import Redis from "ioredis";

const isLocal = process.env.LOCAL === "true";

const redisUrl = isLocal
  ? "redis://127.0.0.1:6379"
  : process.env.REDIS_URL;

console.log("REDIS URL:", redisUrl?.replace(/:(.*?)@/, ":***@"));

const redis = new Redis(redisUrl, {
  connectTimeout: 10000,
  maxRetriesPerRequest: 2,
  enableReadyCheck: true,
  retryStrategy(times) {
    // 2s tak backoff, phir give up
    return Math.min(times * 200, 2000);
  },
});

redis.on("ready", () => {
  console.log(`✅ Redis ready (${isLocal ? "LOCAL" : "PROD"})`);
});

redis.on("connect", () => {
  console.log(`🔌 Redis socket connected`);
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err.message);
});

export default redis;