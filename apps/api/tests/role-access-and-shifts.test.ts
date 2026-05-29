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
    expect(vehicles.json().data.every((vehicle: { routeName: string }) => vehicle.routeName === "Zimmerman")).toBe(true);

    const revenue = await app.inject({
      method: "GET",
      url: "/api/v1/payments/summary",
      headers: { authorization: `Bearer ${token}` }
    });
    expect(revenue.statusCode).toBe(403);
    await app.close();
  });

  it("blocks drivers from collecting fares through STK push", async () => {
    const app = await buildApp();
    const token = await loginAs("driver@na-flow.local", "Driver@12345");

    const stk = await app.inject({
      method: "POST",
      url: "/api/v1/payments/mpesa/stk-push",
      headers: { authorization: `Bearer ${token}` },
      payload: { vehicleId: "KBZ-482D", route: "Zimmerman", phone: "0712345678", amountKes: 100 }
    });

    expect(stk.statusCode).toBe(403);
    expect(stk.json().error.message).toContain("conductors");
    await app.close();
  });

  it("allows a driver to check into a vehicle and route", async () => {
    const app = await buildApp();
    const token = await loginAs("driver@na-flow.local", "Driver@12345");

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/shifts/check-in",
      headers: { authorization: `Bearer ${token}` },
      payload: { vehicleId: "KBZ-482D", route: "Zimmerman" }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.status).toBe("ACTIVE");
    await app.close();
  });

  it("allows a conductor to check into the same bus and queue an STK request", async () => {
    const app = await buildApp();
    const token = await loginAs("conductor@na-flow.local", "Conductor@12345");

    const shift = await app.inject({
      method: "POST",
      url: "/api/v1/shifts/check-in",
      headers: { authorization: `Bearer ${token}` },
      payload: { vehicleId: "KBZ-482D", route: "Zimmerman" }
    });
    expect(shift.statusCode).toBe(200);

    const stk = await app.inject({
      method: "POST",
      url: "/api/v1/payments/mpesa/stk-push",
      headers: { authorization: `Bearer ${token}` },
      payload: { vehicleId: "KBZ-482D", route: "Zimmerman", phone: "0712345678", amountKes: 100 }
    });
    expect(stk.statusCode).toBe(422);
    expect(stk.json().error.details.totals.totalKes).toBeGreaterThanOrEqual(12500);

    const total = await app.inject({
      method: "GET",
      url: "/api/v1/payments/vehicle/KBZ-482D/summary",
      headers: { authorization: `Bearer ${token}` }
    });
    expect(total.statusCode).toBe(200);
    expect(total.json().data.driverShareKes).toBeGreaterThan(0);
    expect(total.json().data.conductorShareKes).toBeGreaterThan(0);
    await app.close();
  });

  it("lets an admin bind a driver and conductor to the same bus and route", async () => {
    const app = await buildApp();
    const token = await loginAs("admin@na-flow.local", "Admin@12345");

    const assignment = await app.inject({
      method: "POST",
      url: "/api/v1/crew/assign",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        vehicleId: "KBZ-482D",
        route: "Zimmerman",
        driverUserId: "usr-driver",
        conductorUserId: "usr-conductor"
      }
    });

    expect(assignment.statusCode).toBe(200);
    expect(assignment.json().data.driverName).toBe("James Mwangi");
    expect(assignment.json().data.conductorName).toBe("Mary Wairimu");
    expect(assignment.json().data.route).toBe("Zimmerman");
    await app.close();
  });

  it("keeps driver and conductor on the same bus route", async () => {
    const app = await buildApp();
    const driverToken = await loginAs("driver@na-flow.local", "Driver@12345");
    const conductorToken = await loginAs("conductor@na-flow.local", "Conductor@12345");

    const driverShift = await app.inject({
      method: "POST",
      url: "/api/v1/shifts/check-in",
      headers: { authorization: `Bearer ${driverToken}` },
      payload: { vehicleId: "KCB-123A", route: "Kasarani" }
    });
    expect(driverShift.json().data.route).toBe("Kasarani");

    const conductorShift = await app.inject({
      method: "POST",
      url: "/api/v1/shifts/check-in",
      headers: { authorization: `Bearer ${conductorToken}` },
      payload: { vehicleId: "KCB-123A", route: "Thika" }
    });
    expect(conductorShift.json().data.route).toBe("Kasarani");
    await app.close();
  });
});
