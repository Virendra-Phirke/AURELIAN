import { createClient } from "redis";
import dotenv from "dotenv";
dotenv.config();

class RedisMock {
  private map = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string) {
    const item = this.map.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.map.delete(key);
      return null;
    }
    return item.value;
  }
  async set(key: string, value: string, options?: { EX?: number; NX?: boolean }) {
    if (options?.NX && this.map.has(key)) {
      const existing = this.map.get(key);
      if (!existing?.expiresAt || Date.now() <= existing.expiresAt) return null;
    }
    const expiresAt = options?.EX ? Date.now() + options.EX * 1000 : undefined;
    this.map.set(key, { value, expiresAt });
    return "OK";
  }
  async del(...keys: string[]) {
    for (const k of keys) {
      this.map.delete(k);
    }
  }
  async keys(pattern?: string) {
    if (!pattern || pattern === '*') return Array.from(this.map.keys());
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Array.from(this.map.keys()).filter(k => regex.test(k));
  }
  async flushall() {
    this.map.clear();
  }
  async incr(key: string) {
    const item = await this.get(key);
    const val = (parseInt(item || "0") + 1).toString();
    await this.set(key, val);
    return parseInt(val);
  }
  async expire(key: string, seconds: number) {
    const item = await this.get(key);
    if (item) {
      this.map.set(key, { value: item, expiresAt: Date.now() + seconds * 1000 });
      return 1;
    }
    return 0;
  }
}

const mock = new RedisMock();

let client: any = null;
let isConnected = false;

if (process.env.REDIS_URL) {
  try {
    const realClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 5) return new Error("Redis retry limit reached");
          return Math.min(retries * 100, 3000);
        }
      }
    });

    realClient.on("error", (err) => {
      if (isConnected) {
        console.warn("[Redis] Connection error, using memory fallback:", err.message);
      }
      isConnected = false;
    });

    realClient.on("ready", () => {
      isConnected = true;
      console.log("[Redis] Connected to real Redis instance:", process.env.REDIS_URL?.replace(/:[^:@]+@/, ":***@"));
    });

    realClient.connect().catch((err) => {
      console.warn("[Redis] Failed to connect to real Redis, using in-memory cache fallback:", err.message);
      isConnected = false;
    });

    client = realClient;
  } catch (err: any) {
    console.warn("[Redis] Initialization error, falling back to memory:", err.message);
  }
} else {
  console.log("[Redis] No REDIS_URL provided, using in-memory cache.");
}

const redisWrapper = {
  async get(key: string) {
    if (isConnected && client) {
      try { return await client.get(key); } catch { return await mock.get(key); }
    }
    return await mock.get(key);
  },
  async set(key: string, value: string, options?: { EX?: number; NX?: boolean }) {
    if (isConnected && client) {
      try { return await client.set(key, value, options); } catch { return await mock.set(key, value, options); }
    }
    return await mock.set(key, value, options);
  },
  async del(...keys: string[]) {
    if (isConnected && client && keys.length > 0) {
      try { return await client.del(keys); } catch { return await mock.del(...keys); }
    }
    return await mock.del(...keys);
  },
  async keys(pattern?: string) {
    if (isConnected && client) {
      try { return await client.keys(pattern || '*'); } catch { return await mock.keys(pattern); }
    }
    return await mock.keys(pattern);
  },
  async incr(key: string) {
    if (isConnected && client) {
      try { return await client.incr(key); } catch { return await mock.incr(key); }
    }
    return await mock.incr(key);
  },
  async expire(key: string, seconds: number) {
    if (isConnected && client) {
      try { return await client.expire(key, seconds); } catch { return await mock.expire(key, seconds); }
    }
    return await mock.expire(key, seconds);
  },
  async flushall() {
    if (isConnected && client) {
      try { return await client.flushAll(); } catch { return await mock.flushall(); }
    }
    return await mock.flushall();
  }
};

export default redisWrapper;
