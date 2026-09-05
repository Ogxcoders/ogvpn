"use client";

// Support center (AZ): ticket list, creation with category & priority, threaded
// conversation, close flow, knowledge-base cross-links.
import { useCallback, useEffect, useRef, useState } from "react";
import { api, timeAgo, errMsg } from "@/lib/client/api";
import { useApp } from "@/lib/client/store";
import { Spinner, ErrorState, EmptyState } from "@/components/product/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { LifeBuoy, Plus, ArrowLeft, Send, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface TicketMessage { id: string; authorRole: string; authorName: string | null; body: string; createdAt: string }
interface Ticket { id: string; subject: string; category: string; priority: string; status: string; createdAt: string; updatedAt: string; messages?: TicketMessage[] }

export function SupportView() {
  const { navigate } = useApp();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("technical");
  const [priority, setPriority] = useState("normal");
  const [creating, setCreating] = useState(false);
  const [openTicket, setOpenTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    setError(null);
    api<{ tickets: Ticket[] }>("/api/support/tickets", { dedupe: true })
      .then((d) => setTickets(d.tickets))
      .catch((e) => setError(errMsg(e)));
  }, []);
  useEffect(load, [load]);

  const openDetail = async (t: Ticket) => {
    try {
      const d = await api<{ ticket: Ticket }>(`/api/support/tickets/${t.id}`, { dedupe: true });
      setOpenTicket(d.ticket);
      setTimeout(() => threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight }), 50);
    } catch (e) {
      toast({ title: "Could not open ticket", description: errMsg(e), variant: "destructive" });
    }
  };

  const create = async () => {
    setCreating(true);
    try {
      await api("/api/support/tickets", { method: "POST", body: { subject, message, category, priority }, retries: 0 });
      toast({ title: "Ticket created", description: "Our team will respond per your plan's SLA." });
      setCreateOpen(false);
      setSubject(""); setMessage("");
      load();
    } catch (e) {
      toast({ title: "Could not create ticket", description: errMsg(e), variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const sendReply = async () => {
    if (!openTicket || !reply.trim()) return;
    try {
      const d = await api<{ ticket: Ticket }>(`/api/support/tickets/${openTicket.id}`, { method: "POST", body: { message: reply }, retries: 0 });
      setOpenTicket(d.ticket);
      setReply("");
      setTimeout(() => threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" }), 50);
      load();
    } catch (e) {
      toast({ title: "Reply failed", description: errMsg(e), variant: "destructive" });
    }
  };

  const closeTicket = async () => {
    if (!openTicket) return;
    await api(`/api/support/tickets/${openTicket.id}`, { method: "POST", body: { action: "close" } }).catch(() => {});
    toast({ title: "Ticket closed" });
    setOpenTicket(null);
    load();
  };

  if (openTicket) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setOpenTicket(null)} className="gap-1.5">
          <ArrowLeft className="size-4" aria-hidden="true" /> All tickets
        </Button>
        <div>
          <h1 className="text-lg font-bold">{openTicket.subject}</h1>
          <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">{openTicket.category}</Badge>
            <Badge variant="outline">{openTicket.priority}</Badge>
            <Badge variant="outline">{openTicket.status}</Badge>
            <span>ref …{openTicket.id.slice(-8).toUpperCase()}</span>
          </p>
        </div>
        <div ref={threadRef} className="max-h-[50vh] space-y-3 overflow-y-auto scroll-contain rounded-xl border bg-card p-4 scrollbar-thin" aria-label="Conversation" role="log" aria-live="polite">
          {(openTicket.messages ?? []).map((m) => (
            <div key={m.id} className={cn("max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm",
              m.authorRole === "user" ? "ml-auto bg-primary/10" : m.authorRole === "system" ? "bg-muted/50 text-muted-foreground" : "bg-muted")}>
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {m.authorRole === "user" ? "You" : m.authorName || m.authorRole} · {timeAgo(m.createdAt)}
              </p>
              <p className="whitespace-pre-wrap">{m.body}</p>
            </div>
          ))}
        </div>
        {openTicket.status !== "closed" && (
          <div className="flex gap-2">
            <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply…" className="min-h-20" aria-label="Reply message" />
            <Button onClick={() => void sendReply()} disabled={!reply.trim()} aria-label="Send reply">
              <Send className="size-4" aria-hidden="true" />
            </Button>
          </div>
        )}
        {openTicket.status !== "closed" && (
          <Button variant="ghost" size="sm" onClick={() => void closeTicket()}>Close ticket</Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Support</h1>
          <p className="text-sm text-muted-foreground">Tickets, SLAs, and self-serve answers.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate({ view: "docs" })}>
            <BookOpen className="size-4" aria-hidden="true" /> Knowledge base
          </Button>
          <Button onClick={() => setCreateOpen(true)}><Plus className="size-4" aria-hidden="true" /> New ticket</Button>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}
      {!tickets && !error && <Spinner label="Loading tickets…" />}
      {tickets && tickets.length === 0 && (
        <EmptyState
          icon={<LifeBuoy className="size-8" />}
          title="No support tickets"
          message="Need help with connections, billing or your account? Browse the knowledge base or open a ticket — Business plans get a 4-hour SLA."
          action={<Button onClick={() => setCreateOpen(true)}>Open your first ticket</Button>}
        />
      )}
      {tickets && tickets.length > 0 && (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {tickets.map((t) => (
            <li key={t.id}>
              <button onClick={() => void openDetail(t)} className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left text-sm hover:bg-accent/30">
                <span className="font-medium">{t.subject}</span>
                <Badge variant="outline" className="capitalize">{t.category}</Badge>
                <Badge variant="outline" className="capitalize">{t.priority}</Badge>
                <Badge variant="outline" className={cn(t.status === "open" && "border-primary/40 text-primary")}>{t.status}</Badge>
                <span className="ml-auto text-xs text-muted-foreground">updated {timeAgo(t.updatedAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New support ticket</DialogTitle>
            <DialogDescription>Describe the issue — include steps to reproduce and your connection region for VPN issues.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="t-subject">Subject</Label>
              <Input id="t-subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={160} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="t-cat">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="t-cat"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["technical", "billing", "account", "abuse", "other"].map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="t-pri">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="t-pri"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["low", "normal", "high", "urgent"].map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="t-msg">Message</Label>
              <Textarea id="t-msg" value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-28" maxLength={4000} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => void create()} disabled={!subject.trim() || !message.trim() || creating}>
              {creating ? "Creating…" : "Create ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
