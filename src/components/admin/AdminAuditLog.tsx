import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Radio,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Layers,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  Code2,
  Pause,
  Play,
  TrendingUp,
  Sparkles,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { AuditLogEntry } from '../../types/admin';
import {
  subscribeToRecentAuditLogs,
  fetchRecentAuditLogs,
  MODULE_NAMES
} from '../../services/auditLogService';

export const AdminAuditLog: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [newLogPulsingId, setNewLogPulsingId] = useState<string | null>(null);

  // Real-time Firestore subscription
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const init = async () => {
      setLoading(true);
      try {
        // Initial fetch to ensure backfill if auditLogs collection was empty
        const initialLogs = await fetchRecentAuditLogs(20);
        setLogs(initialLogs);
        setLastRefreshedAt(new Date());
      } catch (err) {
        console.error('Error in initial audit logs fetch:', err);
      } finally {
        setLoading(false);
      }

      if (isLiveStreaming) {
        unsubscribe = subscribeToRecentAuditLogs(
          (liveLogs) => {
            if (liveLogs.length > 0) {
              setLogs((prev) => {
                // If a brand new log arrived, trigger visual pulse highlight
                if (prev.length > 0 && liveLogs[0].id !== prev[0].id) {
                  setNewLogPulsingId(liveLogs[0].id);
                  setTimeout(() => setNewLogPulsingId(null), 3000);
                }
                return liveLogs;
              });
              setLastRefreshedAt(new Date());
            }
          },
          (err) => {
            console.warn('Real-time listener notice:', err);
          },
          20
        );
      }
    };

    init();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isLiveStreaming]);

  // Manual refresh handler
  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      const refreshed = await fetchRecentAuditLogs(20);
      setLogs(refreshed);
      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error('Failed to manually refresh audit logs:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Search filter by learner code, cohort, or summary
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesLearner = log.learnerCode.toLowerCase().includes(q);
        const matchesCohort = log.cohortId.toLowerCase().includes(q);
        const matchesSummary = log.decisionSummary.toLowerCase().includes(q);
        const matchesResults = log.resultSummary.toLowerCase().includes(q);
        if (!matchesLearner && !matchesCohort && !matchesSummary && !matchesResults) {
          return false;
        }
      }

      // Module filter
      if (selectedModule !== 'all' && log.moduleId !== selectedModule) {
        return false;
      }

      // Severity filter
      if (selectedSeverity !== 'all') {
        if (selectedSeverity === 'critical' && log.severity !== 'critical') return false;
        if (selectedSeverity === 'warning' && log.severity !== 'warning') return false;
        if (selectedSeverity === 'success' && log.severity !== 'success') return false;
      }

      return true;
    });
  }, [logs, searchQuery, selectedModule, selectedSeverity]);

  // Summary Metrics
  const uniqueLearners = useMemo(() => {
    const set = new Set(logs.map((l) => l.learnerCode));
    return set.size;
  }, [logs]);

  const criticalActionsCount = useMemo(() => {
    return logs.filter((l) => l.severity === 'critical').length;
  }, [logs]);

  const activeModulesCount = useMemo(() => {
    const set = new Set(logs.map((l) => l.moduleId));
    return set.size;
  }, [logs]);

  const formatRelativeTime = (timestampStr: string) => {
    try {
      const date = new Date(timestampStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      if (diffSecs < 10) return 'Just now';
      if (diffSecs < 60) return `${diffSecs}s ago`;
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return timestampStr;
    }
  };

  const getModuleBadgeColor = (moduleId: string) => {
    switch (moduleId) {
      case 'money_rules':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'event_disaster':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'nomsa_spaza':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'game_rounds':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertOctagon size={14} className="text-rose-400" />;
      case 'warning':
        return <AlertTriangle size={14} className="text-amber-400" />;
      case 'success':
        return <CheckCircle size={14} className="text-emerald-400" />;
      default:
        return <Activity size={14} className="text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Telemetry Overview */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex h-2.5 w-2.5 relative">
                {isLiveStreaming && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isLiveStreaming ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-emerald-400">
                {isLiveStreaming ? 'FIRESTORE REAL-TIME STREAM ACTIVE' : 'STREAM PAUSED'}
              </span>
              <span className="text-slate-600 text-xs">•</span>
              <span className="text-[10px] font-mono text-slate-400">
                Tracking Last 20 Actions Across All Modules
              </span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Activity className="text-indigo-400" size={22} />
              Institutional Learner Decision Audit Log
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Live chronological ledger of learner submissions, pricing changes, inventory commitments, and evaluated risk responses synchronized directly from Firestore.
            </p>
          </div>

          {/* Control Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsLiveStreaming(!isLiveStreaming)}
              className={`px-3 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                isLiveStreaming
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
              }`}
            >
              {isLiveStreaming ? (
                <>
                  <Pause size={13} />
                  Pause Stream
                </>
              ) : (
                <>
                  <Play size={13} />
                  Resume Live Stream
                </>
              )}
            </button>

            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Force sync from Firestore"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin text-indigo-400' : 'text-slate-400'} />
              Sync Now
            </button>
          </div>
        </div>

        {/* Live Metrics Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-lg p-3">
            <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">Total Actions in Buffer</div>
            <div className="text-xl font-mono font-black text-white mt-0.5">{logs.length} <span className="text-xs font-normal text-slate-500">/ 20</span></div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-lg p-3">
            <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">Unique Learners Active</div>
            <div className="text-xl font-mono font-black text-indigo-400 mt-0.5">{uniqueLearners}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-lg p-3">
            <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">Critical / Risk Events</div>
            <div className="text-xl font-mono font-black text-rose-400 mt-0.5">{criticalActionsCount}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-lg p-3">
            <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">Active Modules Tracked</div>
            <div className="text-xl font-mono font-black text-emerald-400 mt-0.5">{activeModulesCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by anonymous learner code (e.g. TUCK-2026-014), cohort, or decision..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Module Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <Layers size={13} className="text-slate-400" />
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="bg-transparent text-xs font-mono text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-200">All Modules</option>
              <option value="money_rules" className="bg-slate-900 text-slate-200">Tuckshop Math (M1)</option>
              <option value="nomsa_spaza" className="bg-slate-900 text-slate-200">Spaza Compliance (M2)</option>
              <option value="event_disaster" className="bg-slate-900 text-slate-200">Event Planner (M3)</option>
              <option value="game_rounds" className="bg-slate-900 text-slate-200">Strategy Arena (M4)</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <Filter size={13} className="text-slate-400" />
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-transparent text-xs font-mono text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-200">All Outcomes</option>
              <option value="critical" className="bg-slate-900 text-slate-200">Critical Alerts</option>
              <option value="warning" className="bg-slate-900 text-slate-200">Warnings / Stockouts</option>
              <option value="success" className="bg-slate-900 text-slate-200">Profitable / Safe</option>
            </select>
          </div>

          {(searchQuery || selectedModule !== 'all' || selectedSeverity !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedModule('all');
                setSelectedSeverity('all');
              }}
              className="text-xs font-mono text-indigo-400 hover:text-indigo-300 px-2 py-1 underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Real-Time Log Feed */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="px-5 py-3.5 bg-slate-900/80 border-b border-slate-800 flex justify-between items-center text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <Radio size={14} className="text-emerald-400 animate-pulse" />
            <span>Chronological Decision Stream ({filteredLogs.length} matching events)</span>
          </div>
          <div className="text-[10px] text-slate-500 font-normal">
            Refreshed {lastRefreshedAt.toLocaleTimeString()}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw size={24} className="animate-spin text-indigo-400 mx-auto" />
            <div className="text-sm font-mono text-slate-300">Connecting to Firestore Decision Stream...</div>
            <div className="text-xs text-slate-500">Querying module runs and recent round subcollections</div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Activity size={32} className="text-slate-600 mx-auto" />
            <div className="text-sm font-mono text-slate-300 font-bold">No decision logs match active filters</div>
            <div className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search query or module filters to view recent learner simulation decisions.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const isPulsing = newLogPulsingId === log.id;

              return (
                <div
                  key={log.id}
                  className={`p-4 hover:bg-slate-800/30 transition-all ${
                    isPulsing ? 'bg-indigo-950/40 border-l-4 border-indigo-400' : ''
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Left Meta: Timestamp, Learner Code, Module */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400 min-w-[70px]">
                        <Clock size={12} className="text-slate-500" />
                        {formatRelativeTime(log.timestamp)}
                      </span>

                      {/* Learner Code Badge */}
                      <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-md font-mono text-xs font-bold text-white flex items-center gap-1.5 shadow-sm">
                        <User size={12} className="text-indigo-400" />
                        {log.learnerCode}
                      </span>

                      {/* Module Badge */}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getModuleBadgeColor(log.moduleId)}`}>
                        {log.moduleName}
                      </span>

                      {/* Round Indicator */}
                      <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded font-mono text-[10px] text-slate-300 font-bold">
                        R{log.roundNumber}
                      </span>

                      {/* Severity / Outcome Icon */}
                      <span className="flex items-center gap-1 text-[11px] font-mono font-semibold" title={`Outcome: ${log.severity}`}>
                        {getSeverityIcon(log.severity)}
                      </span>
                    </div>

                    {/* Right Toggle */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="px-2 py-1 text-[11px] font-mono text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Code2 size={12} />
                        {isExpanded ? 'Hide Payload' : 'Raw JSON'}
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    </div>
                  </div>

                  {/* Decision & Result Summary */}
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-900/50 border border-slate-800/60 rounded-lg p-3">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-slate-500 font-bold mb-1">
                        Learner Decision
                      </div>
                      <div className="text-xs font-mono text-slate-200">
                        {log.decisionSummary || 'No specific input choices recorded'}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-mono uppercase text-slate-500 font-bold mb-1">
                        Evaluated Consequence
                      </div>
                      <div className="text-xs font-mono text-slate-200">
                        {log.resultSummary || 'Simulation evaluation processed'}
                      </div>
                    </div>
                  </div>

                  {/* Behavioral Tags Detected */}
                  {log.behavioralTags && log.behavioralTags.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Behavioral Pattern:</span>
                      {log.behavioralTags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[10px] font-mono rounded-full font-medium flex items-center gap-1"
                        >
                          <Sparkles size={10} className="text-indigo-400" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Expanded Raw Payload Inspector */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-800">
                      <div className="text-[10px] font-mono uppercase text-slate-400 font-bold mb-2 flex items-center justify-between">
                        <span>Forensic Firestore Document Data</span>
                        <span className="text-slate-500">Document ID: {log.id}</span>
                      </div>
                      <pre className="p-3 bg-[#070A11] border border-slate-800 rounded text-[11px] font-mono text-slate-300 overflow-x-auto max-h-60 leading-relaxed">
                        {JSON.stringify(
                          {
                            id: log.id,
                            timestamp: log.timestamp,
                            createdAtMs: log.createdAtMs,
                            learnerCode: log.learnerCode,
                            cohortId: log.cohortId,
                            moduleId: log.moduleId,
                            roundNumber: log.roundNumber,
                            actionType: log.actionType,
                            decisions: log.decisions,
                            results: log.results,
                            behavioralTags: log.behavioralTags,
                            severity: log.severity
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer info bar */}
        <div className="px-5 py-3 bg-slate-900/60 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono text-slate-500 gap-2">
          <span>Displaying latest decisions across Firestore collections: `auditLogs` & `moduleRuns/*/rounds`</span>
          <span>POPIA Compliant • Minor PII Stripped • Anonymized Learner Codes Only</span>
        </div>
      </div>
    </div>
  );
};
