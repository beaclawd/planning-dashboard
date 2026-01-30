// Planning Dashboard - In-Memory Cache

import { CacheData } from './types';

class Cache {
  private data: CacheData | null = null;
  private readonly TTL = 5 * 60 * 1000; // 5 minutes TTL

  /**
   * Get cached data if available and not expired
   */
  get(): CacheData | null {
    if (!this.data) {
      return null;
    }

    const now = Date.now();
    const age = now - this.data.timestamp;

    if (age > this.TTL) {
      console.log('Cache expired, returning null');
      return null;
    }

    console.log(`Cache hit (age: ${Math.round(age / 1000)}s)`);
    return this.data;
  }

  /**
   * Set cache data
   */
  set(data: Omit<CacheData, 'timestamp'>): void {
    this.data = {
      ...data,
      timestamp: Date.now(),
    };
    console.log('Cache updated');
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.data = null;
    console.log('Cache cleared');
  }

  /**
   * Check if cache is valid
   */
  isValid(): boolean {
    if (!this.data) return false;

    const now = Date.now();
    const age = now - this.data.timestamp;
    return age < this.TTL;
  }

  /**
   * Get cache age in seconds
   */
  getAge(): number {
    if (!this.data) return -1;
    return Math.round((Date.now() - this.data.timestamp) / 1000);
  }
}

// Export a singleton instance
export const cache = new Cache();
