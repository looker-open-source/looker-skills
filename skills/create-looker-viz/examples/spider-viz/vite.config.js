import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'bundle.js',
        assetFileNames: '[name].[ext]',
        chunkFileNames: '[name].js',
      }
    }
  }
})
