import Redis from "ioredis";

const redisUrl =  "redis://127.0.0.1:6379";

const redis = new Redis(redisUrl);

redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("error", (err) => {
  console.error("❌ Redis error", err.message);
});

export default redis;