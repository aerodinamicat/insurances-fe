/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const port = 5173
const clientPort = Number(process.env.PORT ?? port)

function getAllowedWebUiHost(webUiUrl: string | undefined): string | null {
  const normalizedUrl = webUiUrl?.trim()
  if (!normalizedUrl) {
    return null
  }

  try {
    return new URL(normalizedUrl).hostname
  } catch {
    throw new Error(`WEB_UI_URL must be a valid absolute URL: "${normalizedUrl}"`)
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const allowedWebUiHost = getAllowedWebUiHost(
    process.env.WEB_UI_URL ?? env.WEB_UI_URL,
  )

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port,
      ...(allowedWebUiHost ? { allowedHosts: [allowedWebUiHost] } : {}),
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
  }
})
