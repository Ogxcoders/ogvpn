"use client";

// Notification center: unread badge, panel with scroll containment, mark-read,
// live-region announcements, dedupe-aware listing.
import { useCallback, useEffect, useState } from "react";
import { api, timeAgo } from "@/lib/client/api";
import { useApp } from "@/lib/client/store";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Item {
  id: string; category: string; title: string; body: string; priority: string; read: boolean; createdAt: string;
}

export function NotificationBell() {
  const { unread, setUnreadCount, notifOpen, setNotifOpen, refreshNotifications } = useUnread();
  const [items, setItems] = useState<Item[] | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ notifications: Item[] }>("/api/notifications", { dedupe: true });
      setItems(data.notifications);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (notifOpen) void load();
  }, [notifOpen, load]);

  const markAll = async () => {
    await api("/api/notifications", { method: "PATCH", body: { action: "read-all" } }).catch(() => {});
    setItems((prev) => prev?.map((i) => ({ ...i, read: true })) ?? null);
    setUnreadCount(0);
  };

  const markOne = async (id: string) => {
    await api("/api/notifications", { method: "PATCH", body: { action: "read", id } }).catch(() => {});
    setItems((prev) => prev?.map((i) => (i.id === id ? { ...i, read: true } : i)) ?? null);
    void refreshNotifications();
  };

  return (
    <Popover open={notifOpen} onOpenChange={setNotifOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative inline-flex size-9 items-center justify-center rounded-md border transition-colors hover:bg-accent"
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        >
          <Bell className="size-4" aria-hidden="true" />
          {unread > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground"
              aria-hidden="true"
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" role="dialog" aria-label="Notifications">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-semibold">Notifications</p>
          <Button variant="ghost" size="sm" onClick={markAll} className="h-7 gap-1 text-xs">
            <CheckCheck className="size-3.5" aria-hidden="true" /> Mark all read
          </Button>
        </div>
        <div className="max-h-96 overflow-y-auto scroll-contain scrollbar-thin">
          {loading && items === null && <p className="px-3 py-6 text-center text-sm text-muted-foreground">Loading…</p>}
          {items !== null && items.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
          )}
          {items?.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.read && markOne(n.id)}
              className={cn(
                "block w-full border-b px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-accent/50",
                !n.read && "bg-primary/5"
              )}
            >
              <span className="flex items-center gap-2">
                {!n.read && <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />}
                <span className={cn("text-sm", n.priority === "critical" && "text-destructive font-medium")}>{n.title}</span>
                <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
              </span>
              <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{n.body}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function useUnread() {
  const unread = useApp((s) => s.unread);
  const notifOpen = useApp((s) => s.notifOpen);
  const setNotifOpen = useApp((s) => s.setNotifOpen);
  const refreshNotifications = useApp((s) => s.refreshNotifications);
  const setUnreadCount = useCallback((n: number) => useApp.setState({ unread: n }), []);
  return { unread, setUnreadCount, notifOpen, setNotifOpen, refreshNotifications };
}
