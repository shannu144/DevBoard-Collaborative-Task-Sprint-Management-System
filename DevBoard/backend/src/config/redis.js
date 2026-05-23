const { createClient } = require('redis');

let redisClient = null;
let isRedisConnected = false;

const connectRedis = async () => {
  if (process.env.NODE_ENV === 'test') return;

  try {
    const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    redisClient = createClient({ url });

    redisClient.on('error', (err) => {
      console.warn('⚠️ Redis Client Error:', err.message);
      isRedisConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('🚀 Redis client connecting...');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis connected and ready!');
      isRedisConnected = true;
    });

    redisClient.on('end', () => {
      console.warn('🔌 Redis client connection closed');
      isRedisConnected = false;
    });

    await redisClient.connect();
  } catch (error) {
    console.error('❌ Redis Connection Failed. API will fallback to database directly.', error.message);
    isRedisConnected = false;
    redisClient = null;
  }
};

const getRedisClient = () => {
  return isRedisConnected ? redisClient : null;
};

const clearCachePattern = async (pattern) => {
  if (!isRedisConnected || !redisClient) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys && keys.length > 0) {
      await redisClient.del(keys);
      console.log(`🧹 Cache cleared for pattern: ${pattern} (${keys.length} keys)`);
    }
  } catch (err) {
    console.warn(`⚠️ Failed to clear Redis cache for pattern ${pattern}:`, err.message);
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  clearCachePattern
};
