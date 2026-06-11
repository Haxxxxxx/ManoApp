import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    resolve: {
      // Keep in sync with tsconfig paths — previously only the
      // build:ignore-errors config had this alias
      alias: {
        '@': '/src',
      },
      dedupe: [
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
        'firebase/storage',
        'firebase/functions'
      ]
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
            mui: ['@mui/material', '@mui/icons-material']
          }
        }
      }
    },
    server: {
      port: 3000
    },
    define: {
      'process.env': env
    }
  }
})
