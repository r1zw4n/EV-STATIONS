import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-serverless-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url?.startsWith('/api/stations')) {
              try {
                const { default: handler } = await import('./api/stations.js');
                await handler(req, res);
                return;
              } catch (err) {
                console.error('Dev middleware error on /api/stations:', err);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Internal error handling /api/stations' }));
                return;
              }
            }
            if (req.url?.startsWith('/api/availability')) {
              try {
                const { default: handler } = await import('./api/availability.js');
                await handler(req, res);
                return;
              } catch (err) {
                console.error('Dev middleware error on /api/availability:', err);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Internal error handling /api/availability' }));
                return;
              }
            }
            if (req.url?.startsWith('/api/health')) {
              try {
                const { default: handler } = await import('./api/health.js');
                await handler(req, res);
                return;
              } catch (err) {
                console.error('Dev middleware error on /api/health:', err);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Internal error handling /api/health' }));
                return;
              }
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
