import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const workspaceRoot = fileURLToPath(new URL('./', import.meta.url));

const disableDevelopmentServiceWorker: Plugin = {
  name: 'timepulse-disable-service-worker-in-development',
  transformIndexHtml(html, context) {
    if (!context.server) return html;
    return html.replace('<script src="/register-sw.js" async></script>', '');
  },
};

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss(), disableDevelopmentServiceWorker],
  resolve: {
    alias: {
      '@': resolve(workspaceRoot, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  optimizeDeps: {
    noDiscovery: true,
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'framer-motion',
      'date-fns',
      'qrcode.react',
      'react-colorful',
      'react-icons/fi',
      'solarlunar',
      'uuid',
    ],
  },
  server: {
    host: '127.0.0.1',
  },
});
