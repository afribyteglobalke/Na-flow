import { create } from "zustand";
import { getStoredToken, setStoredToken, type SessionUser } from "../lib/api";

interface SessionState {
  token: string | null;
  user: SessionUser | null;
  setSession: (token: string, user: SessionUser) => void;
  logout: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  token: getStoredToken(),
  user: readStoredUser(),
  setSession: (token, user) => {
    setStoredToken(token);
    window.localStorage.setItem("na-flow-user", JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    setStoredToken(null);
    window.localStorage.removeItem("na-flow-user");
    set({ token: null, user: null });
  }
}));

function readStoredUser(): SessionUser | null {
  const raw = window.localStorage.getItem("na-flow-user");
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}
