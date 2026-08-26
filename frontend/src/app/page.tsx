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
import PipelineTool from './components/PipelineTool';
import AuthModal from './components/AuthModal';
import {
  IconBrandGithub,
  IconBrandLinkedin,
  IconBriefcase,
} from "@tabler/icons-react";
import { subscribeToAuthChanges, logoutFirebase } from '@/lib/firebase';

export default function Home() {
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setUserEmail(user?.email ?? null);
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await logoutFirebase();
    setUserEmail(null);
    setShowSearchResults(false);
  };

  return (
    <div className="min-h-screen bg-[var(--color-warm-bone)] text-[var(--color-charcoal)] antialiased">

      {/* Sticky Header navigation */}
      <Header onLogin={() => setAuthMode('login')} onSignUp={() => setAuthMode('signup')} userEmail={userEmail ?? undefined} onLogout={logout} />

      {/* Hero Banner with animated background grid (outside main for full bleed) */}
      <HeroSection onResultsChange={setShowSearchResults} />

      {/* Main Page Layout Wrapper */}
      {!showSearchResults && (
        <main className="relative z-10 mx-auto max-w-[1200px] px-6 pb-20 pt-12">
          {/* Live product pipeline (#pipeline) */}
          <PipelineTool initialUrl={undefined} />

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
        </main>
      )}

      {/* Page Footer */}
      <footer className="border-t border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] py-8 font-mono text-[10px] tracking-wider uppercase text-[var(--color-bark-grey)]">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <span>© {new Date().getFullYear()} WATERCRAB LABS. ALL RIGHTS RESERVED.</span>
          <div className="flex items-center gap-4 text-[9px] md:text-[10px]">
  <a
    href="https://github.com/adityaa-ui"
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
  >
    <IconBrandGithub className="h-3.5 w-3.5" />
    <span>GITHUB</span>
  </a>

  <span className="text-[var(--color-pebble)]">•</span>

  <a
    href="https://www.linkedin.com/in/adityasinghdex"
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
  >
    <IconBrandLinkedin className="h-3.5 w-3.5" />
    <span>LINKEDIN</span>
  </a>

  <span className="text-[var(--color-pebble)]">•</span>

  <a
    href="https://adiityaui.vercel.app/"
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
  >
    <IconBriefcase className="h-3.5 w-3.5" />
    <span>PORTFOLIO</span>
  </a>
</div>
        </div>
      </footer>
      {authMode && <AuthModal mode={authMode} close={() => setAuthMode(null)} onAuthenticated={email => setUserEmail(email)} />}
    </div>
  );
}
