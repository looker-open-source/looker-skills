#!/bin/bash

# Script to scaffold a Looker Extension using Vite and React

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <project-name>"
  exit 1
fi

PROJECT_NAME=$1

echo "Creating Vite project: $PROJECT_NAME..."
npm create vite@latest "$PROJECT_NAME" -- --template react-ts

cd "$PROJECT_NAME"

echo "Installing Looker SDKs..."
npm install @looker/extension-sdk @looker/extension-sdk-react @looker/sdk

echo "Installing Looker Components (optional but recommended)..."
npm install @looker/components styled-components

echo "Configuring Vite for single bundle..."
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'bundle.js',
        assetFileNames: 'bundle.[ext]',
        chunkFileNames: 'bundle.js',
      }
    }
  }
})
EOF

echo "Creating basic manifest.lkml..."
cat > manifest.lkml << EOF
project_name: "my_project"

application: $PROJECT_NAME {
  label: "My Custom Extension"
  url: "http://localhost:5173/bundle.js"
  
  entitlements: {
    use_form_submit: yes
    core_api_methods: ["me"]
  }
}
EOF

echo "Creating basic App.tsx..."
cat > src/App.tsx << 'EOF'
import React from 'react'
import { ExtensionProvider, useExtensionContext } from '@looker/extension-sdk-react'

const InnerApp = () => {
  const { coreSDK } = useExtensionContext()
  const [user, setUser] = React.useState<any>(null)

  React.useEffect(() => {
    coreSDK.ok(coreSDK.me()).then(setUser).catch(console.error)
  }, [coreSDK])

  return (
    <div style={{ padding: '20px' }}>
      <h1>Hello from Looker Extension!</h1>
      {user && <p>Welcome, ${user.display_name}</p>}
    </div>
  )
}

export const App = () => (
  <ExtensionProvider>
    <InnerApp />
  </ExtensionProvider>
)
export default App
EOF

echo "Project $PROJECT_NAME scaffolded successfully!"
echo "To start developing:"
echo "cd $PROJECT_NAME"
echo "npm run dev"
