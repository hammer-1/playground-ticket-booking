import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Read VITE_* vars from the single env file at the repo root.
  envDir: '..',
  server: {
    port: 5200,
    strictPort: true,
  },
});
