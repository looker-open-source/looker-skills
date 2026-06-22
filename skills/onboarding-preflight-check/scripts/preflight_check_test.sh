#!/bin/bash
# Copyright 2026 Google LLC
# Licensed under the Apache License, Version 2.0 (the "License");

set -euo pipefail

# Find path to the script being tested
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PREFLIGHT_SH="${SCRIPT_DIR}/preflight_check.sh"

# Temporary directory for mocks and test workspace
TEST_TMP_DIR=$(mktemp -d)
trap 'rm -rf "${TEST_TMP_DIR}"' EXIT

SANDBOX_DIR="${TEST_TMP_DIR}/sandbox"
mkdir -p "${SANDBOX_DIR}"

# Symlink all commands from /usr/bin and /bin, excluding gcloud and bq
for dir in /usr/bin /bin; do
  if [ -d "$dir" ]; then
    for file in "$dir"/*; do
      if [ -f "$file" ] && [ -x "$file" ]; then
        name=$(basename "$file")
        if [ "$name" != "gcloud" ] && [ "$name" != "bq" ]; then
          ln -sf "$file" "${SANDBOX_DIR}/${name}"
        fi
      fi
    done
  fi
done


MOCK_BIN_DIR="${TEST_TMP_DIR}/mock_bin"
mkdir -p "${MOCK_BIN_DIR}"

# Path includes mock bin first, then sandbox, so host gcloud/bq are hidden
export PATH="${MOCK_BIN_DIR}:${SANDBOX_DIR}"


# Helper to mock command output
mock_cmd() {
  local cmd_name="$1"
  local exit_code="$2"
  shift 2
  local content="$*"
  
  cat <<EOF > "${MOCK_BIN_DIR}/${cmd_name}"
#!/bin/bash
exit_code=${exit_code}
if [ \$exit_code -ne 0 ]; then
  exit \$exit_code
fi
cat <<'INNER_EOF'
${content}
INNER_EOF
EOF
  chmod +x "${MOCK_BIN_DIR}/${cmd_name}"
}

clear_mock() {
  local cmd_name="$1"
  rm -f "${MOCK_BIN_DIR}/${cmd_name}"
}

# --- TESTS ---

echo "=== Running Pre-flight Check Tests ==="

# Test 1: gcloud not installed
(
  echo "Test 1: gcloud not installed..."
  clear_mock gcloud
  clear_mock bq
  set +e
  "${PREFLIGHT_SH}" --mode system --install-dir "${TEST_TMP_DIR}" > "${TEST_TMP_DIR}/out.log" 2>&1
  rc=$?
  set -e
  if [ $rc -eq 0 ]; then
    echo "FAIL: Expected non-zero exit code when gcloud is missing"
    exit 1
  fi
  grep -q "gcloud CLI is not installed" "${TEST_TMP_DIR}/out.log"
  echo "PASS"
)

# Test 2: gcloud installed but not authenticated
(
  echo "Test 2: gcloud installed but not authenticated..."
  mock_cmd gcloud 0 "Active Account: none"
  # Let's mock a scenario where 'gcloud auth list' returns no active account
  # We will mock the output format specifically
  cat <<'EOF' > "${MOCK_BIN_DIR}/gcloud"
#!/bin/bash
if [[ "$*" == *"auth list"* ]]; then
  echo "" # Empty active account
elif [[ "$*" == *"config get-value"* ]]; then
  echo "(unset)"
fi
EOF
  chmod +x "${MOCK_BIN_DIR}/gcloud"
  clear_mock bq
  set +e
  "${PREFLIGHT_SH}" --mode system --install-dir "${TEST_TMP_DIR}" > "${TEST_TMP_DIR}/out.log" 2>&1
  rc=$?
  set -e
  if [ $rc -eq 0 ]; then
    echo "FAIL: Expected non-zero exit code when gcloud is not authenticated"
    exit 1
  fi
  grep -q "gcloud is not authenticated" "${TEST_TMP_DIR}/out.log"
  echo "PASS"
)

# Test 3: bq not installed
(
  echo "Test 3: bq not installed..."
  # Mock authenticated gcloud
  cat <<'EOF' > "${MOCK_BIN_DIR}/gcloud"
#!/bin/bash
if [[ "$*" == *"auth list"* ]]; then
  echo "user@example.com"
elif [[ "$*" == *"config get-value"* ]]; then
  echo "my-gcp-project"
fi
EOF
  chmod +x "${MOCK_BIN_DIR}/gcloud"
  clear_mock bq
  set +e
  "${PREFLIGHT_SH}" --mode system --install-dir "${TEST_TMP_DIR}" > "${TEST_TMP_DIR}/out.log" 2>&1
  rc=$?
  set -e
  if [ $rc -eq 0 ]; then
    echo "FAIL: Expected non-zero exit code when bq is missing"
    exit 1
  fi
  grep -q "bq CLI is not installed" "${TEST_TMP_DIR}/out.log"
  echo "PASS"
)

# Test 4: install-dir not writable
(
  echo "Test 4: install-dir not writable..."
  if [ "$(id -u)" -eq 0 ]; then
    echo "SKIP (running as root)"
    exit 0
  fi
  mock_cmd bq 0 "bq version 2.0"
  NON_WRITABLE_DIR="${TEST_TMP_DIR}/non_writable"
  mkdir -p "${NON_WRITABLE_DIR}"
  chmod 500 "${NON_WRITABLE_DIR}"
  set +e
  "${PREFLIGHT_SH}" --mode system --install-dir "${NON_WRITABLE_DIR}" > "${TEST_TMP_DIR}/out.log" 2>&1
  rc=$?
  chmod 700 "${NON_WRITABLE_DIR}" # cleanup permission
  set -e
  if [ $rc -eq 0 ]; then
    echo "FAIL: Expected non-zero exit code when install-dir is not writable"
    exit 1
  fi
  grep -q "Installation directory .* is not writable" "${TEST_TMP_DIR}/out.log"
  echo "PASS"
)

# Test 5: All system checks pass
(
  echo "Test 5: All system checks pass..."
  mock_cmd bq 0 "bq version 2.0"
  set +e
  "${PREFLIGHT_SH}" --mode system --install-dir "${TEST_TMP_DIR}" > "${TEST_TMP_DIR}/out.log" 2>&1
  rc=$?
  set -e
  if [ $rc -ne 0 ]; then
    echo "FAIL: Expected exit code 0 when all system checks pass"
    cat "${TEST_TMP_DIR}/out.log"
    exit 1
  fi
  echo "PASS"
)

# Test 6: IAM check - Looker service account does not exist or has no roles
(
  echo "Test 6: IAM check - Looker service account has no roles..."
  cat <<'EOF' > "${MOCK_BIN_DIR}/gcloud"
#!/bin/bash
if [[ "$*" == *"projects describe"* ]]; then
  echo "1234567890"
elif [[ "$*" == *"get-iam-policy"* ]]; then
  echo ""
fi
EOF
  chmod +x "${MOCK_BIN_DIR}/gcloud"
  
  set +e
  "${PREFLIGHT_SH}" --mode iam --looker-project "my-looker-proj" --bq-project "my-bq-proj" > "${TEST_TMP_DIR}/out.log" 2>&1
  rc=$?
  set -e
  if [ $rc -eq 0 ]; then
    echo "FAIL: Expected non-zero exit code when Looker service account has no IAM roles"
    exit 1
  fi
  grep -q "Missing role: roles/bigquery.dataViewer" "${TEST_TMP_DIR}/out.log"
  grep -q "Missing role: roles/bigquery.jobUser" "${TEST_TMP_DIR}/out.log"
  grep -q "Missing role: roles/serviceusage.serviceUsageConsumer" "${TEST_TMP_DIR}/out.log"
  echo "PASS"
)

# Test 7: IAM check - Looker service account has some but not all roles
(
  echo "Test 7: IAM check - Looker service account has partial roles..."
  cat <<'EOF' > "${MOCK_BIN_DIR}/gcloud"
#!/bin/bash
if [[ "$*" == *"projects describe"* ]]; then
  echo "1234567890"
elif [[ "$*" == *"get-iam-policy"* ]]; then
  echo "roles/bigquery.dataViewer"
fi
EOF
  chmod +x "${MOCK_BIN_DIR}/gcloud"
  
  set +e
  "${PREFLIGHT_SH}" --mode iam --looker-project "my-looker-proj" --bq-project "my-bq-proj" > "${TEST_TMP_DIR}/out.log" 2>&1
  rc=$?
  set -e
  if [ $rc -eq 0 ]; then
    echo "FAIL: Expected non-zero exit code when Looker service account has partial roles"
    exit 1
  fi
  grep -q "Missing role: roles/bigquery.jobUser" "${TEST_TMP_DIR}/out.log"
  grep -q "Missing role: roles/serviceusage.serviceUsageConsumer" "${TEST_TMP_DIR}/out.log"
  echo "PASS"
)

# Test 8: IAM check - All roles present
(
  echo "Test 8: IAM check - All roles present..."
  cat <<'EOF' > "${MOCK_BIN_DIR}/gcloud"
#!/bin/bash
if [[ "$*" == *"projects describe"* ]]; then
  echo "1234567890"
elif [[ "$*" == *"get-iam-policy"* ]]; then
  echo "roles/bigquery.dataViewer"
  echo "roles/bigquery.jobUser"
  echo "roles/serviceusage.serviceUsageConsumer"
fi
EOF
  chmod +x "${MOCK_BIN_DIR}/gcloud"
  
  set +e
  "${PREFLIGHT_SH}" --mode iam --looker-project "my-looker-proj" --bq-project "my-bq-proj" > "${TEST_TMP_DIR}/out.log" 2>&1
  rc=$?
  set -e
  if [ $rc -ne 0 ]; then
    echo "FAIL: Expected exit code 0 when Looker service account has all roles"
    cat "${TEST_TMP_DIR}/out.log"
    exit 1
  fi
  echo "PASS"
)

# Test 9: IAM check - Missing only serviceUsageConsumer
(
  echo "Test 9: IAM check - Missing only serviceUsageConsumer..."
  cat <<'EOF' > "${MOCK_BIN_DIR}/gcloud"
#!/bin/bash
if [[ "$*" == *"projects describe"* ]]; then
  echo "1234567890"
elif [[ "$*" == *"get-iam-policy"* ]]; then
  echo "roles/bigquery.dataViewer"
  echo "roles/bigquery.jobUser"
fi
EOF
  chmod +x "${MOCK_BIN_DIR}/gcloud"
  
  set +e
  "${PREFLIGHT_SH}" --mode iam --looker-project "my-looker-proj" --bq-project "my-bq-proj" > "${TEST_TMP_DIR}/out.log" 2>&1
  rc=$?
  set -e
  if [ $rc -eq 0 ]; then
    echo "FAIL: Expected non-zero exit code when missing serviceUsageConsumer role"
    exit 1
  fi
  grep -q "Missing role: roles/serviceusage.serviceUsageConsumer" "${TEST_TMP_DIR}/out.log"
  echo "PASS"
)

echo "=== All Tests Passed ==="
exit 0
