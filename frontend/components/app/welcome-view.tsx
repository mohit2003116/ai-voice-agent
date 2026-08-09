'use client';

import React, { useState } from 'react';
import {
  Mic,
  PhoneCall,
  RotateCcw,
  ShieldCheck,
  Landmark,
  ShieldAlert,
  HeartHandshake,
  Sparkles,
  Database,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { AgentStatusBadge } from '@/components/app/agent-status-badge';
import { HistoryModal } from '@/components/app/history-modal';
import { FeedbackForm } from '@/components/app/feedback-form';

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
  hasCallEnded?: boolean;
}

/* ─── Voice Orb ──────────────────────────────────────────── */
function VoiceOrb({ hasCallEnded }: { hasCallEnded: boolean }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
      {/* Outermost ring — slow pulse */}
      <div
        className="absolute rounded-full border border-emerald-500/15 animate-orb-ring-pulse"
        style={{ width: 196, height: 196 }}
      />
      {/* Middle ring */}
      <div
        className="absolute rounded-full border border-emerald-500/25 animate-orb-ring-mid"
        style={{ width: 168, height: 168 }}
      />
      {/* Inner ring + glow */}
      <div
        className="absolute rounded-full border border-emerald-500/40"
        style={{ width: 140, height: 140, boxShadow: '0 0 30px rgba(16,185,129,0.18), 0 0 60px rgba(16,185,129,0.08)' }}
      />

      {/* Core orb */}
      <div
        className="relative flex items-center justify-center rounded-full bg-[#05070A] animate-orb-glow"
        style={{
          width: 116,
          height: 116,
          border: '1.5px solid rgba(16,185,129,0.35)',
          boxShadow: hasCallEnded
            ? '0 0 20px rgba(16,185,129,0.1), inset 0 0 20px rgba(16,185,129,0.03)'
            : '0 0 40px rgba(16,185,129,0.3), 0 0 80px rgba(16,185,129,0.1), inset 0 0 30px rgba(16,185,129,0.05)',
        }}
      >
        {hasCallEnded ? (
          /* Call ended — dim rotate icon */
          <RotateCcw className="size-9 text-emerald-500/50 animate-spin-slow" />
        ) : (
          /* Ready — microphone + static waveform bars */
          <div className="flex flex-col items-center gap-2">
            <Mic className="size-7 text-emerald-400" strokeWidth={1.8} />
            {/* Mini waveform underneath mic */}
            <div className="flex items-end gap-0.5" style={{ height: 18 }}>
              {[6, 12, 8, 14, 10, 8, 5].map((h, i) => (
                <span
                  key={i}
                  className="rounded-full bg-emerald-400/50 animate-wave-bar"
                  style={{
                    width: 3,
                    height: h,
                    animationDelay: `${i * 110}ms`,
                    animationDuration: '1.1s',
                    transformOrigin: 'bottom',
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Ambient inner glow */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 140,
          height: 140,
          background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}

/* ─── Feature Card ───────────────────────────────────────── */
function FeatureCard({
  num,
  icon,
  title,
  desc,
  accentColor,
}: {
  num: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  accentColor: 'emerald' | 'teal' | 'cyan';
}) {
  const borderHover = {
    emerald: 'hover:border-emerald-500/35 hover:shadow-[0_0_20px_rgba(16,185,129,0.08)]',
    teal: 'hover:border-teal-500/35 hover:shadow-[0_0_20px_rgba(45,212,191,0.08)]',
    cyan: 'hover:border-cyan-500/35 hover:shadow-[0_0_20px_rgba(34,211,238,0.08)]',
  }[accentColor];

  const iconBg = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    teal: 'bg-teal-500/10 border-teal-500/20 text-teal-400',
    cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
  }[accentColor];

  const numColor = {
    emerald: 'text-emerald-500/40',
    teal: 'text-teal-500/40',
    cyan: 'text-cyan-500/40',
  }[accentColor];

  return (
    <div
      className={`group relative flex flex-col gap-3 p-5 rounded-2xl fg-glass fg-glass-hover border border-white/6 transition-all duration-300 ${borderHover}`}
    >
      {/* Number */}
      <span className={`text-xs font-bold font-mono tracking-widest ${numColor}`}>{num}</span>

      {/* Icon */}
      <div className={`w-fit p-2 rounded-xl border ${iconBg} group-hover:scale-110 transition-transform duration-200`}>
        {icon}
      </div>

      {/* Text */}
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-white leading-tight">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ─── Main Welcome View ──────────────────────────────────── */
export const WelcomeView = ({
  startButtonText,
  onStartCall,
  hasCallEnded = false,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  return (
    <div
      ref={ref}
      className="relative flex flex-col items-center w-full min-h-svh px-4 pt-20 pb-16 md:pt-24 md:pb-20"
    >
      {/* ── Top-right: History Button ── */}
      <div className="absolute top-[68px] right-4 z-20">
        <button
          onClick={() => setHistoryModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl fg-glass border border-white/8 hover:border-emerald-500/30 text-slate-400 hover:text-emerald-400 text-xs font-semibold transition-all duration-200 hover:scale-105"
        >
          <Database className="size-3.5 text-emerald-500/70" />
          <span className="hidden sm:inline">Call History</span>
        </button>
      </div>

      {/* ════════════════════════════════════════════
          HERO SECTION
      ════════════════════════════════════════════ */}
      <section className="relative z-10 flex flex-col items-center text-center w-full max-w-2xl mx-auto pt-6 md:pt-10">

        {/* Hero heading */}
        {!hasCallEnded && (
          <div className="mb-6 space-y-3 animate-fade-in-up">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
              Your Financial Safety,
              <br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #34d399 40%, #22d3ee 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                One Conversation Away.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto leading-relaxed font-normal">
              Get simple guidance on banking, government schemes, and financial scam awareness — through voice.
            </p>
          </div>
        )}

        {/* Call Ended heading */}
        {hasCallEnded && (
          <div className="mb-6 space-y-2 animate-fade-in-up">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Session Completed
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
              Your financial voice session has ended. Start a new conversation whenever you're ready.
            </p>
          </div>
        )}

        {/* ── VOICE ORB ── */}
        <div className="my-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <VoiceOrb hasCallEnded={hasCallEnded} />
        </div>

        {/* State badge */}
        <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <AgentStatusBadge state={hasCallEnded ? 'ended' : 'ready'} showSubtitle />
        </div>

        {/* ── PRIMARY CTA BUTTON ── */}
        <div className="w-full flex justify-center mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={onStartCall}
            className="group relative flex items-center justify-center gap-2.5 rounded-full font-bold text-sm tracking-wide uppercase transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
            style={{
              width: '100%',
              maxWidth: 340,
              height: 52,
              background: 'linear-gradient(135deg, #10b981 0%, #0d9488 50%, #06b6d4 100%)',
              boxShadow: '0 0 30px rgba(16,185,129,0.35), 0 4px 24px rgba(16,185,129,0.2)',
              color: '#05070A',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.transform = 'scale(1.03)';
              el.style.boxShadow = '0 0 50px rgba(16,185,129,0.55), 0 6px 30px rgba(16,185,129,0.3)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.transform = 'scale(1)';
              el.style.boxShadow = '0 0 30px rgba(16,185,129,0.35), 0 4px 24px rgba(16,185,129,0.2)';
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
          >
            {hasCallEnded ? (
              <>
                <RotateCcw className="size-4" />
                Start Again
              </>
            ) : (
              <>
                <PhoneCall className="size-4" strokeWidth={2.5} />
                {startButtonText || 'Start Financial Safety Call'}
              </>
            )}
          </button>
        </div>

        {/* Post-call feedback */}
        {hasCallEnded && (
          <div className="w-full max-w-sm mb-10 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <FeedbackForm />
          </div>
        )}
      </section>

      {/* ════════════════════════════════════════════
          FEATURE CARDS SECTION
      ════════════════════════════════════════════ */}
      <section className="relative z-10 w-full max-w-2xl mx-auto mb-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FeatureCard
            num="01"
            icon={<Landmark className="size-5" strokeWidth={1.8} />}
            title="Government Schemes"
            desc="Understand eligibility and basic scheme information."
            accentColor="emerald"
          />
          <FeatureCard
            num="02"
            icon={<HeartHandshake className="size-5" strokeWidth={1.8} />}
            title="Basic Banking"
            desc="Get simple explanations for common banking questions."
            accentColor="teal"
          />
          <FeatureCard
            num="03"
            icon={<ShieldAlert className="size-5" strokeWidth={1.8} />}
            title="Scam Safety"
            desc="Learn how to identify suspicious calls, messages and requests."
            accentColor="cyan"
          />
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECURITY CARD
      ════════════════════════════════════════════ */}
      <section className="relative z-10 w-full max-w-2xl mx-auto mb-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <div
          className="relative overflow-hidden rounded-2xl fg-glass border border-white/8 p-5"
          style={{ boxShadow: '0 0 30px rgba(16,185,129,0.04)' }}
        >
          {/* Top accent strip */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: 'linear-gradient(90deg, #10b981, #0d9488, #22d3ee)' }}
          />

          <div className="flex items-start gap-4">
            {/* Shield icon */}
            <div className="flex-shrink-0 flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <ShieldCheck className="size-5 text-emerald-400" strokeWidth={1.8} />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Your security comes first.
                <Lock className="size-3.5 text-emerald-500/60" />
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                FinGuard will{' '}
                <span className="font-bold text-white">NEVER</span> ask for your{' '}
                <span className="text-emerald-400/80 font-semibold">OTP</span>,{' '}
                <span className="text-emerald-400/80 font-semibold">PIN</span>,{' '}
                <span className="text-emerald-400/80 font-semibold">password</span>,{' '}
                <span className="text-emerald-400/80 font-semibold">CVV</span> or any banking credentials.
                If anyone claims to be FinGuard and asks for these, it's a scam.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SUGGESTED QUESTIONS CHIPS
      ════════════════════════════════════════════ */}
      <section className="relative z-10 w-full max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="size-3.5 text-emerald-400/70" />
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Try asking</p>
          <Sparkles className="size-3.5 text-emerald-400/70" />
        </div>

        <div className="flex flex-wrap justify-center gap-2.5">
          {[
            { text: '"PM Kisan Yojana ki eligibility kya hai?"', color: 'emerald' },
            { text: '"UPI PIN share karna safe hai?"', color: 'teal' },
            { text: '"Fake call identify kaise karein?"', color: 'cyan' },
          ].map(({ text, color }) => {
            const chipStyles = {
              emerald: {
                bg: 'rgba(16,185,129,0.06)',
                border: 'rgba(16,185,129,0.25)',
                text: '#34d399',
                hoverBorder: 'rgba(16,185,129,0.5)',
              },
              teal: {
                bg: 'rgba(45,212,191,0.06)',
                border: 'rgba(45,212,191,0.25)',
                text: '#2dd4bf',
                hoverBorder: 'rgba(45,212,191,0.5)',
              },
              cyan: {
                bg: 'rgba(34,211,238,0.06)',
                border: 'rgba(34,211,238,0.25)',
                text: '#22d3ee',
                hoverBorder: 'rgba(34,211,238,0.5)',
              },
            }[color] as { bg: string; border: string; text: string; hoverBorder: string };

            return (
              <span
                key={text}
                className="cursor-pointer text-[11px] font-medium px-3.5 py-2 rounded-full transition-all duration-200 hover:scale-105"
                style={{
                  background: chipStyles.bg,
                  border: `1px solid ${chipStyles.border}`,
                  color: chipStyles.text,
                  backdropFilter: 'blur(8px)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = chipStyles.hoverBorder;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = chipStyles.border;
                }}
              >
                {text}
              </span>
            );
          })}
        </div>
      </section>

      {/* History Modal */}
      <HistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
      />
    </div>
  );
};
