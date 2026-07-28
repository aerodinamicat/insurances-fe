/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const port = 5173
const clientPort = Number(process.env.PORT ?? port)

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port,
    hmr: {
      clientPort,
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    pool: 'threads',
  },
})
