import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5175,
    proxy: {
      // All /api/* calls are proxied to the backend so HttpOnly cookies work same-origin
      '/api': { target: 'http://localhost:5032', changeOrigin: true },
    },
  },
})
