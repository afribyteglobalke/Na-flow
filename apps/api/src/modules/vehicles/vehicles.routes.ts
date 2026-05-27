import type { FastifyInstance } from "fastify";
import { fail, ok } from "../../utils/api-response.js";
import { demoLiveVehicles } from "../../seed/demo-live-vehicles.js";

export async function registerVehicleRoutes(app: FastifyInstance): Promise<void> {
  app.get("/", async (_request, reply) => {
    return ok(reply, demoLiveVehicles);
  });

  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const vehicle = demoLiveVehicles.find((item) => item.vehicleId === id || item.plate === id);

    if (!vehicle) {
      return fail(reply, 404, "VEHICLE_NOT_FOUND", "Vehicle was not found");
    }

    return ok(reply, vehicle);
  });
}
