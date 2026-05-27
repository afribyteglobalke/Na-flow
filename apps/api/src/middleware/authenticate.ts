import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { fail } from "../utils/api-response.js";

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  role: string;
  assignedVehicleId?: string;
  assignedRoute?: string;
  passwordChangeAllowed?: boolean;
}

export async function authenticate(app: FastifyInstance, request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    request.user = await app.jwt.verify<AuthUser>(request.headers.authorization?.replace("Bearer ", "") ?? "");
  } catch {
    fail(reply, 401, "UNAUTHENTICATED", "A valid access token is required");
  }
}
