"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

export default function AuthModal({ mode, close, onAuthenticated }: { mode: AuthMode; close: () => void; onAuthenticated: (email: string) => void }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true); setMessage("");
    const supabase = createBrowserClient();
    const response = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/workspace` } });
    setBusy(false);
    if (response.error) { setMessage(response.error.message); return; }
    if (mode === "signup" && !response.data.session) { setMessage("Check your email to confirm your account, then log in."); return; }
    onAuthenticated(response.data.user?.email || email); close(); router.push("/workspace"); router.refresh();
  };

  const loginWithGoogle = async () => {
    setBusy(true); setMessage("");
    try {
      const { error } = await createBrowserClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?next=/workspace` } });
      if (error) setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(12,10,9,0.48)] p-5" role="dialog" aria-modal="true" aria-label={mode === "login" ? "Log in" : "Sign up"}><div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-2xl text-[var(--color-foreground)]"><button onClick={close} className="float-right text-xl text-[var(--color-bark-grey)]" aria-label="Close">×</button><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-electric-indigo)]">WaterCrab account</p><h2 className="mt-2 text-2xl font-semibold">{mode === "login" ? "Welcome back" : "Create your account"}</h2><p className="mt-2 text-sm text-[var(--color-bark-grey)]">Use email and password, or continue with Google.</p><button type="button" disabled={busy} onClick={loginWithGoogle} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-stone-mist)] px-4 py-3 text-sm font-semibold hover:bg-[var(--color-warm-bone)] disabled:opacity-50"><span className="text-base font-bold text-[#4285F4]">G</span> Continue with Google</button><div className="my-5 flex items-center gap-3 text-xs text-[var(--color-pebble)]"><span className="h-px flex-1 bg-[var(--color-stone-mist)]" />or<span className="h-px flex-1 bg-[var(--color-stone-mist)]" /></div><form onSubmit={submit} className="space-y-3"><input type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="Email address" className="w-full rounded-lg border border-[var(--color-stone-mist)] px-3 py-3 text-sm outline-none focus:border-[var(--color-electric-indigo)]" /><input type="password" required minLength={6} value={password} onChange={event => setPassword(event.target.value)} placeholder="Password" className="w-full rounded-lg border border-[var(--color-stone-mist)] px-3 py-3 text-sm outline-none focus:border-[var(--color-electric-indigo)]" /><button disabled={busy} className="w-full rounded-lg bg-[var(--color-electric-indigo)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--color-deep-violet)] disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}</button></form>{message && <p className="mt-4 text-sm text-[var(--color-bark-grey)]">{message}</p>}</div></div>;
}
