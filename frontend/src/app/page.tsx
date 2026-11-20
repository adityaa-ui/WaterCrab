"use client";
import { Analytics } from "@vercel/analytics/next";
import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import FamilyValuesSection from './components/FamilyValuesSection';
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
  IconArrowUpRight,
  IconSparkles
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
    <div className="min-h-screen bg-[var(--color-warm-bone)] text-[var(--color-charcoal)] antialiased selection:bg-[#FF5C38]/20">

      {/* Floating Capsule Header Navigation */}
      <Header 
        onLogin={() => setAuthMode('login')} 
        onSignUp={() => setAuthMode('signup')} 
        userEmail={userEmail ?? undefined} 
        onLogout={logout} 
      />
      <Analytics />

      {/* Family-style Hero Banner */}
      <HeroSection onResultsChange={setShowSearchResults} />

      {/* Main Content Layout */}
      {!showSearchResults && (
        <main className="relative z-10 mx-auto max-w-[1140px] px-6 pb-24">
          
          {/* Continuous scrolling brands marquee */}
          <LogoMarquee />

          {/* Interactive Live Playground (#pipeline) */}
          <div className="my-16">
            <PipelineTool initialUrl={undefined} />
          </div>

          {/* Family Values (Simplicity, Fluidity, Delight) */}
          <FamilyValuesSection />

          {/* Core Architecture Bento Grid */}
          <FeatureGrid />

          {/* Numeric credibility metrics card */}
          <StatsBar />

          {/* Numbered visual accordion workflows (#01, #02, #03) */}
          <FeatureShowcase />

          {/* Multi-tenant environment mock selector */}
          <ProjectsSection />

          {/* Zero-config ecosystem integrations */}
          <AgenticGrid />
        </main>
      )}

      {/* Grand Family.co Signature Footer */}
      <footer className="border-t border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] pt-16 pb-12">
        <div className="mx-auto max-w-[1140px] px-6">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            
            {/* Left brand info */}
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#FF5C38] text-white font-bold text-xs">
                  W
                </div>
                <span className="text-lg font-bold tracking-tight text-[var(--color-charcoal)]">
                  WaterCrab
                </span>
              </div>
              <p className="mt-2 max-w-sm text-xs text-[var(--color-bark-grey)]">
                The web scraping and structured extraction engine designed for modern AI developer workflows.
              </p>
            </div>

            {/* Right Quick Links */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://github.com/adityaa-ui"
                target="_blank"
                rel="noopener noreferrer"
                className="family-pill hover:scale-105"
              >
                <IconBrandGithub className="h-4 w-4 text-[#FF5C38]" />
                <span>GitHub</span>
                <IconArrowUpRight className="h-3 w-3 opacity-60" />
              </a>

              <a
                href="https://www.linkedin.com/in/adityasinghdex"
                target="_blank"
                rel="noopener noreferrer"
                className="family-pill hover:scale-105"
              >
                <IconBrandLinkedin className="h-4 w-4 text-[#5B5BD6]" />
                <span>LinkedIn</span>
                <IconArrowUpRight className="h-3 w-3 opacity-60" />
              </a>

              <a
                href="https://adiityaui.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="family-pill hover:scale-105"
              >
                <IconBriefcase className="h-4 w-4 text-[#10B981]" />
                <span>Portfolio</span>
                <IconArrowUpRight className="h-3 w-3 opacity-60" />
              </a>
            </div>
          </div>

          {/* Giant Family-Style Brand Typography */}
          <div className="mt-16 select-none border-t border-[var(--color-stone-mist)] pt-8 text-center">
            <span className="font-extrabold tracking-tighter text-[var(--color-stone-mist)] text-[64px] sm:text-[100px] md:text-[140px] lg:text-[170px] leading-none block">
              WATERCRAB
            </span>
          </div>

          <div className="mt-6 flex flex-col items-center justify-between gap-4 text-xs font-medium text-[var(--color-stone)] sm:flex-row">
            <span>© {new Date().getFullYear()} WaterCrab Labs. Inspired by Family.co & Benji Taylor.</span>
            <span>All systems operational · v2.4</span>
          </div>
        </div>
      </footer>

      {authMode && (
        <AuthModal 
          mode={authMode} 
          close={() => setAuthMode(null)} 
          onAuthenticated={email => setUserEmail(email)} 
        />
      )}
    </div>
  );
}
