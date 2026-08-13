'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  RefreshCw,
  TrendingUp,
  PhoneCall,
  CheckCircle2,
  XCircle,
  BarChart3,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

/* ─── Types ──────────────────────────────────────────────── */
interface CallRecord {
  call_id: string;
  started_at: string;
  ended_at: string | null;
  outcome: 'SUCCESS' | 'FAILED';
  outcome_reason: string;
}

interface AnalyticsStats {
  totalCalls: number;
  successCalls: number;
  failedCalls: number;
  successRate: number | null;
}

interface CallAnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ─── Helpers ────────────────────────────────────────────── */
function formatDate(iso: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatDuration(startIso: string | null, endIso: string | null) {
  if (!startIso || !endIso) return '—';
  try {
    const secs = Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 1000);
    if (secs < 0) return '—';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  } catch {
    return '—';
  }
}

/* ─── Animated counter ───────────────────────────────────── */
function AnimatedNumber({ target, duration = 700 }: { target: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (target === 0) { setDisplay(0); return; }
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return <>{display}</>;
}

/* ─── Metric Card ────────────────────────────────────────── */
function MetricCard({
  label,
  value,
  icon,
  accent,
  subtext,
  delay = 0,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: 'neutral' | 'emerald' | 'red';
  subtext?: string;
  delay?: number;
}) {
  const styles = {
    neutral: {
      border: 'border-slate-700/60',
      glow: '',
      iconBg: 'bg-slate-800/80 border-slate-700/50',
      iconColor: 'text-slate-300',
      valueColor: 'text-white',
      labelColor: 'text-slate-400',
    },
    emerald: {
      border: 'border-emerald-500/30',
      glow: 'shadow-[0_0_24px_rgba(16,185,129,0.1)]',
      iconBg: 'bg-emerald-500/10 border-emerald-500/25',
      iconColor: 'text-emerald-400',
      valueColor: 'text-emerald-300',
      labelColor: 'text-emerald-400/80',
    },
    red: {
      border: 'border-red-500/25',
      glow: 'shadow-[0_0_20px_rgba(239,68,68,0.08)]',
      iconBg: 'bg-red-500/10 border-red-500/20',
      iconColor: 'text-red-400',
      valueColor: 'text-red-300',
      labelColor: 'text-red-400/80',
    },
  }[accent];

  return (
    <div
      className={`relative flex flex-col gap-4 p-6 rounded-2xl fg-glass border ${styles.border} ${styles.glow} animate-fade-in-up`}
      style={{ animationDelay: `${delay}s`, animationFillMode: 'both' }}
    >
      {/* Top accent strip */}
      {accent !== 'neutral' && (
        <div
          className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
          style={{
            background:
              accent === 'emerald'
                ? 'linear-gradient(90deg, #10b981, #34d399, #22d3ee)'
                : 'linear-gradient(90deg, #ef4444, #f97316)',
          }}
        />
      )}

      <div className="flex items-center justify-between">
        <div
          className={`flex size-10 items-center justify-center rounded-xl border ${styles.iconBg} ${styles.iconColor}`}
        >
          {icon}
        </div>
        <span className={`text-[10px] font-mono uppercase tracking-widest ${styles.labelColor}`}>
          {label}
        </span>
      </div>

      <div>
        <div className={`text-4xl font-extrabold tracking-tight ${styles.valueColor}`}>
          <AnimatedNumber target={value} />
        </div>
        {subtext && (
          <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">{subtext}</p>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────── */
export function CallAnalyticsDashboard({ isOpen, onClose }: CallAnalyticsDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<CallRecord[]>([]);
  const [stats, setStats] = useState<AnalyticsStats>({
    totalCalls: 0,
    successCalls: 0,
    failedCalls: 0,
    successRate: null,
  });
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/history');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (!data.success) throw new Error(data.error || 'Fetch failed');

      const raw: CallRecord[] = data.callAnalytics || [];
      setRecords(raw);

      const s = data.stats || {};
      setStats({
        totalCalls: s.totalCalls ?? 0,
        successCalls: s.successCalls ?? 0,
        failedCalls: s.failedCalls ?? 0,
        successRate: s.successRate ?? null,
      });
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error('[CallAnalytics] fetch error:', err);
      toast.error('Could not load call analytics data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen, fetchData]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Call Analytics Dashboard"
    >
      <div className="relative max-w-4xl w-[96vw] max-h-[88vh] flex flex-col bg-[#05070A]/97 border border-emerald-500/25 backdrop-blur-2xl text-slate-100 shadow-2xl overflow-hidden rounded-2xl">

        {/* ── Header ── */}
        <div className="relative p-6 border-b border-emerald-500/15 bg-gradient-to-r from-emerald-950/40 via-slate-900/50 to-[#05070A]">
          {/* Top gradient strip */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: 'linear-gradient(90deg, #10b981 0%, #34d399 40%, #22d3ee 100%)' }}
          />

          <button
            onClick={onClose}
            id="analytics-close-btn"
            className="absolute top-4 right-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Close analytics dashboard"
          >
            <X className="size-5" />
          </button>

          <div className="flex items-center justify-between pr-10">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                <BarChart3 className="size-5" strokeWidth={1.8} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Call Analytics
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                    Day 8
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Live outcome metrics — all values read directly from database
                </p>
              </div>
            </div>

            {/* Refresh */}
            <button
              id="analytics-refresh-btn"
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 bg-slate-900/80 border border-slate-700/60 hover:border-emerald-500/40 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
              aria-label="Refresh analytics data"
            >
              <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Last refreshed */}
          {lastRefreshed && (
            <p className="mt-3 text-[11px] text-slate-500 flex items-center gap-1.5">
              <Clock className="size-3 text-slate-600" />
              Last refreshed: {lastRefreshed.toLocaleTimeString('en-IN')}
            </p>
          )}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ── Privacy Notice ── */}
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-950/25 border border-emerald-500/15 text-[11px] text-emerald-300/70">
            <ShieldCheck className="size-3.5 shrink-0 text-emerald-500/60" />
            <span>
              Analytics contain <strong className="text-emerald-300">only</strong> call outcome
              summaries. No OTP, PIN, CVV, password, account number, or conversation transcript is
              stored or displayed.
            </span>
          </div>

          {/* ── Loading Skeleton ── */}
          {loading && records.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-32 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse"
                />
              ))}
            </div>
          )}

          {/* ── THREE MAIN METRIC CARDS ── */}
          {!loading || records.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard
                label="Total Calls"
                value={stats.totalCalls}
                icon={<PhoneCall className="size-5" strokeWidth={1.8} />}
                accent="neutral"
                subtext="All completed calls evaluated"
                delay={0}
              />
              <MetricCard
                label="Successful Calls"
                value={stats.successCalls}
                icon={<CheckCircle2 className="size-5" strokeWidth={1.8} />}
                accent="emerald"
                subtext="Guidance delivered or escalation created"
                delay={0.07}
              />
              <MetricCard
                label="Failed Calls"
                value={stats.failedCalls}
                icon={<XCircle className="size-5" strokeWidth={1.8} />}
                accent="red"
                subtext="No guidance delivered and no escalation"
                delay={0.14}
              />
            </div>
          ) : null}

          {/* ── Success Rate Bar ── */}
          {stats.totalCalls > 0 && (
            <div
              className="p-5 rounded-2xl fg-glass border border-slate-700/50 animate-fade-in-up"
              style={{ animationDelay: '0.22s', animationFillMode: 'both' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <TrendingUp className="size-3.5 text-emerald-400" />
                  Overall Success Rate
                </div>
                <span className="text-xl font-extrabold text-emerald-400">
                  {stats.successRate !== null ? `${stats.successRate}%` : '—'}
                </span>
              </div>

              {/* Progress bar */}
              <div className="relative h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                  style={{
                    width: `${stats.successRate ?? 0}%`,
                    background: 'linear-gradient(90deg, #10b981, #34d399, #22d3ee)',
                    boxShadow: '0 0 8px rgba(16,185,129,0.5)',
                  }}
                />
              </div>

              <div className="flex justify-between mt-2 text-[11px] text-slate-500">
                <span>{stats.successCalls} success</span>
                <span>{stats.failedCalls} failed</span>
              </div>
            </div>
          )}

          {/* ── Call Records Table ── */}
          <div
            className="animate-fade-in-up"
            style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <PhoneCall className="size-3.5 text-emerald-400/70" />
                Call Records ({records.length})
              </h3>
              {records.length > 0 && (
                <span className="text-[10px] text-slate-500 font-mono">newest first</span>
              )}
            </div>

            {records.length === 0 ? (
              <div className="text-center py-16 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800">
                <BarChart3 className="size-10 text-slate-700 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">No call records yet</p>
                <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                  Complete a FinGuard voice call and the outcome will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800/70 bg-slate-900/30">
                <table className="w-full text-left text-xs text-slate-300" id="call-analytics-table">
                  <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Call ID</th>
                      <th className="py-3 px-4 whitespace-nowrap">Start Time</th>
                      <th className="py-3 px-4 whitespace-nowrap">End Time</th>
                      <th className="py-3 px-4 whitespace-nowrap">Duration</th>
                      <th className="py-3 px-4">Outcome</th>
                      <th className="py-3 px-4">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {records.map((row) => (
                      <tr
                        key={row.call_id}
                        className="hover:bg-slate-800/30 transition-colors group"
                      >
                        {/* Call ID — truncated */}
                        <td
                          className="py-3 px-4 font-mono text-[11px] text-slate-400 max-w-[140px] truncate"
                          title={row.call_id}
                        >
                          {row.call_id}
                        </td>

                        {/* Start */}
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                          {formatDate(row.started_at)}
                        </td>

                        {/* End */}
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                          {formatDate(row.ended_at)}
                        </td>

                        {/* Duration */}
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                          {formatDuration(row.started_at, row.ended_at)}
                        </td>

                        {/* Outcome badge */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {row.outcome === 'SUCCESS' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/12 text-emerald-300 border border-emerald-500/25">
                              <CheckCircle2 className="size-3" />
                              SUCCESS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/12 text-red-400 border border-red-500/20">
                              <XCircle className="size-3" />
                              FAILED
                            </span>
                          )}
                        </td>

                        {/* Reason */}
                        <td className="py-3 px-4 text-slate-400 leading-relaxed max-w-[220px]">
                          {row.outcome_reason || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
