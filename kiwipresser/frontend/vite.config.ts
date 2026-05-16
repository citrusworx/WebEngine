import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'frontend.kiwi.local', // 👈 allow the Traefik hostname
      'localhost',
    ],
  },
})