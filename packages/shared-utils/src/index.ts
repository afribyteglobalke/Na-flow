import type { FareSplit, RevenueSplitConfig } from "@na-flow/shared-types";

export function formatKes(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatRelativeMinutes(minutesAgo: number): string {
  if (minutesAgo < 1) {
    return "just now";
  }

  if (minutesAgo < 60) {
    return `${minutesAgo} min ago`;
  }

  const hours = Math.floor(minutesAgo / 60);
  return `${hours} hour${hours === 1 ? "" : "s"} ago`;
}

export function splitFare(amount: number, split: RevenueSplitConfig): FareSplit {
  const fuel = Math.floor((amount * split.fuelPct) / 100);
  const driver = Math.floor((amount * split.driverPct) / 100);
  const conductor = Math.floor((amount * split.conductorPct) / 100);
  const maintenance = Math.floor((amount * split.maintenancePct) / 100);
  const subtotal = fuel + driver + conductor + maintenance;

  // WHY: Shilling rounding must preserve the full fare; the SACCO bucket absorbs tiny remainders.
  return {
    fuel,
    driver,
    conductor,
    maintenance,
    sacco: amount - subtotal
  };
}

export interface SafetyScoreInput {
  speedViolations: number;
  harshBrakes: number;
  harshAccelerations: number;
  routeDeviations: number;
  prolongedIdlingEvents: number;
  suddenStops: number;
}

export function calculateSafetyScore(input: SafetyScoreInput): number {
  const deductions =
    input.speedViolations * 3 +
    input.harshBrakes * 2 +
    input.harshAccelerations * 2 +
    input.routeDeviations * 5 +
    input.prolongedIdlingEvents +
    input.suddenStops * 10;

  return Math.max(0, 100 - deductions);
}
