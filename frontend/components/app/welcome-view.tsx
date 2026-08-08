'use client';

import React from 'react';
import { Mic, PhoneCall, RotateCcw, ShieldCheck, Landmark, ShieldAlert, HeartHandshake, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgentStatusBadge } from '@/components/app/agent-status-badge';

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
  hasCallEnded?: boolean;
}

export const WelcomeView = ({
  startButtonText,
  onStartCall,
  hasCallEnded = false,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  return (
    <div ref={ref} className="relative flex flex-col items-center justify-center w-full min-h-svh px-4 pt-24 pb-10 md:pt-28 md:pb-12 overflow-y-auto">
      {/* Background ambient lighting glows */}
      <div className="absolute -z-10 size-96 rounded-full bg-emerald-500/15 blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute -z-10 size-80 rounded-full bg-cyan-500/15 blur-[100px] pointer-events-none translate-x-12 translate-y-12" />

      <section className="relative z-10 flex flex-col items-center text-center max-w-md w-full space-y-5">
        {/* Glowing Voice Orb */}
        <div className="relative z-10 group flex items-center justify-center my-1">
          {/* Dual animated neon glow rings */}
          <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 blur-xl opacity-50 group-hover:opacity-85 transition-opacity duration-500 animate-tilt" />
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-md animate-ping duration-1000 opacity-40" />

          {/* Core Orb Container */}
          <div className="relative flex size-28 items-center justify-center rounded-full bg-slate-950/80 border border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.3)] backdrop-blur-2xl transition-transform duration-300 group-hover:scale-105">
            {hasCallEnded ? (
              <RotateCcw className="size-10 text-emerald-400/80 animate-spin-slow" />
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-8 bg-emerald-400 rounded-full animate-bounce delay-75 shadow-[0_0_10px_#34d399]" />
                <span className="w-1.5 h-12 bg-teal-400 rounded-full animate-bounce delay-150 shadow-[0_0_12px_#2dd4bf]" />
                <span className="w-1.5 h-9 bg-cyan-400 rounded-full animate-bounce delay-300 shadow-[0_0_10px_#38bdf8]" />
                <span className="w-1.5 h-6 bg-emerald-300 rounded-full animate-bounce delay-100 shadow-[0_0_8px_#6ee7b7]" />
              </div>
            )}
          </div>
        </div>

        {/* State Badge */}
        <AgentStatusBadge
          state={hasCallEnded ? 'ended' : 'ready'}
          showSubtitle
        />

        {/* Main Heading & Tagline */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent drop-shadow-sm">
            {hasCallEnded ? 'Session Completed' : 'FinGuard Voice Assistant'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
            {hasCallEnded
              ? 'Your financial voice session has ended. Click below whenever you are ready to start a new conversation.'
              : 'Your voice-guided helper for basic banking, government schemes, and financial scam protection in Hindi & English.'}
          </p>
        </div>

        {/* Single Clear Primary Action Button */}
        <div className="w-full pt-1">
          <Button
            size="lg"
            onClick={onStartCall}
            className="w-full sm:w-80 h-13 rounded-full font-bold text-sm tracking-wider uppercase transition-all duration-300 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] hover:scale-[1.03] active:scale-[0.98] border-none gap-2.5"
          >
            {hasCallEnded ? (
              <>
                <RotateCcw className="size-4" />
                Start New Call
              </>
            ) : (
              <>
                <PhoneCall className="size-4 fill-slate-950" />
                {startButtonText || 'Start Financial Safety Call'}
              </>
            )}
          </Button>
        </div>

        {/* Premium Glassmorphism Feature Cards */}
        <div className="pt-4 grid grid-cols-3 gap-3 w-full border-t border-slate-800/80 text-left">
          <div className="flex flex-col items-start gap-1.5 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl hover:border-emerald-500/40 hover:bg-slate-900/80 transition-all shadow-lg group">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
              <Landmark className="size-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-200 leading-tight">Government Schemes</span>
          </div>

          <div className="flex flex-col items-start gap-1.5 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl hover:border-teal-500/40 hover:bg-slate-900/80 transition-all shadow-lg group">
            <div className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 group-hover:scale-110 transition-transform">
              <HeartHandshake className="size-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-200 leading-tight">Basic Banking</span>
          </div>

          <div className="flex flex-col items-start gap-1.5 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl hover:border-cyan-500/40 hover:bg-slate-900/80 transition-all shadow-lg group">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
              <ShieldAlert className="size-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-200 leading-tight">Scam Safety</span>
          </div>
        </div>

        {/* Sample Voice Prompts */}
        <div className="w-full pt-1 space-y-2 text-left">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center flex items-center justify-center gap-1">
            <Sparkles className="size-3 text-emerald-400" />
            Try asking things like:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="text-[11px] px-3 py-1.5 rounded-full bg-slate-900/70 border border-emerald-500/30 text-emerald-300 font-medium hover:border-emerald-400 transition-colors shadow-sm cursor-pointer">
              "PM Kisan Yojana ki eligibility kya hai?"
            </span>
            <span className="text-[11px] px-3 py-1.5 rounded-full bg-slate-900/70 border border-teal-500/30 text-teal-300 font-medium hover:border-teal-400 transition-colors shadow-sm cursor-pointer">
              "UPI PIN share karna safe hai ya nahi?"
            </span>
            <span className="text-[11px] px-3 py-1.5 rounded-full bg-slate-900/70 border border-cyan-500/30 text-cyan-300 font-medium hover:border-cyan-400 transition-colors shadow-sm cursor-pointer">
              "Fake call identify kaise karein?"
            </span>
          </div>
        </div>
      </section>

      {/* Security notice */}
      <div className="mt-8 text-center max-w-xs">
        <p className="text-slate-400 text-[11px] leading-relaxed flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/50 border border-slate-800">
          <ShieldCheck className="size-3.5 text-emerald-400 shrink-0" />
          <span>FinGuard will never ask for OTP, PIN, password, or CVV.</span>
        </p>
      </div>
    </div>
  );
};
