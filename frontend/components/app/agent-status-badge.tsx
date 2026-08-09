'use client';

import React from 'react';
import { Mic, Volume2, Loader2, PhoneOff, Sparkles } from 'lucide-react';
import { cn } from '@/lib/shadcn/utils';

export type AgentStateDisplay = 'ready' | 'connecting' | 'listening' | 'speaking' | 'ended';

interface AgentStatusBadgeProps {
  state: AgentStateDisplay;
  className?: string;
  showSubtitle?: boolean;
}

export function AgentStatusBadge({ state, className, showSubtitle = false }: AgentStatusBadgeProps) {
  switch (state) {
    case 'ready':
      return (
        <div className={cn('inline-flex flex-col items-center gap-1.5', className)}>
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold backdrop-blur-md"
            style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.25)',
              color: '#34d399',
            }}
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            <Sparkles className="size-3.5" />
            <span>Ready</span>
          </div>
          {showSubtitle && (
            <p className="text-xs text-slate-500">Press start to begin your conversation</p>
          )}
        </div>
      );

    case 'connecting':
      return (
        <div className={cn('inline-flex flex-col items-center gap-1.5', className)}>
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold backdrop-blur-md"
            style={{
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              color: '#10b981',
            }}
          >
            <Loader2 className="size-3.5 animate-spin" />
            <span>Connecting...</span>
          </div>
          {showSubtitle && (
            <p className="text-xs text-emerald-500/70 font-medium animate-pulse">
              Joining the call — please wait...
            </p>
          )}
        </div>
      );

    case 'listening':
      return (
        <div className={cn('inline-flex flex-col items-center gap-1.5', className)}>
          <div className="inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 text-xs font-semibold backdrop-blur-md"
            style={{
              background: 'rgba(34,211,238,0.1)',
              border: '1px solid rgba(34,211,238,0.3)',
              color: '#22d3ee',
              boxShadow: '0 0 16px rgba(34,211,238,0.1)',
            }}
          >
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-cyan-400" />
            </span>
            <Mic className="size-3.5 animate-pulse" />
            <span>Listening to you</span>
          </div>
          {showSubtitle && (
            <p className="text-xs font-medium" style={{ color: 'rgba(34,211,238,0.7)' }}>
              Speak naturally, your AI agent is listening
            </p>
          )}
        </div>
      );

    case 'speaking':
      return (
        <div className={cn('inline-flex flex-col items-center gap-1.5', className)}>
          <div className="inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 text-xs font-semibold backdrop-blur-md"
            style={{
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(16,185,129,0.35)',
              color: '#34d399',
              boxShadow: '0 0 16px rgba(16,185,129,0.12)',
            }}
          >
            <Volume2 className="size-4 animate-bounce" />
            <span>FinGuard is speaking</span>
            {/* Animated waveform dots */}
            <span className="flex items-end gap-0.5" style={{ height: 12 }}>
              {[4, 8, 6, 10, 7].map((h, i) => (
                <span
                  key={i}
                  className="rounded-full bg-emerald-400 animate-wave-bar"
                  style={{
                    width: 2,
                    height: h,
                    animationDelay: `${i * 100}ms`,
                    transformOrigin: 'bottom',
                    display: 'inline-block',
                  }}
                />
              ))}
            </span>
          </div>
          {showSubtitle && (
            <p className="text-xs font-medium text-emerald-400/70">
              Agent response in progress
            </p>
          )}
        </div>
      );

    case 'ended':
      return (
        <div className={cn('inline-flex flex-col items-center gap-1.5', className)}>
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold backdrop-blur-md"
            style={{
              background: 'rgba(100,116,139,0.12)',
              border: '1px solid rgba(100,116,139,0.2)',
              color: '#64748b',
            }}
          >
            <PhoneOff className="size-3.5" />
            <span>Conversation ended</span>
          </div>
          {showSubtitle && (
            <p className="text-xs text-slate-600">
              The conversation is over. Start again whenever you wish.
            </p>
          )}
        </div>
      );

    default:
      return null;
  }
}
