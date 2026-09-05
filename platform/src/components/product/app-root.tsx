"use client";

// App root: hash router, global chrome, maintenance & offline banners,
// footer (sticky per layout rules), theme toggle, notification center mount.
import { useEffect } from "react";
import { useApp, syncRouteFromHash } from "@/lib/client/store";
import { useSessionEventGlobally, useGlobalListeners } from "@/components/product/app-globals";
import { PublicHeader } from "@/components/product/public-header";
import { LandingView, PricingView, SecurityView, DownloadsView } from "@/components/product/public-site";
import { StatusView, LegalView, DocsView } from "@/components/product/info-pages";
import { AuthView } from "@/components/product/auth-view";
import { DashboardView } from "@/components/product/dashboard";
import { AdminView } from "@/components/product/admin-view";
import { Logo, OfflineBanner } from "@/components/product/ui-bits";
import { Sun, Moon, ShieldCheck } from "lucide-react";

export function AppRoot() {
  const route = useApp((s) => s.route);
  const theme = useApp((s) => s.theme);
  const toggleTheme = useApp((s) => s.toggleTheme);
  const hydrate = useApp((s) => s.hydrate);
  const offline = useApp((s) => s.offline);

  useSessionEventGlobally();
  useGlobalListeners();

  useEffect(() => {
    void hydrate();
    const onHash = () => syncRouteFromHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [hydrate]);

  const isProduct = route.view === "app" || route.view === "admin";
  const isAuth = ["login", "register", "reset", "verify-email"].includes(route.view);

  return (
    <div className="flex min-h-screen flex-col">
      <OfflineBanner visible={offline} />
      {!isProduct && <PublicHeader showAuthCta={!isAuth} />}
      <main id="main-content" className="flex-1 flex flex-col" role="main">
        {route.view === "landing" && <LandingView />}
        {route.view === "pricing" && <PricingView />}
        {route.view === "security" && <SecurityView />}
        {route.view === "downloads" && <DownloadsView />}
        {route.view === "status" && <StatusView />}
        {route.view === "legal" && <LegalView doc={route.doc} />}
        {route.view === "docs" && <DocsView slug={route.slug} />}
        {route.view === "login" && <AuthView mode="login" />}
        {route.view === "register" && <AuthView mode="register" />}
        {route.view === "reset" && <AuthView mode="reset" token={route.token} />}
        {route.view === "verify-email" && <AuthView mode="verify" token={route.token} />}
        {route.view === "app" && <DashboardView />}
        {route.view === "admin" && <AdminView />}
      </main>
      {!isProduct && !isAuth && <PublicFooter theme={theme} onToggleTheme={toggleTheme} />}
    </div>
  );
}

function PublicFooter({ theme, onToggleTheme }: { theme: "light" | "dark"; onToggleTheme: () => void }) {
  const { navigate } = useApp();
  const col = (title: string, links: Array<[string, () => void]>) => (
    <div>
      <p className="mb-2 text-sm font-semibold">{title}</p>
      <ul className="space-y-1.5">
        {links.map(([label, onClick]) => (
          <li key={label}>
            <button onClick={onClick} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <footer className="mt-auto border-t bg-card/40 safe-bottom" role="contentinfo">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Privacy that follows you everywhere. Independently audited, zero-traffic-log VPN built on WireGuard®.
          </p>
          <button
            onClick={onToggleTheme}
            className="mt-4 inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
            {theme === "dark" ? "Light" : "Dark"} mode
          </button>
        </div>
        {col("Product", [
          ["Pricing", () => navigate({ view: "pricing" })],
          ["Download apps", () => navigate({ view: "downloads" })],
          ["Server status", () => navigate({ view: "status" })],
          ["Security architecture", () => navigate({ view: "security" })],
        ])}
        {col("Resources", [
          ["Documentation", () => navigate({ view: "docs" })],
          ["Troubleshooting", () => navigate({ view: "docs", slug: "troubleshooting-connection" })],
          ["Knowledge base", () => navigate({ view: "docs" })],
          ["Chrome extension", () => navigate({ view: "downloads" })],
        ])}
        {col("Legal", [
          ["Privacy policy", () => navigate({ view: "legal", doc: "privacy" })],
          ["Terms of service", () => navigate({ view: "legal", doc: "terms" })],
          ["Acceptable use", () => navigate({ view: "legal", doc: "aup" })],
          ["Logging policy", () => navigate({ view: "legal", doc: "logging" })],
          ["Refund policy", () => navigate({ view: "legal", doc: "refund" })],
        ])}
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} AegisVPN Labs. WireGuard is a registered trademark of Jason A. Donenfeld.</p>
          <p className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" aria-hidden="true" /> Built for the 1,400-requirement production inventory
          </p>
        </div>
      </div>
    </footer>
  );
}
