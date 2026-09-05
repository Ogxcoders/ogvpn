"use client";

// Connection engine hook (Section M + R): a shared connection state machine
// used across surfaces — connecting stages, reconnect with backoff, degraded
// detection, offline/kill-switch surfacing, duplicate protection, telemetry.
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiClientError, isOnline, onOfflineChange, setOnlineState, track } from "./api";
import { useApp } from "./store";

export type ConnState =
  | "disconnected" | "connecting" | "connected" | "reconnecting" | "disconnecting";

export interface ConnServerInfo {
  id: string; code: string; hostname: string; ipv4?: string; port?: number;
  health: string; loadPct: number; latencyMs: number;
  region: { code: string; name: string; city: string; country: string; countryCode: string };
}

export interface ConnInfo {
  id: string;
  protocol: string;
  transport: string;
  startedAt: string;
  durationSec?: number;
  bytesIn?: number;
  bytesOut?: number;
  throughputMbps?: number;
  degraded?: boolean;
  server: ConnServerInfo;
  device: { id: string; name: string; platform: string };
}

export interface ConnError {
  code: string;
  message: string;
  retryable: boolean;
  details?: unknown;
}

export interface SubSummary {
  plan: string; status: string; deviceLimit: number;
  bandwidthGb: number | null; bytesUsed: number;
  currentPeriodEnd: string; cancelAtPeriodEnd: boolean;
}

interface StatusPayload {
  state: "connected" | "disconnected" | "degraded";
  connection: (Omit<ConnInfo, "startedAt"> & { startedAt: string }) | null;
  tunnel: { addressV4: string | null; dns?: string | null } | null;
  killSwitchActive?: boolean;
  subscription: SubSummary;
}

const STAGE_LABELS = [
  "Resolving endpoint",
  "Checking network & captive portal",
  "Performing secure handshake",
  "Assigning tunnel address",
  "Securing DNS resolvers",
  "Connection secured",
];

export function useConnectionEngine() {
  const { user, setUser } = useApp();
  const [state, setState] = useState<ConnState>("disconnected");
  const [stageIdx, setStageIdx] = useState(0);
  const [conn, setConn] = useState<ConnInfo | null>(null);
  const [tunnel, setTunnel] = useState<StatusPayload["tunnel"]>(null);
  const [subscription, setSubscription] = useState<SubSummary | null>(null);
  const [error, setError] = useState<ConnError | null>(null);
  const [offline, setOffline] = useState(!isOnline());
  const [killSwitchActive, setKillSwitchActive] = useState(false);
  const [selectedServer, setSelectedServer] = useState<{ serverId?: string; serverCode?: string; regionName?: string; countryCode?: string } | null>(null);
  const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectingRef = useRef(false);

  useEffect(() => {
    const off = onOfflineChange(setOffline);
    return () => { off(); };
  }, []);

  const stopStages = () => {
    if (stageTimer.current) { clearInterval(stageTimer.current); stageTimer.current = null; }
  };
  const stopPolling = () => {
    if (pollTimer.current) { clearInterval(pollTimer.current); pollTimer.current = null; }
  };

  const refresh = useCallback(async () => {
    try {
      const data = await api<StatusPayload>("/api/connection/status", { dedupe: true, retries: 1 });
      setSubscription(data.subscription);
      if (data.connection) {
        setConn(data.connection);
        setTunnel(data.tunnel);
        setSelectedServer({
          serverId: data.connection.server.id,
          serverCode: data.connection.server.code,
          regionName: data.connection.server.region.name,
          countryCode: data.connection.server.region.countryCode,
        });
        setKillSwitchActive(Boolean(data.killSwitchActive));
        setState(data.state === "degraded" ? "connected" : "connected");
      } else {
        setConn(null);
        setTunnel(null);
        setState((s) => (s === "connecting" || s === "disconnecting" ? s : "disconnected"));
      }
      setOnlineState(true);
      return data;
    } catch (e) {
      if (e instanceof ApiClientError && (e.code === "network_error" || e.code === "timeout")) {
        setOffline(true);
      }
      return null;
    }
  }, []);

  // Poll while connected (background sync — AR)
  useEffect(() => {
    stopPolling();
    if (state === "connected" && user) {
      pollTimer.current = setInterval(() => void refresh(), 5000);
    }
    return stopPolling;
  }, [state, user, refresh]);

  // Initial sync on auth
  useEffect(() => {
    if (user) void refresh();
    else { setState("disconnected"); setConn(null); setSubscription(null); }
  }, [user?.id]);

  const animateStages = () => {
    setStageIdx(0);
    stopStages();
    stageTimer.current = setInterval(() => {
      setStageIdx((i) => Math.min(i + 1, STAGE_LABELS.length - 2));
    }, 700);
  };

  const connect = useCallback(async (target?: { serverId?: string; serverCode?: string; regionName?: string; countryCode?: string; simulate?: string }): Promise<{ ok: true } | { ok: false; error: ConnError }> => {
    if (connectingRef.current) {
      return { ok: false, error: { code: "conflict", message: "A connection attempt is already in progress.", retryable: false } };
    }
    connectingRef.current = true;
    setError(null);
    setSelectedServer(target ?? null);
    setState("connecting");
    animateStages();
    track("vpn_connect_attempt", { server: target?.serverCode });
    try {
      const data = await api<{ connection: ConnInfo; tunnel: { addressV4: string } }>(
        "/api/connection/connect",
        {
          method: "POST",
          body: {
            serverId: target?.serverId, serverCode: target?.serverCode, simulate: target?.simulate,
          },
          retries: 0,
          timeoutMs: 20000,
        }
      );
      stopStages();
      setStageIdx(STAGE_LABELS.length - 1);
      await new Promise((r) => setTimeout(r, 350));
      setConn(data.connection);
      setTunnel({ addressV4: data.tunnel?.addressV4 ?? null });
      setState("connected");
      track("vpn_connected", { server: data.connection.server.code, protocol: data.connection.protocol });
      void refresh();
      return { ok: true as const };
    } catch (e) {
      stopStages();
      setState("disconnected");
      const err = e instanceof ApiClientError ? e : new ApiClientError(0, "unknown", "Connection failed.");
      setError({ code: err.code, message: err.message, retryable: err.retryable, details: err.details });
      track("vpn_connect_failure", { code: err.code, server: target?.serverCode });
      return { ok: false as const, error: err };
    } finally {
      connectingRef.current = false;
    }
  }, [refresh]);

  const disconnect = useCallback(async (reason = "user") => {
    setState("disconnecting");
    try {
      await api("/api/connection/disconnect", { method: "POST", body: { reason }, retries: 0 });
    } catch { /* idempotent — status poll reconciles */ }
    stopStages();
    setConn(null);
    setTunnel(null);
    setState("disconnected");
    track("vpn_disconnect", { reason });
    void refresh();
  }, [refresh]);

  const reconnect = useCallback(async () => {
    setState("reconnecting");
    const backoffSeq = [500, 1200, 2500];
    for (let attempt = 0; attempt < backoffSeq.length; attempt++) {
      await new Promise((r) => setTimeout(r, backoffSeq[attempt]));
      try {
        await api("/api/connection/reconnect", {
          method: "POST",
          body: { serverId: selectedServer?.serverId, serverCode: selectedServer?.serverCode, force: true },
          retries: 0,
        });
        const data = await refresh();
        if (data?.connection) {
          setState("connected");
          track("vpn_reconnect", { attempt });
          return { ok: true as const };
        }
      } catch (e) {
        if (attempt === backoffSeq.length - 1) {
          const err = e instanceof ApiClientError ? e : new ApiClientError(0, "unknown", "Reconnection failed.");
          setState("disconnected");
          setError({ code: err.code, message: err.message, retryable: true });
          return { ok: false as const, error: err };
        }
      }
    }
    return { ok: false as const };
  }, [refresh, selectedServer]);

  // Global offline transition handling (AQ): kill-switch surfacing + auto-reconnect
  useEffect(() => {
    if (!offline) return;
    track("offline_event", { connected: state === "connected" });
    const onBack = () => {
      setOnlineState(navigator.onLine);
      if (navigator.onLine && conn) {
        void reconnect();
      }
    };
    window.addEventListener("online", onBack, { once: true });
    return () => window.removeEventListener("online", onBack);
  }, [offline, conn, reconnect, state]);

  // Session expiry → drop connection state (R 421)
  useEffect(() => {
    if (!user && state !== "disconnected") {
      void disconnect("session_expired");
    }
  }, [user, state, disconnect]);

  return {
    state, stageIdx, stageLabels: STAGE_LABELS, conn, tunnel, subscription,
    error, offline, killSwitchActive, selectedServer,
    connect, disconnect, reconnect, refresh, setSelectedServer, clearError: () => setError(null),
  };
}

export type ConnectionEngine = ReturnType<typeof useConnectionEngine>;
