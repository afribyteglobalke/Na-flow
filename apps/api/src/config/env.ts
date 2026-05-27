import { z } from "zod";
import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";

loadDotenv({ path: resolve(process.cwd(), ".env") });
loadDotenv({ path: resolve(process.cwd(), "../../.env"), override: false });

const envSchema = z.object({
  DATABASE_URL: z.string().url().default("postgresql://mfis:mfis@localhost:5432/mfis?schema=public"),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  JWT_SECRET: z.string().min(16).default("dev-only-change-this-secret"),
  JWT_EXPIRY: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRY: z.string().default("7d"),
  MQTT_BROKER_URL: z.string().default("mqtt://localhost:1883"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.string().default("info"),
  DEFAULT_SPEED_LIMIT_URBAN: z.coerce.number().default(50),
  DEFAULT_SPEED_LIMIT_HIGHWAY: z.coerce.number().default(80)
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return envSchema.parse(source);
}
