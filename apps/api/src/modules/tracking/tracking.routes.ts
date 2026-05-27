import type { FastifyInstance } from "fastify";
import { ok } from "../../utils/api-response.js";
import { demoLiveVehicles } from "../../seed/demo-live-vehicles.js";

export async function registerTrackingRoutes(app: FastifyInstance): Promise<void> {
  app.get("/live", async (_request, reply) => {
    return ok(reply, demoLiveVehicles);
  });

  app.get("/fleet-status", async (_request, reply) => {
    const counts = demoLiveVehicles.reduce(
      (acc, vehicle) => {
        acc[vehicle.status.toLowerCase() as keyof typeof acc] += 1;
        return acc;
      },
      { active: 0, idle: 0, maintenance: 0, offline: 0 }
    );

    return ok(reply, counts);
  });
}
