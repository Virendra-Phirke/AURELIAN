import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { auth } from './auth.js';
import { apiRouter } from './routes/api.js';
import { db } from './db/index.js';
import { services } from './db/schema.js';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';

const PORT = 3000;

async function startServer() {
  const app = express();
  
  // Security Headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.use(cors());
  app.use(express.json({ limit: '10kb' }));

  // Better Auth handler
  const { toNodeHandler } = await import('better-auth/node');
  const authHandler = toNodeHandler(auth);
  app.all('/api/auth/*all', async (req, res, next) => {
    try {
      await authHandler(req, res);
    } catch (e: any) {
      console.error('BetterAuth Error:', e);
      fs.writeFileSync('auth-error.log', e.toString() + '\\n' + (e.stack || ''));
      res.status(500).send('Error');
    }
  });

  // Main API Routes
  app.use('/api', apiRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Seed initial services if empty
    try {
      const existingServices = await db.select().from(services);
      if (existingServices.length === 0) {
        await db.insert(services).values([
          { name: 'Haircut', durationMinutes: 30 },
          { name: 'Shaving', durationMinutes: 20 },
          { name: 'Zat Ke Bal', durationMinutes: 30 }
        ]);
        console.log("Seeded default services.");
      } else if (existingServices.length === 2 && !existingServices.some(s => s.name.toLowerCase() === 'zat ke bal')) {
        await db.insert(services).values([
          { name: 'Zat Ke Bal', durationMinutes: 30 }
        ]);
      }

      // Ensure database-level unique constraint on active booking slots
      await db.execute(sql`
        CREATE UNIQUE INDEX IF NOT EXISTS unique_active_booking_slot 
        ON bookings ("bookingDate", "startTime") 
        WHERE status IN ('ACCEPTED', 'PENDING');
      `);
      console.log("Database unique constraint active.");
    } catch (e) {
      console.log("DB initialization check:", e);
    }
  });
}

startServer();
