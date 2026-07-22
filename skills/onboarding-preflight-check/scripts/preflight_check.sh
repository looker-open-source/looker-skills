#!/bin/bash
# Copyright 2026 Google LLC
# Licensed under the Apache License, Version 2.0 (the "License");

set -euo pipefail

# Initialize arguments
MODE=""
INSTALL_DIR=""
LOOKER_PROJECT=""
BQ_PROJECT=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)
      if [[ $# -lt 2 ]]; then echo "Error: Missing value for $1"; exit 1; fi
      MODE="$2"
      shift 2
      ;;
    --install-dir)
      if [[ $# -lt 2 ]]; then echo "Error: Missing value for $1"; exit 1; fi
      INSTALL_DIR="$2"
      shift 2
      ;;
    --looker-project)
      if [[ $# -lt 2 ]]; then echo "Error: Missing value for $1"; exit 1; fi
      LOOKER_PROJECT="$2"
      shift 2
      ;;
    --bq-project)
      if [[ $# -lt 2 ]]; then echo "Error: Missing value for $1"; exit 1; fi
      BQ_PROJECT="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

if [[ -z "${MODE}" ]]; then
  echo "Error: --mode is required (system or iam)"
  exit 1
fi

check_system() {
  if [[ -z "${INSTALL_DIR}" ]]; then
    echo "Error: --install-dir is required in system mode"
    exit 1
  fi

  # 1. Check gcloud CLI presence
  if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI is not installed. Please install the Google Cloud SDK."
    exit 1
  fi

  # 2. Check gcloud CLI authentication
  local active_account
  active_account=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null || true)
  if [[ -z "${active_account}" ]]; then
    echo "Error: gcloud is not authenticated. Please run 'gcloud auth login' to authenticate."
    exit 1
  fi

  # 3. Check bq CLI presence
  if ! command -v bq &> /dev/null; then
    echo "Error: bq CLI is not installed. Run 'gcloud components install bq' to install it."
    exit 1
  fi

  # 4. Check installation directory write permissions
  if [[ -e "${INSTALL_DIR}" ]] && [[ ! -d "${INSTALL_DIR}" ]]; then
    echo "Error: Installation directory ${INSTALL_DIR} exists but is not a directory."
    exit 1
  fi

  if [[ ! -d "${INSTALL_DIR}" ]]; then
    # Try to create it
    if ! mkdir -p "${INSTALL_DIR}" 2>/dev/null; then
      echo "Error: Installation directory ${INSTALL_DIR} does not exist and could not be created."
      exit 1
    fi
  fi

  if [[ ! -w "${INSTALL_DIR}" ]]; then
    echo "Error: Installation directory ${INSTALL_DIR} is not writable."
    exit 1
  fi
}

check_iam() {
  if [[ -z "${LOOKER_PROJECT}" ]] || [[ -z "${BQ_PROJECT}" ]]; then
    echo "Error: --looker-project and --bq-project are required in iam mode"
    exit 1
  fi

  # 1. Get project number of Looker Core instance project
  local project_number
  project_number=$(gcloud projects describe "${LOOKER_PROJECT}" --format="value(projectNumber)" 2>/dev/null || true)
  if [[ -z "${project_number}" ]]; then
    echo "Error: Unable to describe project ${LOOKER_PROJECT}. Check your permissions or project ID."
    exit 1
  fi

  # 2. Looker Service Account email
  local looker_sa="service-${project_number}@gcp-sa-looker.iam.gserviceaccount.com"
  
  # 3. Fetch IAM roles bound to the Looker Service Account on target BigQuery project
  local sa_roles
  sa_roles=$(gcloud projects get-iam-policy "${BQ_PROJECT}" \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount:${looker_sa}" \
    --format="value(bindings.role)" 2>/dev/null || true)

  # 4. Verify roles are bound to the service account
  local has_viewer=false
  local has_job_user=false
  local has_service_consumer=false

  if echo "${sa_roles}" | grep -q -E "^roles/bigquery\.(dataViewer|dataEditor|admin)$"; then
    has_viewer=true
  fi
  if echo "${sa_roles}" | grep -q "^roles/bigquery\.jobUser$"; then
    has_job_user=true
  fi
  if echo "${sa_roles}" | grep -q -E "^roles/(serviceusage\.serviceUsageConsumer|editor|owner)$"; then
    has_service_consumer=true
  fi

  local error=0
  if [[ "${has_viewer}" == false ]]; then
    echo "Error: Missing role: roles/bigquery.dataViewer on Looker Service Account ${looker_sa} in project ${BQ_PROJECT}."
    error=1
  fi

  if [[ "${has_job_user}" == false ]]; then
    echo "Error: Missing role: roles/bigquery.jobUser on Looker Service Account ${looker_sa} in project ${BQ_PROJECT}."
    error=1
  fi

  if [[ "${has_service_consumer}" == false ]]; then
    echo "Error: Missing role: roles/serviceusage.serviceUsageConsumer on Looker Service Account ${looker_sa} in project ${BQ_PROJECT}."
    error=1
  fi

  if [[ $error -ne 0 ]]; then
    exit 1
  fi
}

case "${MODE}" in
  system)
    check_system
    ;;
  iam)
    check_iam
    ;;
  *)
    echo "Error: Invalid mode: ${MODE}"
    exit 1
    ;;
esac

exit 0
