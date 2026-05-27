import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../plugins/prisma.js";
import type { AuthUser } from "../../middleware/authenticate.js";
import { demoDrivers } from "../../seed/demo-domain.js";
import { fail, ok } from "../../utils/api-response.js";

const createDriverSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  password: z.string().min(8),
  licenseNumber: z.string().min(3),
  licenseExpiry: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  mpesaPhone: z.string().min(7),
  assignedRouteId: z.string().optional()
});

export async function registerDriversRoutes(app: FastifyInstance): Promise<void> {
  app.get("/", async (_request, reply) => {
    try {
      const drivers = await prisma.driver.findMany({
        include: { user: true },
        orderBy: { createdAt: "desc" }
      });
      return ok(
        reply,
        drivers.map((driver) => ({
          id: driver.id,
          name: driver.user.name,
          licenseNumber: driver.licenseNumber,
          experience: "New",
          phone: driver.user.phone,
          safetyScore: driver.safetyScore,
          vehicle: "Unassigned",
          route: driver.user.assignedRouteId ?? "Unassigned",
          tripsToday: 0,
          revenueKes: 0,
          harshEvents: 0
        }))
      );
    } catch {
      return ok(reply, demoDrivers);
    }
  });

  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const driver = demoDrivers.find((item) => item.id === id);
    return driver ? ok(reply, driver) : fail(reply, 404, "DRIVER_NOT_FOUND", "Driver was not found");
  });

  app.post("/", async (request, reply) => {
    const user = request.user as AuthUser | undefined;
    if (!user || user.role !== "SUPER_ADMIN") {
      return fail(reply, 403, "FORBIDDEN", "Only admins can add drivers");
    }

    const body = createDriverSchema.parse(request.body);
    const passwordHash = await bcrypt.hash(body.password, 12);

    try {
      const driver = await prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            name: body.name,
            email: body.email,
            phone: body.phone,
            passwordHash,
            passwordChangeAllowed: false,
            role: UserRole.DRIVER,
            ...(body.assignedRouteId ? { assignedRoute: { connect: { id: body.assignedRouteId } } } : {})
          }
        });

        return tx.driver.create({
          data: {
            userId: createdUser.id,
            licenseNumber: body.licenseNumber,
            licenseExpiry: new Date(body.licenseExpiry),
            safetyScore: 100,
            mpesaPhone: body.mpesaPhone
          },
          include: { user: true }
        });
      });

      return reply.status(201).send({
        success: true,
        data: {
          id: driver.id,
          name: driver.user.name,
          email: driver.user.email,
          phone: driver.user.phone,
          role: driver.user.role,
          passwordChangeAllowed: driver.user.passwordChangeAllowed,
          licenseNumber: driver.licenseNumber
        }
      });
    } catch (error) {
      app.log.warn(error);
      return fail(reply, 409, "DRIVER_CREATE_FAILED", "Driver could not be created. Check duplicate email, phone, or license number.");
    }
  });
}
