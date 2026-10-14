import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/maps': {
        target: 'http://localhost:5089',
        changeOrigin: true,
      },
      '/token': {
        target: 'http://localhost:5089',
        changeOrigin: true,
      },
    },
  },
})
