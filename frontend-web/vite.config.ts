// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // <--- Agrega esta línea

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // <--- Agrega esta línea
  ],
  server: {
    host: true, // <--- ¡ESTA LÍNEA ES LA CLAVE! Permite acceso desde la red
    port: 5173,
  }
})