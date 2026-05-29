import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuthUser } from "../../middleware/authenticate.js";
import { demoShifts, demoUsers, demoVehicles, routeOptions } from "../../seed/demo-domain.js";
import { fail, ok } from "../../utils/api-response.js";

const checkInSchema = z.object({
  vehicleId: z.string().min(3),
  route: z.string().min(3)
});

export async function registerShiftsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/current", async (request, reply) => {
    const user = request.user as AuthUser | undefined;
    if (!user) return fail(reply, 401, "UNAUTHENTICATED", "A valid access token is required");

    const shift = demoShifts.find((item) => item.userId === user.sub && item.status === "ACTIVE");
    return ok(reply, shift ?? null);
  });

  app.post("/check-in", async (request, reply) => {
    const user = request.user as AuthUser | undefined;
    if (!user) return fail(reply, 401, "UNAUTHENTICATED", "A valid access token is required");
    if (user.role !== "DRIVER" && user.role !== "CONDUCTOR" && user.role !== "SUPER_ADMIN") {
      return fail(reply, 403, "FORBIDDEN", "Only drivers and conductors can check into shifts");
    }

    const body = checkInSchema.parse(request.body);
    const vehicle = demoVehicles.find((item) => item.vehicleId === body.vehicleId || item.plate === body.vehicleId);
    if (!vehicle) return fail(reply, 404, "VEHICLE_NOT_FOUND", "Vehicle/car number was not found");
    const requestedRoute = routeOptions.find((item) => item.name === body.route || item.id === body.route);
    if (!requestedRoute) return fail(reply, 404, "ROUTE_NOT_FOUND", "Selected route was not found");

    const driver = demoUsers.find((item) => item.id === user.sub);
    const existing = demoShifts.find((item) => item.userId === user.sub && item.status === "ACTIVE");
    const activeBusShift = demoShifts.find((item) => item.vehicleId === vehicle.vehicleId && item.status === "ACTIVE" && item.userId !== user.sub);
    const busRoute = activeBusShift?.route ?? requestedRoute.name;
    if (existing) {
      existing.vehicleId = vehicle.vehicleId;
      existing.route = busRoute;
      vehicle.routeName = busRoute;
      return ok(reply, existing);
    }

    const shift = {
      id: `shift-${Date.now()}`,
      userId: user.sub,
      staffName: driver?.name ?? user.name,
      role: user.role === "CONDUCTOR" ? "CONDUCTOR" as const : "DRIVER" as const,
      vehicleId: vehicle.vehicleId,
      route: busRoute,
      startedAt: new Date().toISOString(),
      status: "ACTIVE" as const
    };
    demoShifts.push(shift);
    if (shift.role === "DRIVER") {
      vehicle.driverName = shift.staffName;
    }
    vehicle.routeName = busRoute;
    return ok(reply, shift);
  });

  app.post("/end", async (request, reply) => {
    const user = request.user as AuthUser | undefined;
    if (!user) return fail(reply, 401, "UNAUTHENTICATED", "A valid access token is required");
    const shift = demoShifts.find((item) => item.userId === user.sub && item.status === "ACTIVE");
    if (!shift) return fail(reply, 404, "SHIFT_NOT_FOUND", "No active shift was found");
    shift.status = "ENDED";
    return ok(reply, shift);
  });
}
