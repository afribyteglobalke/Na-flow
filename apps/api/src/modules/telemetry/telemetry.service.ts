import type { LiveVehicleState } from "@na-flow/shared-types";
import { telemetryPayloadSchema, type ValidTelemetryPayload } from "./telemetry.schema.js";

export interface TelemetryDetectionInput {
  payload: ValidTelemetryPayload;
  capacity: number;
  speedLimitKmh: number;
  previousFuelLitres?: number;
  previousTimestamp?: Date;
}

export interface DetectedFleetEvent {
  type: "SPEED_VIOLATION" | "FUEL_LOW" | "OVERCAPACITY" | "FUEL_ANOMALY";
  severity: "CRITICAL" | "WARNING" | "INFO";
  message: string;
}

export function parseTelemetryPacket(packet: unknown): ValidTelemetryPayload | null {
  const parsed = telemetryPayloadSchema.safeParse(packet);
  return parsed.success ? parsed.data : null;
}

export function detectTelemetryEvents(input: TelemetryDetectionInput): DetectedFleetEvent[] {
  const events: DetectedFleetEvent[] = [];
  const { payload } = input;

  if (payload.speedKmh > input.speedLimitKmh) {
    events.push({
      type: "SPEED_VIOLATION",
      severity: "WARNING",
      message: `${payload.vehicleId} exceeded ${input.speedLimitKmh} km/h`
    });
  }

  if (payload.fuelPercent < 15) {
    events.push({
      type: "FUEL_LOW",
      severity: "WARNING",
      message: `${payload.vehicleId} fuel is below 15%`
    });
  }

  if (payload.passengerCount > input.capacity) {
    events.push({
      type: "OVERCAPACITY",
      severity: "CRITICAL",
      message: `${payload.vehicleId} is over passenger capacity`
    });
  }

  if (input.previousFuelLitres !== undefined && input.previousTimestamp !== undefined) {
    const minutes = (new Date(payload.timestamp).getTime() - input.previousTimestamp.getTime()) / 60000;
    const fuelDrop = input.previousFuelLitres - payload.fuelLitres;

    // WHY: A sharp drop in a short window outside known fuel stations is a siphoning signal.
    if (minutes > 0 && minutes <= 15 && fuelDrop > 10) {
      events.push({
        type: "FUEL_ANOMALY",
        severity: "CRITICAL",
        message: `${payload.vehicleId} lost ${fuelDrop.toFixed(1)}L fuel in ${minutes.toFixed(0)} minutes`
      });
    }
  }

  return events;
}

export function toLiveVehicleState(payload: ValidTelemetryPayload, seed: Omit<LiveVehicleState, keyof ValidTelemetryPayload | "updatedAt">): LiveVehicleState {
  return {
    ...seed,
    vehicleId: payload.vehicleId,
    latitude: payload.latitude,
    longitude: payload.longitude,
    speedKmh: payload.speedKmh,
    headingDeg: payload.headingDeg,
    fuelPercent: payload.fuelPercent,
    fuelLitres: payload.fuelLitres,
    passengerCount: payload.passengerCount,
    updatedAt: payload.timestamp
  };
}
