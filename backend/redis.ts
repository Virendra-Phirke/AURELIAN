import { createClient } from "redis";
import { Redis as UpstashRedis } from "@upstash/redis";
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

// Check for Upstash REST credentials (injected automatically by Vercel Upstash integration)
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

let upstashClient: UpstashRedis | null = null;
let nodeRedisClient: any = null;
let nodeRedisConnected = false;

if (upstashUrl && upstashToken) {
  try {
    upstashClient = new UpstashRedis({
      url: upstashUrl,
      token: upstashToken,
    });
    console.log("[Redis] Using Upstash HTTP REST Client for serverless edge.");
  } catch (err: any) {
    console.warn("[Redis] Failed to initialize Upstash REST client:", err.message);
  }
} else if (process.env.REDIS_URL) {
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
      if (nodeRedisConnected) {
        console.warn("[Redis] Connection error, using memory fallback:", err.message);
      }
      nodeRedisConnected = false;
    });

    realClient.on("ready", () => {
      nodeRedisConnected = true;
      console.log("[Redis] Connected to real Redis instance:", process.env.REDIS_URL?.replace(/:[^:@]+@/, ":***@"));
    });

    realClient.connect().catch((err) => {
      console.warn("[Redis] Failed to connect to real Redis, using in-memory fallback:", err.message);
      nodeRedisConnected = false;
    });

    nodeRedisClient = realClient;
  } catch (err: any) {
    console.warn("[Redis] Initialization error, falling back to memory:", err.message);
  }
} else {
  console.log("[Redis] No REDIS_URL or Upstash config provided, using in-memory cache.");
}

const redisWrapper = {
  async get(key: string): Promise<string | null> {
    if (upstashClient) {
      try {
        const res = await upstashClient.get<any>(key);
        if (res === null || res === undefined) return null;
        return typeof res === 'string' ? res : JSON.stringify(res);
      } catch {
        return await mock.get(key);
      }
    }
    if (nodeRedisConnected && nodeRedisClient) {
      try { return await nodeRedisClient.get(key); } catch { return await mock.get(key); }
    }
    return await mock.get(key);
  },
  async set(key: string, value: string, options?: { EX?: number; NX?: boolean }): Promise<string | null> {
    if (upstashClient) {
      try {
        const upstashOpts: any = {};
        if (options?.EX) upstashOpts.ex = options.EX;
        if (options?.NX) upstashOpts.nx = true;
        const res = await upstashClient.set(key, value, upstashOpts);
        return res ? "OK" : null;
      } catch {
        return await mock.set(key, value, options);
      }
    }
    if (nodeRedisConnected && nodeRedisClient) {
      try { return await nodeRedisClient.set(key, value, options); } catch { return await mock.set(key, value, options); }
    }
    return await mock.set(key, value, options);
  },
  async del(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    if (upstashClient) {
      try {
        await upstashClient.del(...keys);
        return;
      } catch {
        await mock.del(...keys);
        return;
      }
    }
    if (nodeRedisConnected && nodeRedisClient) {
      try { await nodeRedisClient.del(keys); return; } catch { await mock.del(...keys); return; }
    }
    await mock.del(...keys);
  },
  async keys(pattern?: string): Promise<string[]> {
    if (upstashClient) {
      try {
        return await upstashClient.keys(pattern || '*');
      } catch {
        return await mock.keys(pattern);
      }
    }
    if (nodeRedisConnected && nodeRedisClient) {
      try { return await nodeRedisClient.keys(pattern || '*'); } catch { return await mock.keys(pattern); }
    }
    return await mock.keys(pattern);
  },
  async incr(key: string): Promise<number> {
    if (upstashClient) {
      try {
        return await upstashClient.incr(key);
      } catch {
        return await mock.incr(key);
      }
    }
    if (nodeRedisConnected && nodeRedisClient) {
      try { return await nodeRedisClient.incr(key); } catch { return await mock.incr(key); }
    }
    return await mock.incr(key);
  },
  async expire(key: string, seconds: number): Promise<number> {
    if (upstashClient) {
      try {
        return await upstashClient.expire(key, seconds);
      } catch {
        return await mock.expire(key, seconds);
      }
    }
    if (nodeRedisConnected && nodeRedisClient) {
      try { return await nodeRedisClient.expire(key, seconds); } catch { return await mock.expire(key, seconds); }
    }
    return await mock.expire(key, seconds);
  },
  async flushall(): Promise<void> {
    if (upstashClient) {
      try {
        await upstashClient.flushdb();
        return;
      } catch {
        await mock.flushall();
        return;
      }
    }
    if (nodeRedisConnected && nodeRedisClient) {
      try { await nodeRedisClient.flushAll(); return; } catch { await mock.flushall(); return; }
    }
    await mock.flushall();
  }
};

export default redisWrapper;
