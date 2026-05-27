export type UserRole =
  | "SUPER_ADMIN"
  | "OPERATIONS_MANAGER"
  | "FINANCE_MANAGER"
  | "ROUTE_MANAGER"
  | "FLEET_MARSHAL"
  | "DISPATCHER"
  | "DRIVER"
  | "CONDUCTOR"
  | "MAINTENANCE_TECH"
  | "REGULATOR";

export type VehicleStatus = "ACTIVE" | "IDLE" | "MAINTENANCE" | "OFFLINE";
export type AlertSeverity = "CRITICAL" | "WARNING" | "INFO";
export type AlertStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
export type TripStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type PaymentMethod = "MPESA_STK" | "NFC_TAP" | "QR_CODE" | "CASH";

export interface RouteStage {
  name: string;
  latitude: number;
  longitude: number;
}

export interface FleetRoute {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distanceKm: number;
  stages: RouteStage[];
}

export interface LiveVehicleState {
  vehicleId: string;
  plate: string;
  routeName: string;
  driverName: string;
  status: VehicleStatus;
  latitude: number;
  longitude: number;
  speedKmh: number;
  headingDeg: number;
  fuelPercent: number;
  fuelLitres: number;
  passengerCount: number;
  capacity: number;
  revenueTodayKes: number;
  tripsToday: number;
  lastAlert?: string;
  updatedAt: string;
}

export interface TelemetryPayload {
  vehicleId: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  speedKmh: number;
  headingDeg: number;
  fuelPercent: number;
  fuelLitres: number;
  passengerCount: number;
  engineOn: boolean;
  odometer: number;
}

export interface RevenueSplitConfig {
  fuelPct: number;
  driverPct: number;
  conductorPct: number;
  maintenancePct: number;
  saccoPct: number;
}

export interface FareSplit {
  fuel: number;
  driver: number;
  conductor: number;
  maintenance: number;
  sacco: number;
}

export interface ApiErrorShape {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ApiSuccessShape<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = ApiSuccessShape<T> | ApiErrorShape;
