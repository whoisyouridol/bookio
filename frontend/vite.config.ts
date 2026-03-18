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
    // Allow *.localhost subdomains for local development
    allowedHosts: true,
    proxy: {
      // All /api/* calls are proxied to the backend so HttpOnly cookies work same-origin
      '/api': {
        target: 'http://localhost:5032',
        changeOrigin: true,
        // Forward the original Host so SubdomainMiddleware can read it
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (req.headers.host) {
              proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
            }
          });
        },
      },
    },
  },
})
