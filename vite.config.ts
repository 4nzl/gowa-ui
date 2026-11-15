import { readFileSync } from 'node:fs'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.VITE_DEFAULT_SERVER_URL || 'http://localhost:3000'
  const { version } = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf8')) as {
    version: string
  }

  return {
    plugins: [react(), tailwindcss(), viteSingleFile()],
    define: {
      __APP_VERSION__: JSON.stringify(version),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // Same-origin fallback for developing against a gowa server without
      // CORS support: point the UI at http://localhost:5173/gowa instead.
      proxy: {
        '/gowa': {
          target: backendUrl,
          changeOrigin: true,
          ws: true,
          rewrite: (p) => p.replace(/^\/gowa/, ''),
        },
      },
    },
  }
})
