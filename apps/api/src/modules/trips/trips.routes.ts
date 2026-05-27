import type { FastifyInstance } from "fastify";
import { demoTrips } from "../../seed/demo-domain.js";
import { fail, ok } from "../../utils/api-response.js";

export async function registerTripsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/", async (_request, reply) => ok(reply, demoTrips));

  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const trip = demoTrips.find((item) => item.id === id);
    return trip ? ok(reply, trip) : fail(reply, 404, "TRIP_NOT_FOUND", "Trip was not found");
  });
}
