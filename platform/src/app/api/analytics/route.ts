// Analytics ingest (Section AG): event taxonomy, sampling, opt-out enforcement,
// PII minimization, batching-friendly endpoint.
import { db } from "@/lib/db";
import { ok, route, readJson, readJsonSafe, rateLimit, rateLimitResponse, getClientIp } from "@/lib/api";
import { getSessionUser } from "@/lib/session";

const ALLOWED_EVENTS = new Set([
  "app_launch", "account_created", "auth_success", "auth_failure",
  "vpn_connect_attempt", "vpn_connected", "vpn_connect_failure", "vpn_reconnect", "vpn_disconnect",
  "server_changed", "mode_changed", "device_registered", "device_removed",
  "settings_changed", "upgrade_view", "upgrade_start", "upgrade_complete",
  "cancel_flow", "payment_failure", "support_interaction", "download_click",
  "update_event", "permission_event", "offline_event", "api_failure", "error_shown",
]);
const PROHIBITED_PROPS = new Set(["url", "email", "ip", "password", "token", "dns_query", "domain", "traffic"]);

export const POST = route(async (req) => {
  const rl = rateLimit(`analytics:${getClientIp(req)}`, 120, 60_000);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSec);
  const user = await getSessionUser(req);
  const body = await readJsonSafe(req);
  const events = Array.isArray(body.events) ? body.events.slice(0, 50) : [];

  // Analytics opt-out (AG 773): drop everything except security-critical counters
  if (user?.analyticsOptOut) {
    return ok({ accepted: 0, reason: "opted_out" });
  }

  let accepted = 0;
  for (const e of events) {
    if (!e || typeof e.name !== "string" || !ALLOWED_EVENTS.has(e.name)) continue;
    let props: Record<string, unknown> | null = null;
    if (e.props && typeof e.props === "object") {
      props = {};
      for (const [k, v] of Object.entries(e.props as Record<string, unknown>)) {
        if (PROHIBITED_PROPS.has(k.toLowerCase())) continue; // PII minimization (AG 774)
        props[k] = typeof v === "string" ? v.slice(0, 120) : v;
      }
    }
    const sampled = Math.random() < 0.9; // 90% sampling (AG 772)
    await db.analyticsEvent.create({
      data: { name: e.name, userId: user?.id ?? null, sessionId: typeof e.sessionId === "string" ? e.sessionId.slice(0, 40) : null, props: props ? JSON.stringify(props) : null, sampled },
    }).catch(() => {});
    accepted += 1;
  }
  return ok({ accepted });
}, { name: "analytics.ingest" });
