import type { FastifyInstance } from "fastify";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import type { AuthUser } from "../../middleware/authenticate.js";
import { prisma } from "../../plugins/prisma.js";
import { demoCrewAssignments, demoUsers, demoVehicles, routeOptions } from "../../seed/demo-domain.js";
import { fail, ok } from "../../utils/api-response.js";

const assignCrewSchema = z.object({
  vehicleId: z.string().min(3),
  route: z.string().min(2),
  driverUserId: z.string().optional(),
  conductorUserId: z.string().optional()
});

export async function registerCrewRoutes(app: FastifyInstance): Promise<void> {
  app.get("/", async (_request, reply) => {
    try {
      const crew = await prisma.user.findMany({
        where: {
          role: { in: [UserRole.DRIVER, UserRole.CONDUCTOR] },
          assignedVehicleId: { not: null }
        },
        include: { assignedRoute: true, driverProfile: true },
        orderBy: { name: "asc" }
      });
      const assignments = new Map<string, {
        id: string;
        vehicleId: string;
        plate: string;
        route: string;
        driverUserId?: string;
        driverName?: string;
        conductorUserId?: string;
        conductorName?: string;
        assignedAt: string;
      }>();

      for (const member of crew) {
        if (!member.assignedVehicleId) continue;
        const existing = assignments.get(member.assignedVehicleId) ?? {
          id: `crew-${member.assignedVehicleId.toLowerCase()}`,
          vehicleId: member.assignedVehicleId,
          plate: member.assignedVehicleId.replace(/-/g, " "),
          route: member.assignedRoute?.name ?? "Unassigned",
          assignedAt: member.createdAt.toISOString()
        };
        existing.route = member.assignedRoute?.name ?? existing.route;
        if (member.role === UserRole.DRIVER) {
          existing.driverUserId = member.id;
          existing.driverName = member.name;
        }
        if (member.role === UserRole.CONDUCTOR) {
          existing.conductorUserId = member.id;
          existing.conductorName = member.name;
        }
        assignments.set(member.assignedVehicleId, existing);
      }

      return ok(reply, [...assignments.values()]);
    } catch {
      return ok(reply, demoCrewAssignments);
    }
  });

  app.post("/assign", async (request, reply) => {
    const user = request.user as AuthUser | undefined;
    if (!user || user.role !== "SUPER_ADMIN") {
      return fail(reply, 403, "FORBIDDEN", "Only admins can assign crew");
    }

    const body = assignCrewSchema.parse(request.body);

    try {
      const route = await prisma.route.findFirst({ where: { OR: [{ id: body.route }, { name: body.route }] } });
      if (!route) throw new Error("Route was not found in the database");
      const vehicle = await prisma.vehicle.findUnique({ where: { id: body.vehicleId } });
      if (!vehicle) throw new Error("Vehicle was not found in the database");

      const driverProfile = body.driverUserId
        ? await prisma.driver.findFirst({
            where: { OR: [{ id: body.driverUserId }, { userId: body.driverUserId }] },
            include: { user: true }
          })
        : null;
      const conductor = body.conductorUserId
        ? await prisma.user.findFirst({ where: { id: body.conductorUserId, role: UserRole.CONDUCTOR } })
        : null;

      await prisma.$transaction(async (tx) => {
        await tx.vehicle.update({
          where: { id: vehicle.id },
          data: {
            assignedRouteId: route.id,
            ...(driverProfile ? { currentDriverId: driverProfile.id } : {})
          }
        });
        if (driverProfile) {
          await tx.user.update({
            where: { id: driverProfile.userId },
            data: { assignedVehicleId: vehicle.id, assignedRouteId: route.id }
          });
        }
        if (conductor) {
          await tx.user.update({
            where: { id: conductor.id },
            data: { assignedVehicleId: vehicle.id, assignedRouteId: route.id }
          });
        }
      });

      return ok(reply, {
        id: `crew-${vehicle.id.toLowerCase()}`,
        vehicleId: vehicle.id,
        plate: vehicle.id.replace(/-/g, " "),
        route: route.name,
        driverUserId: driverProfile?.userId,
        driverName: driverProfile?.user.name,
        conductorUserId: conductor?.id,
        conductorName: conductor?.name,
        assignedAt: new Date().toISOString()
      });
    } catch (error) {
      app.log.warn(error);
    }

    const vehicle = demoVehicles.find((item) => item.vehicleId === body.vehicleId || item.plate === body.vehicleId);
    if (!vehicle) return fail(reply, 404, "VEHICLE_NOT_FOUND", "Bus number plate was not found");
    const route = routeOptions.find((item) => item.name === body.route || item.id === body.route);
    if (!route) return fail(reply, 404, "ROUTE_NOT_FOUND", "Route was not found");

    const driver = body.driverUserId ? demoUsers.find((item) => item.id === body.driverUserId && item.role === "DRIVER") : undefined;
    const conductor = body.conductorUserId ? demoUsers.find((item) => item.id === body.conductorUserId && item.role === "CONDUCTOR") : undefined;
    const existing = demoCrewAssignments.find((item) => item.vehicleId === vehicle.vehicleId);
    const assignment = existing ?? {
      id: `crew-${vehicle.vehicleId.toLowerCase()}`,
      vehicleId: vehicle.vehicleId,
      plate: vehicle.plate,
      route: route.name,
      assignedAt: new Date().toISOString()
    };

    assignment.route = route.name;
    assignment.driverUserId = driver?.id ?? assignment.driverUserId;
    assignment.driverName = driver?.name ?? assignment.driverName;
    assignment.conductorUserId = conductor?.id ?? assignment.conductorUserId;
    assignment.conductorName = conductor?.name ?? assignment.conductorName;
    assignment.assignedAt = new Date().toISOString();
    vehicle.routeName = route.name;
    if (assignment.driverName) vehicle.driverName = assignment.driverName;
    if (!existing) demoCrewAssignments.push(assignment);

    if (driver) {
      driver.assignedVehicleId = vehicle.vehicleId;
      driver.assignedRoute = route.name;
    }
    if (conductor) {
      conductor.assignedVehicleId = vehicle.vehicleId;
      conductor.assignedRoute = route.name;
    }

    return ok(reply, assignment);
  });
}
