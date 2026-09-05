"use client";

// Global wiring: session expiry events, analytics flush, online/offline listeners.
import { useEffect } from "react";
import { useApp } from "@/lib/client/store";
import { onSessionEvent, flushAnalytics, setOnlineState } from "@/lib/client/api";
import { useToast } from "@/hooks/use-toast";

export function useSessionEventGlobally(): void {
  const setUser = useApp((s) => s.setUser);
  const navigate = useApp((s) => s.navigate);
  const { toast } = useToast();
  useEffect(() => {
    const off = onSessionEvent((state) => {
      if (state === "expired") {
        setUser(null);
        toast({
          title: "Session expired",
          description: "You were signed out for security. Sign in again to continue.",
        });
        navigate({ view: "login" });
      }
    });
    return () => { off(); };
  }, [setUser, navigate, toast]);
}

export function useGlobalListeners(): void {
  useEffect(() => {
    const onOnline = () => setOnlineState(true);
    const onOffline = () => setOnlineState(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") void flushAnalytics();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
}
