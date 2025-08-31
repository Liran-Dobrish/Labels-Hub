import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '',
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        hub: 'public/hub.html',
      }
    }
  },
  server: {
    port: 5173,
    open: true
  }
});
