import { describe, expect, it } from "vitest";
import { detectTelemetryEvents, parseTelemetryPacket } from "../src/modules/telemetry/telemetry.service.js";

describe("telemetry ingestion", () => {
  it("validates and detects fleet events", () => {
    const payload = parseTelemetryPacket({
      vehicleId: "KBZ-482D",
      timestamp: new Date().toISOString(),
      latitude: -1.2674,
      longitude: 36.8065,
      speedKmh: 86,
      headingDeg: 126,
      fuelPercent: 12,
      fuelLitres: 20,
      passengerCount: 36,
      engineOn: true,
      odometer: 10020
    });

    expect(payload).not.toBeNull();

    const events = detectTelemetryEvents({
      payload: payload!,
      capacity: 33,
      speedLimitKmh: 50,
      previousFuelLitres: 33,
      previousTimestamp: new Date(Date.now() - 5 * 60000)
    });

    expect(events.map((event) => event.type)).toEqual([
      "SPEED_VIOLATION",
      "FUEL_LOW",
      "OVERCAPACITY",
      "FUEL_ANOMALY"
    ]);
  });
});
