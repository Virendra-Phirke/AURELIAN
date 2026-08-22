import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');
import * as schema from './schema.js';
import dotenv from 'dotenv';
dotenv.config();

// Direct IP connection to the Neon proxy with optimized connection pooling
const pool = new pg.Pool({
  host: '13.251.213.89', // Direct IP to the Neon proxy
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_fhmUEAD3jC7b', 
  port: 5432,
  ssl: { rejectUnauthorized: false },
  options: 'endpoint=ep-nameless-rain-azjgrr6l-pooler', // Required SNI routing parameter for Neon
  max: 20, // Max simultaneous connections in pool
  min: 2,  // Keep 2 warm connections ready to avoid cold-start handshakes
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on('error', (err) => {
  console.warn('[Postgres Pool] Idle client connection closed or reset:', err.message || err);
});

export const db = drizzle(pool, { schema });
