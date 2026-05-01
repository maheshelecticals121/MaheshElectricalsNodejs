import Redis from "ioredis";

// 🔥 Toggle (env se control hoga)
const isLocal = process.env.LOCAL === "true";

// ✅ URLs
const LOCAL_REDIS = "redis://127.0.0.1:6379";
const PROD_REDIS = process.env.REDIS_URL;

// 👉 Final URL select
const redisUrl = isLocal ? LOCAL_REDIS : PROD_REDIS;

// 🔥 Redis instance
const redis = new Redis(redisUrl, {
  tls: !isLocal
    ? { rejectUnauthorized: false } // production (Render)
    : undefined,
});

redis.on("connect", () => {
  console.log(`✅ Redis connected (${isLocal ? "LOCAL" : "PROD"})`);
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err.message);
});

export default redis;