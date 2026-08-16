"use client";
import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import FeatureGrid from './components/FeatureGrid';
import StatsBar from './components/StatsBar';
import LogoMarquee from './components/LogoMarquee';
import FeatureShowcase from './components/FeatureShowcase';
import ProjectsSection from './components/ProjectsSection';
import AgenticGrid from './components/AgenticGrid';
import AuthModal from './components/AuthModal';
import { createClient as createBrowserClient } from '@/lib/supabase/client';

export default function Home() {
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUserEmail(session?.user.email ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await createBrowserClient().auth.signOut();
    setUserEmail(null); setShowSearchResults(false);
  };

  return (
    <div className="min-h-screen bg-[var(--color-warm-bone)] text-[var(--color-charcoal)] antialiased">

      {/* Sticky Header navigation */}
      <Header onLogin={() => setAuthMode('login')} onSignUp={() => setAuthMode('signup')} userEmail={userEmail ?? undefined} onLogout={logout} />

      <>
      {/* Hero Banner with animated background grid (outside main for full bleed) */}
      <HeroSection onResultsChange={setShowSearchResults} />

      {/* Main Page Layout Wrapper */}
      {!showSearchResults && <main className="relative z-10 mx-auto max-w-[1200px] px-6 pb-20 pt-12">
        
        {/* Feature Highlights Grid */}
        <FeatureGrid />

        {/* Numeric credibility metrics bar */}
        <StatsBar />

        {/* Continuous horizontal scrolling brands marquee */}
        <LogoMarquee />

        {/* Numbered visual accordion workflows (#01, #02, #03) */}
        <FeatureShowcase />

        {/* Multi-tenant environment mock selector */}
        <ProjectsSection />

        {/* Grid showing zero-config integrations */}
        <AgenticGrid />

      </main>}</>

      {/* Page Footer */}
      <footer className="border-t border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] py-8 font-mono text-[10px] tracking-wider uppercase text-[var(--color-bark-grey)]">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <span>© {new Date().getFullYear()} WATERCRAB LABS. ALL RIGHTS RESERVED.</span>
          <div className="flex items-center gap-4 text-[9px] md:text-[10px]">
            <span>BYOK CLIENT</span>
            <span className="text-[var(--color-pebble)]">•</span>
            <span>RENDER DEPLOYED</span>
            <span className="text-[var(--color-pebble)]">•</span>
            <span>PLAYWRIGHT DRIVER</span>
          </div>
        </div>
      </footer>
      {authMode && <AuthModal mode={authMode} close={() => setAuthMode(null)} onAuthenticated={email => setUserEmail(email)} />}
    </div>
  );
}
