import { PrismaClient } from "@prisma/client";
import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";

loadDotenv({ path: resolve(process.cwd(), ".env") });
loadDotenv({ path: resolve(process.cwd(), "../../.env"), override: false });

export const prisma = new PrismaClient({
  log: ["error", "warn"]
});
