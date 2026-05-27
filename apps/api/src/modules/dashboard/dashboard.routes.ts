import type { FastifyInstance } from "fastify";
import { demoAlerts, demoDrivers, demoVehicles, revenueByRoute } from "../../seed/demo-domain.js";
import { ok } from "../../utils/api-response.js";

export async function registerDashboardRoutes(app: FastifyInstance): Promise<void> {
  app.get("/summary", async (_request, reply) => {
    return ok(reply, {
      kpis: {
        activeVehicles: "42/52",
        revenueTodayKes: 284500,
        criticalAlerts: demoAlerts.filter((alert) => alert.severity === "CRITICAL" && alert.status === "OPEN").length,
        fleetAvailabilityPct: 84
      },
      vehicles: demoVehicles,
      alerts: demoAlerts.slice(0, 5),
      topEarner: demoVehicles[0],
      fleetStatus: [
        { label: "Moving", value: 28, pct: 54 },
        { label: "Idle", value: 14, pct: 27 },
        { label: "Alert", value: 3, pct: 6 },
        { label: "Offline", value: 7, pct: 13 }
      ],
      revenueTrend: [
        { day: "Mon", value: 210000 },
        { day: "Tue", value: 244000 },
        { day: "Wed", value: 230000 },
        { day: "Thu", value: 284500 },
        { day: "Fri", value: 302000 },
        { day: "Sat", value: 318000 },
        { day: "Sun", value: 271000 }
      ],
      revenueByRoute,
      driverLeaderboard: demoDrivers.map((driver) => ({ name: driver.name, trips: driver.tripsToday, score: driver.safetyScore }))
    });
  });
}
