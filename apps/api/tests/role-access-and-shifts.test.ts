import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";

async function loginAs(identifier: string, password: string): Promise<string> {
  const app = await buildApp();
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    payload: { identifier, password }
  });
  await app.close();
  return response.json().data.accessToken as string;
}

describe("role access and driver shifts", () => {
  it("allows a fleet marshal to see vehicles but blocks revenue", async () => {
    const app = await buildApp();
    const token = await loginAs("marshal@na-flow.local", "Marshal@12345");

    const vehicles = await app.inject({
      method: "GET",
      url: "/api/v1/vehicles",
      headers: { authorization: `Bearer ${token}` }
    });
    expect(vehicles.statusCode).toBe(200);

    const revenue = await app.inject({
      method: "GET",
      url: "/api/v1/payments/summary",
      headers: { authorization: `Bearer ${token}` }
    });
    expect(revenue.statusCode).toBe(403);
    await app.close();
  });

  it("allows a driver to check into a vehicle and route", async () => {
    const app = await buildApp();
    const token = await loginAs("driver@na-flow.local", "Driver@12345");

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/shifts/check-in",
      headers: { authorization: `Bearer ${token}` },
      payload: { vehicleId: "KBZ-482D", route: "KBS-01" }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.status).toBe("ACTIVE");
    await app.close();
  });
});
