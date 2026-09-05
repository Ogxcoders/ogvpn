import { EventEmitter } from 'node:events';
import { isDemoMode } from '../demoState';

/**
 * Server-Sent Events client for the backend event bus (GET /events).
 *
 * Runs in the main process. The backend accepts the short-lived access
 * token via the `access_token` query parameter (EventSource cannot set
 * headers). Events are notifications — after every reconnect the caller
 * must re-fetch authoritative state; this class only forwards payloads.
 *
 * Reconnect policy: exponential backoff 1s → 30s, reset on a successful
 * open. `ping` keepalives from the server keep intermediaries from closing
 * the stream; a silent socket is detected via the backoff on error/close.
 */

export type ServerEventType =
  | 'device.revoked'
  | 'session.force-disconnect'
  | 'subscription.changed'
  | 'server.changed'
  | 'config.updated'
  | 'account.disabled'
  | 'ping';

export interface StreamEvent {
  event: ServerEventType;
  data: Record<string, unknown>;
}

export class EventStream extends EventEmitter {
  private controller: AbortController | null = null;
  private backoffMs = 1000;
  private closed = false;

  constructor(
    private readonly urlProvider: () => string,
    private readonly tokenProvider: () => string | null,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {
    super();
  }

  get connected(): boolean {
    return this.controller !== null;
  }

  start(): void {
    if (this.closed || this.controller) return;
    // Demo mode has no control plane to stream from: park permanently until
    // stop()+start() are re-issued after demo mode is switched off.
    if (isDemoMode()) return;
    this.open();
  }

  stop(): void {
    this.closed = true;
    this.controller?.abort();
    this.controller = null;
  }

  private open(): void {
    const token = this.tokenProvider();
    if (!token) {
      // No token yet — retry shortly; start() will be called after login.
      this.scheduleRetry();
      return;
    }
    const controller = new AbortController();
    this.controller = controller;

    this.fetchImpl(`${this.urlProvider()}/api/v1/events?access_token=${encodeURIComponent(token)}`, {
      headers: { Accept: 'text/event-stream', 'Cache-Control': 'no-cache' },
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok || !res.body) {
          throw new Error(`event stream HTTP ${res.status}`);
        }
        this.backoffMs = 1000;
        this.emit('open');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = buffer.indexOf('\n\n')) !== -1) {
            const raw = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            const parsed = parseSseBlock(raw);
            if (parsed) this.emit('event', parsed);
          }
        }
        // Server closed the stream — reconnect via the catch path below.
        throw new Error('stream closed');
      })
      .catch((err: unknown) => {
        if (this.closed || controller.signal.aborted) return;
        this.emit('stream-error', err instanceof Error ? err.message : String(err));
        this.controller = null;
        this.scheduleRetry();
      });
  }

  private scheduleRetry(): void {
    const delay = this.backoffMs;
    this.backoffMs = Math.min(this.backoffMs * 2, 30_000);
    setTimeout(() => {
      if (!this.closed && !this.controller) this.open();
    }, delay).unref?.();
  }
}

/** Parses one SSE block ("event: x\ndata: {...}") into a StreamEvent. */
export function parseSseBlock(block: string): StreamEvent | null {
  let event: string | null = null;
  let data = '';
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) data += line.slice(5).trim();
  }
  if (!event) return null;
  let payload: Record<string, unknown> = {};
  if (data) {
    try {
      payload = JSON.parse(data) as Record<string, unknown>;
    } catch {
      payload = {};
    }
  }
  return { event: event as ServerEventType, data: payload };
}
