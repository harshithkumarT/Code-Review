/**
 * Simple High-Performance In-Memory Cache Middleware for Backend Routes
 */
const cacheStore = new Map();

export const cacheMiddleware = (durationInSeconds = 60) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Build unique cache key using user ID + request URL
    const userId = req.user ? (req.user.id || req.user._id || 'anonymous').toString() : 'anonymous';
    const key = `cache:${userId}:${req.originalUrl || req.url}`;

    const cachedResponse = cacheStore.get(key);

    if (cachedResponse && Date.now() < cachedResponse.expiry) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cachedResponse.data);
    }

    // Intercept res.json to store fresh data in cache
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheStore.set(key, {
          data,
          expiry: Date.now() + durationInSeconds * 1000,
        });
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(data);
    };

    next();
  };
};

/**
 * Utility to invalidate user cache entries when data mutates (e.g. on new review or delete)
 */
export const clearUserCache = (userId) => {
  if (!userId) return;
  const idStr = (userId.id || userId._id || userId).toString();
  const prefix = `cache:${idStr}`;
  for (const key of cacheStore.keys()) {
    if (key.startsWith(prefix)) {
      cacheStore.delete(key);
    }
  }
};
