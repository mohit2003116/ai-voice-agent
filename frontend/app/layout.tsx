import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import { headers } from 'next/headers';
import { cn } from '@/lib/shadcn/utils';
import { getAppConfig, getStyles } from '@/lib/utils';
import '@/styles/globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

const commitMono = localFont({
  display: 'swap',
  variable: '--font-commit-mono',
  src: [
    {
      path: '../fonts/CommitMono-400-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/CommitMono-700-Regular.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../fonts/CommitMono-400-Italic.otf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../fonts/CommitMono-700-Italic.otf',
      weight: '700',
      style: 'italic',
    },
  ],
});

import { ThemeProvider } from '@/components/app/theme-provider';

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const hdrs = await headers();
  const appConfig = await getAppConfig(hdrs);
  const styles = getStyles(appConfig);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        inter.variable,
        commitMono.variable,
        'dark scroll-smooth antialiased'
      )}
      style={{ fontFamily: 'Inter, var(--font-inter), ui-sans-serif, system-ui, sans-serif' }}
    >
      <head>
        {styles && <style>{styles}</style>}
        <title>{appConfig.pageTitle}</title>
        <meta name="description" content={appConfig.pageDescription} />
        <meta name="theme-color" content="#05070A" />
      </head>
      <body className="overflow-x-hidden bg-[#05070A] text-[#E8EDF5]">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          {/* ═══════════════════════════════════════════════
              HEADER — Fixed dark fintech nav
          ═══════════════════════════════════════════════ */}
        <header className="fixed top-0 left-0 z-50 flex w-full flex-row items-center justify-between px-4 py-3 md:px-6 md:py-3.5 bg-[#05070A]/85 backdrop-blur-xl border-b border-white/5">
          {/* Left: Logo + Brand */}
          <div className="flex items-center gap-3">
            {/* Shield icon */}
            <div className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <svg className="size-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              {/* Tiny glow pulse dot */}
              <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]">
                <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
              </span>
            </div>

            {/* Brand text */}
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-tight text-white leading-none">
                FinGuard
                <span className="ml-1.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded font-mono tracking-widest uppercase">
                  AI
                </span>
              </span>
              <span className="text-[10px] text-slate-500 font-normal mt-0.5 leading-none tracking-wide">
                Financial Safety AI
              </span>
            </div>
          </div>

          {/* Right: LiveKit + Murf badge */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0B1220] border border-white/8 text-[11px] font-medium text-slate-400">
              {/* Green online indicator */}
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
              </span>
              <span className="text-slate-300 font-semibold">LiveKit</span>
              <span className="text-slate-600">+</span>
              <span className="text-slate-300 font-semibold">Murf Falcon</span>
            </div>
            {/* Mobile: just the dot */}
            <div className="flex sm:hidden items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#0B1220] border border-white/8">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Live</span>
            </div>
          </div>
        </header>

        {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
