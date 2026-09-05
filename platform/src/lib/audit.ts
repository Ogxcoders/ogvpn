// Audit logging + notification fan-out with preferences, dedup and channels (Sections AF/AI).
import { db } from "@/lib/db";
import { metricCounter } from "@/lib/api";

export interface AuditInput {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  severity?: "info" | "warning" | "critical";
}

export async function audit(input: AuditInput) {
  try {
    await db.auditEvent.create({
      data: {
        actorId: input.actorId ?? null,
        actorEmail: input.actorEmail ?? null,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        metadata: input.metadata ? JSON.stringify(input.metadata).slice(0, 2000) : null,
        ip: input.ip,
        severity: input.severity ?? "info",
      },
    });
    metricCounter(`audit_${input.action}`);
  } catch (e) {
    console.error(JSON.stringify({ level: "error", service: "audit", action: input.action, message: String(e) }));
  }
}

export type NotificationCategory =
  | "connection" | "security" | "account" | "billing" | "maintenance" | "incident" | "update" | "device" | "privacy";

const CATEGORY_TO_PREF: Record<NotificationCategory, string> = {
  connection: "connection", security: "security", account: "account", billing: "billing",
  maintenance: "maintenance", incident: "incident", update: "update", device: "security", privacy: "account",
};

export interface NotifyInput {
  userId: string;
  category: NotificationCategory;
  type: string;
  title: string;
  body: string;
  priority?: "info" | "important" | "critical";
  dedupeKey?: string;
  email?: boolean;
}

export async function notify(input: NotifyInput) {
  try {
    const pref = await db.notificationPref.findUnique({ where: { userId: input.userId } });
    const prefKey = CATEGORY_TO_PREF[input.category];
    const enabledForCategory = pref ? Boolean((pref as unknown as Record<string, boolean>)[prefKey]) : true;
    const inProduct = pref ? pref.inProductEnabled : true;
    if (!enabledForCategory || !inProduct) return;
    const channels = ["in_product"];
    if ((input.email ?? true) && (pref ? pref.emailEnabled : true)) channels.push("email");
    if (pref?.pushEnabled) channels.push("push");
    await db.notification.create({
      data: {
        userId: input.userId,
        category: input.category,
        type: input.type,
        title: input.title,
        body: input.body,
        priority: input.priority ?? "info",
        channels: JSON.stringify(channels),
        dedupeKey: input.dedupeKey,
      },
    }).catch(() => { /* dedupe conflict → suppressed by design */ });
    metricCounter("notifications_sent");
  } catch (e) {
    console.error(JSON.stringify({ level: "error", service: "notify", message: String(e) }));
  }
}

export async function ensureNotificationPrefs(userId: string) {
  await db.notificationPref.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}
