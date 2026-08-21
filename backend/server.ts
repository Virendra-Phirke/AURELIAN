import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { auth } from './auth.js';
import { apiRouter } from './routes/api.js';
import { db } from './db/index.js';
import { services } from './db/schema.js';
import { sql, eq } from 'drizzle-orm';
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
    
    // Seed initial services if empty & ensure schema updates
    try {
      await db.execute(sql`
        ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "price" integer DEFAULT 0;
        ALTER TABLE "shop_settings" ADD COLUMN IF NOT EXISTS "shopName" text DEFAULT 'Aurelian Salon';
        ALTER TABLE "shop_settings" ADD COLUMN IF NOT EXISTS "shopTagline" text DEFAULT 'Luxury Grooming & Styling';
        ALTER TABLE "shop_settings" ADD COLUMN IF NOT EXISTS "phone" text DEFAULT '+1 (555) 234-5678';
        ALTER TABLE "shop_settings" ADD COLUMN IF NOT EXISTS "email" text DEFAULT 'contact@aureliansalon.com';
        ALTER TABLE "shop_settings" ADD COLUMN IF NOT EXISTS "address" text DEFAULT '123 Luxury Ave, Beverly Hills, CA';
        ALTER TABLE "shop_settings" ADD COLUMN IF NOT EXISTS "autoConfirmBookings" boolean DEFAULT true;
        ALTER TABLE "shop_settings" ADD COLUMN IF NOT EXISTS "allowCancellation" boolean DEFAULT true;
        ALTER TABLE "shop_settings" ADD COLUMN IF NOT EXISTS "cancellationCutoffHours" integer DEFAULT 2;
        ALTER TABLE "shop_settings" ADD COLUMN IF NOT EXISTS "cancellationCutoffMinutes" integer DEFAULT 120;
        ALTER TABLE "shop_settings" ADD COLUMN IF NOT EXISTS "breakStartTime" varchar(5) DEFAULT '13:00';
        ALTER TABLE "shop_settings" ADD COLUMN IF NOT EXISTS "breakEndTime" varchar(5) DEFAULT '14:00';
        ALTER TABLE "shop_settings" ADD COLUMN IF NOT EXISTS "breakEnabled" boolean DEFAULT false;
        ALTER TABLE "shop_settings" ADD COLUMN IF NOT EXISTS "closedDays" text DEFAULT '0';
        ALTER TABLE "shop_settings" ADD COLUMN IF NOT EXISTS "currencySymbol" varchar(5) DEFAULT '$';
        ALTER TABLE "shop_settings" ADD COLUMN IF NOT EXISTS "announcementText" text DEFAULT '';
        ALTER TABLE "shop_settings" ADD COLUMN IF NOT EXISTS "announcementActive" boolean DEFAULT false;
      `);

      const existingServices = await db.select().from(services);
      if (existingServices.length === 0) {
        await db.insert(services).values([
          { name: 'Haircut', durationMinutes: 30, price: 75 },
          { name: 'Shaving', durationMinutes: 20, price: 50 },
        ]);
        console.log("Seeded initial default services.");
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
