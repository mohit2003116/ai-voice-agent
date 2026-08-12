'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Clock,
  RefreshCw,
  X,
  AlertTriangle,
  PhoneCall,
  MessageSquare,
  Globe,
  Tag,
  CheckCircle2,
  Lock,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface EscalationRecord {
  id: number;
  reference_id: string;
  user_id: string | null;
  session_id: string | null;
  issue_type: string;
  short_summary: string;
  urgency: string;
  language: string;
  preferred_followup_method: string;
  status: string;
  created_at: string;
}

interface EscalationDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EscalationDashboardModal({ isOpen, onClose }: EscalationDashboardModalProps) {
  const [loading, setLoading] = useState(false);
  const [escalations, setEscalations] = useState<EscalationRecord[]>([]);

  const fetchEscalations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/escalations');
      const data = await res.json();

      if (data.success) {
        setEscalations(data.escalations || []);
      } else {
        toast.error('Failed to load human escalations');
      }
    } catch (err) {
      console.error('Error fetching escalations:', err);
      toast.error('Could not connect to database for escalations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEscalations();
    }
  }, [isOpen]);

  const formatDate = (isoStr: string) => {
    if (!isoStr) return 'N/A';
    try {
      const dt = new Date(isoStr);
      return dt.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    const u = urgency.toLowerCase();
    if (u === 'critical') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
          <AlertTriangle className="size-3 text-red-400" />
          Critical
        </span>
      );
    }
    if (u === 'high') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
          High
        </span>
      );
    }
    if (u === 'medium') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
          Medium
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
        Low
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'resolved') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="size-3" />
          Resolved
        </span>
      );
    }
    if (s === 'in_review' || s === 'in review') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          <UserCheck className="size-3" />
          In Review
        </span>
      );
    }
    if (s === 'closed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
          Closed
        </span>
      );
    }
    // Default open status
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
        <Clock className="size-3 text-amber-400" />
        Open
      </span>
    );
  };

  const formatFollowupMethod = (method: string) => {
    const m = method.toLowerCase();
    if (m === 'phone_call' || m === 'phone call') return 'Phone Call';
    if (m === 'callback') return 'Callback';
    if (m === 'sms') return 'SMS';
    if (m === 'whatsapp') return 'WhatsApp';
    return method;
  };

  const formatIssueType = (issue: string) => {
    if (issue === 'suspected_fraud') return 'Suspected Fraud';
    if (issue === 'official_decision_dispute') return 'Official Decision Dispute';
    if (issue === 'scheme_eligibility_dispute') return 'Scheme Eligibility Dispute';
    return issue.replace(/_/g, ' ');
  };

  if (!isOpen) return null;

  const totalCount = escalations.length;
  const criticalCount = escalations.filter((e) => e.urgency?.toLowerCase() === 'critical').length;
  const openCount = escalations.filter((e) => (e.status || 'open').toLowerCase() === 'open').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative max-w-5xl w-[95vw] max-h-[85vh] flex flex-col bg-slate-950/95 border border-emerald-500/30 backdrop-blur-2xl text-slate-100 shadow-2xl p-0 overflow-hidden rounded-2xl">
        
        {/* Header */}
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
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <ShieldAlert className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  Human Escalation Dashboard
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Day 7 Escalations
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                  <Lock className="size-3 text-emerald-400 inline" />
                  Sensitive caller data (OTP, PIN, CVV, Passwords, Card/Account #) strictly redacted
                </p>
              </div>
            </div>

            <button
              onClick={fetchEscalations}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 px-3 py-1.5 rounded-lg transition-all"
            >
              <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-800/80">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-2.5">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldAlert className="size-3 text-amber-400" /> Total Requests
              </div>
              <div className="text-lg font-bold text-white mt-0.5">{totalCount}</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-2.5">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <AlertTriangle className="size-3 text-red-400" /> Critical Urgency
              </div>
              <div className="text-lg font-bold text-red-400 mt-0.5">{criticalCount}</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-2.5">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="size-3 text-cyan-400" /> Open Requests
              </div>
              <div className="text-lg font-bold text-cyan-400 mt-0.5">{openCount}</div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <RefreshCw className="size-6 animate-spin text-emerald-400" />
              <p className="text-xs">Loading human escalation requests from database...</p>
            </div>
          ) : escalations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 gap-3 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
              <ShieldAlert className="size-10 text-slate-600" />
              <p className="text-sm font-medium text-slate-300">No human escalation requests found</p>
              <p className="text-xs text-slate-500 max-w-sm">
                Human help requests created during caller sessions (e.g. for suspected financial fraud or official non-delegable disputes) will be listed here.
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
                    <tr
                      key={esc.id || esc.reference_id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Reference ID */}
                      <td className="py-3 px-3.5 font-mono text-emerald-400 font-bold whitespace-nowrap">
                        {esc.reference_id}
                      </td>

                      {/* Issue Type */}
                      <td className="py-3 px-3.5 font-medium text-slate-200 capitalize whitespace-nowrap">
                        {formatIssueType(esc.issue_type)}
                      </td>

                      {/* Short Summary */}
                      <td className="py-3 px-3.5 text-slate-300 leading-relaxed max-w-xs break-words">
                        {esc.short_summary}
                      </td>

                      {/* Urgency */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {getUrgencyBadge(esc.urgency)}
                      </td>

                      {/* Language */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Globe className="size-3 text-slate-500" />
                          {esc.language || 'Hindi'}
                        </span>
                      </td>

                      {/* Preferred Follow-up */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <PhoneCall className="size-3 text-slate-500" />
                          {formatFollowupMethod(esc.preferred_followup_method)}
                        </span>
                      </td>

                      {/* Date/Time */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                        {formatDate(esc.created_at)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {getStatusBadge(esc.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950 flex justify-between items-center text-xs text-slate-500">
          <span>Showing latest {escalations.length} escalation requests</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
