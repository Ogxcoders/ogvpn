"use client";

// Public site header: navigation, mobile menu (overlay rules: backdrop,
// Escape, focus, scroll containment), auth CTAs, notification bell.
import { useEffect, useRef } from "react";
import { useApp } from "@/lib/client/store";
import { Logo } from "@/components/product/ui-bits";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Menu, Bell, X } from "lucide-react";
import { NotificationBell } from "@/components/product/notification-bell";

const NAV: Array<[string, "pricing" | "security" | "downloads" | "status" | "docs"]> = [
  ["Pricing", "pricing"],
  ["Security", "security"],
  ["Downloads", "downloads"],
  ["Status", "status"],
  ["Docs", "docs"],
];

export function PublicHeader({ showAuthCta = true }: { showAuthCta?: boolean }) {
  const { navigate, user, mobileMenuOpen, setMobileMenu } = useApp();
  const go = (v: Parameters<typeof navigate>[0]) => () => navigate(v);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70" role="banner">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <button onClick={go({ view: "landing" })} aria-label="AegisVPN home" className="rounded-md">
          <Logo />
        </button>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map(([label, view]) => (
            <button
              key={view}
              onClick={go({ view } as never)}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user && <NotificationBell />}
          {showAuthCta && !user && (
            <>
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={go({ view: "login" })}>
                Sign in
              </Button>
              <Button size="sm" onClick={go({ view: "register" })}>
                Get Aegis free
              </Button>
            </>
          )}
          {user && (
            <Button size="sm" onClick={go({ view: "app", tab: "overview" })}>
              Open dashboard
            </Button>
          )}
          <button
            className="inline-flex size-9 items-center justify-center rounded-md border md:hidden"
            onClick={() => setMobileMenu(true)}
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="size-4" />
          </button>
        </div>
      </div>

      {/* Mobile menu — backdrop dismissal, Escape, visible close, scroll containment (T 451-473) */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenu}>
        <SheetContent side="right" className="w-72 overflow-y-auto scroll-contain" role="dialog" aria-modal="true" aria-label="Site menu">
          <SheetHeader className="flex-row items-center justify-between border-b pb-3">
            <SheetTitle>
              <Logo />
            </SheetTitle>
            <button
              onClick={() => setMobileMenu(false)}
              aria-label="Close menu"
              className="inline-flex size-8 items-center justify-center rounded-md border"
            >
              <X className="size-4" />
            </button>
          </SheetHeader>
          <nav className="mt-2 flex flex-col gap-1" aria-label="Mobile">
            {NAV.map(([label, view]) => (
              <button
                key={view}
                onClick={go({ view } as never)}
                className="rounded-md px-3 py-2.5 text-left text-sm font-medium hover:bg-accent"
              >
                {label}
              </button>
            ))}
            <div className="my-2 border-t" />
            {!user ? (
              <>
                <Button variant="outline" className="w-full" onClick={go({ view: "login" })}>Sign in</Button>
                <Button className="mt-2 w-full" onClick={go({ view: "register" })}>Get Aegis free</Button>
              </>
            ) : (
              <>
                <Button className="mt-2 w-full" onClick={go({ view: "app", tab: "overview" })}>Open dashboard</Button>
                <Button variant="outline" className="mt-2 w-full" onClick={go({ view: "status" })}>Server status</Button>
              </>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}

export function useEscapeClose(open: boolean, onClose: () => void) {
  const ref = useRef(onClose);
  useEffect(() => {
    ref.current = onClose;
  }, [onClose]);
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") ref.current();
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [open]);
}
