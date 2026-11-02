import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { env } from './config/env.js';
import { session } from './middleware/session.js';
import { errorHandler, notFound } from './middleware/errors.js';
import caseRoutes from './routes/caseRoutes.js';

const app = express();
const mutationMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

app.disable('x-powered-by');
if (env.trustProxyHops > 0) app.set('trust proxy', env.trustProxyHops);
app.use((req, res, next) => {
  req.id = randomUUID();
  res.setHeader('X-Request-Id', req.id);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  next();
});
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use((req, res, next) => {
  const origin = req.get('Origin');
  if (mutationMethods.has(req.method) && origin && origin !== env.clientOrigin) {
    return res.status(403).json({ error: { code: 'ORIGIN_NOT_ALLOWED', message: 'This request origin is not allowed.', requestId: req.id } });
  }
  next();
});
app.use(express.json({ limit: '32kb' }));
app.use((req, res, next) => {
  const raw = req.headers.cookie || '';
  const match = raw.match(/(?:^|;\s*)mystery_session=([^;]+)/);
  let token;
  if (match) {
    try {
      token = decodeURIComponent(match[1]);
    } catch {
      token = undefined;
    }
  }
  req.cookies = { mystery_session: token };
  next();
});
app.use(session);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/cases', caseRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
