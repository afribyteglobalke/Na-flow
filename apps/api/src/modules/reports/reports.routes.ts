import type { FastifyInstance } from "fastify";
import { demoDrivers, demoMaintenanceJobs, demoTrips, demoVehicles } from "../../seed/demo-domain.js";
import { ok } from "../../utils/api-response.js";

export async function registerReportsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/daily-summary", async (_request, reply) => ok(reply, {
    activeVehicles: 42,
    trips: demoTrips.length,
    passengers: demoTrips.reduce((sum, trip) => sum + trip.passengers, 0),
    revenueKes: 284500
  }));
  app.get("/revenue", async (_request, reply) => ok(reply, { totalKes: 284500, vehicles: demoVehicles }));
  app.get("/fuel", async (_request, reply) => ok(reply, { averageKmPerLitre: 9.4 }));
  app.get("/driver-performance", async (_request, reply) => ok(reply, demoDrivers));
  app.get("/passengers", async (_request, reply) => ok(reply, demoTrips));
  app.get("/maintenance-costs", async (_request, reply) => ok(reply, demoMaintenanceJobs));
}
