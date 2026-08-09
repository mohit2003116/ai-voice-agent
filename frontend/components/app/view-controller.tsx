'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useSessionContext } from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { AgentSessionView_01 } from '@/components/agents-ui/blocks/agent-session-view-01';
import { WelcomeView } from '@/components/app/welcome-view';
import { AgentStatusBadge } from '@/components/app/agent-status-badge';
import { MicPermissionModal } from '@/components/app/mic-permission-modal';

const MotionWelcomeView = motion.create(WelcomeView);
const MotionSessionView = motion.create(AgentSessionView_01);

const VIEW_MOTION_PROPS = {
  variants: {
    visible: { opacity: 1 },
    hidden:  { opacity: 0 },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: {
    duration: 0.4,
    ease: 'linear',
  },
};

interface ViewControllerProps {
  appConfig: AppConfig;
}

export function ViewController({ appConfig }: ViewControllerProps) {
  const { isConnected, start } = useSessionContext();

  const [isConnecting, setIsConnecting] = useState(false);
  const [hasCallEnded, setHasCallEnded] = useState(false);
  const [micErrorModalOpen, setMicErrorModalOpen] = useState(false);
  const [micErrorDetails, setMicErrorDetails] = useState('');

  const prevConnectedRef = React.useRef(isConnected);

  // Track session transition to handle "Call ended" state
  useEffect(() => {
    if (prevConnectedRef.current && !isConnected) {
      setHasCallEnded(true);
      setIsConnecting(false);
    } else if (isConnected) {
      setIsConnecting(false);
    }
    prevConnectedRef.current = isConnected;
  }, [isConnected]);

  const handleStartCall = async () => {
    try {
      setIsConnecting(true);
      await start();
    } catch (err: any) {
      setIsConnecting(false);
      console.error('Error starting agent session:', err);
      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError' ||
        (err.message && err.message.toLowerCase().includes('permission'))
      ) {
        setMicErrorDetails(err.message || 'Microphone permission denied.');
        setMicErrorModalOpen(true);
      }
    }
  };

  const handleDisconnectTransition = () => {
    setHasCallEnded(true);
    setIsConnecting(false);
  };

  return (
    <>
      <AnimatePresence mode="wait">

        {/* ── CONNECTING STATE ── */}
        {!isConnected && isConnecting && (
          <motion.div
            key="connecting-state"
            {...VIEW_MOTION_PROPS}
            className="flex flex-col items-center justify-center min-h-svh text-center px-4"
          >
            {/* Orb with spinning ring */}
            <div className="relative flex items-center justify-center mb-8">
              {/* Outer spinning ring */}
              <div
                className="absolute rounded-full animate-ring-spin"
                style={{
                  width: 160,
                  height: 160,
                  border: '2px solid transparent',
                  borderTopColor: '#10b981',
                  borderRightColor: 'rgba(16,185,129,0.3)',
                }}
              />
              {/* Second ring, opposite spin, slower */}
              <div
                className="absolute rounded-full"
                style={{
                  width: 140,
                  height: 140,
                  border: '1.5px solid transparent',
                  borderTopColor: '#22d3ee',
                  borderLeftColor: 'rgba(34,211,238,0.2)',
                  animation: 'ring-spin 2.2s linear infinite reverse',
                }}
              />
              {/* Static ring */}
              <div
                className="absolute rounded-full border border-emerald-500/15"
                style={{ width: 120, height: 120 }}
              />

              {/* Core orb */}
              <div
                className="relative flex size-24 items-center justify-center rounded-full bg-[#05070A] animate-orb-glow"
                style={{
                  border: '1.5px solid rgba(16,185,129,0.3)',
                  boxShadow: '0 0 40px rgba(16,185,129,0.2), inset 0 0 20px rgba(16,185,129,0.04)',
                }}
              >
                {/* Animated dots inside */}
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="size-2 rounded-full bg-emerald-400 animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>

              {/* Ambient glow */}
              <div
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: 180,
                  height: 180,
                  background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
                }}
              />
            </div>

            {/* Status badge */}
            <AgentStatusBadge state="connecting" showSubtitle />

            <p className="mt-4 text-xs text-slate-500 max-w-xs leading-relaxed">
              Establishing encrypted voice connection with your AI agent...
            </p>
          </motion.div>
        )}

        {/* ── READY & CALL ENDED ── */}
        {!isConnected && !isConnecting && (
          <MotionWelcomeView
            key="welcome-view"
            {...VIEW_MOTION_PROPS}
            startButtonText={appConfig.startButtonText}
            onStartCall={handleStartCall}
            hasCallEnded={hasCallEnded}
          />
        )}

        {/* ── ACTIVE SESSION (Listening & Speaking) ── */}
        {isConnected && (
          <MotionSessionView
            key="session-view"
            {...VIEW_MOTION_PROPS}
            supportsChatInput={appConfig.supportsChatInput}
            supportsVideoInput={appConfig.supportsVideoInput}
            supportsScreenShare={appConfig.supportsScreenShare}
            isPreConnectBufferEnabled={appConfig.isPreConnectBufferEnabled}
