class RedisMock {
  private map = new Map<string, { value: string; expiresAt?: number }>();

  async connect() { console.log("Using in-memory cache."); }
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

const redisClient = new RedisMock();
redisClient.connect();

export default redisClient as any;
