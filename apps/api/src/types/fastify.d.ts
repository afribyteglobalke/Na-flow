import type { AuthUser } from "../middleware/authenticate.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
  }
}
