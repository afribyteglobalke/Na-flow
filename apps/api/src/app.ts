import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import websocket from "@fastify/websocket";
import fastify, { type FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { loadEnv } from "./config/env.js";
import type { AuthUser } from "./middleware/authenticate.js";
import { registerAlertsRoutes } from "./modules/alerts/alerts.routes.js";
import { registerAuthRoutes } from "./modules/auth/auth.routes.js";
import { registerConductorsRoutes } from "./modules/conductors/conductors.routes.js";
import { registerCrewRoutes } from "./modules/crew/crew.routes.js";
import { registerDashboardRoutes } from "./modules/dashboard/dashboard.routes.js";
import { registerDriversRoutes } from "./modules/drivers/drivers.routes.js";
import { registerMaintenanceRoutes } from "./modules/maintenance/maintenance.routes.js";
import { registerPaymentsRoutes } from "./modules/payments/payments.routes.js";
import { registerReportsRoutes } from "./modules/reports/reports.routes.js";
import { registerRoutesRoutes } from "./modules/routes/routes.routes.js";
import { registerShiftsRoutes } from "./modules/shifts/shifts.routes.js";
import { registerTrackingRoutes } from "./modules/tracking/tracking.routes.js";
import { registerTripsRoutes } from "./modules/trips/trips.routes.js";
import { registerVehicleRoutes } from "./modules/vehicles/vehicles.routes.js";
import { fail, ok } from "./utils/api-response.js";

export async function buildApp(): Promise<FastifyInstance> {
  const env = loadEnv();
  const logger =
    env.NODE_ENV === "development"
      ? { level: env.LOG_LEVEL, transport: { target: "pino-pretty" } }
      : { level: env.LOG_LEVEL };

  const app = fastify({
    logger
  });

  await app.register(cors, { origin: true });
  await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });
  await app.register(jwt, { secret: env.JWT_SECRET });
  await app.register(websocket);

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return fail(reply, 400, "VALIDATION_ERROR", "Request validation failed", error.flatten());
    }

    app.log.error(error);
    return fail(reply, 500, "INTERNAL_SERVER_ERROR", "Unexpected server error");
  });

  app.get("/health", async (_request, reply) => {
    return ok(reply, { status: "ok", service: "na-flow-api" });
  });

  app.addHook("onRequest", async (request, reply) => {
    const url = request.url;
    if (!url.startsWith("/api/v1") || url.startsWith("/api/v1/auth")) {
      return;
    }

    try {
      request.user = await app.jwt.verify<AuthUser>(request.headers.authorization?.replace("Bearer ", "") ?? "");
    } catch {
      return fail(reply, 401, "UNAUTHENTICATED", "A valid access token is required");
    }

    const authUser = request.user as AuthUser;
    if (!isRouteAllowed(authUser.role, url)) {
      return fail(reply, 403, "FORBIDDEN", "Your role cannot access this resource");
    }
  });

  await app.register(registerAuthRoutes, { prefix: "/api/v1/auth" });
  await app.register(registerDashboardRoutes, { prefix: "/api/v1/dashboard" });
  await app.register(registerVehicleRoutes, { prefix: "/api/v1/vehicles" });
  await app.register(registerTrackingRoutes, { prefix: "/api/v1/tracking" });
  await app.register(registerShiftsRoutes, { prefix: "/api/v1/shifts" });
  await app.register(registerTripsRoutes, { prefix: "/api/v1/trips" });
  await app.register(registerRoutesRoutes, { prefix: "/api/v1/routes" });
  await app.register(registerPaymentsRoutes, { prefix: "/api/v1/payments" });
  await app.register(registerAlertsRoutes, { prefix: "/api/v1/alerts" });
  await app.register(registerDriversRoutes, { prefix: "/api/v1/drivers" });
  await app.register(registerConductorsRoutes, { prefix: "/api/v1/conductors" });
  await app.register(registerCrewRoutes, { prefix: "/api/v1/crew" });
  await app.register(registerMaintenanceRoutes, { prefix: "/api/v1/maintenance" });
  await app.register(registerReportsRoutes, { prefix: "/api/v1/reports" });

  return app;
}

function isRouteAllowed(role: string, url: string): boolean {
  if (role === "SUPER_ADMIN") return true;
  if (role === "DRIVER") {
    return url.startsWith("/api/v1/shifts") || url.startsWith("/api/v1/vehicles") || url.startsWith("/api/v1/trips") || url.startsWith("/api/v1/alerts") || url.startsWith("/api/v1/payments") || url.startsWith("/api/v1/routes");
  }
  if (role === "CONDUCTOR") {
    return url.startsWith("/api/v1/shifts") || url.startsWith("/api/v1/vehicles") || url.startsWith("/api/v1/payments") || url.startsWith("/api/v1/alerts") || url.startsWith("/api/v1/routes");
  }
  if (role === "FLEET_MARSHAL" || role === "DISPATCHER" || role === "OPERATIONS_MANAGER") {
    return url.startsWith("/api/v1/dashboard") || url.startsWith("/api/v1/vehicles") || url.startsWith("/api/v1/tracking") || url.startsWith("/api/v1/alerts") || url.startsWith("/api/v1/routes");
  }
  return url.startsWith("/api/v1/reports");
}
