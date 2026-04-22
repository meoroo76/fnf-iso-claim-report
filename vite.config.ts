import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { kgMiddleware } from './server/kgMiddleware';
import { notifyMiddleware } from './server/notifyMiddleware';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'fnf-api',
      configureServer(server) {
        server.middlewares.use(kgMiddleware());
        server.middlewares.use(notifyMiddleware());
      },
      configurePreviewServer(server) {
        server.middlewares.use(kgMiddleware());
        server.middlewares.use(notifyMiddleware());
      },
    },
  ],
  server: {
    port: 5173,
    host: true,
  },
});
