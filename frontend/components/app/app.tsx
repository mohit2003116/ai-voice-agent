'use client';

import { useMemo } from 'react';
import { TokenSource } from 'livekit-client';
import { useSession } from '@livekit/components-react';
import { WarningIcon } from '@phosphor-icons/react/dist/ssr';
import type { AppConfig } from '@/app-config';
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import { StartAudioButton } from '@/components/agents-ui/start-audio-button';
import { ViewController } from '@/components/app/view-controller';
import { Toaster } from '@/components/ui/sonner';
import { useAgentErrors } from '@/hooks/useAgentErrors';
import { useDebugMode } from '@/hooks/useDebug';
import { getSandboxTokenSource } from '@/lib/utils';

const IN_DEVELOPMENT = process.env.NODE_ENV !== 'production';

function AppSetup() {
  useDebugMode({ enabled: IN_DEVELOPMENT });
  useAgentErrors();

  return null;
}

interface AppProps {
  appConfig: AppConfig;
}

export function App({ appConfig }: AppProps) {
  const tokenSource = useMemo(() => {
    return typeof process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT === 'string'
      ? getSandboxTokenSource(appConfig)
      : TokenSource.endpoint('/api/token');
  }, [appConfig]);

  const session = useSession(
    tokenSource,
    appConfig.agentName ? { agentName: appConfig.agentName } : undefined
  );

  return (
    <AgentSessionProvider session={session}>
      <AppSetup />

      {/* Full-page dark background */}
      <main className="relative flex min-h-svh w-full flex-col items-center justify-start bg-[#05070A] overflow-x-hidden overflow-y-auto">

        {/* ── Ambient background glows ── */}
        {/* Primary emerald glow — center */}
        <div
          className="pointer-events-none fixed inset-0 z-0"
          aria-hidden="true"
        >
          {/* Large emerald radial behind orb area */}
          <div className="absolute left-1/2 top-[35%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] rounded-full bg-emerald-500/[0.06] blur-[100px] animate-glow-drift" />
          {/* Cyan offset glow */}
          <div className="absolute left-[60%] top-[50%] w-[400px] h-[350px] rounded-full bg-cyan-500/[0.04] blur-[90px]" style={{ animationDelay: '3s' }} />
          {/* Bottom navy base glow */}
          <div className="absolute left-[30%] top-[70%] w-[500px] h-[300px] rounded-full bg-emerald-900/[0.12] blur-[120px]" />
        </div>

        {/* Dot-grid overlay */}
        <div className="pointer-events-none fixed inset-0 z-0 fg-dot-grid opacity-100" aria-hidden="true" />

        {/* App content */}
        <div className="relative z-10 w-full">
          <ViewController appConfig={appConfig} />
        </div>
      </main>

      <StartAudioButton label="Start Audio" />
      <Toaster
        icons={{
          warning: <WarningIcon weight="bold" />,
        }}
        position="top-center"
        className="toaster group"
        style={
          {
            '--normal-bg': '#0D1624',
            '--normal-text': '#E8EDF5',
            '--normal-border': 'rgba(255,255,255,0.08)',
          } as React.CSSProperties
        }
      />
    </AgentSessionProvider>
  );
}
