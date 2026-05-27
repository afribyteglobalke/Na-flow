import type { AlertSeverity, AlertStatus, LiveVehicleState, TripStatus, UserRole } from "@na-flow/shared-types";

export interface DemoUser {
  id: string;
  email: string;
  phone: string;
  password: string;
  name: string;
  role: UserRole;
  assignedVehicleId?: string;
  assignedRoute?: string;
}

export interface DemoShift {
  id: string;
  driverUserId: string;
  driverName: string;
  vehicleId: string;
  route: string;
  startedAt: string;
  status: "ACTIVE" | "ENDED";
}

export interface DemoAlert {
  id: string;
  vehicle: string;
  type: string;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  location: string;
  time: string;
  videoClipUrl?: string;
}

export interface DemoTrip {
  id: string;
  vehicle: string;
  route: string;
  driver: string;
  status: TripStatus;
  revenueKes: number;
  startedAt: string;
  completedAt: string;
  durationMin: number;
  distanceKm: number;
  passengers: number;
}

export interface DemoDriver {
  id: string;
  name: string;
  licenseNumber: string;
  experience: string;
  phone: string;
  safetyScore: number;
  vehicle: string;
  route: string;
  tripsToday: number;
  revenueKes: number;
  harshEvents: number;
}

export interface DemoMaintenanceJob {
  id: string;
  vehicle: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  type: string;
  description: string;
  dueDate: string;
  lastService: string;
  status: "UPCOMING" | "OVERDUE" | "SCHEDULED" | "COMPLETED";
}

const now = new Date().toISOString();

export const demoUsers: DemoUser[] = [
  {
    id: "usr-admin",
    email: "admin@na-flow.local",
    phone: "+254700000001",
    password: "Admin@12345",
    name: "John Kamau",
    role: "SUPER_ADMIN"
  },
  {
    id: "usr-ops",
    email: "marshal@na-flow.local",
    phone: "+254700000002",
    password: "Marshal@12345",
    name: "Samuel Njoroge",
    role: "FLEET_MARSHAL",
    assignedRoute: "KBS-01"
  },
  {
    id: "usr-driver",
    email: "driver@na-flow.local",
    phone: "+254700000003",
    password: "Driver@12345",
    name: "James Mwangi",
    role: "DRIVER",
    assignedVehicleId: "KBZ-482D",
    assignedRoute: "KBS-01"
  }
];

export const demoShifts: DemoShift[] = [];

export const demoVehicles: LiveVehicleState[] = [
  {
    vehicleId: "KBZ-482D",
    plate: "KBZ 482D",
    routeName: "KBS-01",
    driverName: "James Mwangi",
    status: "ACTIVE",
    latitude: -1.2674,
    longitude: 36.8065,
    speedKmh: 45,
    headingDeg: 126,
    fuelPercent: 78,
    fuelLitres: 54,
    passengerCount: 12,
    capacity: 33,
    revenueTodayKes: 12400,
    tripsToday: 8,
    lastAlert: "2 hours ago",
    updatedAt: now
  },
  {
    vehicleId: "KCB-123A",
    plate: "KCB 123A",
    routeName: "KBS-02",
    driverName: "Grace Akinyi",
    status: "IDLE",
    latitude: -1.3029,
    longitude: 36.7073,
    speedKmh: 0,
    headingDeg: 20,
    fuelPercent: 45,
    fuelLitres: 31,
    passengerCount: 0,
    capacity: 33,
    revenueTodayKes: 8900,
    tripsToday: 6,
    lastAlert: "1 hour ago",
    updatedAt: now
  },
  {
    vehicleId: "KDA-567C",
    plate: "KDA 567C",
    routeName: "KBS-01",
    driverName: "Peter Kimani",
    status: "ACTIVE",
    latitude: -1.2196,
    longitude: 36.8886,
    speedKmh: 28,
    headingDeg: 210,
    fuelPercent: 92,
    fuelLitres: 63,
    passengerCount: 14,
    capacity: 33,
    revenueTodayKes: 11200,
    tripsToday: 9,
    lastAlert: "Just now",
    updatedAt: now
  },
  {
    vehicleId: "KAB-891E",
    plate: "KAB 891E",
    routeName: "KBS-03",
    driverName: "Mary Wanjiru",
    status: "ACTIVE",
    latitude: -1.2864,
    longitude: 36.8172,
    speedKmh: 52,
    headingDeg: 0,
    fuelPercent: 65,
    fuelLitres: 45,
    passengerCount: 11,
    capacity: 33,
    revenueTodayKes: 10500,
    tripsToday: 7,
    lastAlert: "3 hours ago",
    updatedAt: now
  },
  {
    vehicleId: "KBX-234F",
    plate: "KBX 234F",
    routeName: "KBS-02",
    driverName: "David Ochieng",
    status: "ACTIVE",
    latitude: -1.2521,
    longitude: 36.8618,
    speedKmh: 38,
    headingDeg: 92,
    fuelPercent: 88,
    fuelLitres: 61,
    passengerCount: 13,
    capacity: 33,
    revenueTodayKes: 9800,
    tripsToday: 8,
    updatedAt: now
  },
  {
    vehicleId: "KCD-789G",
    plate: "KCD 789G",
    routeName: "KBS-01",
    driverName: "Brian Otieno",
    status: "OFFLINE",
    latitude: -1.2901,
    longitude: 36.8123,
    speedKmh: 42,
    headingDeg: 56,
    fuelPercent: 34,
    fuelLitres: 24,
    passengerCount: 9,
    capacity: 33,
    revenueTodayKes: 7200,
    tripsToday: 5,
    lastAlert: "3 hours ago",
    updatedAt: now
  }
];

export const demoAlerts: DemoAlert[] = [
  { id: "alt-1", vehicle: "KBZ 482D", type: "Hard Braking", severity: "CRITICAL", status: "OPEN", message: "Hard braking event detected at Uhuru Highway", location: "Uhuru Highway", time: "2 min ago", videoClipUrl: "s3://mfis-media/kbz-482d/hard-brake.mp4" },
  { id: "alt-2", vehicle: "KCB 123A", type: "Low Fuel", severity: "WARNING", status: "OPEN", message: "Fuel level below 20% - refueling recommended", location: "Karen Road", time: "15 min ago" },
  { id: "alt-3", vehicle: "KDA 567C", type: "Engine Temperature", severity: "CRITICAL", status: "ACKNOWLEDGED", message: "Engine temperature exceeding safe limits", location: "Thika Road", time: "23 min ago" },
  { id: "alt-4", vehicle: "KAB 891E", type: "Maintenance Due", severity: "INFO", status: "ACKNOWLEDGED", message: "Scheduled maintenance due in 2 days", location: "CBD Depot", time: "1 hour ago" },
  { id: "alt-5", vehicle: "KBX 234F", type: "Route Deviation", severity: "WARNING", status: "RESOLVED", message: "Vehicle deviated from assigned route", location: "Ngong Road", time: "2 hours ago" },
  { id: "alt-6", vehicle: "KCD 789G", type: "Speeding", severity: "CRITICAL", status: "RESOLVED", message: "Speed limit exceeded by 25 km/h", location: "Mombasa Road", time: "3 hours ago" }
];

export const demoTrips: DemoTrip[] = [
  { id: "TRP-1234", vehicle: "KBZ 482D", route: "KBS-01", driver: "James Mwangi", status: "COMPLETED", revenueKes: 1680, startedAt: "06:45 AM", completedAt: "07:32 AM", durationMin: 47, distanceKm: 18.5, passengers: 14 },
  { id: "TRP-1235", vehicle: "KCB 123A", route: "KBS-02", driver: "Grace Akinyi", status: "COMPLETED", revenueKes: 1920, startedAt: "07:15 AM", completedAt: "08:10 AM", durationMin: 55, distanceKm: 22.3, passengers: 16 },
  { id: "TRP-1236", vehicle: "KDA 567C", route: "KBS-01", driver: "Peter Kimani", status: "IN_PROGRESS", revenueKes: 1440, startedAt: "08:30 AM", completedAt: "In Progress", durationMin: 28, distanceKm: 12.1, passengers: 12 },
  { id: "TRP-1237", vehicle: "KAB 891E", route: "KBS-03", driver: "Mary Wanjiru", status: "IN_PROGRESS", revenueKes: 1320, startedAt: "09:00 AM", completedAt: "In Progress", durationMin: 15, distanceKm: 8.7, passengers: 11 }
];

export const demoDrivers: DemoDriver[] = [
  { id: "drv-1", name: "James Mwangi", licenseNumber: "DL-2018-45678", experience: "5 years", phone: "+254 712 345 678", safetyScore: 98, vehicle: "KBZ 482D", route: "KBS-01", tripsToday: 24, revenueKes: 12400, harshEvents: 2 },
  { id: "drv-2", name: "Grace Akinyi", licenseNumber: "DL-2019-12345", experience: "4 years", phone: "+254 723 456 789", safetyScore: 96, vehicle: "KCB 123A", route: "KBS-02", tripsToday: 22, revenueKes: 11800, harshEvents: 3 },
  { id: "drv-3", name: "Peter Kimani", licenseNumber: "DL-2020-67890", experience: "3 years", phone: "+254 734 567 890", safetyScore: 94, vehicle: "KDA 567C", route: "KBS-01", tripsToday: 20, revenueKes: 10500, harshEvents: 4 },
  { id: "drv-4", name: "Mary Wanjiru", licenseNumber: "DL-2017-23456", experience: "6 years", phone: "+254 745 678 901", safetyScore: 92, vehicle: "KAB 891E", route: "KBS-03", tripsToday: 21, revenueKes: 11200, harshEvents: 5 },
  { id: "drv-5", name: "David Ochieng", licenseNumber: "DL-2021-34567", experience: "2 years", phone: "+254 756 789 012", safetyScore: 90, vehicle: "KBX 234F", route: "KBS-02", tripsToday: 19, revenueKes: 9800, harshEvents: 6 }
];

export const demoMaintenanceJobs: DemoMaintenanceJob[] = [
  { id: "mnt-1", vehicle: "KBZ 482D", priority: "NORMAL", type: "Scheduled Service", description: "10,000 km service - oil change, filter replacement", dueDate: "May 25, 2026", lastService: "Apr 10, 2026", status: "UPCOMING" },
  { id: "mnt-2", vehicle: "KCB 123A", priority: "HIGH", type: "Tire Replacement", description: "Front tires showing 80% wear - replacement needed", dueDate: "May 22, 2026", lastService: "Feb 15, 2026", status: "OVERDUE" },
  { id: "mnt-3", vehicle: "KDA 567C", priority: "NORMAL", type: "Brake Inspection", description: "Routine brake pad and rotor inspection", dueDate: "May 28, 2026", lastService: "Mar 28, 2026", status: "UPCOMING" },
  { id: "mnt-4", vehicle: "KAB 891E", priority: "CRITICAL", type: "Engine Diagnostics", description: "Check engine light - OBD scan required", dueDate: "May 21, 2026", lastService: "Jan 10, 2026", status: "OVERDUE" },
  { id: "mnt-5", vehicle: "KBX 234F", priority: "LOW", type: "AC Service", description: "Air conditioning system cleaning and gas refill", dueDate: "Jun 5, 2026", lastService: "Dec 1, 2025", status: "SCHEDULED" }
];

export const revenueByRoute = [
  { route: "KBS-01", revenue: 78000 },
  { route: "KBS-02", revenue: 62000 },
  { route: "KBS-03", revenue: 54000 },
  { route: "KBS-04", revenue: 41000 },
  { route: "KBS-05", revenue: 49500 }
];
