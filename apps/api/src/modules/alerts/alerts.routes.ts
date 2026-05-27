import type { FastifyInstance } from "fastify";
import { demoAlerts } from "../../seed/demo-domain.js";
import { fail, ok } from "../../utils/api-response.js";

export async function registerAlertsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/", async (_request, reply) => ok(reply, demoAlerts));
  app.get("/unread-count", async (_request, reply) => ok(reply, { count: demoAlerts.filter((alert) => alert.status === "OPEN").length }));

  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const alert = demoAlerts.find((item) => item.id === id);
    return alert ? ok(reply, alert) : fail(reply, 404, "ALERT_NOT_FOUND", "Alert was not found");
  });

  app.patch("/:id/acknowledge", async (request, reply) => {
    const { id } = request.params as { id: string };
    const alert = demoAlerts.find((item) => item.id === id);
    if (!alert) return fail(reply, 404, "ALERT_NOT_FOUND", "Alert was not found");
    alert.status = "ACKNOWLEDGED";
    return ok(reply, alert);
  });

  app.patch("/:id/resolve", async (request, reply) => {
    const { id } = request.params as { id: string };
    const alert = demoAlerts.find((item) => item.id === id);
    if (!alert) return fail(reply, 404, "ALERT_NOT_FOUND", "Alert was not found");
    alert.status = "RESOLVED";
    return ok(reply, alert);
  });
}
