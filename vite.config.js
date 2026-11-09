import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          // El backend escucha en 6000 según kiosco-dany-servidor/.env
          target: env.VITE_API_PROXY || 'http://localhost:6000',
          changeOrigin: true,
        },
      },
    },
  }
})
