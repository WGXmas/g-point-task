import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 👇 關鍵就是這行！請確保有加這行，且前後都有斜線
  base: '/g-point-task/', 
})