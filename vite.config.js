import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: '.'
  },
  worker: {
    format: 'es', // worker 파일에 대해 ES 모듈 포맷 사용
  },
})