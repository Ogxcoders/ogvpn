import type { Response } from "express";
import type { DB } from "./db.js";
import { run } from "./db.js";
import crypto from "node:crypto";

export type EventType =
  | "device.revoked"
  | "session.force-disconnect"
  | "subscription.changed"
  | "server.changed"
  | "config.updated"
  | "account.disabled"
  | "ping";

export interface BusEvent {
  event: EventType;
  data: Record<string, unknown>;
}

interface SseClient {
  userId: string;
  res: Response;
}

/** In-process event bus: pushes events to connected SSE clients and
 *  persists durable copies as notifications. */
export class EventBus {
  private clients = new Set<SseClient>();

  constructor(private db: DB) {}

  get clientCount(): number {
    return this.clients.size;
  }

  addClient(userId: string, res: Response): () => void {
    const client: SseClient = { userId, res };
    this.clients.add(client);
    return () => this.clients.delete(client);
  }

  /** Publishes to live clients; `durable` also stores a notification row. */
  publish(
    userId: string,
    event: EventType,
    data: Record<string, unknown>,
    durable?: { title: string; body: string },
  ): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const c of this.clients) {
      if (c.userId === userId && !c.res.writableEnded) {
        c.res.write(payload);
      }
    }
    if (durable) {
      run(
        this.db,
        "INSERT INTO notifications (id, user_id, type, title, body, read_at, created_at) VALUES (?, ?, ?, ?, ?, NULL, ?)",
        crypto.randomUUID(),
        userId,
        event,
        durable.title,
        durable.body,
        new Date().toISOString(),
      );
    }
  }

  broadcastServerEvent(
    event: EventType,
    data: Record<string, unknown>,
    affectedUserIds: string[],
  ): void {
    for (const userId of affectedUserIds) {
      this.publish(userId, event, data);
    }
  }
}
