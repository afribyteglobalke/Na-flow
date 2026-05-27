import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "../../plugins/prisma.js";
import { demoUsers } from "../../seed/demo-domain.js";
import { fail, ok } from "../../utils/api-response.js";

const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(6)
});

interface AuthRecord {
  id: string;
  email: string;
  phone: string;
  passwordHash?: string;
  password?: string;
  name: string;
  role: string;
  assignedVehicleId?: string;
  assignedRoute?: string;
  passwordChangeAllowed?: boolean;
}

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  app.post("/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const user = await findUserForLogin(body.identifier);

    if (!user || !(await verifyPassword(user, body.password))) {
      return fail(reply, 401, "INVALID_CREDENTIALS", "Email/phone or password is incorrect");
    }

    const tokenPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      assignedVehicleId: user.assignedVehicleId,
      assignedRoute: user.assignedRoute,
      passwordChangeAllowed: user.passwordChangeAllowed ?? user.role !== "DRIVER"
    };

    return ok(reply, {
      user: tokenPayload,
      accessToken: app.jwt.sign(tokenPayload, { expiresIn: "15m" }),
      refreshToken: app.jwt.sign({ sub: user.id, type: "refresh" }, { expiresIn: "7d" })
    });
  });

  app.post("/refresh", async (request, reply) => {
    const schema = z.object({ refreshToken: z.string().min(10) });
    const { refreshToken } = schema.parse(request.body);
    const decoded = app.jwt.verify<{ sub: string; type: string }>(refreshToken);
    const user = await findUserById(decoded.sub);

    if (!user || decoded.type !== "refresh") {
      return fail(reply, 401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid");
    }

    const tokenPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      assignedVehicleId: user.assignedVehicleId,
      assignedRoute: user.assignedRoute,
      passwordChangeAllowed: user.passwordChangeAllowed ?? user.role !== "DRIVER"
    };

    return ok(reply, {
      accessToken: app.jwt.sign(tokenPayload, { expiresIn: "15m" })
    });
  });

  app.post("/logout", async (_request, reply) => ok(reply, { loggedOut: true }));
  app.post("/mfa/enable", async (_request, reply) => ok(reply, { secret: "MFIS-DEMO-TOTP", qrCodeUrl: "otpauth://totp/Na-Flow:demo" }));
  app.post("/mfa/verify", async (_request, reply) => ok(reply, { verified: true }));
  app.post("/password/reset-request", async (request, reply) => {
    const schema = z.object({ identifier: z.string().min(3) });
    const { identifier } = schema.parse(request.body);
    const user = await findUserForLogin(identifier);
    if (user?.role === "DRIVER" || user?.passwordChangeAllowed === false) {
      return fail(reply, 403, "PASSWORD_ADMIN_MANAGED", "Driver passwords are managed by an admin");
    }
    return ok(reply, { queued: true });
  });
  app.post("/password/reset", async (request, reply) => {
    const schema = z.object({ identifier: z.string().min(3), password: z.string().min(8) });
    const { identifier } = schema.parse(request.body);
    const user = await findUserForLogin(identifier);
    if (user?.role === "DRIVER" || user?.passwordChangeAllowed === false) {
      return fail(reply, 403, "PASSWORD_ADMIN_MANAGED", "Driver passwords are managed by an admin");
    }
    return ok(reply, { reset: true });
  });
}

async function findUserForLogin(identifier: string): Promise<AuthRecord | null> {
  if (shouldUseDatabase()) {
    try {
      const dbUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: identifier }, { phone: identifier }]
        }
      });
      if (dbUser) return dbUser;
    } catch {
      // Local tests and first-run environments can use the demo users until Prisma is pushed.
    }
  }

  return demoUsers.find((item) => item.email === identifier || item.phone === identifier) ?? null;
}

async function findUserById(id: string): Promise<AuthRecord | null> {
  if (shouldUseDatabase()) {
    try {
      const dbUser = await prisma.user.findUnique({ where: { id } });
      if (dbUser) return dbUser;
    } catch {
      // See findUserForLogin fallback note.
    }
  }

  return demoUsers.find((item) => item.id === id) ?? null;
}

async function verifyPassword(user: AuthRecord, password: string): Promise<boolean> {
  if (user.passwordHash) {
    return bcrypt.compare(password, user.passwordHash);
  }

  return user.password === password;
}

function shouldUseDatabase(): boolean {
  return process.env.VITEST !== "true" && process.env.NODE_ENV !== "test";
}
