import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const browserSecurityHeaders = {
  'Content-Security-Policy': contentSecurityPolicy,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'production-security-policy',
      transformIndexHtml(html, context) {
        if (context.server) return html;
        const content = contentSecurityPolicy.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
        return html.replace('</head>', `<meta http-equiv="Content-Security-Policy" content="${content}"></head>`);
      },
      configurePreviewServer(server) {
        server.middlewares.use((_req, res, next) => {
          for (const [name, value] of Object.entries(browserSecurityHeaders)) res.setHeader(name, value);
          next();
        });
      },
    },
  ],
  server: {
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            if (res.writeHead && !res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: {
                  code: 'BACKEND_UNAVAILABLE',
                  message: 'The backend server is not running on port 5000. Please start it using "npm run dev".',
                },
              }));
            }
          });
        },
      },
    },
  },
});
