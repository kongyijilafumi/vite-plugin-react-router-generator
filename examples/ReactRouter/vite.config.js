import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import ReactRouterGenerator from "../../src/index.js";
import { resolve } from "path"
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ReactRouterGenerator({
      outputFile: resolve(".", "./src/router/list.jsx"),
      comKey: "element",
      isLazy: false
    })
  ],
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      }
    }
  },
  server: {
    open: true,
    port: 3001
  }
})
