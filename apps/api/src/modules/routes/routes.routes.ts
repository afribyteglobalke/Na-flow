import type { FastifyInstance } from "fastify";
import { prisma } from "../../plugins/prisma.js";
import { routeOptions } from "../../seed/demo-domain.js";
import { fail, ok } from "../../utils/api-response.js";

export async function registerRoutesRoutes(app: FastifyInstance): Promise<void> {
  app.get("/", async (_request, reply) => {
    try {
      const routes = await prisma.route.findMany({ orderBy: { name: "asc" } });
      return ok(
        reply,
        routes.map((route) => ({
          id: route.id,
          name: route.name,
          origin: route.origin,
          destination: route.destination,
          distanceKm: Number(route.distanceKm)
        }))
      );
    } catch {
      return ok(reply, routeOptions);
    }
  });

  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const route = routeOptions.find((item) => item.id === id || item.name === id);
    return route ? ok(reply, route) : fail(reply, 404, "ROUTE_NOT_FOUND", "Route was not found");
  });
}
