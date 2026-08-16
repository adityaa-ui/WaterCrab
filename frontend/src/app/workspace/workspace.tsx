"use client";

import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import PdfUpload from "@/app/components/PdfUpload";
import { createClient } from "@/lib/supabase/client";

export default function Workspace({ email }: { email: string }) {
  const router = useRouter();

  const logout = async () => {
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  };

  return <div className="min-h-screen bg-[var(--color-warm-bone)] text-[var(--color-charcoal)] antialiased"><Header onLogin={() => {}} onSignUp={() => {}} userEmail={email} onLogout={logout} /><PdfUpload /></div>;
}
