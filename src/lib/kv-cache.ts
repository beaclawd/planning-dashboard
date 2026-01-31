// Planning Dashboard - Persistent Cache using Vercel KV

import { kv } from '@vercel/kv';
import { CacheData } from './types';

const CACHE_KEY = 'planning:dashboard:data';
const TTL = 5 * 60; // 5 minutes in seconds

/**
 * Get cached data from Vercel KV
 */
export async function get(): Promise<CacheData | null> {
  try {
    const data = await kv.get<CacheData>(CACHE_KEY);

    if (!data) {
      console.log('KV cache miss');
      return null;
    }

    const now = Date.now();
    const age = now - data.timestamp;

    if (age > TTL * 1000) {
      console.log('KV cache expired');
      return null;
    }

    console.log(`KV cache hit (age: ${Math.round(age / 1000)}s)`);
    return data;
  } catch (error) {
    console.error('Error reading from KV:', error);
    return null;
  }
}

/**
 * Set cached data in Vercel KV
 */
export async function set(data: Omit<CacheData, 'timestamp'>): Promise<void> {
  try {
    const cacheData: CacheData = {
      ...data,
      timestamp: Date.now(),
    };

    await kv.set(CACHE_KEY, cacheData, { ex: TTL });
    console.log('KV cache updated');
  } catch (error) {
    console.error('Error writing to KV:', error);
    throw error;
  }
}

/**
 * Clear cache from Vercel KV
 */
export async function clear(): Promise<void> {
  try {
    await kv.del(CACHE_KEY);
    console.log('KV cache cleared');
  } catch (error) {
    console.error('Error clearing KV cache:', error);
    throw error;
  }
}

/**
 * Check if cache is valid
 */
export async function isValid(): Promise<boolean> {
  try {
    const data = await get();
    return data !== null;
  } catch {
    return false;
  }
}

/**
 * Get cache age in seconds
 */
export async function getAge(): Promise<number> {
  try {
    const data = await get();
    if (!data) return -1;
    return Math.round((Date.now() - data.timestamp) / 1000);
  } catch {
    return -1;
  }
}
