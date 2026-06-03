import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/fusion/fusion-fuel-cycle/',
  build: {
    outDir: 'dist/fusion-fuel-cycle',
  },
});
