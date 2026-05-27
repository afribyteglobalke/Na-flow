import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";

describe("auth and screen data APIs", () => {
  it("logs in and returns dashboard screen data", async () => {
    const app = await buildApp();

    const loginResponse = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        identifier: "admin@na-flow.local",
        password: "Admin@12345"
      }
    });

    expect(loginResponse.statusCode).toBe(200);
    const loginPayload = loginResponse.json();
    expect(loginPayload.success).toBe(true);
    expect(loginPayload.data.accessToken).toBeTypeOf("string");

    const dashboardResponse = await app.inject({
      method: "GET",
      url: "/api/v1/dashboard/summary",
      headers: {
        authorization: `Bearer ${loginPayload.data.accessToken}`
      }
    });

    expect(dashboardResponse.statusCode).toBe(200);
    const dashboardPayload = dashboardResponse.json();
    expect(dashboardPayload.data.kpis.activeVehicles).toBe("42/52");
    expect(dashboardPayload.data.vehicles.length).toBeGreaterThan(0);

    await app.close();
  });
});
