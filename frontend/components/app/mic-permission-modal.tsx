'use client';

import React from 'react';
import { MicOff, AlertTriangle, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/shadcn/utils';

interface MicPermissionModalProps {
  isOpen: boolean;
  onRetry: () => void;
  onDismiss: () => void;
  errorDetails?: string;
  className?: string;
}

export function MicPermissionModal({
  isOpen,
  onRetry,
  onDismiss,
  errorDetails,
  className,
}: MicPermissionModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center p-4',
        className
      )}
      style={{ background: 'rgba(5,7,10,0.85)', backdropFilter: 'blur(12px)' }}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl p-6 animate-fade-in-up"
        style={{
          background: 'rgba(13,22,36,0.97)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 0 60px rgba(0,0,0,0.6), 0 0 30px rgba(239,68,68,0.06)',
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* Top red→amber accent strip */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg, #ef4444, #f59e0b, #ef4444)' }}
        />

        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 flex size-7 items-center justify-center rounded-full transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)';
            (e.currentTarget as HTMLElement).style.color = '#E8EDF5';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
            (e.currentTarget as HTMLElement).style.color = '#64748b';
          }}
          aria-label="Close dialog"
        >
          <X className="size-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          {/* Mic-off icon with red glow */}
          <div
            className="flex-shrink-0 flex size-12 items-center justify-center rounded-2xl"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              boxShadow: '0 0 16px rgba(239,68,68,0.1)',
            }}
          >
            <MicOff className="size-5 text-red-400 animate-pulse" />
          </div>

          <div className="space-y-1 pt-0.5">
            <h3 className="text-base font-bold text-white">
              Microphone Access Required
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your browser has blocked microphone access. Please allow microphone access and try again.
            </p>
          </div>
        </div>

        {/* Error details (if any) */}
        {errorDetails && (
          <div
            className="mb-4 rounded-xl p-3 text-xs font-mono overflow-x-auto"
            style={{
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.15)',
              color: '#f87171',
            }}
          >
            {errorDetails}
          </div>
        )}

        {/* Step-by-step instructions */}
        <div
          className="mb-5 rounded-xl p-4 space-y-3"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
            <AlertTriangle className="size-3.5 text-amber-500/70" />
            How to enable microphone access
          </h4>
          <ol className="space-y-2.5 list-none">
            {[
              <>Click the <strong className="text-white">Lock (🔒)</strong> or <strong className="text-white">Site Controls</strong> icon next to the address bar.</>,
              <>Find <strong className="text-white">Microphone</strong> permissions and change the setting to <strong className="text-white">Allow</strong>.</>,
              <>Click the <strong className="text-white">Try Again</strong> button below or refresh the page.</>,
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-slate-400 leading-relaxed">
                <span
                  className="flex-shrink-0 flex size-4 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.2)',
                    color: '#10b981',
                  }}
                >
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
          {/* Dismiss */}
          <button
            onClick={onDismiss}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#64748b',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
              (e.currentTarget as HTMLElement).style.color = '#E8EDF5';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
              (e.currentTarget as HTMLElement).style.color = '#64748b';
            }}
          >
            Dismiss
          </button>

          {/* Try Again */}
          <button
            onClick={onRetry}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: '#fff',
              boxShadow: '0 0 20px rgba(239,68,68,0.25)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 30px rgba(239,68,68,0.4)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(239,68,68,0.25)';
            }}
          >
            <RefreshCw className="size-3.5" />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
