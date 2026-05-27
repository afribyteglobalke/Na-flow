import { create } from "zustand";

export type DashboardView = "Live Map" | "Fleet" | "Trips" | "Revenue" | "Drivers" | "Alerts" | "Maintenance" | "Reports";

interface UiState {
  activeView: DashboardView;
  selectedVehicleId: string | null;
  selectedAlertId: string | null;
  setActiveView: (view: DashboardView) => void;
  setSelectedVehicleId: (vehicleId: string | null) => void;
  setSelectedAlertId: (alertId: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeView: "Reports",
  selectedVehicleId: null,
  selectedAlertId: null,
  setActiveView: (activeView) => set({ activeView }),
  setSelectedVehicleId: (selectedVehicleId) => set({ selectedVehicleId }),
  setSelectedAlertId: (selectedAlertId) => set({ selectedAlertId })
}));
