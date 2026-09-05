"use client";

// Auth surfaces (E/F/G): login (with MFA challenge + captcha), register with
// live password validation, password reset request/confirm, email verification,
// OAuth provider buttons with graceful failure handling.
import { useEffect, useMemo, useState } from "react";
import { api, ApiClientError, track, errMsg } from "@/lib/client/api";
import { useApp } from "@/lib/client/store";
import { Logo } from "@/components/product/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, ShieldCheck, MailCheck, KeySquare, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { validatePasswordStrength } from "@/components/product/password-strength";

type Mode = "login" | "register" | "reset" | "verify";

export function AuthView({ mode, token }: { mode: Mode; token?: string }) {
  switch (mode) {
    case "login": return <LoginView />;
    case "register": return <RegisterView />;
    case "reset": return <ResetView token={token} />;
    case "verify": return <VerifyEmailView token={token} />;
  }
}

function AuthShell({ title, subtitle, children, wide }: { title: string; subtitle: string; children: React.ReactNode; wide?: boolean }) {
  const { navigate } = useApp();
  return (
    <section className="flex flex-1 items-center justify-center px-4 py-14" aria-labelledby="auth-title">
      <div className={`w-full ${wide ? "max-w-md" : "max-w-sm"}`}>
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <button onClick={() => navigate({ view: "landing" })} aria-label="AegisVPN home"><Logo size={36} /></button>
          <h1 id="auth-title" className="text-xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {children}
      </div>
    </section>
  );
}

function FieldError({ msg }: { msg?: string | null }) {
  if (!msg) return null;
  return (
    <p className="mt-1 text-xs text-destructive" role="alert">{msg}</p>
  );
}

/* ---------------- Login ---------------- */

function LoginView() {
  const { navigate, setUser } = useApp();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState<{ id: string; question: string } | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [mfaChallenge, setMfaChallenge] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [remember, setRemember] = useState(true);
  const [maskedEmail, setMaskedEmail] = useState("");

  const loadCaptcha = () => {
    api<{ id: string; question: string }>("/api/auth/captcha")
      .then(setCaptcha)
      .catch(() => setCaptcha(null));
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const data = await api<{ mfaRequired?: boolean; challengeToken?: string; maskedEmail?: string; user?: { id: string; email: string; name: string | null; role: string; emailVerified: boolean; mfaEnabled: boolean }; emailUnverified?: boolean }>(
        "/api/auth/login",
        { method: "POST", body: { email, password, captchaId: captcha?.id, captchaAnswer, clientVersion: "1.2.0" }, retries: 0 }
      );
      if (data.mfaRequired && data.challengeToken) {
        setMfaChallenge(data.challengeToken);
        setMaskedEmail(data.maskedEmail || "");
        track("auth_mfa_challenge");
        return;
      }
      if (data.user) {
        setUser(data.user);
        track("auth_success");
        toast({ title: `Welcome back${data.user.name ? ", " + data.user.name : ""}!`, description: "You're signed in." });
        navigate(data.user.role === "admin" ? { view: "admin", tab: "overview" } as const : { view: "app", tab: "overview" } as const);
      }
    } catch (e2) {
      const err2 = e2 as ApiClientError;
      if (err2.details && typeof err2.details === "object" && "captchaRequired" in (err2.details as object)) {
        loadCaptcha();
      }
      setErr(err2.message);
    } finally {
      setBusy(false);
    }
  };

  const submitMfa = async () => {
    setErr(null);
    setBusy(true);
    try {
      const data = await api<{ user: { id: string; email: string; name: string | null; role: string; emailVerified: boolean; mfaEnabled: boolean } }>(
        "/api/auth/verify-login",
        { method: "POST", body: { challengeToken: mfaChallenge, code: mfaCode }, retries: 0 }
      );
      setUser(data.user);
      track("auth_success", { mfa: true });
      toast({ title: "Welcome back!", description: "Two-factor sign-in complete." });
      navigate(data.user.role === "admin" ? { view: "admin", tab: "overview" } as const : { view: "app", tab: "overview" } as const);
    } catch (e2) {
      setErr((e2 as ApiClientError).message);
      setMfaCode("");
    } finally {
      setBusy(false);
    }
  };

  if (mfaChallenge) {
    return (
      <AuthShell title="Two-factor authentication" subtitle={`Enter the 6-digit code from your authenticator app for ${maskedEmail}`}>
        <form onSubmit={(e) => { e.preventDefault(); void submitMfa(); }} className="space-y-4">
          {err && <Alert variant="destructive"><AlertTriangle className="size-4" /><AlertDescription>{err}</AlertDescription></Alert>}
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={mfaCode} onChange={setMfaCode} aria-label="Two-factor code">
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button type="submit" className="w-full" disabled={mfaCode.length !== 6 || busy}>
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />} Verify code
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => setMfaChallenge(null)}>Back to sign in</Button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Sign in" subtitle="Welcome back to your secure workspace.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {err && <Alert variant="destructive"><AlertTriangle className="size-4" /><AlertDescription role="alert">{err}</AlertDescription></Alert>}
        <div>
          <Label htmlFor="login-email">Email</Label>
          <Input id="login-email" type="email" autoComplete="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Password</Label>
            <button type="button" onClick={() => navigate({ view: "reset" })} className="text-xs text-primary hover:underline">
              Forgot password?
            </button>
          </div>
          <Input id="login-password" type="password" autoComplete="current-password" required value={password}
            onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••" />
        </div>
        {captcha && (
          <div>
            <Label htmlFor="captcha-answer">Security check: {captcha.question} = ?</Label>
            <Input id="captcha-answer" inputMode="numeric" value={captchaAnswer} onChange={(e) => setCaptchaAnswer(e.target.value)} placeholder="Answer" />
          </div>
        )}
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} aria-label="Keep me signed in" />
          Keep me signed in for 7 days
        </label>
        <Button type="submit" className="w-full" disabled={busy || !email || !password}>
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />} Sign in
        </Button>
      </form>

      <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground" role="separator">
        <span className="h-px flex-1 bg-border" /> or continue with <span className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {["google", "apple", "microsoft"].map((p) => (
          <Button key={p} variant="outline" size="sm" className="capitalize" onClick={async () => {
            try {
              await api("/api/auth/oauth", { method: "POST", body: { provider: p }, retries: 0 });
            } catch (e2) {
              toast({ title: `${p} unavailable`, description: (e2 as ApiClientError).message });
            }
          }}>
            {p}
          </Button>
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Aegis?{" "}
        <button onClick={() => navigate({ view: "register" })} className="font-medium text-primary hover:underline">Create an account</button>
      </p>
      <div className="mt-4 rounded-lg border bg-card/50 p-3 text-xs text-muted-foreground">
        <p className="mb-1 flex items-center gap-1.5 font-medium text-foreground"><KeySquare className="size-3.5" aria-hidden="true" /> Demo accounts</p>
        <p>Pro user: <code className="font-mono">demo@aegisvpn.io</code> / <code className="font-mono">Demo#Secure2024</code></p>
        <p>Admin: <code className="font-mono">admin@aegisvpn.io</code> / <code className="font-mono">Admin#Secure2024</code></p>
        <p>Free user: <code className="font-mono">free@aegisvpn.io</code> / <code className="font-mono">Free#Secure2024</code></p>
      </div>
    </AuthShell>
  );
}

/* ---------------- Register ---------------- */

function RegisterView() {
  const { navigate, setUser } = useApp();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accept, setAccept] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const strength = useMemo(() => validatePasswordStrength(password), [password]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!accept) { setErr("Please accept the terms and privacy policy to continue."); return; }
    if (strength.score < 3) { setErr(strength.messages[0]); return; }
    setBusy(true);
    try {
      const data = await api<{ user: { id: string; email: string; name: string | null; role: string }; emailUnverified: boolean; devVerificationToken: string }>(
        "/api/auth/register",
        { method: "POST", body: { name, email, password, clientVersion: "1.2.0" }, retries: 0 }
      );
      setUser({ ...data.user, emailVerified: false, mfaEnabled: false });
      track("account_created");
      toast({
        title: "Account created",
        description: data.devVerificationToken
          ? "Dev environment: open Verify from the banner to confirm your email."
          : "Check your inbox to verify your email.",
      });
      navigate({ view: "app", tab: "overview" });
    } catch (e2) {
      setErr((e2 as ApiClientError).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell wide title="Create your account" subtitle="Free forever. No credit card required.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {err && <Alert variant="destructive"><AlertTriangle className="size-4" /><AlertDescription role="alert">{err}</AlertDescription></Alert>}
        <div>
          <Label htmlFor="reg-name">Name (optional)</Label>
          <Input id="reg-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" maxLength={80} />
        </div>
        <div>
          <Label htmlFor="reg-email">Email</Label>
          <Input id="reg-email" type="email" autoComplete="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div>
          <Label htmlFor="reg-password">Password</Label>
          <Input id="reg-password" type="password" autoComplete="new-password" required value={password}
            onChange={(e) => setPassword(e.target.value)} placeholder="10+ chars, mixed case, digit" aria-describedby="pw-strength" />
          <div id="pw-strength" className="mt-2" aria-live="polite">
            <PasswordMeter strength={strength} />
          </div>
        </div>
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <Checkbox checked={accept} onCheckedChange={(v) => setAccept(Boolean(v))} aria-label="Accept terms and privacy policy" className="mt-0.5" />
          <span>
            I agree to the{" "}
            <button type="button" onClick={() => navigate({ view: "legal", doc: "terms" })} className="text-primary hover:underline">Terms</button> and{" "}
            <button type="button" onClick={() => navigate({ view: "legal", doc: "privacy" })} className="text-primary hover:underline">Privacy Policy</button>.
          </span>
        </label>
        <Button type="submit" className="w-full" disabled={busy || !email || !password || !accept}>
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />} Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <button onClick={() => navigate({ view: "login" })} className="font-medium text-primary hover:underline">Sign in</button>
      </p>
    </AuthShell>
  );
}

function PasswordMeter({ strength }: { strength: ReturnType<typeof validatePasswordStrength> }) {
  const colors = ["bg-destructive", "bg-destructive", "bg-warning", "bg-primary", "bg-primary", "bg-primary"];
  const labels = ["Very weak", "Weak", "Fair", "Strong", "Excellent", "Excellent"];
  return (
    <div>
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className={`h-1 flex-1 rounded-full ${i < strength.score ? colors[strength.score] : "bg-border"}`} />
        ))}
      </div>
      <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
        {labels[strength.score]} · {strength.messages[0] || "Meets all requirements."}
      </p>
    </div>
  );
}

/* ---------------- Password reset ---------------- */

function ResetView({ token }: { token?: string }) {
  const { navigate } = useApp();
  const { toast } = useToast();
  const [step, setStep] = useState<"request" | "confirm" | "done">(token ? "confirm" : "request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetToken, setResetToken] = useState(token || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const data = await api<{ sent: boolean; devResetToken?: string }>("/api/auth/password-reset-request", {
        method: "POST", body: { email }, retries: 0,
      });
      if (data.devResetToken) {
        setResetToken(data.devResetToken);
        setStep("confirm");
        toast({ title: "Dev environment", description: "Email delivery is simulated — the reset link is pre-filled below." });
      } else {
        toast({ title: "Check your inbox", description: "If an account exists for that email, a reset link is on its way." });
        setStep("done");
      }
    } catch (e2) {
      setErr((e2 as ApiClientError).message);
    } finally {
      setBusy(false);
    }
  };

  const confirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await api("/api/auth/password-reset-confirm", { method: "POST", body: { token: resetToken, password }, retries: 0 });
      setStep("done");
      toast({ title: "Password reset", description: "All sessions were signed out. Sign in with your new password." });
    } catch (e2) {
      setErr((e2 as ApiClientError).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell wide title={step === "request" ? "Reset your password" : step === "confirm" ? "Choose a new password" : "All set"} subtitle={
      step === "request" ? "We'll email you a secure reset link (expires in 1 hour)."
      : step === "confirm" ? "Your other devices will be signed out for safety."
      : "Your password has been changed."
    }>
      {step === "request" && (
        <form onSubmit={requestReset} className="space-y-4">
          {err && <Alert variant="destructive"><AlertTriangle className="size-4" /><AlertDescription>{err}</AlertDescription></Alert>}
          <div>
            <Label htmlFor="reset-email">Email</Label>
            <Input id="reset-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <Button type="submit" className="w-full" disabled={busy || !email}>
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />} Send reset link
          </Button>
        </form>
      )}
      {step === "confirm" && (
        <form onSubmit={confirmReset} className="space-y-4">
          {err && <Alert variant="destructive"><AlertTriangle className="size-4" /><AlertDescription>{err}</AlertDescription></Alert>}
          <div>
            <Label htmlFor="reset-token">Reset token</Label>
            <Input id="reset-token" value={resetToken} onChange={(e) => setResetToken(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="reset-password">New password</Label>
            <Input id="reset-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="10+ chars, mixed case, digit" />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />} Reset password
          </Button>
        </form>
      )}
      {step === "done" && (
        <div className="space-y-4 text-center">
          <MailCheck className="mx-auto size-10 text-primary" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">You can now sign in with your new password.</p>
          <Button className="w-full" onClick={() => navigate({ view: "login" })}>Go to sign in</Button>
        </div>
      )}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <button onClick={() => navigate({ view: "login" })} className="font-medium text-primary hover:underline">Back to sign in</button>
      </p>
    </AuthShell>
  );
}

/* ---------------- Email verification ---------------- */

function VerifyEmailView({ token }: { token?: string }) {
  const { navigate, user, setUser } = useApp();
  const { toast } = useToast();
  const [state, setState] = useState<"idle" | "verifying" | "verified" | "error">(token ? "verifying" : "idle");
  const [err, setErr] = useState<string | null>(null);
  const [inputToken, setInputToken] = useState(token || "");

  useEffect(() => {
    if (!token) return;
    api("/api/auth/verify-email", { method: "POST", body: { token }, retries: 0 })
      .then(() => {
        setState("verified");
        if (user) setUser({ ...user, emailVerified: true });
        toast({ title: "Email verified", description: "Your address is confirmed. Welcome aboard!" });
      })
      .catch((e) => { setState("error"); setErr(errMsg(e)); });
  }, [token]);

  const resend = async () => {
    try {
      const data = await api<{ sent: boolean; devVerificationToken?: string }>("/api/auth/resend-verification", { method: "POST", body: {}, retries: 0 });
      if (data.devVerificationToken) {
        setInputToken(data.devVerificationToken);
        toast({ title: "Dev environment", description: "Verification token refreshed below." });
      } else {
        toast({ title: "Verification sent", description: "Check your inbox." });
      }
    } catch (e) {
      toast({ title: "Could not resend", description: errMsg(e), variant: "destructive" });
    }
  };

  return (
    <AuthShell title="Email verification" subtitle="Confirm your address to unlock billing and sensitive actions.">
      <div className="space-y-4 text-center">
        <ShieldCheck className="mx-auto size-10 text-primary" aria-hidden="true" />
        {state === "verifying" && <p className="text-sm text-muted-foreground" role="status" aria-live="polite">Verifying…</p>}
        {state === "verified" && (
          <>
            <p className="font-medium">Email verified ✓</p>
            <Button className="w-full" onClick={() => navigate({ view: "app", tab: "overview" })}>Go to dashboard</Button>
          </>
        )}
        {state === "error" && <p className="text-sm text-destructive" role="alert">{err}</p>}
        {state === "idle" && (
          <>
            <div>
              <Label htmlFor="verify-token" className="sr-only">Verification token</Label>
              <Input id="verify-token" value={inputToken} onChange={(e) => setInputToken(e.target.value)} placeholder="Paste your verification token" />
            </div>
            <Button
              className="w-full"
              disabled={!inputToken}
              onClick={async () => {
                try {
                  await api("/api/auth/verify-email", { method: "POST", body: { token: inputToken }, retries: 0 });
                  setState("verified");
                  if (user) setUser({ ...user, emailVerified: true });
                } catch (e) {
                  setErr(errMsg(e)); setState("error");
                }
              }}
            >
              Verify
            </Button>
            <Button variant="ghost" className="w-full" onClick={resend}>Resend verification email</Button>
          </>
        )}
      </div>
    </AuthShell>
  );
}
