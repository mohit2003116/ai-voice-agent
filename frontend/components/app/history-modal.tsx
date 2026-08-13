'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  MessageSquare,
  ShieldAlert,
  Star,
  Database,
  RefreshCw,
  User,
  Bot,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  X,
  TrendingUp,
  PhoneCall,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HistoryModal({ isOpen, onClose }: HistoryModalProps) {
  const [activeTab, setActiveTab] = useState<'sessions' | 'detail' | 'callers' | 'escalations' | 'analytics'>('sessions');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [callers, setCallers] = useState<any[]>([]);
  const [escalations, setEscalations] = useState<any[]>([]);
  const [callAnalytics, setCallAnalytics] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionDetail, setSessionDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const [histRes, userRes, escRes] = await Promise.all([
        fetch('/api/history'),
        fetch('/api/users'),
        fetch('/api/escalations'),
      ]);
      
      const histData = await histRes.json();
      const userData = await userRes.json();
      const escData = await escRes.json();

      if (histData.success) {
        setSessions(histData.sessions || []);
        setStats(histData.stats || null);
        setCallAnalytics(histData.callAnalytics || []);
      }
      if (userData.success) {
        setCallers(userData.users || []);
      }
      if (escData.success) {
        setEscalations(escData.escalations || []);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
      toast.error('Could not connect to history database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const loadSessionDetails = async (id: string) => {
    try {
      setSelectedSessionId(id);
      setLoadingDetail(true);
      setActiveTab('detail');
      const res = await fetch(`/api/history/${id}`);
      const data = await res.json();
      if (data.success) {
        setSessionDetail(data);
      } else {
        toast.error('Session details not found');
      }
    } catch (err) {
      console.error('Error fetching session detail:', err);
      toast.error('Failed to load session details');
    } finally {
      setLoadingDetail(false);
    }
  };

  const formatDuration = (secs: number) => {
    if (!secs) return '0s';
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.round(secs % 60);
    return mins > 0 ? `${mins}m ${remainingSecs}s` : `${remainingSecs}s`;
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return 'N/A';
    try {
      const dt = new Date(isoStr);
      return dt.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative max-w-4xl w-[95vw] max-h-[85vh] flex flex-col bg-slate-950/95 border border-emerald-500/30 backdrop-blur-2xl text-slate-100 shadow-2xl p-0 overflow-hidden rounded-2xl">
        {/* Header with gradient glow */}
        <div className="relative p-6 border-b border-emerald-500/20 bg-gradient-to-r from-emerald-950/50 via-slate-900/60 to-slate-950">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="size-5" />
          </button>

          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Database className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  FinGuard SQLite Database
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    SQLite Ready
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Persisted voice sessions, caller facts, transcripts, & safety logs stored in finguard.db
                </p>
              </div>
            </div>
            <button
              onClick={fetchHistory}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 px-3 py-1.5 rounded-lg transition-all"
            >
              <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Stats Bar */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4 pt-3 border-t border-slate-800/80">
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-2.5">
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="size-3 text-emerald-400" /> Total Sessions
                </div>
                <div className="text-lg font-bold text-white mt-0.5">{stats.totalSessions}</div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-2.5">
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <User className="size-3 text-emerald-400" /> Saved Callers
                </div>
                <div className="text-lg font-bold text-white mt-0.5">{callers.length}</div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-2.5">
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <MessageSquare className="size-3 text-cyan-400" /> Total Transcripts
                </div>
                <div className="text-lg font-bold text-white mt-0.5">{stats.totalMessages}</div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-2.5">
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldAlert className="size-3 text-amber-400" /> Safety Events
                </div>
                <div className="text-lg font-bold text-white mt-0.5">{stats.safetyEvents}</div>
              </div>
              <div className="bg-slate-900/60 border border-emerald-500/25 rounded-lg p-2.5">
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <TrendingUp className="size-3 text-emerald-400" /> Success Rate
                </div>
                <div className="text-lg font-bold mt-0.5">
                  {stats.successRate !== null && stats.successRate !== undefined
                    ? <span className="text-emerald-400">{stats.successRate}%</span>
                    : <span className="text-slate-500 text-sm">—</span>
                  }
                </div>
                {stats.totalCalls > 0 && (
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {stats.successCalls}/{stats.totalCalls} calls
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'sessions'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Call Sessions ({sessions.length})
            </button>
            <button
              onClick={() => setActiveTab('callers')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'callers'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Caller Profiles ({callers.length})
            </button>
            <button
              onClick={() => setActiveTab('escalations')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'escalations'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Escalation Requests ({escalations.length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'analytics'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <TrendingUp className="size-3" />
                Call Analytics ({callAnalytics.length})
              </span>
            </button>
            <button
              onClick={() => setActiveTab('detail')}
              disabled={!selectedSessionId}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'detail'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 disabled:opacity-40'
              }`}
            >
              Transcript View {selectedSessionId ? `(${selectedSessionId.slice(0, 8)}...)` : ''}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'sessions' && (
            <div>
              {sessions.length === 0 ? (
                <div className="text-center py-12 bg-slate-900/30 border border-dashed border-slate-800 rounded-xl">
                  <Database className="size-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-300">No voice sessions recorded yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Start a financial safety call to record voice transcripts, guardrail safety events, and ratings in SQLite.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {sessions.map((sess) => (
                    <div
                      key={sess.id}
                      onClick={() => loadSessionDetails(sess.id)}
                      className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-900/80 cursor-pointer transition-all shadow-sm"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white font-mono">
                            {sess.id}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="size-2.5" />
                            {sess.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span>Started: {formatDate(sess.started_at)}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="size-3 text-slate-400" />
                            {formatDuration(sess.duration_seconds)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="size-3 text-cyan-400" />
                            {sess.total_messages} messages
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 sm:mt-0 text-xs text-emerald-400 font-medium group-hover:translate-x-1 transition-transform">
                        View Transcripts
                        <ChevronRight className="size-4" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'callers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="size-3.5 text-emerald-400" />
                  Stored Caller Records & Financial Track Facts
                </h4>
                <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Strictly No Sensitive IDs / Account Numbers Stored
                </span>
              </div>

              {callers.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No caller records saved in database.</p>
              ) : (
                <div className="grid gap-4">
                  {callers.map((user) => {
                    const facts = user.facts || {};
                    const schemes = facts.schemes_checked || [];
                    const eligibility = facts.eligibility_answers || {};

                    return (
                      <div
                        key={user.user_id}
                        className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-lg"
                      >
                        {/* User Header */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white flex items-center gap-2">
                                {user.name}
                                <span className="text-[11px] font-mono font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                                  ID: {user.user_id}
                                </span>
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
                                <span>Language: <strong className="text-emerald-400">{user.language_preference}</strong></span>
                                <span>•</span>
                                <span>Last Interaction: {formatDate(user.last_interaction)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Financial Facts Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {/* Schemes Checked */}
                          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                            <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                              <Sparkles className="size-3.5 text-emerald-400" />
                              Schemes Already Checked ({schemes.length})
                            </div>
                            {schemes.length === 0 ? (
                              <p className="text-[11px] text-slate-500 italic">No scheme inquiries recorded yet.</p>
                            ) : (
                              <ul className="space-y-1">
                                {schemes.map((scheme: string, idx: number) => (
                                  <li key={idx} className="flex items-center gap-2 text-slate-200 text-[11px]">
                                    <span className="size-1.5 rounded-full bg-emerald-400 shrink-0" />
                                    {scheme}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          {/* Eligibility Answers */}
                          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                            <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                              <CheckCircle2 className="size-3.5 text-cyan-400" />
                              Eligibility Answers Recorded
                            </div>
                            {Object.keys(eligibility).length === 0 ? (
                              <p className="text-[11px] text-slate-500 italic">No eligibility answers saved yet.</p>
                            ) : (
                              <div className="space-y-1">
                                {Object.entries(eligibility).map(([k, v]) => (
                                  <div key={k} className="flex items-center justify-between text-[11px] bg-slate-900/60 p-1.5 rounded border border-slate-800/50">
                                    <span className="text-slate-400 capitalize">{k.replace(/_/g, ' ')}</span>
                                    <span className="font-semibold text-cyan-200">{String(v)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Raw Record Preview matching user format requirement */}
                        <div className="pt-2 border-t border-slate-800/50">
                          <div className="text-[10px] uppercase font-mono text-slate-500 mb-1">
                            SQLite Saved Record Payload
                          </div>
                          <pre className="text-[10px] font-mono bg-slate-950 p-2.5 rounded-lg text-emerald-300 border border-slate-800 overflow-x-auto">
                            {JSON.stringify(
                              {
                                user_id: user.user_id,
                                name: user.name,
                                language_preference: user.language_preference,
                                facts: user.facts,
                                last_interaction: user.last_interaction,
                              },
                              null,
                              2
                            )}
                          </pre>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'detail' && (
            <div>
              {loadingDetail ? (
                <div className="text-center py-12">
                  <RefreshCw className="size-8 text-emerald-400 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Loading transcript history from database...</p>
                </div>
              ) : sessionDetail ? (
                <div className="space-y-6">
                  {/* Session Overview Header */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-xs text-slate-400">Session ID</div>
                      <div className="text-sm font-mono text-emerald-300 font-semibold">{sessionDetail.session.id}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Started</div>
                      <div className="text-xs text-white">{formatDate(sessionDetail.session.started_at)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Duration</div>
                      <div className="text-xs text-white">{formatDuration(sessionDetail.session.duration_seconds)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Transcripts</div>
                      <div className="text-xs text-cyan-300">{sessionDetail.messages.length} exchanges</div>
                    </div>
                  </div>

                  {/* Safety & Scam Events callout if any */}
                  {sessionDetail.safetyLogs && sessionDetail.safetyLogs.length > 0 && (
                    <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                        <ShieldAlert className="size-4 text-amber-400" />
                        Safety Audit & Guardrail Logs ({sessionDetail.safetyLogs.length})
                      </div>
                      <div className="space-y-1.5">
                        {sessionDetail.safetyLogs.map((log: any) => (
                          <div key={log.id} className="text-xs text-amber-200/90 bg-amber-900/20 p-2 rounded border border-amber-800/40">
                            <span className="font-mono text-[10px] uppercase bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-300 mr-2">
                              {log.event_type}
                            </span>
                            {log.detail}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Transcripts List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-emerald-400" />
                      Voice Conversation Transcripts
                    </h4>
                    {sessionDetail.messages.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">No audio messages transcribed in this session.</p>
                    ) : (
                      <div className="space-y-3">
                        {sessionDetail.messages.map((msg: any) => {
                          const isUser = msg.role === 'user';
                          return (
                            <div
                              key={msg.id}
                              className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                              <div
                                className={`flex size-8 shrink-0 items-center justify-center rounded-full border ${
                                  isUser
                                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                }`}
                              >
                                {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
                              </div>
                              <div
                                className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                                  isUser
                                    ? 'bg-cyan-950/40 border border-cyan-500/20 text-cyan-100 rounded-tr-none'
                                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-70">
                                  <span className="font-semibold uppercase tracking-wider">
                                    {isUser ? 'User' : 'FinGuard Assistant'}
                                  </span>
                                  <span>{formatDate(msg.created_at)}</span>
                                </div>
                                <div>{msg.content}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Feedback rating display if submitted */}
                  {sessionDetail.feedback && sessionDetail.feedback.length > 0 && (
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                      <div className="text-xs font-semibold text-yellow-300 flex items-center gap-1.5">
                        <Star className="size-4 fill-yellow-400 text-yellow-400" />
                        User Rating & Feedback Recorded
                      </div>
                      {sessionDetail.feedback.map((f: any) => (
                        <div key={f.id} className="text-xs text-slate-300">
                          <div className="flex items-center gap-1 text-yellow-400 font-bold mb-1">
                            {Array.from({ length: f.rating }).map((_, i) => (
                              <Star key={i} className="size-3 fill-yellow-400" />
                            ))}
                            <span className="ml-1 text-slate-400 font-normal">({f.rating}/5 stars)</span>
                          </div>
                          {f.feedback_text && <p className="italic text-slate-400">"{f.feedback_text}"</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {activeTab === 'escalations' && (
            <div>
              {escalations.length === 0 ? (
                <div className="text-center py-12 bg-slate-900/30 border border-dashed border-slate-800 rounded-xl">
                  <ShieldAlert className="size-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-300">No human escalation requests recorded yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Human help requests created during caller sessions (e.g., for suspected fraud or official non-delegable disputes) will appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-medium">
                      <tr>
                        <th className="py-3 px-3.5">Reference ID</th>
                        <th className="py-3 px-3.5">Issue Type</th>
                        <th className="py-3 px-3.5 max-w-xs">Short Summary</th>
                        <th className="py-3 px-3.5">Urgency</th>
                        <th className="py-3 px-3.5">Language</th>
                        <th className="py-3 px-3.5">Follow-up</th>
                        <th className="py-3 px-3.5">Date / Time</th>
                        <th className="py-3 px-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {escalations.map((esc) => (
                        <tr key={esc.id || esc.reference_id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3.5 font-mono text-emerald-400 font-bold whitespace-nowrap">
                            {esc.reference_id}
                          </td>
                          <td className="py-3 px-3.5 font-medium text-slate-200 capitalize whitespace-nowrap">
                            {(esc.issue_type || '').replace(/_/g, ' ')}
                          </td>
                          <td className="py-3 px-3.5 text-slate-300 leading-relaxed max-w-xs break-words">
                            {esc.short_summary}
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              (esc.urgency || '').toLowerCase() === 'critical'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : (esc.urgency || '').toLowerCase() === 'high'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : (esc.urgency || '').toLowerCase() === 'medium'
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              {esc.urgency || 'medium'}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap text-slate-400">
                            {esc.language || 'Hindi'}
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap text-slate-400">
                            {esc.preferred_followup_method || esc.preferred_follow_up_method || 'phone_call'}
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                            {formatDate(esc.created_at || esc.timestamp)}
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <Clock className="size-3 text-amber-400" />
                              {esc.status || 'open'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {activeTab === 'analytics' && (
            <div>
              {/* Summary row */}
              {callAnalytics.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-center">
                    <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1 mb-1">
                      <PhoneCall className="size-3 text-emerald-400" /> Total Evaluated
                    </div>
                    <div className="text-2xl font-bold text-white">{callAnalytics.length}</div>
                  </div>
                  <div className="bg-emerald-950/40 border border-emerald-500/25 rounded-xl p-3.5 text-center">
                    <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1 mb-1">
                      <CheckCircle2 className="size-3 text-emerald-400" /> Successful
                    </div>
                    <div className="text-2xl font-bold text-emerald-400">
                      {callAnalytics.filter((c: any) => c.outcome === 'SUCCESS').length}
                    </div>
                  </div>
                  <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-3.5 text-center">
                    <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1 mb-1">
                      <XCircle className="size-3 text-red-400" /> Failed
                    </div>
                    <div className="text-2xl font-bold text-red-400">
                      {callAnalytics.filter((c: any) => c.outcome === 'FAILED').length}
                    </div>
                  </div>
                </div>
              )}

              {callAnalytics.length === 0 ? (
                <div className="text-center py-12 bg-slate-900/30 border border-dashed border-slate-800 rounded-xl">
                  <TrendingUp className="size-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-300">No call analytics recorded yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Complete a financial voice call to record its SUCCESS or FAILED outcome here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-medium">
                      <tr>
                        <th className="py-3 px-3.5">Call ID</th>
                        <th className="py-3 px-3.5">Start Time</th>
                        <th className="py-3 px-3.5">End Time</th>
                        <th className="py-3 px-3.5">Outcome</th>
                        <th className="py-3 px-3.5">Outcome Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {callAnalytics.map((row: any) => (
                        <tr key={row.call_id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3.5 font-mono text-[11px] text-slate-300 max-w-[160px] truncate" title={row.call_id}>
                            {row.call_id}
                          </td>
                          <td className="py-3 px-3.5 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                            {formatDate(row.started_at)}
                          </td>
                          <td className="py-3 px-3.5 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                            {row.ended_at ? formatDate(row.ended_at) : '—'}
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            {row.outcome === 'SUCCESS' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                <CheckCircle2 className="size-3" />
                                SUCCESS
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/15 text-red-400 border border-red-500/25">
                                <XCircle className="size-3" />
                                FAILED
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-slate-400 leading-relaxed">
                            {row.outcome_reason || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
