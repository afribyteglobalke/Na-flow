import type { LiveVehicleState } from "@na-flow/shared-types";

export const vehicles: LiveVehicleState[] = [
  {
    vehicleId: "KBZ-482D",
    plate: "KBZ 482D",
    routeName: "KBS-01 Westlands - CBD",
    driverName: "James Mwangi",
    status: "ACTIVE",
    latitude: -1.2674,
    longitude: 36.8065,
    speedKmh: 42,
    headingDeg: 126,
    fuelPercent: 78,
    fuelLitres: 54,
    passengerCount: 24,
    capacity: 33,
    revenueTodayKes: 12400,
    tripsToday: 18,
    updatedAt: new Date().toISOString()
  },
  {
    vehicleId: "KCB-123A",
    plate: "KCB 123A",
    routeName: "KBS-03 Karen - CBD",
    driverName: "Grace Akinyi",
    status: "IDLE",
    latitude: -1.3029,
    longitude: 36.7073,
    speedKmh: 0,
    headingDeg: 20,
    fuelPercent: 18,
    fuelLitres: 13,
    passengerCount: 8,
    capacity: 33,
    revenueTodayKes: 9800,
    tripsToday: 14,
    lastAlert: "Fuel level below 20%",
    updatedAt: new Date().toISOString()
  },
  {
    vehicleId: "KDA-567C",
    plate: "KDA 567C",
    routeName: "KBS-05 Thika - CBD",
    driverName: "Peter Kimani",
    status: "ACTIVE",
    latitude: -1.2196,
    longitude: 36.8886,
    speedKmh: 68,
    headingDeg: 210,
    fuelPercent: 44,
    fuelLitres: 31,
    passengerCount: 35,
    capacity: 33,
    revenueTodayKes: 11250,
    tripsToday: 16,
    lastAlert: "Overcapacity detected",
    updatedAt: new Date().toISOString()
  }
];

export const alerts = [
  { vehicle: "KBZ 482D", message: "Hard braking detected", time: "2 min ago", severity: "critical" },
  { vehicle: "KCB 123A", message: "Fuel level below 20%", time: "15 min ago", severity: "warning" },
  { vehicle: "KDA 567C", message: "Engine temperature high", time: "23 min ago", severity: "critical" },
  { vehicle: "KAB 891E", message: "Scheduled maintenance due", time: "1 hour ago", severity: "info" },
  { vehicle: "KBX 234F", message: "Route deviation detected", time: "2 hours ago", severity: "warning" }
];

export const revenueTrend = [
  { day: "Mon", value: 210000 },
  { day: "Tue", value: 244000 },
  { day: "Wed", value: 230000 },
  { day: "Thu", value: 284500 },
  { day: "Fri", value: 302000 },
  { day: "Sat", value: 318000 },
  { day: "Sun", value: 271000 }
];

export const driverLeaderboard = [
  { name: "James Mwangi", trips: 24, score: 98 },
  { name: "Grace Akinyi", trips: 22, score: 96 },
  { name: "Peter Kimani", trips: 20, score: 94 },
  { name: "Mary Wanjiru", trips: 21, score: 92 },
  { name: "David Ochieng", trips: 19, score: 90 }
];
