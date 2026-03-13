import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL?.replace('/api', '') || 'http://223.2.46.78:8765',
          changeOrigin: true,
          rewrite: (path) => path, // 保持 /api 前缀
        },
      },
    },
  }
})
