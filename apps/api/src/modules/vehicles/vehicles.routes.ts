import type { FastifyInstance } from "fastify";
import { fail, ok } from "../../utils/api-response.js";
import { demoLiveVehicles } from "../../seed/demo-live-vehicles.js";
import type { AuthUser } from "../../middleware/authenticate.js";

export async function registerVehicleRoutes(app: FastifyInstance): Promise<void> {
  app.get("/", async (request, reply) => {
    const user = request.user as AuthUser | undefined;
    if (user?.role === "FLEET_MARSHAL" && user.assignedRoute) {
      return ok(reply, demoLiveVehicles.filter((vehicle) => vehicle.routeName === user.assignedRoute));
    }

    if ((user?.role === "DRIVER" || user?.role === "CONDUCTOR") && user.assignedVehicleId) {
      return ok(reply, demoLiveVehicles.filter((vehicle) => vehicle.vehicleId === user.assignedVehicleId || vehicle.plate === user.assignedVehicleId));
    }

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
