'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { AnimatePresence, motion } from 'motion/react';
import { useSessionContext } from '@livekit/components-react';
import { Loader2 } from 'lucide-react';
import type { AppConfig } from '@/app-config';
import { AgentSessionView_01 } from '@/components/agents-ui/blocks/agent-session-view-01';
import { WelcomeView } from '@/components/app/welcome-view';
import { AgentStatusBadge } from '@/components/app/agent-status-badge';
import { MicPermissionModal } from '@/components/app/mic-permission-modal';

const MotionWelcomeView = motion.create(WelcomeView);
const MotionSessionView = motion.create(AgentSessionView_01);

const VIEW_MOTION_PROPS = {
  variants: {
    visible: {
      opacity: 1,
    },
    hidden: {
      opacity: 0,
    },
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
  const { resolvedTheme } = useTheme();

  const [isConnecting, setIsConnecting] = useState(false);
  const [hasCallEnded, setHasCallEnded] = useState(false);
  const [micErrorModalOpen, setMicErrorModalOpen] = useState(false);
  const [micErrorDetails, setMicErrorDetails] = useState('');

  const prevConnectedRef = React.useRef(isConnected);
  // Track session transition to handle "Call ended" state
  useEffect(() => {
    if (prevConnectedRef.current && !isConnected) {
      // Session disconnected -> Call ended state
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

      // Check microphone permission explicitly first
      if (typeof window !== 'undefined' && navigator?.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          // Stop temporary stream track after checking
          stream.getTracks().forEach((track) => track.stop());
        } catch (micErr: any) {
          setIsConnecting(false);
          console.warn('Microphone permission check failed:', micErr);
          if (
            micErr.name === 'NotAllowedError' ||
            micErr.name === 'PermissionDeniedError' ||
            (micErr.message && micErr.message.toLowerCase().includes('permission'))
          ) {
            setMicErrorDetails(
              micErr.message || 'Microphone access was blocked by your browser.'
            );
            setMicErrorModalOpen(true);
            return;
          }
        }
      }

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
        {/* Connecting state */}
        {!isConnected && isConnecting && (
          <motion.div
            key="connecting-state"
            {...VIEW_MOTION_PROPS}
            className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4"
          >
            <div className="relative flex items-center justify-center mb-6">
              <div className="absolute size-32 rounded-full bg-amber-500/20 blur-xl animate-ping" />
              <div className="relative flex size-20 items-center justify-center rounded-full bg-background border border-amber-500/40 shadow-2xl">
                <Loader2 className="size-10 text-amber-400 animate-spin" />
              </div>
            </div>
            <AgentStatusBadge state="connecting" showSubtitle />
            <p className="mt-4 text-xs text-muted-foreground max-w-xs leading-relaxed">
              Establishing encrypted voice connection with your AI agent...
            </p>
          </motion.div>
        )}

        {/* Ready & Call Ended states */}
        {!isConnected && !isConnecting && (
          <MotionWelcomeView
            key="welcome-view"
            {...VIEW_MOTION_PROPS}
            startButtonText={appConfig.startButtonText}
            onStartCall={handleStartCall}
            hasCallEnded={hasCallEnded}
          />
        )}

        {/* Active Session view (Listening & Speaking states) */}
        {isConnected && (
          <MotionSessionView
            key="session-view"
            {...VIEW_MOTION_PROPS}
            supportsChatInput={appConfig.supportsChatInput}
            supportsVideoInput={appConfig.supportsVideoInput}
            supportsScreenShare={appConfig.supportsScreenShare}
            isPreConnectBufferEnabled={appConfig.isPreConnectBufferEnabled}
            audioVisualizerType={appConfig.audioVisualizerType}
            audioVisualizerColor={
              resolvedTheme === 'dark'
                ? appConfig.audioVisualizerColorDark
                : appConfig.audioVisualizerColor
            }
            audioVisualizerColorShift={appConfig.audioVisualizerColorShift}
            audioVisualizerBarCount={appConfig.audioVisualizerBarCount}
            audioVisualizerGridRowCount={appConfig.audioVisualizerGridRowCount}
            audioVisualizerGridColumnCount={appConfig.audioVisualizerGridColumnCount}
            audioVisualizerRadialBarCount={appConfig.audioVisualizerRadialBarCount}
            audioVisualizerRadialRadius={appConfig.audioVisualizerRadialRadius}
            audioVisualizerWaveLineWidth={appConfig.audioVisualizerWaveLineWidth}
            className="fixed inset-0"
          />
        )}
      </AnimatePresence>

      {/* Step 4: Microphone Permission Error Modal */}
      <MicPermissionModal
        isOpen={micErrorModalOpen}
        onRetry={handleStartCall}
        onDismiss={() => setMicErrorModalOpen(false)}
        errorDetails={micErrorDetails}
      />
    </>
  );
}
