// Client version/update gate (AT): minimum supported version, optional updates,
// release channel metadata for Android/desktop/extension/web.
import { ok } from "@/lib/api";
import { LATEST_CLIENT_VERSION, MIN_CLIENT_VERSION, compareVersions } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

const RELEASES = {
  android: { version: "1.2.0", minSupported: MIN_CLIENT_VERSION, forced: false, notes: "Faster roaming between networks; per-app split tunneling fixes.", url: "#downloads" },
  windows: { version: "1.2.0", minSupported: MIN_CLIENT_VERSION, forced: false, notes: "Kill switch hardening on sleep/wake; OpenVPN TCP 443 fallback.", url: "#downloads" },
  macos: { version: "1.2.0", minSupported: MIN_CLIENT_VERSION, forced: false, notes: "Native on Sonoma/Sequoia; menu bar quick connect.", url: "#downloads" },
  linux: { version: "1.2.0", minSupported: MIN_CLIENT_VERSION, forced: false, notes: "nftables kill switch; systemd-resolved DNS handling.", url: "#downloads" },
  extension: { version: "1.1.3", minSupported: "1.0.0", forced: false, notes: "Reduced permissions; proxy credential rotation.", url: "#downloads" },
  web: { version: LATEST_CLIENT_VERSION, minSupported: MIN_CLIENT_VERSION, forced: false, notes: "Live connection workspace; degraded-state surfacing.", url: "/" },
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientVersion = searchParams.get("version") || LATEST_CLIENT_VERSION;
  const platform = searchParams.get("platform") || "web";
  const rel = (RELEASES as Record<string, { version: string; minSupported: string; forced: boolean; notes: string; url: string }>)[platform] || RELEASES.web;
  const updateRequired = compareVersions(clientVersion, rel.minSupported) < 0;
  const updateAvailable = compareVersions(clientVersion, rel.version) < 0;
  return ok({
    platform, clientVersion,
    latest: rel.version,
    updateRequired: updateRequired || rel.forced,
    updateAvailable,
    notes: rel.notes,
    url: rel.url,
    releaseChannel: "stable",
  });
}
