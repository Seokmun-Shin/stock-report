/** 서버 API 라우트용 — 짧은 TTL 메모리 캐시 + 재시도 */

const cache = new Map<string, { expires: number; data: unknown }>();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 350): Promise<T> {
  let last: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      if (i < retries) await sleep(delayMs * (i + 1));
    }
  }
  throw last;
}

export function getCached<T>(key: string): T | null {
  const hit = cache.get(key);
  if (!hit || hit.expires <= Date.now()) {
    if (hit) cache.delete(key);
    return null;
  }
  return hit.data as T;
}

export function setCached(key: string, data: unknown, ttlMs: number) {
  cache.set(key, { data, expires: Date.now() + ttlMs });
}

export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = getCached<T>(key);
  if (hit != null) return hit;
  const data = await fn();
  setCached(key, data, ttlMs);
  return data;
}
