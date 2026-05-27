import { Redis } from "ioredis";
import { loadEnv } from "../config/env.js";

export function createRedisClient(): Redis {
  const env = loadEnv();
  return new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 2
  });
}
