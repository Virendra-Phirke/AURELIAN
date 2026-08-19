import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');
import * as schema from './schema.js';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;

// Parse the connection string to extract password, user, etc. but override the host with the IP address
// to bypass Windows DNS/ISP blocking issues on .neon.tech domains.
const pool = new pg.Pool({
  host: '13.251.213.89', // Direct IP to the Neon proxy
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_fhmUEAD3jC7b', 
  port: 5432,
  ssl: { rejectUnauthorized: false },
  options: 'endpoint=ep-nameless-rain-azjgrr6l-pooler' // Required SNI routing parameter for Neon
});

export const db = drizzle(pool, { schema });
