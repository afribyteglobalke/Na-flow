import {
  Activity,
  AlertTriangle,
  Bell,
  Bus,
  Car,
  CheckCircle2,
  DollarSign,
  Download,
  Eye,
  FileBarChart,
  Filter,
  LogOut,
  MapPin,
  Navigation,
  Search,
  TrendingUp,
  User,
  Users,
  Wrench,
  type LucideIcon
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { useState, type ReactNode } from "react";
import type { AlertSeverity, AlertStatus, LiveVehicleState, TripStatus } from "@na-flow/shared-types";
import { formatKes } from "@na-flow/shared-utils";
import { apiGet, apiPatch, apiPost, login } from "./lib/api";
import { useSessionStore } from "./store/session-store";
import { type DashboardView, useUiStore } from "./store/ui-store";

interface DashboardSummary {
  kpis: {
    activeVehicles: string;
    revenueTodayKes: number;
    criticalAlerts: number;
    fleetAvailabilityPct: number;
  };
  vehicles: LiveVehicleState[];
  alerts: DemoAlert[];
  topEarner: LiveVehicleState;
  fleetStatus: Array<{ label: string; value: number; pct: number }>;
  revenueTrend: Array<{ day: string; value: number }>;
  revenueByRoute: Array<{ route: string; revenue: number }>;
  driverLeaderboard: Array<{ name: string; trips: number; score: number }>;
}

interface DemoAlert {
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

interface DemoTrip {
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

interface DemoDriver {
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

interface DemoMaintenanceJob {
  id: string;
  vehicle: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  type: string;
  description: string;
  dueDate: string;
  lastService: string;
  status: "UPCOMING" | "OVERDUE" | "SCHEDULED" | "COMPLETED";
}

interface RevenueSummary {
  todayKes: number;
  weekKes: number;
  monthKes: number;
  averagePerVehicleKes: number;
  revenueByRoute: Array<{ route: string; revenue: number }>;
  split: {
    sacco: number;
    driver: number;
    maintenance: number;
  };
}

interface DriverShift {
  id: string;
  driverUserId: string;
  driverName: string;
  vehicleId: string;
  route: string;
  startedAt: string;
  status: "ACTIVE" | "ENDED";
}

const navItems: Array<{ label: DashboardView; icon: LucideIcon }> = [
  { label: "Live Map", icon: MapPin },
  { label: "Fleet", icon: Car },
  { label: "Trips", icon: TrendingUp },
  { label: "Revenue", icon: DollarSign },
  { label: "Drivers", icon: Users },
  { label: "Alerts", icon: Bell },
  { label: "Maintenance", icon: Wrench },
  { label: "Reports", icon: FileBarChart }
];

const vehicleNicknames = new Map([
  ["KBZ 482D", "Thunder"],
  ["KCB 123A", "Lightning"],
  ["KDA 567C", "Flash"],
  ["KAB 891E", "Rocket"],
  ["KBX 234F", "Bullet"],
  ["KCD 789G", "Comet"]
]);

function useDashboard(): DashboardSummary {
  const fallback = {
    kpis: { activeVehicles: "42/52", revenueTodayKes: 284500, criticalAlerts: 3, fleetAvailabilityPct: 84 },
    vehicles: [],
    alerts: [],
    topEarner: undefined,
    fleetStatus: [],
    revenueTrend: [],
    revenueByRoute: [],
    driverLeaderboard: []
  };
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => apiGet<DashboardSummary>("/dashboard/summary") });
  return (data ?? fallback) as DashboardSummary;
}

function LoginScreen(): JSX.Element {
  const setSession = useSessionStore((state) => state.setSession);
  const mutation = useMutation({
    mutationFn: (input: { identifier: string; password: string }) => login(input.identifier, input.password),
    onSuccess: (result) => setSession(result.accessToken, result.user)
  });

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="brand login-brand">
          <span className="brand-mark"><Bus size={18} /></span>
          <span>Na-Flow</span>
        </div>
        <h1>Fleet intelligence login</h1>
        <p>Sign in as an admin, fleet marshal, or driver to see the right workspace.</p>
        <div className="demo-accounts">
          <span>Admin: admin@na-flow.local / Admin@12345</span>
          <span>Fleet marshal: marshal@na-flow.local / Marshal@12345</span>
          <span>Driver: driver@na-flow.local / Driver@12345</span>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            mutation.mutate({
              identifier: String(form.get("identifier")),
              password: String(form.get("password"))
            });
          }}
        >
          <label>
            Email or phone
            <input name="identifier" defaultValue="admin@na-flow.local" autoComplete="username" />
          </label>
          <label>
            Password
            <input name="password" type="password" defaultValue="Admin@12345" autoComplete="current-password" />
          </label>
          {mutation.error ? <div className="form-error">{mutation.error.message}</div> : null}
          <button className="primary-button" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}

function Sidebar(): JSX.Element {
  const { activeView, setActiveView } = useUiStore();
  const user = useSessionStore((state) => state.user);
  const items = navItems.filter((item) => canViewNav(user?.role, item.label));

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark"><Bus size={18} /></span>
        <span>Na-Flow</span>
      </div>
      <nav className="nav-list" aria-label="Dashboard">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button className={item.label === activeView ? "nav-item active" : "nav-item"} key={item.label} onClick={() => setActiveView(item.label)} type="button">
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="profile-card">
        <Users size={19} />
        <div>
          <strong>{user?.name ?? "John Kamau"}</strong>
          <span>{labelRole(user?.role ?? "Fleet Manager")}</span>
        </div>
      </div>
    </aside>
  );
}

function Topbar(): JSX.Element {
  const logout = useSessionStore((state) => state.logout);
  const user = useSessionStore((state) => state.user);

  return (
    <header className="topbar">
      <label className="search">
        <Search size={18} />
        <input placeholder="Search vehicles, drivers, routes..." />
      </label>
      <div className="top-actions">
        <button className="icon-button" type="button" aria-label="Notifications">
          <Bell size={18} />
          <span className="dot" />
        </button>
        <div className="user-chip">
          <span>
            <strong>{user?.name ?? "John Kamau"}</strong>
            <small>{labelRole(user?.role ?? "Fleet Manager")}</small>
          </span>
          <User size={18} />
        </div>
        <button className="icon-button" type="button" aria-label="Log out" onClick={logout}>
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

function KpiGrid({ summary }: { summary: DashboardSummary }): JSX.Element {
  const cards = [
    { label: "ACTIVE VEHICLES", value: summary.kpis.activeVehicles, trend: "8% vs yesterday", icon: Car, tone: "amber" },
    { label: "LIVE REVENUE TODAY (KES)", value: summary.kpis.revenueTodayKes.toLocaleString("en-KE"), trend: "12% vs yesterday", icon: DollarSign, tone: "amber" },
    { label: "CRITICAL ALERTS", value: String(summary.kpis.criticalAlerts), trend: "", icon: AlertTriangle, tone: "red" },
    { label: "FLEET AVAILABILITY", value: `${summary.kpis.fleetAvailabilityPct}%`, trend: "3% vs yesterday", icon: Activity, tone: "green" }
  ];

  return (
    <section className="kpi-grid" aria-label="Fleet KPIs">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article className={`kpi-card ${card.tone}`} key={card.label}>
            <div className="kpi-top"><span>{card.label}</span><Icon size={20} /></div>
            <strong>{card.value}</strong>
            {card.trend ? <small>{card.trend}</small> : null}
          </article>
        );
      })}
    </section>
  );
}

function FleetMap({ vehicles, large = false }: { vehicles: LiveVehicleState[]; large?: boolean }): JSX.Element {
  const setSelectedVehicleId = useUiStore((state) => state.setSelectedVehicleId);

  return (
    <div className={large ? "map-canvas map-canvas-large" : "map-canvas"} aria-label="Stylized Nairobi fleet map">
      <svg viewBox="0 0 760 430" role="img">
        <path d="M88 210 C180 150 260 195 340 280 S510 350 650 286" className="route-line" />
        <path d="M60 310 C170 315 230 255 280 215 S375 110 470 140 S610 170 690 82" className="route-line faint" />
        {vehicles.map((vehicle, index) => (
          <g key={vehicle.vehicleId} transform={`translate(${130 + index * 95}, ${245 - (index % 3) * 58})`} onClick={() => setSelectedVehicleId(vehicle.vehicleId)} className="map-marker-button">
            <circle className={vehicle.lastAlert ? "marker alert" : "marker"} r="19" />
            <circle className="marker-core" r="7" />
            {large ? <text y="36" textAnchor="middle">{vehicle.plate}</text> : null}
          </g>
        ))}
      </svg>
    </div>
  );
}

function Dashboard(): JSX.Element {
  const summary = useDashboard();

  return (
    <>
      <PageTitle title="Executive Dashboard" subtitle="Every route. Every shilling. In flow." />
      <KpiGrid summary={summary} />
      <div className="dashboard-grid">
        <section className="panel map-panel">
          <div className="panel-heading"><h2>Live Fleet Map</h2><span><Navigation size={15} />52 vehicles</span></div>
          <FleetMap vehicles={summary.vehicles} />
        </section>
        <AlertsPanel alerts={summary.alerts} />
        <TopEarner vehicle={summary.topEarner} />
        <FleetStatus rows={summary.fleetStatus} />
        <RevenueTrend data={summary.revenueTrend} />
        <Leaderboard rows={summary.driverLeaderboard} />
      </div>
    </>
  );
}

function DriverWorkspace(): JSX.Element {
  const user = useSessionStore((state) => state.user);
  const queryClient = useQueryClient();
  const { data: shift } = useQuery({ queryKey: ["shift"], queryFn: () => apiGet<DriverShift | null>("/shifts/current") });
  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles"], queryFn: () => apiGet<LiveVehicleState[]>("/vehicles") });
  const assignedVehicle = vehicles.find((vehicle) => vehicle.vehicleId === (shift?.vehicleId ?? user?.assignedVehicleId)) ?? vehicles[0];
  const checkIn = useMutation({
    mutationFn: (input: { vehicleId: string; route: string }) => apiPost<DriverShift>("/shifts/check-in", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shift"] })
  });
  const endShift = useMutation({
    mutationFn: () => apiPost<DriverShift>("/shifts/end"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shift"] })
  });

  return (
    <>
      <PageTitle title="Driver Shift" subtitle="Check in with your car number and route before starting work." />
      <div className="driver-workspace">
        <section className="panel shift-panel">
          <h2>{shift ? "Active Shift" : "Start Shift"}</h2>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              checkIn.mutate({
                vehicleId: String(form.get("vehicleId")),
                route: String(form.get("route"))
              });
            }}
          >
            <label>
              Car number
              <input name="vehicleId" defaultValue={shift?.vehicleId ?? user?.assignedVehicleId ?? "KBZ-482D"} />
            </label>
            <label>
              Route
              <select name="route" defaultValue={shift?.route ?? user?.assignedRoute ?? "KBS-01"}>
                {["KBS-01", "KBS-02", "KBS-03", "KBS-04", "KBS-05"].map((route) => <option key={route}>{route}</option>)}
              </select>
            </label>
            <button className="primary-button" type="submit">{shift ? "Update Shift" : "Check In"}</button>
            {shift ? <button className="secondary-button" type="button" onClick={() => endShift.mutate()}>End Shift</button> : null}
          </form>
        </section>
        <section className="panel driver-trip-panel">
          <h2>My Vehicle</h2>
          {assignedVehicle ? (
            <>
              <strong>{assignedVehicle.plate}</strong>
              <dl>
                <div><dt>Route</dt><dd>{shift?.route ?? assignedVehicle.routeName}</dd></div>
                <div><dt>Speed</dt><dd>{assignedVehicle.speedKmh} km/h</dd></div>
                <div><dt>Passengers</dt><dd>{assignedVehicle.passengerCount}</dd></div>
                <div><dt>Fuel</dt><dd>{assignedVehicle.fuelPercent}%</dd></div>
                <div><dt>Trips Today</dt><dd>{assignedVehicle.tripsToday}</dd></div>
                <div><dt>Revenue</dt><dd>{formatKes(assignedVehicle.revenueTodayKes)}</dd></div>
              </dl>
            </>
          ) : <p>No vehicle data available.</p>}
        </section>
      </div>
    </>
  );
}

function FleetMarshalWorkspace(): JSX.Element {
  const summary = useDashboard();

  return (
    <>
      <PageTitle title="Fleet Marshal Console" subtitle="Live buses, GPS status, and route alerts." />
      <section className="mini-kpis">
        <Metric label="BUSES VISIBLE" value={String(summary.vehicles.length)} />
        <Metric label="MOVING NOW" value="28" />
        <Metric label="OPEN ALERTS" value={String(summary.alerts.filter((alert) => alert.status === "OPEN").length)} />
        <Metric label="PRIMARY ROUTE" value="KBS-01" />
      </section>
      <div className="live-map-layout">
        <section className="panel"><FleetMap vehicles={summary.vehicles} large /></section>
        <AlertsPanel alerts={summary.alerts} />
      </div>
    </>
  );
}

function LiveMapScreen(): JSX.Element {
  const { data = [] } = useQuery({ queryKey: ["vehicles"], queryFn: () => apiGet<LiveVehicleState[]>("/vehicles") });
  const [route, setRoute] = useLocalState("All Routes");
  const filtered = route === "All Routes" ? data : data.filter((vehicle) => vehicle.routeName === route);
  const selectedVehicleId = useUiStore((state) => state.selectedVehicleId);
  const selected = data.find((vehicle) => vehicle.vehicleId === selectedVehicleId) ?? filtered[0];

  return (
    <>
      <PageTitle title="Live Fleet Map" subtitle={`${filtered.length} vehicles`} />
      <div className="route-filter">
        {["All Routes", "KBS-01", "KBS-02", "KBS-03", "KBS-04", "KBS-05"].map((item) => (
          <button className={route === item ? "segment active" : "segment"} key={item} onClick={() => setRoute(item)} type="button">{item}</button>
        ))}
      </div>
      <div className="live-map-layout">
        <section className="panel"><FleetMap vehicles={filtered} large /></section>
        <section className="panel vehicle-side">
          <h2>Vehicle List</h2>
          {filtered.map((vehicle) => <VehicleListRow vehicle={vehicle} key={vehicle.vehicleId} />)}
          {selected ? <VehicleDetailTabs vehicle={selected} /> : null}
        </section>
      </div>
    </>
  );
}

function FleetScreen(): JSX.Element {
  const { data = [] } = useQuery({ queryKey: ["vehicles"], queryFn: () => apiGet<LiveVehicleState[]>("/vehicles") });
  const [query, setQuery] = useLocalState("");
  const rows = data.filter((vehicle) => `${vehicle.plate} ${vehicle.driverName} ${vehicle.routeName}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <PageTitle title="Fleet Overview" subtitle="Manage and monitor all 52 vehicles" actions={<><button className="secondary-button" type="button"><Download size={16} />Export Data</button><button className="secondary-button" type="button"><Filter size={16} />Filter</button></>} />
      <label className="table-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter fleet table" /></label>
      <section className="panel fleet-table">
        <table>
          <thead><tr><th>Vehicle</th><th>Route</th><th>Driver</th><th>Status</th><th>Speed</th><th>Fuel</th><th>Passengers</th><th>Trips</th><th>Revenue</th><th>Last Alert</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map((vehicle) => <FleetTableRow vehicle={vehicle} key={vehicle.vehicleId} />)}
          </tbody>
        </table>
      </section>
      <p className="table-caption">Showing {rows.length} of 52 vehicles</p>
    </>
  );
}

function TripsScreen(): JSX.Element {
  const { data = [] } = useQuery({ queryKey: ["trips"], queryFn: () => apiGet<DemoTrip[]>("/trips") });
  const activeTrips = data.filter((trip) => trip.status === "IN_PROGRESS").length;

  return (
    <>
      <PageTitle title="Trip History" subtitle="Track all trips across your fleet" />
      <section className="mini-kpis">
        <Metric label="TOTAL TRIPS TODAY" value="342" />
        <Metric label="ACTIVE TRIPS" value={String(activeTrips)} />
        <Metric label="TOTAL DISTANCE" value="4,582 km" />
        <Metric label="TOTAL PASSENGERS" value="4,896" />
      </section>
      <section className="stack-panel">
        <h2>Recent Trips</h2>
        {data.map((trip) => (
          <article className="trip-card" key={trip.id}>
            <div><strong>{trip.id}</strong><span className={`status-pill ${trip.status.toLowerCase()}`}>{trip.status.replace("_", " ")}</span></div>
            <p>Vehicle: {trip.vehicle}</p><p>Route: {trip.route}</p><p>Driver: {trip.driver}</p>
            <b>{formatKes(trip.revenueKes)}</b>
            <small>{trip.startedAt} - {trip.completedAt} ({trip.durationMin} min)</small>
            <small>{trip.distanceKm} km · {trip.passengers} passengers</small>
          </article>
        ))}
      </section>
    </>
  );
}

function RevenueScreen(): JSX.Element {
  const { data } = useQuery({ queryKey: ["revenue"], queryFn: () => apiGet<RevenueSummary>("/payments/summary") });
  const revenue = data ?? { todayKes: 0, weekKes: 0, monthKes: 0, averagePerVehicleKes: 0, revenueByRoute: [], split: { sacco: 0, driver: 0, maintenance: 0 } };

  return (
    <>
      <PageTitle title="Revenue Dashboard" subtitle="Financial overview and insights" />
      <section className="mini-kpis">
        <Metric label="TODAY'S TOTAL REVENUE" value={formatKes(revenue.todayKes)} hint="+12% vs yesterday" />
        <Metric label="THIS WEEK" value={formatKes(revenue.weekKes)} hint="+8% vs last week" />
        <Metric label="THIS MONTH" value={formatKes(revenue.monthKes)} hint="+15% vs last month" />
        <Metric label="AVERAGE PER VEHICLE" value={formatKes(revenue.averagePerVehicleKes)} />
      </section>
      <div className="two-column">
        <section className="panel chart-panel"><h2>Revenue by Route</h2><RouteRevenueChart data={revenue.revenueByRoute} /></section>
        <section className="panel split-panel">
          <h2>Revenue Split</h2>
          <SplitRow label="SACCO (60%)" value={revenue.split.sacco} />
          <SplitRow label="Driver (35%)" value={revenue.split.driver} />
          <SplitRow label="Maintenance (5%)" value={revenue.split.maintenance} />
        </section>
      </div>
    </>
  );
}

function DriversScreen(): JSX.Element {
  const queryClient = useQueryClient();
  const user = useSessionStore((state) => state.user);
  const { data = [] } = useQuery({ queryKey: ["drivers"], queryFn: () => apiGet<DemoDriver[]>("/drivers") });
  const createDriver = useMutation({
    mutationFn: (input: {
      name: string;
      email: string;
      phone: string;
      password: string;
      licenseNumber: string;
      licenseExpiry: string;
      mpesaPhone: string;
    }) => apiPost("/drivers", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["drivers"] })
  });

  return (
    <>
      <PageTitle title="Driver Management" subtitle="Monitor driver performance and safety" />
      {user?.role === "SUPER_ADMIN" ? (
        <section className="panel create-driver-panel">
          <h2>Add Driver</h2>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              createDriver.mutate({
                name: String(form.get("name")),
                email: String(form.get("email")),
                phone: String(form.get("phone")),
                password: String(form.get("password")),
                licenseNumber: String(form.get("licenseNumber")),
                licenseExpiry: String(form.get("licenseExpiry")),
                mpesaPhone: String(form.get("mpesaPhone"))
              });
              event.currentTarget.reset();
            }}
          >
            <input name="name" placeholder="Driver name" required />
            <input name="email" placeholder="Email" type="email" required />
            <input name="phone" placeholder="Phone" required />
            <input name="password" placeholder="Initial password" type="password" minLength={8} required />
            <input name="licenseNumber" placeholder="License number" required />
            <input name="licenseExpiry" type="date" required />
            <input name="mpesaPhone" placeholder="M-Pesa phone" required />
            <button className="primary-button" type="submit" disabled={createDriver.isPending}>
              {createDriver.isPending ? "Creating..." : "Create Driver"}
            </button>
          </form>
          <p>Driver passwords are admin-managed and cannot be changed by drivers.</p>
          {createDriver.isSuccess ? <small className="success-text">Driver created.</small> : null}
          {createDriver.error ? <small className="form-error">{createDriver.error.message}</small> : null}
        </section>
      ) : null}
      <section className="mini-kpis">
        <Metric label="TOTAL DRIVERS" value="52" />
        <Metric label="AVG SAFETY SCORE" value="94" />
        <Metric label="ACTIVE TODAY" value="42" />
        <Metric label="TOP PERFORMERS" value="12" />
      </section>
      <section className="driver-grid">
        {data.map((driver) => (
          <article className="driver-card panel" key={driver.id}>
            <div className="driver-head"><div><h2>{driver.name}</h2><small>{driver.licenseNumber} · {driver.experience} · {driver.phone}</small></div><strong>{driver.safetyScore}</strong></div>
            <span>Safety Score</span>
            <dl>
              <div><dt>Vehicle</dt><dd>{driver.vehicle}</dd></div><div><dt>Route</dt><dd>{driver.route}</dd></div><div><dt>Trips Today</dt><dd>{driver.tripsToday}</dd></div><div><dt>Revenue</dt><dd>{formatKes(driver.revenueKes)}</dd></div><div><dt>Harsh Events</dt><dd>{driver.harshEvents}</dd></div>
            </dl>
            <div className="progress wide"><i className="green" style={{ width: `${driver.safetyScore}%` }} /></div>
          </article>
        ))}
      </section>
    </>
  );
}

function AlertsScreen(): JSX.Element {
  const queryClient = useQueryClient();
  const { selectedAlertId, setSelectedAlertId } = useUiStore();
  const [filter, setFilter] = useLocalState("All");
  const { data = [] } = useQuery({ queryKey: ["alerts"], queryFn: () => apiGet<DemoAlert[]>("/alerts") });
  const mutation = useMutation({
    mutationFn: (input: { id: string; action: "acknowledge" | "resolve" }) => apiPatch<DemoAlert>(`/alerts/${input.id}/${input.action}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] })
  });
  const alerts = filter === "All" ? data : data.filter((alert) => alert.severity === filter || alert.status === filter);
  const selected = data.find((alert) => alert.id === selectedAlertId);

  return (
    <>
      <PageTitle title="Alerts Centre" subtitle="Monitor and manage fleet alerts" />
      <div className="route-filter">
        {["All", "CRITICAL", "WARNING", "INFO", "OPEN", "ACKNOWLEDGED", "RESOLVED"].map((item) => (
          <button className={filter === item ? "segment active" : "segment"} key={item} onClick={() => setFilter(item)} type="button">{titleCase(item)}</button>
        ))}
      </div>
      <div className="alerts-layout">
        <section className="stack-panel">
          {alerts.map((alert) => (
            <button className={`alert-card ${alert.severity.toLowerCase()}`} key={alert.id} onClick={() => setSelectedAlertId(alert.id)} type="button">
              <span>{alert.severity}</span><strong>{alert.vehicle}</strong><b>{alert.type}</b><p>{alert.message}</p><small>{alert.time}</small><em>{alert.status}</em>
            </button>
          ))}
        </section>
        <section className="panel alert-detail">
          {selected ? (
            <>
              <h2>{selected.type}</h2><p>{selected.message}</p><dl><div><dt>Vehicle</dt><dd>{selected.vehicle}</dd></div><div><dt>Location</dt><dd>{selected.location}</dd></div><div><dt>Status</dt><dd>{selected.status}</dd></div></dl>
              <div className="detail-actions">
                <button className="secondary-button" type="button" onClick={() => mutation.mutate({ id: selected.id, action: "acknowledge" })}><Eye size={16} />Acknowledge</button>
                <button className="primary-button" type="button" onClick={() => mutation.mutate({ id: selected.id, action: "resolve" })}><CheckCircle2 size={16} />Resolve</button>
              </div>
            </>
          ) : (
            <div className="empty-state"><h2>No Alert Selected</h2><p>Select an alert from the list to view details</p></div>
          )}
        </section>
      </div>
    </>
  );
}

function MaintenanceScreen(): JSX.Element {
  const { data = [] } = useQuery({ queryKey: ["maintenance"], queryFn: () => apiGet<DemoMaintenanceJob[]>("/maintenance/jobs") });

  return (
    <>
      <PageTitle title="Maintenance Schedule" subtitle="Track and manage vehicle maintenance" />
      <section className="mini-kpis">
        <Metric label="OVERDUE" value={String(data.filter((job) => job.status === "OVERDUE").length)} />
        <Metric label="DUE THIS WEEK" value="5" />
        <Metric label="SCHEDULED" value={String(data.filter((job) => job.status === "SCHEDULED").length)} />
        <Metric label="COMPLETED (30D)" value="24" />
      </section>
      <section className="stack-panel">
        <h2>Maintenance Jobs</h2>
        {data.map((job) => (
          <article className="maintenance-card" key={job.id}>
            <div><strong>{job.vehicle}</strong><span className={`priority ${job.priority.toLowerCase()}`}>{job.priority} PRIORITY</span></div>
            <h3>{job.type}</h3><p>{job.description}</p>
            <dl><div><dt>Due:</dt><dd>{job.dueDate}</dd></div><div><dt>Last Service:</dt><dd>{job.lastService}</dd></div></dl>
            <span className={`status-pill ${job.status.toLowerCase()}`}>{job.status}</span>
            <button className="secondary-button" type="button">Schedule Service</button>
          </article>
        ))}
      </section>
    </>
  );
}

function VehicleDetailTabs({ vehicle }: { vehicle: LiveVehicleState }): JSX.Element {
  const [tab, setTab] = useLocalState("Live");
  const tabs = ["Live", "Trips", "Fuel", "Safety", "Maintenance", "Financials"];

  return (
    <div className="detail-tabs">
      <div className="tab-list">{tabs.map((item) => <button className={tab === item ? "tab active" : "tab"} key={item} onClick={() => setTab(item)} type="button">{item}</button>)}</div>
      <div className="tab-body">
        {tab === "Live" ? <p>{vehicle.plate} is on {vehicle.routeName}, moving at {vehicle.speedKmh} km/h with {vehicle.passengerCount} passengers.</p> : null}
        {tab === "Trips" ? <p>{vehicle.tripsToday} trips completed today.</p> : null}
        {tab === "Fuel" ? <p>Fuel is at {vehicle.fuelPercent}% ({vehicle.fuelLitres}L).</p> : null}
        {tab === "Safety" ? <p>Current alert state: {vehicle.lastAlert ?? "No active alert"}.</p> : null}
        {tab === "Maintenance" ? <p>Next service check is based on odometer and OBD events.</p> : null}
        {tab === "Financials" ? <p>Revenue today: {formatKes(vehicle.revenueTodayKes)}.</p> : null}
      </div>
    </div>
  );
}

function ReportsScreen(): JSX.Element {
  return <Dashboard />;
}

function AlertsPanel({ alerts }: { alerts: DemoAlert[] }): JSX.Element {
  return (
    <section className="panel alerts-panel">
      <div className="panel-heading"><h2>Recent Alerts</h2><button type="button">View all</button></div>
      <div className="alert-list">
        {alerts.map((alert) => (
          <article className={`alert-row ${alert.severity.toLowerCase()}`} key={alert.id}>
            <AlertTriangle size={16} /><div><span>{alert.vehicle}</span><strong>{alert.message}</strong></div><time>{alert.time}</time>
          </article>
        ))}
      </div>
    </section>
  );
}

function TopEarner({ vehicle }: { vehicle?: LiveVehicleState }): JSX.Element {
  if (!vehicle) return <section className="panel earner-panel">Loading...</section>;

  return (
    <section className="panel earner-panel">
      <span>Top Earner Today</span><strong>{vehicle.plate}</strong><small>Route {vehicle.routeName} · Westlands - CBD</small>
      <dl><div><dt>Revenue</dt><dd>{formatKes(vehicle.revenueTodayKes)}</dd></div><div><dt>Trips</dt><dd>{vehicle.tripsToday}</dd></div><div><dt>Passengers</dt><dd>234</dd></div><div><dt>Fuel</dt><dd>{vehicle.fuelPercent}%</dd></div></dl>
    </section>
  );
}

function FleetStatus({ rows }: { rows: Array<{ label: string; value: number; pct: number }> }): JSX.Element {
  return <section className="panel status-panel"><h2>Fleet Status</h2>{rows.map((row) => <div className="status-row" key={row.label}><span>{row.label}</span><strong>{row.value}</strong><div className="progress"><i className={statusTone(row.label)} style={{ width: `${row.pct}%` }} /></div><small>{row.pct}%</small></div>)}</section>;
}

function RevenueTrend({ data }: { data: Array<{ day: string; value: number }> }): JSX.Element {
  return (
    <section className="panel chart-panel"><h2>Revenue Trend (Last 7 Days)</h2><ResponsiveContainer height={220} width="100%"><AreaChart data={data}><defs><linearGradient id="revenue" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#f2c300" stopOpacity={0.35} /><stop offset="100%" stopColor="#f2c300" stopOpacity={0.03} /></linearGradient></defs><XAxis dataKey="day" tickLine={false} axisLine={false} /><YAxis tickFormatter={(value) => `${Number(value) / 1000}K`} tickLine={false} axisLine={false} /><Tooltip formatter={(value) => formatKes(Number(value))} /><Area dataKey="value" type="monotone" stroke="#e0b000" strokeWidth={3} fill="url(#revenue)" /></AreaChart></ResponsiveContainer></section>
  );
}

function Leaderboard({ rows }: { rows: Array<{ name: string; trips: number; score: number }> }): JSX.Element {
  return <section className="panel leaderboard-panel"><h2>Driver Safety Leaderboard</h2>{rows.map((driver, index) => <div className="driver-row" key={driver.name}><span>{index + 1}</span><div><strong>{driver.name}</strong><small>{driver.trips} trips today</small></div><b>{driver.score}</b><small>score</small></div>)}</section>;
}

function RouteRevenueChart({ data }: { data: Array<{ route: string; revenue: number }> }): JSX.Element {
  return <ResponsiveContainer height={280} width="100%"><BarChart data={data}><CartesianGrid vertical={false} stroke="#eeeeea" /><XAxis dataKey="route" tickLine={false} axisLine={false} /><YAxis tickFormatter={(value) => `${Number(value) / 1000}K`} tickLine={false} axisLine={false} /><Tooltip formatter={(value) => formatKes(Number(value))} /><Bar dataKey="revenue" fill="#f2c300" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>;
}

function FleetTableRow({ vehicle }: { vehicle: LiveVehicleState }): JSX.Element {
  const setSelectedVehicleId = useUiStore((state) => state.setSelectedVehicleId);
  const setActiveView = useUiStore((state) => state.setActiveView);

  return (
    <tr>
      <td><strong>{vehicle.plate}</strong><small>{vehicleNicknames.get(vehicle.plate) ?? "Na-Flow"}</small></td>
      <td>{vehicle.routeName}</td><td>{vehicle.driverName}</td><td><span className={`status-pill ${vehicleStatusClass(vehicle)}`}>{vehicleStatusLabel(vehicle)}</span></td><td>{vehicle.speedKmh} km/h</td><td>{vehicle.fuelPercent}%</td><td>{vehicle.passengerCount}</td><td>{vehicle.tripsToday}</td><td>{formatKes(vehicle.revenueTodayKes)}</td><td>{vehicle.lastAlert ?? "None"}</td>
      <td><button className="icon-button" type="button" aria-label={`View ${vehicle.plate}`} onClick={() => { setSelectedVehicleId(vehicle.vehicleId); setActiveView("Live Map"); }}><Eye size={16} /></button></td>
    </tr>
  );
}

function VehicleListRow({ vehicle }: { vehicle: LiveVehicleState }): JSX.Element {
  const setSelectedVehicleId = useUiStore((state) => state.setSelectedVehicleId);
  return <button className="vehicle-row" type="button" onClick={() => setSelectedVehicleId(vehicle.vehicleId)}><strong>{vehicle.plate}</strong><span>{vehicle.routeName}</span><small>{vehicle.speedKmh} km/h</small></button>;
}

function PageTitle({ title, subtitle, actions }: { title: string; subtitle: string; actions?: ReactNode }): JSX.Element {
  return <div className="page-title"><div><h1>{title}</h1><p>{subtitle}</p></div>{actions ? <div className="page-actions">{actions}</div> : null}</div>;
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }): JSX.Element {
  return <article className="metric-card"><span>{label}</span><strong>{value}</strong>{hint ? <small>{hint}</small> : null}</article>;
}

function SplitRow({ label, value }: { label: string; value: number }): JSX.Element {
  return <div className="split-row"><span>{label}</span><strong>{formatKes(value)}</strong></div>;
}

function ScreenRouter(): JSX.Element {
  const activeView = useUiStore((state) => state.activeView);
  const role = useSessionStore((state) => state.user?.role);

  if (role === "DRIVER") return <DriverWorkspace />;
  if (role === "FLEET_MARSHAL" && (activeView === "Reports" || activeView === "Revenue" || activeView === "Drivers" || activeView === "Maintenance" || activeView === "Trips")) {
    return <FleetMarshalWorkspace />;
  }
  if (activeView === "Live Map") return <LiveMapScreen />;
  if (activeView === "Fleet") return <FleetScreen />;
  if (activeView === "Trips") return <TripsScreen />;
  if (activeView === "Revenue") return <RevenueScreen />;
  if (activeView === "Drivers") return <DriversScreen />;
  if (activeView === "Alerts") return <AlertsScreen />;
  if (activeView === "Maintenance") return <MaintenanceScreen />;
  return <ReportsScreen />;
}

export function App(): JSX.Element {
  const token = useSessionStore((state) => state.token);

  if (!token) {
    return <LoginScreen />;
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-shell">
        <Topbar />
        <div className="content"><ScreenRouter /></div>
      </main>
    </div>
  );
}

function labelRole(role: string): string {
  return role.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function canViewNav(role: string | undefined, view: DashboardView): boolean {
  if (role === "DRIVER") return false;
  if (role === "FLEET_MARSHAL") return view === "Live Map" || view === "Fleet" || view === "Alerts" || view === "Reports";
  return true;
}

function statusTone(label: string): string {
  if (label === "Moving") return "green";
  if (label === "Idle") return "amber";
  if (label === "Alert") return "red";
  return "gray";
}

function vehicleStatusLabel(vehicle: LiveVehicleState): string {
  if (vehicle.lastAlert === "Just now") return "ALERT";
  if (vehicle.speedKmh === 0) return "IDLE";
  if (vehicle.status === "OFFLINE") return "OFFLINE";
  return "MOVING";
}

function vehicleStatusClass(vehicle: LiveVehicleState): string {
  return vehicleStatusLabel(vehicle).toLowerCase();
}

function titleCase(value: string): string {
  return value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function useLocalState(initialValue: string): [string, (value: string) => void] {
  return useState(initialValue);
}
