import type { FastifyInstance } from "fastify";
import { splitFare } from "@na-flow/shared-utils";
import { z } from "zod";
import type { AuthUser } from "../../middleware/authenticate.js";
import { demoFareCollections, demoVehicles, revenueByRoute } from "../../seed/demo-domain.js";
import { initiateStkPush } from "../../services/mpesa/daraja.service.js";
import { fail, ok } from "../../utils/api-response.js";

const stkPushSchema = z.object({
  phone: z.string().min(9),
  amountKes: z.coerce.number().positive(),
  vehicleId: z.string().min(3),
  route: z.string().min(3).optional()
});

export async function registerPaymentsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/summary", async (_request, reply) => {
    return ok(reply, {
      todayKes: 284500,
      weekKes: 1890000,
      monthKes: 7420000,
      averagePerVehicleKes: 5471,
      revenueByRoute,
      split: {
        sacco: 170700,
        driver: 99575,
        maintenance: 14225
      }
    });
  });

  app.post("/fare", async (request, reply) => {
    const body = request.body as { amountKes?: number };
    const amountKes = body.amountKes ?? 100;
    return ok(reply, {
      amountKes,
      split: splitFare(amountKes, {
        fuelPct: 20,
        driverPct: 35,
        conductorPct: 10,
        maintenancePct: 5,
        saccoPct: 30
      })
    });
  });

  app.post("/mpesa/stk-push", async (request, reply) => {
    const user = request.user as AuthUser | undefined;
    if (!user) return fail(reply, 401, "UNAUTHENTICATED", "A valid access token is required");
    if (user.role !== "CONDUCTOR") {
      return fail(reply, 403, "FORBIDDEN", "Only conductors can request fare payments");
    }

    const body = stkPushSchema.parse(request.body);
    const vehicle = demoVehicles.find((item) => item.vehicleId === body.vehicleId || item.plate === body.vehicleId);
    if (!vehicle) return fail(reply, 404, "VEHICLE_NOT_FOUND", "Bus number plate was not found");

    try {
      const stk = await initiateStkPush({
        phone: body.phone,
        amountKes: body.amountKes,
        accountReference: vehicle.plate,
        transactionDescription: `Fare ${vehicle.plate} ${body.route ?? vehicle.routeName}`
      });
      const collection = addCollection({
        vehicleId: vehicle.vehicleId,
        plate: vehicle.plate,
        route: body.route ?? vehicle.routeName,
        amountKes: body.amountKes,
        phone: body.phone,
        requestedByUserId: user.sub,
        requestedByRole: "CONDUCTOR",
        checkoutRequestId: stk.checkoutRequestId,
        status: "PENDING"
      });
      return ok(reply, { ...stk, collection, totals: getVehicleTotals(vehicle.vehicleId) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not initiate STK push";
      const collection = addCollection({
        vehicleId: vehicle.vehicleId,
        plate: vehicle.plate,
        route: body.route ?? vehicle.routeName,
        amountKes: body.amountKes,
        phone: body.phone,
        requestedByUserId: user.sub,
        requestedByRole: "CONDUCTOR",
        checkoutRequestId: `demo-${Date.now()}`,
        status: "QUEUED"
      });
      return fail(reply, 422, "STK_PUSH_NOT_SENT", message, { collection, totals: getVehicleTotals(vehicle.vehicleId) });
    }
  });
  app.post("/mpesa/callback", async (_request, reply) => ok(reply, { received: true }));
  app.get("/transactions", async (_request, reply) => ok(reply, demoFareCollections));
  app.get("/vehicle/:vehicleId/summary", async (request, reply) => {
    const { vehicleId } = request.params as { vehicleId: string };
    const vehicle = demoVehicles.find((item) => item.vehicleId === vehicleId || item.plate === vehicleId);
    if (!vehicle) return fail(reply, 404, "VEHICLE_NOT_FOUND", "Bus number plate was not found");
    return ok(reply, getVehicleTotals(vehicle.vehicleId));
  });
  app.get("/reconciliation", async (_request, reply) => ok(reply, []));
  app.post("/settle", async (_request, reply) => ok(reply, { settlementId: "set-demo", status: "PROCESSING" }));
  app.get("/settlements", async (_request, reply) => ok(reply, []));
}

function addCollection(input: {
  vehicleId: string;
  plate: string;
  route: string;
  amountKes: number;
  phone: string;
  requestedByUserId: string;
  requestedByRole: "DRIVER" | "CONDUCTOR";
  checkoutRequestId: string;
  status: "QUEUED" | "PENDING" | "PAID" | "FAILED";
}) {
  const collection = {
    id: `fare-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...input
  };
  demoFareCollections.push(collection);
  const vehicle = demoVehicles.find((item) => item.vehicleId === input.vehicleId);
  if (vehicle) {
    vehicle.revenueTodayKes = getVehicleTotals(input.vehicleId).totalKes;
  }
  return collection;
}

function getVehicleTotals(vehicleId: string) {
  const transactions = demoFareCollections.filter((item) => item.vehicleId === vehicleId);
  const totalKes = transactions.reduce((sum, item) => sum + item.amountKes, 0);
  return {
    vehicleId,
    totalKes,
    transactions,
    driverShareKes: Math.floor(totalKes * 0.35),
    conductorShareKes: Math.floor(totalKes * 0.1)
  };
}
