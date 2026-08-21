import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth.js';
import { apiRouter } from './routes/api.js';

export function createApp() {
  const app = express();

  // Trust proxy for Vercel / reverse proxies to properly detect HTTPS and secure cookies
  app.set('trust proxy', true);

  // Security Headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.use(cors({
    origin: true,
    credentials: true,
  }));

  // Better Auth handler - mounted before express.json()
  const authHandler = toNodeHandler(auth);

  app.all('/api/auth', async (req, res) => {
    try {
      await authHandler(req, res);
    } catch (e: any) {
      console.error('BetterAuth Error:', e);
      res.status(500).send('Error');
    }
  });

  app.all('/api/auth/*splat', async (req, res) => {
    try {
      await authHandler(req, res);
    } catch (e: any) {
      console.error('BetterAuth Error:', e);
      res.status(500).send('Error');
    }
  });

  // Express body parsers for general API routes
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true }));

  // Main API Routes
  app.use('/api', apiRouter);

  return app;
}

export const app = createApp();
export default app;
