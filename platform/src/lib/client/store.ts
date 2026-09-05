"use client";

// Global client state (Section D — shared polymorphic state system):
// route, session, theme, notifications; hash-based deep links.
import { create } from "zustand";
import { api, track } from "./api";
import { setThemeClass, getThemeClass } from "@/components/product/theme";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  clientVersion?: string;
}

export type ViewRoute =
  | { view: "landing" }
  | { view: "pricing" }
  | { view: "security" }
  | { view: "downloads" }
  | { view: "status" }
  | { view: "docs"; slug?: string }
  | { view: "legal"; doc: string }
  | { view: "login" }
  | { view: "register" }
  | { view: "reset"; token?: string }
  | { view: "verify-email"; token?: string }
  | { view: "app"; tab: string }
  | { view: "admin"; tab: string };

function parseHash(): ViewRoute {
  const h = window.location.hash.replace(/^#\/?/, "");
  const parts = h.split("/").filter(Boolean);
  switch (parts[0]) {
    case "pricing": return { view: "pricing" };
    case "security": return { view: "security" };
    case "downloads": return { view: "downloads" };
    case "status": return { view: "status" };
    case "docs": return { view: "docs", slug: parts[1] };
    case "legal": return { view: "legal", doc: parts[1] || "privacy" };
    case "login": return { view: "login" };
    case "register": return { view: "register" };
    case "reset": return { view: "reset", token: parts[1] };
    case "verify-email": return { view: "verify-email", token: parts[1] };
    case "app": return { view: "app", tab: parts[1] || "overview" };
    case "admin": return { view: "admin", tab: parts[1] || "overview" };
    default: return { view: "landing" };
  }
}

export interface NotificationItem {
  id: string;
  category: string;
  type: string;
  title: string;
  body: string;
  priority: string;
  read: boolean;
  createdAt: string;
}

interface AppState {
  hydrated: boolean;
  user: SessionUser | null;
  sessionId: string | null;
  route: ViewRoute;
  theme: "light" | "dark";
  mobileMenuOpen: boolean;
  notifOpen: boolean;
  unread: number;
  offline: boolean;
  maintenanceBanner: string | null;

  navigate: (route: ViewRoute) => void;
  hydrate: () => Promise<void>;
  setUser: (u: SessionUser | null, sessionId?: string | null) => void;
  toggleTheme: () => void;
  setMobileMenu: (v: boolean) => void;
  setNotifOpen: (v: boolean) => void;
  refreshNotifications: () => Promise<void>;
  setOffline: (v: boolean) => void;
  setMaintenanceBanner: (v: string | null) => void;
}

function currentRoute(): ViewRoute {
  if (typeof window === "undefined") return { view: "landing" };
  return parseHash();
}

export const useApp = create<AppState>((set, get) => ({
  hydrated: false,
  user: null,
  sessionId: null,
  route: typeof window !== "undefined" ? currentRoute() : { view: "landing" },
  theme: "dark",
  mobileMenuOpen: false,
  notifOpen: false,
  unread: 0,
  offline: false,
  maintenanceBanner: null,

  navigate: (route) => {
    const hash = routeToHash(route);
    if (`#/${hash}` !== window.location.hash) {
      window.location.hash = `/${hash}`;
    }
    set({ route, mobileMenuOpen: false, notifOpen: false });
    // Scroll restoration: top of page on navigation, preserved by browser on back
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }));
  },

  hydrate: async () => {
    set({ theme: getThemeClass() });
    try {
      const data = await api<{ authenticated: boolean; user: SessionUser | null; sessionId?: string }>("/api/auth/session", { dedupe: true });
      set({ hydrated: true, user: data.authenticated ? data.user : null, sessionId: data.sessionId ?? null });
      if (data.authenticated) {
        void get().refreshNotifications();
        track("app_launch");
      }
    } catch {
      set({ hydrated: true });
    }
  },

  setUser: (u, sessionId) => {
    set({ user: u, sessionId: sessionId ?? null });
    if (u) void get().refreshNotifications();
    else set({ unread: 0 });
  },

  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    setThemeClass(next);
    set({ theme: next });
  },

  setMobileMenu: (v) => set({ mobileMenuOpen: v }),
  setNotifOpen: (v) => set({ notifOpen: v }),
  setOffline: (v) => set({ offline: v }),
  setMaintenanceBanner: (v) => set({ maintenanceBanner: v }),

  refreshNotifications: async () => {
    try {
      const data = await api<{ unread: number }>("/api/notifications?unread=1", { dedupe: true });
      set({ unread: data.unread });
    } catch { /* non-fatal */ }
  },
}));

export function routeToHash(route: ViewRoute): string {
  switch (route.view) {
    case "landing": return "";
    case "pricing": return "pricing";
    case "security": return "security";
    case "downloads": return "downloads";
    case "status": return "status";
    case "docs": return route.slug ? `docs/${route.slug}` : "docs";
    case "legal": return `legal/${route.doc}`;
    case "login": return "login";
    case "register": return "register";
    case "reset": return route.token ? `reset/${route.token}` : "reset";
    case "verify-email": return route.token ? `verify-email/${route.token}` : "verify-email";
    case "app": return route.tab === "overview" ? "app" : `app/${route.tab}`;
    case "admin": return route.tab === "overview" ? "admin" : `admin/${route.tab}`;
  }
}

/** Re-parse the current hash into the store (used by back/forward navigation). */
export function syncRouteFromHash() {
  const route = parseHash();
  useApp.setState({ route, mobileMenuOpen: false, notifOpen: false });
  requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }));
}
