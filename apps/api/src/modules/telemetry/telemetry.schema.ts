import { z } from "zod";

export const telemetryPayloadSchema = z.object({
  vehicleId: z.string().min(3),
  timestamp: z.string().datetime(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speedKmh: z.number().min(0).max(220),
  headingDeg: z.number().min(0).max(360),
  fuelPercent: z.number().min(0).max(100),
  fuelLitres: z.number().min(0),
  passengerCount: z.number().int().min(0),
  engineOn: z.boolean(),
  odometer: z.number().min(0)
});

export type ValidTelemetryPayload = z.infer<typeof telemetryPayloadSchema>;
