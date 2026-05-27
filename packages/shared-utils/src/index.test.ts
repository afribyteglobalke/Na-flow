import { describe, expect, it } from "vitest";
import { calculateSafetyScore, splitFare } from "./index";

describe("splitFare", () => {
  it("keeps rounding remainder in the sacco bucket", () => {
    expect(
      splitFare(103, {
        fuelPct: 20,
        driverPct: 15,
        conductorPct: 10,
        maintenancePct: 10,
        saccoPct: 45
      })
    ).toEqual({
      fuel: 20,
      driver: 15,
      conductor: 10,
      maintenance: 10,
      sacco: 48
    });
  });
});

describe("calculateSafetyScore", () => {
  it("deducts configured safety events with a floor of zero", () => {
    expect(
      calculateSafetyScore({
        speedViolations: 2,
        harshBrakes: 1,
        harshAccelerations: 1,
        routeDeviations: 1,
        prolongedIdlingEvents: 3,
        suddenStops: 1
      })
    ).toBe(72);
  });
});
