import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8097,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://127.0.0.1:5098',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 8097,
    host: '0.0.0.0',
  },
})
