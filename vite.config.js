
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Vercelにデプロイされているかどうかを判断
const isVercel = process.env.VERCEL === '1';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@services': resolve(__dirname, 'src/services'),
      '@styles': resolve(__dirname, 'src/styles'),
      '@utils': resolve(__dirname, 'src/utils')
    }
  },
  // Vercelにデプロイされている場合はbaseを設定しない
  base: isVercel ? '/' : '/liff-app/abacus-circuit-viewer/'
});
