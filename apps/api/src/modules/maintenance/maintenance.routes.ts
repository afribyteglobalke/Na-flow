import type { FastifyInstance } from "fastify";
import { demoMaintenanceJobs } from "../../seed/demo-domain.js";
import { ok } from "../../utils/api-response.js";

export async function registerMaintenanceRoutes(app: FastifyInstance): Promise<void> {
  app.get("/jobs", async (_request, reply) => ok(reply, demoMaintenanceJobs));
  app.get("/schedule", async (_request, reply) => ok(reply, demoMaintenanceJobs));
  app.get("/vehicles/:vehicleId/obd-codes", async (_request, reply) => ok(reply, [
    { dtcCode: "P0217", description: "Engine coolant over temperature condition", severity: "CRITICAL" },
    { dtcCode: "P0301", description: "Cylinder 1 misfire detected", severity: "WARNING" }
  ]));
}
