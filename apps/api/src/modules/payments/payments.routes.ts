import type { FastifyInstance } from "fastify";
import { splitFare } from "@na-flow/shared-utils";
import { revenueByRoute } from "../../seed/demo-domain.js";
import { ok } from "../../utils/api-response.js";

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

  app.post("/mpesa/stk-push", async (_request, reply) => ok(reply, { checkoutRequestId: "ws_CO_demo", status: "QUEUED" }));
  app.post("/mpesa/callback", async (_request, reply) => ok(reply, { received: true }));
  app.get("/transactions", async (_request, reply) => ok(reply, []));
  app.get("/reconciliation", async (_request, reply) => ok(reply, []));
  app.post("/settle", async (_request, reply) => ok(reply, { settlementId: "set-demo", status: "PROCESSING" }));
  app.get("/settlements", async (_request, reply) => ok(reply, []));
}
