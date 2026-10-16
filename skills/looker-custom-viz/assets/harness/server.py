#!/usr/bin/env python3
import os
import json
import urllib.parse
import subprocess
import shutil
from http.server import SimpleHTTPRequestHandler, HTTPServer
import socketserver

PORT = 45873


class ThreadingHTTPServer(socketserver.ThreadingMixIn, HTTPServer):
    daemon_threads = True


# Find paths relative to this script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# CWD will be the workspace root when run from launch, so we can use
# standard SimpleHTTPRequestHandler path translation


class HarnessHTTPRequestHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        parsed_url = urllib.parse.urlparse(path)
        req_path = parsed_url.path
        harness_prefix = '/skills/looker-custom-viz/assets/harness/'
        if req_path.startswith(harness_prefix):
            relative_file = req_path[len(harness_prefix):]
            return os.path.join(SCRIPT_DIR, relative_file)
        return super().translate_path(path)

    def end_headers(self):
        # Allow CORS for development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        if parsed_url.path in ['/', '/builder.html', '/harness']:
            self.send_response(302)
            location = '/skills/looker-custom-viz/assets/harness/builder.html'
            if parsed_url.query:
                location += '?' + parsed_url.query
            self.send_header('Location', location)
            self.end_headers()
            return

        if parsed_url.path == '/api/color-collections':
            try:
                cli_path = shutil.which('looker-cli')
                if not cli_path:
                    self.send_error_json(
                        500,
                        "looker-cli not found in PATH."
                    )
                    return
                collections = self.run_cli([
                    cli_path, 'api', 'colorcollection',
                    'all_color_collections'
                ])
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(collections).encode('utf-8'))
            except Exception as e:
                self.send_error_json(
                    500, f"Failed to fetch color collections: {str(e)}"
                )
            return

        if parsed_url.path == '/api/fetch-explore':
            query_params = urllib.parse.parse_qs(parsed_url.query)
            identifier = query_params.get('identifier', [None])[0]
            id_type = query_params.get('type', ['id'])[0]

            if not identifier:
                self.send_error_json(400, "Missing identifier parameter")
                return

            try:
                cli_path = shutil.which('looker-cli')
                if not cli_path:
                    self.send_error_json(
                        500,
                        "looker-cli not found in PATH. "
                        "Please verify it is installed and authenticated."
                    )
                    return

                # 1. Fetch query description (for vis_config)
                if id_type == 'slug':
                    query_def = self.run_cli([
                        cli_path, 'api', 'query',
                        'query_for_slug', identifier
                    ])
                    query_id = query_def.get('id')
                    vis_config = query_def.get('vis_config') or {}
                else:
                    query_id = identifier
                    query_def = self.run_cli([
                        cli_path, 'api', 'query',
                        'query', str(query_id)
                    ])
                    vis_config = query_def.get('vis_config') or {}

                # 2. Run the Query for results
                response = self.run_cli([
                    cli_path, 'api', 'query',
                    'run_query', str(query_id), 'json_detail'
                ])

                scenario = {
                    "config": vis_config,
                    "data": response.get('data', []),
                    "queryResponse": {
                        "fields": response.get('fields', {}),
                        "pivots": response.get('pivots', [])
                    }
                }

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(scenario).encode('utf-8'))
            except Exception as e:
                self.send_error_json(
                    500, f"Failed to fetch scenario: {str(e)}"
                )
            return

        super().do_GET()

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        if parsed_url.path == '/api/save-scenario':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                params = json.loads(post_data.decode('utf-8'))
                scenario_key = params.get('key')
                scenario_data = params.get('scenario')

                if not scenario_key or not scenario_data:
                    self.send_error_json(400, "Missing key or scenario data")
                    return

                # Use absolute path to harness/data_scenarios.js
                scenarios_js_path = os.path.join(
                    SCRIPT_DIR, 'data_scenarios.js'
                )
                self.inject_into_harness(
                    scenario_data, scenarios_js_path, scenario_key
                )

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True}).encode('utf-8'))
            except Exception as e:
                self.send_error_json(500, f"Failed to save scenario: {str(e)}")
            return

        self.send_response(404)
        self.end_headers()

    def run_cli(self, cmd):
        try:
            result = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=10,
            )
        except subprocess.TimeoutExpired:
            raise Exception(
                f"Command {' '.join(cmd)} timed out after 10 seconds"
            )
        if result.returncode != 0:
            raise Exception(
                f"Command {' '.join(cmd)} failed: {result.stderr.strip()}"
            )
        try:
            return json.loads(result.stdout)
        except json.JSONDecodeError:
            raise Exception(
                f"Failed to decode looker-cli JSON. "
                f"Output was: {result.stdout}"
            )

    def send_error_json(self, status, message):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}).encode('utf-8'))

    def inject_into_harness(self, scenario_data, js_file_path, scenario_key):
        """Appends/updates the scenario in data_scenarios.js."""
        with open(js_file_path, 'r') as f:
            content = f.read()

        prefix = "window.scenarios = "
        start_index = content.find(prefix)
        if start_index == -1:
            raise Exception(f"Could not find '{prefix}' in data_scenarios.js")

        json_start = start_index + len(prefix)
        json_end = content.rfind(";")
        if json_end == -1:
            json_end = len(content)

        existing_json_str = content[json_start:json_end].strip()

        try:
            scenarios = json.loads(existing_json_str)
        except json.JSONDecodeError:
            # Simple fallback if data_scenarios has JS comments/trailing commas
            raise Exception(
                "data_scenarios.js does not contain clean JSON "
                "inside window.scenarios assignment. "
                "Please cleanup data_scenarios.js first."
            )

        scenarios[scenario_key] = scenario_data
        new_json_str = json.dumps(scenarios, indent=2)
        new_content = content[:json_start] + new_json_str + ";"

        with open(js_file_path, 'w') as f:
            f.write(new_content)


def run(port=PORT):
    server_address = ('', port)
    httpd = ThreadingHTTPServer(server_address, HarnessHTTPRequestHandler)
    print(
        f"Harness development proxy server running on "
        f"http://localhost:{port}..."
    )
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping harness proxy server...")
        httpd.server_close()


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(
        description="Harness Development Proxy Server"
    )
    parser.add_argument(
        '--port', type=int, default=PORT, help="Port to run server on"
    )
    args = parser.parse_args()
    run(args.port)
