/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // A API (CorsConfig) só aceita chamadas do navegador vindas de http://localhost:5173.
    // strictPort: se a porta estiver ocupada, falha em vez de subir em outra porta (que daria erro de CORS).
    port: 5173,
    strictPort: true,
  },
  test: {
    // jsdom simula o navegador (document, window) dentro do Node para testar componentes
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
