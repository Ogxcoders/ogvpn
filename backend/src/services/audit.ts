import type { DB } from "../db.js";
import { run } from "../db.js";
import { newId, nowIso } from "../lib/util.js";

export function audit(
  db: DB,
  action: string,
  opts: {
    actorUserId?: string | null;
    targetType?: string;
    targetId?: string;
    meta?: Record<string, unknown>;
  } = {},
): void {
  run(
    db,
    "INSERT INTO audit_log (id, actor_user_id, action, target_type, target_id, meta, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    newId(),
    opts.actorUserId ?? null,
    action,
    opts.targetType ?? null,
    opts.targetId ?? null,
    opts.meta ? JSON.stringify(opts.meta) : null,
    nowIso(),
  );
}
