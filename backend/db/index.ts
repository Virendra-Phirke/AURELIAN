import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');
import * as schema from './schema.js';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;

// Connection pool supporting DATABASE_URL or discrete environment variables
const pool = connectionString
  ? new pg.Pool({
      connectionString,
      ssl: connectionString.includes('sslmode=require') || connectionString.includes('neon.tech') 
        ? { rejectUnauthorized: false } 
        : false,
      max: 20,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    })
  : new pg.Pool({
      host: process.env.DB_HOST || '127.0.0.1',
      database: process.env.DB_NAME || 'aurelian',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      port: Number(process.env.DB_PORT) || 5432,
      max: 20,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

pool.on('error', (err) => {
  console.warn('[Postgres Pool] Idle client connection closed or reset:', err.message || err);
});

export const db = drizzle(pool, { schema });
