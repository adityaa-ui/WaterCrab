"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { isFirebaseConfigured, signInWithEmail, signUpWithEmail, signInWithGoogle } from "@/lib/firebase";

type AuthMode = "login" | "signup";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="h-4 w-4"><path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 4.2A10.8 10.8 0 0112 4c5 0 8.7 5.1 9.6 7.1a1.8 1.8 0 010 1.8 18.6 18.6 0 01-3 4.1M6.2 6.2A18.6 18.6 0 002.4 11a1.8 1.8 0 000 1.8C3.3 14.9 7 20 12 20a9.8 9.8 0 004.1-.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="h-4 w-4"><path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="2.7" /></svg>
  );
}

function GoogleIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5a4.7 4.7 0 01-2 3.1v2.5h3.2c1.9-1.8 3.1-4.4 3.1-7.4Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.2-2.5c-.9.6-2 .9-3.5.9-2.7 0-5-1.8-5.8-4.3H2.9v2.6A10 10 0 0012 22Z"/><path fill="#FBBC05" d="M6.2 13.7A6 6 0 016.2 10V7.4H2.9a10 10 0 000 9l3.3-2.7Z"/><path fill="#EA4335" d="M12 6c1.7 0 3.1.6 4.3 1.7l3-3A10 10 0 002.9 7.4l3.3 2.6C7 7.8 9.3 6 12 6Z"/></svg>;
}

export default function AuthModal({ mode, close, onAuthenticated }: { mode: AuthMode; close: () => void; onAuthenticated: (email: string) => void; }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const isSignup = mode === "signup";
  const finishAuthentication = (user: { email?: string | null } | null) => {
    if (!user) return;
    onAuthenticated(user.email || email); close(); router.push("/workspace"); router.refresh();
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      if (!isFirebaseConfigured) throw new Error("Firebase is not configured. Please ensure Firebase keys are defined in your .env.local file.");
      finishAuthentication(isSignup ? await signUpWithEmail(email, password) : await signInWithEmail(email, password));
    } catch (err) { setMessage(err instanceof Error ? err.message : "Authentication failed. Please check your details."); }
    finally { setBusy(false); }
  };
  const loginWithGoogle = async () => {
    setBusy(true); setMessage("");
    try {
      if (!isFirebaseConfigured) throw new Error("Firebase is not configured. Please ensure Firebase keys are defined in your .env.local file.");
      finishAuthentication(await signInWithGoogle());
    } catch (err) { setMessage(err instanceof Error ? err.message : "Google authentication failed."); }
    finally { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[color-mix(in_srgb,var(--color-obsidian)_62%,transparent)] p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={isSignup ? "Sign up" : "Log in"}>
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-[var(--color-foreground)] shadow-[0_28px_80px_rgba(12,10,9,0.3)] sm:p-8">
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent opacity-75" />
        <button onClick={close} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-lg text-[var(--color-foreground-secondary)] transition hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-foreground)]" aria-label="Close">×</button>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">WaterCrab account</p>
        <h2 className="mt-2 font-serif text-3xl leading-tight">{isSignup ? "Create your account" : "Welcome back"}</h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--color-foreground-secondary)]">{isSignup ? "Sign up to start turning the web into structured insight." : "Log in to continue where your research left off."}</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block text-sm font-medium" htmlFor="auth-email">Email address
            <input id="auth-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-2 h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)] outline-none transition placeholder:text-[var(--color-foreground-muted)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-accent)_20%,transparent)]" />
          </label>
          <label className="block text-sm font-medium" htmlFor="auth-password">Password
            <span className="relative mt-2 block"><input id="auth-password" type={showPassword ? "text" : "password"} required minLength={6} autoComplete={isSignup ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] py-2 pl-3 pr-12 text-sm text-[var(--color-foreground)] outline-none transition placeholder:text-[var(--color-foreground-muted)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-accent)_20%,transparent)]" />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-1.5 my-auto inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-[var(--color-foreground-secondary)] transition hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-foreground)]" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}><EyeIcon open={showPassword} /><span>{showPassword ? "Hide" : "Show"}</span></button>
            </span>
          </label>
          {isSignup && <p className="text-xs text-[var(--color-foreground-muted)]">Use at least 6 characters.</p>}
          <button disabled={busy} className="group relative flex h-11 w-full items-center justify-center overflow-hidden rounded-lg bg-[var(--color-foreground)] px-4 text-sm font-semibold text-[var(--color-surface)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"><span>{busy ? "Processing…" : isSignup ? "Create account" : "Log in"}</span><span className="absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--color-tide-teal)] to-transparent opacity-0 transition group-hover:opacity-100" /></button>
        </form>
        <div className="my-6 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-foreground-muted)]"><span className="h-px flex-1 bg-[var(--color-border)]" />or continue with<span className="h-px flex-1 bg-[var(--color-border)]" /></div>
        <button type="button" disabled={busy} onClick={loginWithGoogle} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-sm font-semibold text-[var(--color-foreground)] transition hover:bg-[var(--color-surface-hover)] disabled:cursor-not-allowed disabled:opacity-50"><GoogleIcon />Continue with Google</button>
        {message && <div role="alert" className="mt-4 rounded-lg border border-[color-mix(in_srgb,var(--color-danger)_28%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_9%,transparent)] p-3 text-xs leading-5 text-[var(--color-danger)]">{message}</div>}
      </div>
    </div>
  );
}
