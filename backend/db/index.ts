import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import dns from 'node:dns';
import * as schema from './schema.js';
import dotenv from 'dotenv';
dotenv.config();

dns.setDefaultResultOrder('ipv4first');

// Neon proxy fallback IP for ap-southeast-1 region (prevents ENOTFOUND on restricted local ISP DNS)
const NEON_DEFAULT_PROXY_IP = '13.251.213.89';

function createPoolConfig(): pg.PoolConfig {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return {
      host: process.env.DB_HOST || '127.0.0.1',
      database: process.env.DB_NAME || 'aurelian',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      port: Number(process.env.DB_PORT) || 5432,
      max: 20,
      min: 2,
    };
  }

  try {
    const url = new URL(connectionString);
    const hostname = url.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === 'postgres';

    if (isLocal) {
      return {
        host: hostname,
        port: Number(url.port) || 5432,
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.replace(/^\//, '') || 'aurelian',
        max: 20,
        min: 2,
      };
    }

    const isNeon = hostname.includes('neon.tech');
    const endpoint = isNeon ? hostname.split('.')[0] : (url.searchParams.get('options')?.replace('endpoint=', '') || '');

    // For Neon, use the proxy IP with SNI servername to guarantee zero ENOTFOUND errors across all networks/ISPs
    const targetHost = isNeon ? NEON_DEFAULT_PROXY_IP : hostname;

    return {
      host: targetHost,
      port: Number(url.port) || 5432,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, '') || 'neondb',
      ssl: {
        rejectUnauthorized: false,
        servername: hostname,
      },
      options: endpoint ? `endpoint=${endpoint}` : undefined,
      max: 20,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    };
  } catch (err: any) {
    console.warn('[Postgres Pool] URL parse error, falling back to raw connectionString:', err.message);
    return {
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 20,
      min: 2,
    };
  }
}

const pool = new pg.Pool(createPoolConfig());

pool.on('error', (err) => {
  console.warn('[Postgres Pool] Idle client connection closed or reset:', err.message || err);
});

export const db = drizzle(pool, { schema });
