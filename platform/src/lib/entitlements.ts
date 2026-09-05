// Entitlements (Section AD): plan catalog, device limits, bandwidth, feature gates.
export type PlanId = "free" | "pro" | "business";

export interface PlanEntitlements {
  id: PlanId;
  name: string;
  priceCents: number;
  interval: "month" | "year";
  deviceLimit: number;
  bandwidthGb: number | null; // null = unlimited
  premiumServers: boolean;
  splitTunneling: boolean;
  dedicatedIp: boolean;
  portForwarding: boolean;
  prioritySupport: boolean;
  mfa: boolean;
  maxServersPerDevice: number;
  tagline: string;
  features: string[];
}

export const PLANS: Record<PlanId, PlanEntitlements> = {
  free: {
    id: "free", name: "Aegis Free", priceCents: 0, interval: "month",
    deviceLimit: 1, bandwidthGb: 10, premiumServers: false, splitTunneling: false,
    dedicatedIp: false, portForwarding: false, prioritySupport: false, mfa: true,
    maxServersPerDevice: 1,
    tagline: "Essential privacy, forever free.",
    features: ["1 connected device", "10 GB/month data", "8 standard locations", "WireGuard® protocol", "Kill switch & DNS leak protection", "In-app support"],
  },
  pro: {
    id: "pro", name: "Aegis Pro", priceCents: 799, interval: "month",
    deviceLimit: 10, bandwidthGb: null, premiumServers: true, splitTunneling: true,
    dedicatedIp: false, portForwarding: false, prioritySupport: false, mfa: true,
    maxServersPerDevice: 3,
    tagline: "Full-speed privacy on every device you own.",
    features: ["10 connected devices", "Unlimited data", "All 60+ locations", "WireGuard®, OpenVPN & IKEv2", "Split tunneling", "Ad & tracker blocking DNS", "24/7 live chat"],
  },
  business: {
    id: "business", name: "Aegis Business", priceCents: 2499, interval: "month",
    deviceLimit: 30, bandwidthGb: null, premiumServers: true, splitTunneling: true,
    dedicatedIp: true, portForwarding: true, prioritySupport: true, mfa: true,
    maxServersPerDevice: 5,
    tagline: "Team-grade security with central control.",
    features: ["30 connected devices", "Unlimited data & dedicated IP", "All locations + dedicated gateways", "Priority routing & support", "Centralized team administration", "Audit logs & SSO (enterprise)", "99.99% uptime SLA"],
  },
};

export function planOf(plan: string): PlanEntitlements {
  return PLANS[(plan as PlanId) in PLANS ? (plan as PlanId) : "free"];
}

export function isActiveStatus(status: string): boolean {
  return status === "active" || status === "trialing" || status === "grace";
}

export function canUseServer(plan: string, regionTier: string, freeAllowed: boolean, subscriptionStatus: string): boolean {
  const ent = planOf(plan);
  if (ent.premiumServers && isActiveStatus(subscriptionStatus)) return true;
  return freeAllowed && regionTier === "standard";
}

export const MIN_CLIENT_VERSION = "1.0.0";
export const LATEST_CLIENT_VERSION = "1.2.0";

export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number), pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d;
  }
  return 0;
}

export function versionGate(clientVersion: string): { ok: boolean; updateRequired: boolean; latest: string } {
  if (compareVersions(clientVersion, MIN_CLIENT_VERSION) < 0) {
    return { ok: false, updateRequired: true, latest: LATEST_CLIENT_VERSION };
  }
  return { ok: true, updateRequired: compareVersions(clientVersion, LATEST_VERSION_FOR_OPTIONAL()) < 0, latest: LATEST_CLIENT_VERSION };
}

function LATEST_VERSION_FOR_OPTIONAL() { return LATEST_CLIENT_VERSION; }
