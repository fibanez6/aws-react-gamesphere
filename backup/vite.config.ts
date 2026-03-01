import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    // Fix for amazon-cognito-identity-js which expects Node.js globals
    global: 'globalThis',
  },
  server: {
    port: 3000,
  },
});
