interface CacheEntry<T> {
  data: T;
  expiry: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlSeconds * 1000
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

export const cache = new SimpleCache();

export const CACHE_TTL = {
  PRODUCTS: 60,
  BANNERS: 300,
  VERSE: 3600,
  COMPANY_INFO: 600,
  FREE_SHIPPING: 300
} as const;
