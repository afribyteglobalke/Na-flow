import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import type { AuthUser } from "../../middleware/authenticate.js";
import { prisma } from "../../plugins/prisma.js";
import { demoUsers } from "../../seed/demo-domain.js";
import { fail, ok } from "../../utils/api-response.js";

const createConductorSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  password: z.string().min(8),
  assignedVehicleId: z.string().optional(),
  assignedRouteId: z.string().optional()
});

export async function registerConductorsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/", async (_request, reply) => {
    try {
      const conductors = await prisma.user.findMany({
        where: { role: UserRole.CONDUCTOR },
        include: { assignedRoute: true },
        orderBy: { createdAt: "desc" }
      });
      return ok(reply, conductors.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        vehicle: user.assignedVehicleId ?? "Unassigned",
        route: user.assignedRoute?.name ?? "Unassigned",
        passwordChangeAllowed: user.passwordChangeAllowed
      })));
    } catch {
      return ok(reply, demoUsers.filter((user) => user.role === "CONDUCTOR").map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        vehicle: user.assignedVehicleId ?? "Unassigned",
        route: user.assignedRoute ?? "Unassigned",
        passwordChangeAllowed: false
      })));
    }
  });

  app.post("/", async (request, reply) => {
    const user = request.user as AuthUser | undefined;
    if (!user || user.role !== "SUPER_ADMIN") {
      return fail(reply, 403, "FORBIDDEN", "Only admins can add conductors");
    }

    const body = createConductorSchema.parse(request.body);
    const passwordHash = await bcrypt.hash(body.password, 12);

    try {
      const conductor = await prisma.user.create({
        data: {
          name: body.name,
          email: body.email,
          phone: body.phone,
          passwordHash,
          passwordChangeAllowed: false,
          role: UserRole.CONDUCTOR,
          assignedVehicleId: body.assignedVehicleId,
          ...(body.assignedRouteId ? { assignedRoute: { connect: { id: body.assignedRouteId } } } : {})
        },
        include: { assignedRoute: true }
      });

      return reply.status(201).send({
        success: true,
        data: {
          id: conductor.id,
          name: conductor.name,
          email: conductor.email,
          phone: conductor.phone,
          vehicle: conductor.assignedVehicleId ?? "Unassigned",
          route: conductor.assignedRoute?.name ?? "Unassigned",
          passwordChangeAllowed: conductor.passwordChangeAllowed
        }
      });
    } catch (error) {
      app.log.warn(error);
      return fail(reply, 409, "CONDUCTOR_CREATE_FAILED", "Conductor could not be created. Check duplicate email or phone.");
    }
  });
}
