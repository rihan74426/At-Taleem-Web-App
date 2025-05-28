import { LRUCache } from "lru-cache";

export function rateLimit({
  interval = 60 * 1000, // 1 minute
  uniqueTokenPerInterval = 500,
} = {}) {
  const tokenCache = new LRUCache({
    max: uniqueTokenPerInterval,
    ttl: interval,
  });

  return {
    check: (limit, token) =>
      new Promise((resolve, reject) => {
        const tokenCount = tokenCache.get(token) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, [1]);
        } else {
          tokenCount[0] += 1;
          tokenCache.set(token, tokenCount);
        }
        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage >= limit;
        tokenCache.set(token, tokenCount);

        if (isRateLimited) {
          const error = new Error("Rate limit exceeded");
          error.code = "RATE_LIMIT_EXCEEDED";
          reject(error);
        } else {
          resolve();
        }
      }),
  };
}
