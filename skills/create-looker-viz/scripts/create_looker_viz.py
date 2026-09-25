#!/usr/bin/env python3
import sys
import os
import argparse
import json
import subprocess

def load_template(filename):
    script_dir = os.path.dirname(os.path.realpath(__file__))
    template_path = os.path.join(script_dir, "..", "templates", filename)
    with open(template_path, 'r') as f:
        return f.read()

def generate_config_json(dim_count, metric_count, style_options):
    config = {
        "framework": "react",
        "dimensions": dim_count,
        "metrics": metric_count,
        "style": style_options
    }
    return json.dumps(config, indent=2)

def main():
    parser = argparse.ArgumentParser(description="Initialize a Looker Custom Visualization")
    parser.add_argument("--name", help="Project directory name")
    parser.add_argument("--title", help="Visualization Title")
    parser.add_argument("--framework", choices=["react", "vanilla"], default="react")
    parser.add_argument("--type", choices=["table", "cond-table", "bar", "pie", "radar", "echarts"], default=None)
    args = parser.parse_args()

    # Interactive config if args are missing
    if not args.name or not args.title:
        print("Interactive Mode Started!")
        if not os.path.exists("viz-config.json"):
            print("Generating default viz-config.json...")
            with open("viz-config.json", "w") as f:
                f.write('{\n  "name": "my-viz",\n  "title": "My Custom Viz",\n  "type": "table",\n  "framework": "react",\n  "metrics": 1\n}')
        input("Please configure viz-config.json in your editor. Press Enter when ready...")
        
        with open("viz-config.json", "r") as f:
            config = json.load(f)
        project_name = config.get("name", "my-viz")
        project_title = config.get("title", "My Viz")
        viz_type = config.get("type", "table")
        framework = config.get("framework", "react").lower()
    else:
        project_name = args.name
        project_title = args.title
        framework = args.framework.lower()
        if args.type:
            viz_type = args.type
        elif "spider" in project_name.lower() or "radar" in project_name.lower():
            viz_type = "radar"
        else:
            viz_type = "table"

    project_dir = os.path.abspath(project_name)
    if not os.path.exists(project_dir):
        os.makedirs(project_dir)
        
    src_dir = os.path.join(project_dir, "src")
    os.makedirs(src_dir, exist_ok=True)
    os.makedirs(os.path.join(src_dir, "utils"), exist_ok=True)
    
    print(f"\nCreating {framework} project in {project_dir}...")
    
    is_vanilla = (framework == "vanilla")
    
    # Load core templates
    package_json_tmpl = load_template("package.json")
    vite_config = load_template("vite.config.ts")
    index_html_tmpl = load_template("index.html")
    
    # Prepare dependencies
    extra_deps = ""
    if not is_vanilla:
        extra_deps = ''
    if viz_type in ["bar", "pie", "radar"]:
        extra_deps += ',\n    "chart.js": "^4.4.1",\n    "react-chartjs-2": "^5.2.0"'
    elif viz_type == "echarts":
        extra_deps += ',\n    "echarts": "^5.4.3"'
        
    # Write Package.json
    package_json = package_json_tmpl.replace("{name}", project_name).replace("{extra_deps}", extra_deps)
    # Strip Vite React plugin and React from vanilla package.json
    if is_vanilla:
        package_json = package_json.replace('"@vitejs/plugin-react": "^4.3.1",\n', '')
        package_json = package_json.replace('"typescript": "^5.2.2",\n', '')
        package_json = package_json.replace('"@types/react": "^18.3.3",\n', '')
        package_json = package_json.replace('"@types/react-dom": "^18.3.0",\n', '')
        package_json = package_json.replace('"react": "^18.3.1",\n', '')
        package_json = package_json.replace('"react-dom": "^18.3.1"\n', '')
        package_json = package_json.replace('"build": "tsc && vite build"', '"build": "vite build"')
    
    with open(os.path.join(project_dir, "package.json"), "w") as f:
        f.write(package_json)
        
    # Write Vite Config
    if is_vanilla:
        vite_config = vite_config.replace("import react from '@vitejs/plugin-react'\n", "")
        vite_config = vite_config.replace("plugins: [react()],", "plugins: [],")
    with open(os.path.join(project_dir, "vite.config.js" if is_vanilla else "vite.config.ts"), "w") as f:
        f.write(vite_config)
        
    # Write Index HTML
    ext = "js" if is_vanilla else "tsx"
    index_html = index_html_tmpl.replace("main.tsx", f"main.{ext}")
    with open(os.path.join(project_dir, "index.html"), "w") as f:
        f.write(index_html)
        
    # Write Main Entrypoint
    if is_vanilla:
        vanilla_main = """import './index.css';

looker.plugins.visualizations.add({
  id: "vanilla_viz",
  label: "Vanilla Viz",
  create: function(element, config) {
    element.innerHTML = "<h1>Vanilla JS Template Generated!</h1>";
  },
  updateAsync: function(data, element, config, queryResponse, details, done) {
    console.log("Data:", data);
    done();
  }
});
"""
        with open(os.path.join(src_dir, "main.js"), "w") as f:
            f.write(vanilla_main)
    else:
        # React Setup
        main_tsx = load_template("main.tsx").replace("{name}", project_name).replace("{title}", project_title)
        with open(os.path.join(src_dir, "main.tsx"), "w") as f:
            f.write(main_tsx)
            
        with open(os.path.join(project_dir, "tsconfig.json"), "w") as f:
            f.write(load_template("tsconfig.json"))
            
        app_tsx = load_template("App.tsx")
        with open(os.path.join(src_dir, "App.tsx"), "w") as f:
            f.write(app_tsx)
            
        # Select Chart Component
        comp_map = {
            "table": "CompTable.tsx",
            "cond-table": "CompCondTable.tsx",
            "bar": "CompBar.tsx",
            "pie": "CompPie.tsx",
            "radar": "CompRadar.tsx",
            "echarts": "CompEcharts.tsx"
        }
        comp_tmpl_name = comp_map.get(viz_type, "CompTable.tsx")
        with open(os.path.join(src_dir, "VizComponent.tsx"), "w") as f:
            comp_content = load_template(comp_tmpl_name).replace("{component_name}", "VizComponent")
            f.write(comp_content)
            
        with open(os.path.join(src_dir, "useLookerData.ts"), "w") as f:
            f.write(load_template("useLookerData.ts"))
            
        with open(os.path.join(src_dir, "looker.d.ts"), "w") as f:
            f.write(load_template("looker.d.ts"))
            
        with open(os.path.join(src_dir, "utils", "types.ts"), "w") as f:
            f.write(load_template("types.ts"))
            
    # CSS
    with open(os.path.join(src_dir, "index.css"), "w") as f:
        f.write(load_template("index.css"))
    with open(os.path.join(src_dir, "App.css"), "w") as f:
        f.write(load_template("App.css"))
        
    readme = (load_template("README.md")
        .replace("{title}", project_title)
        .replace("{project_name}", project_name)
        .replace("{comp_name}", "VizComponent")
        .replace("{viz_type}", viz_type)
        .replace("{deploy_instructions}", "2. Upload `dist/bundle.js` to your Looker project and reference it in the manifest."))
    with open(os.path.join(project_dir, "README.md"), "w") as f:
        f.write(readme)
        
    print(f"\nDone! Project created at {project_dir}")
    print("Run the following to start developing:")
    print(f"  cd {project_name}")
    print("  npm install")
    print("  npm run dev")

if __name__ == "__main__":
    main()
