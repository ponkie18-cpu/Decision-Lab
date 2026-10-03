/**
 * Module 1 - Behavioral Radar View (Individual Admin View)
 * Displays spider/radar behavioral domain chart, round-by-round DTS timeline,
 * behavioral identity tags, and raw LLM forensic feedback panel for worst round.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserAdminProfile, 
  UserBehavioralProfileData 
} from '../../types/admin';
import { getUserBehavioralProfile, MOCK_ADMIN_USERS } from '../../services/adminService';
import { 
  Search, 
  UserCheck, 
  AlertTriangle, 
  Activity, 
  CheckCircle2, 
  ShieldCheck, 
  FileSearch, 
  TrendingUp, 
  Tag, 
  Award, 
  Flame,
  Hash,
  ChevronRight,
  Info
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface BehavioralRadarViewProps {
  currentUser?: UserAdminProfile;
  liveSimulationRun?: any;
}

export const BehavioralRadarView: React.FC<BehavioralRadarViewProps> = ({
  liveSimulationRun,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('usr_101');
  const [profileData, setProfileData] = useState<UserBehavioralProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const data = await getUserBehavioralProfile(selectedUserId, liveSimulationRun);
        setProfileData(data);
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch user behavioral profile.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedUserId, liveSimulationRun]);

  // Memoize user search filtering to prevent expensive re-filtering and redundant string lowercasing on unrelated state updates
  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return MOCK_ADMIN_USERS.filter((u) => !u.isAdmin);
    }
    return MOCK_ADMIN_USERS.filter((u) =>
      !u.isAdmin && (
        u.name.toLowerCase().includes(query) ||
        (u.email ? u.email.toLowerCase().includes(query) : false) ||
        u.id.toLowerCase().includes(query) ||
        u.cohortName.toLowerCase().includes(query)
      )
    );
  }, [searchTerm]);

  return (
    <div className="space-y-8 font-sans text-slate-100">
      {/* Top Search & User Switcher Bar */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
            <UserCheck size={22} />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-indigo-400 tracking-wider uppercase">
              INDIVIDUAL FORENSIC EVALUATION
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Behavioral Radar & Forensic Trace
            </h2>
          </div>
        </div>

        {/* Search input and Dropdown */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative min-w-[240px]">
            <Search size={16} className="absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search user by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
            />
          </div>

          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {filteredUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.id}) - {u.cohortName.slice(0, 22)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-16 text-center space-y-4">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-mono text-slate-400">Fetching simulation trace & computing domain scores...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-red-400 text-xs font-mono">
          <AlertTriangle className="inline mr-2" size={16} /> {error}
        </div>
      ) : profileData ? (
        <>
          {/* User Header Summary Card */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col lg:flex-row justify-between gap-6 pb-6 border-b border-slate-800">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black text-white tracking-tight">
                    {profileData.user.isMinorCohort ? profileData.user.maskedName : profileData.user.name}
                  </h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                    profileData.latestRun.decisionIntegrityTier === 'Tier A' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : profileData.latestRun.decisionIntegrityTier === 'Tier B'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                      : profileData.latestRun.decisionIntegrityTier === 'Tier C'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : 'bg-red-500/10 text-red-400 border border-red-500/30'
                  }`}>
                    {profileData.latestRun.decisionIntegrityTier}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
                  <span>ID: <strong className="text-slate-200">{profileData.user.id}</strong></span>
                  {profileData.user.isMinorCohort ? (
                    <span>Privacy Status: <strong className="text-emerald-400">Minor-Safe Learner (Zero PII)</strong></span>
                  ) : (
                    <span>Email: <strong className="text-slate-200">{profileData.user.email}</strong></span>
                  )}
                  <span>Institution: <strong className="text-indigo-300">{profileData.user.institutionName}</strong></span>
                </div>
              </div>

              {/* Forensic Hash Badge */}
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg font-mono text-[10px] text-slate-400 self-start">
                <Hash size={14} className="text-indigo-400" />
                <span>Simulation Hash:</span>
                <span className="text-indigo-300 font-bold">{profileData.latestRun.simulationHash.slice(0, 18)}...</span>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Decision Tier</span>
                <span className="text-xl font-black text-white">{profileData.latestRun.decisionIntegrityTier}</span>
                <span className="text-[9px] font-mono text-emerald-400 block">{profileData.latestRun.percentileRank}th Percentile</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Credibility Score</span>
                <span className="text-xl font-black text-indigo-400">{profileData.latestRun.credibilityScore} <span className="text-xs font-normal text-slate-500">/ 100</span></span>
                <span className="text-[9px] font-mono text-slate-400 block">Norm Score</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Reliability Index</span>
                <span className={`text-xl font-black ${
                  profileData.latestRun.reliabilityIndex === 'High' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {profileData.latestRun.reliabilityIndex}
                </span>
                <span className="text-[9px] font-mono text-slate-400 block">Decision Consistency</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Volatility Index</span>
                <span className="text-xl font-black text-amber-400">{profileData.latestRun.volatilityIndex}</span>
                <span className="text-[9px] font-mono text-slate-400 block">Price / Action Shift</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1 col-span-2 md:col-span-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Difficulty Index</span>
                <span className="text-xl font-black text-blue-400">{profileData.latestRun.difficultyIndex}</span>
                <span className="text-[9px] font-mono text-slate-400 block">Scenario Weighting</span>
              </div>
            </div>

            {/* Behavioral Identity Tags */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Tag size={12} className="text-indigo-400" /> Detected Behavioral Tags:
              </span>
              <div className="flex flex-wrap gap-2">
                {profileData.latestRun.behavioralTags.map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono text-xs rounded-lg font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Main Grid: Spider Chart & DTS Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 1. Behavioral Domain Radar Chart */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Award size={18} className="text-indigo-400" />
                    <h3 className="font-bold text-white text-base">Behavioral Radar Domains</h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">vs Cohort Benchmark</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Multi-dimensional analysis evaluating domain discipline across financial, compliance, risk, agility, and resilience vectors.
                </p>
              </div>

              {/* Spider Chart Rendering */}
              <div className="w-full h-80 py-2">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={profileData.latestRun.radarDomains}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="domain" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" tick={{ fill: '#64748B', fontSize: 9 }} />
                    <Radar name="User Score" dataKey="score" stroke="#6366F1" fill="#6366F1" fillOpacity={0.5} />
                    <Radar name="Benchmark" dataKey="benchmark" stroke="#10B981" fill="#10B981" fillOpacity={0.15} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-center items-center gap-6 text-xs font-mono pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-indigo-500 rounded-sm"></div>
                  <span className="text-slate-300">User Domain Profile</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500/50 border border-emerald-500 rounded-sm"></div>
                  <span className="text-slate-400">Cohort Benchmark</span>
                </div>
              </div>
            </div>

            {/* 2. Decision Trace Timeline (Round-by-Round DTS) */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={18} className="text-indigo-400" />
                    <h3 className="font-bold text-white text-base">Decision Trace Score (DTS) Timeline</h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">Round Progress</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Round-by-round Decision Trace Score tracking. Notice trajectory shifts following feedback loops or penalty shocks.
                </p>
              </div>

              {/* Line/Area Chart */}
              <div className="w-full h-80 py-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={profileData.latestRun.dtsTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dtsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="round" tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={(r) => `R${r}`} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(val: any) => [`${val} DTS`, 'Decision Trace Score']}
                      labelFormatter={(lbl: any) => `Round ${lbl}`}
                    />
                    <Area type="monotone" dataKey="dts" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#dtsGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-mono pt-2 border-t border-slate-800">
                {profileData.latestRun.dtsTimeline.map((item) => (
                  <div key={item.round} className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block">R{item.round}</span>
                    <span className="font-bold text-indigo-400 block">{item.dts} DTS</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Raw LLM Forensic Feedback Panel (Worst Round Analysis) */}
          <div className="bg-[#0F172A] border border-amber-500/30 rounded-xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
                  <Flame size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-amber-400 tracking-wider uppercase">
                    FORENSIC DEEP DIVE // WORST PERFORMING ROUND (R{profileData.latestRun.worstRound.round})
                  </span>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Causal Breakdown: Obligation → Decision → Consequence
                  </h3>
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold rounded-lg">
                DTS: {profileData.latestRun.worstRound.dts} / 100
              </span>
            </div>

            {/* Tri-stage Causal Chain */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Obligation */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    1. Statutory / Scenario Obligation
                  </span>
                  <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">Context</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {profileData.latestRun.worstRound.obligation}
                </p>
              </div>

              {/* Decision */}
              <div className="bg-slate-900 border border-amber-500/30 p-5 rounded-xl space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                    2. User Action Taken
                  </span>
                  <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">Decision</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {profileData.latestRun.worstRound.decision}
                </p>
              </div>

              {/* Consequence */}
              <div className="bg-slate-900 border border-red-500/30 p-5 rounded-xl space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider">
                    3. System Consequence
                  </span>
                  <span className="text-[9px] font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded">Impact</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {profileData.latestRun.worstRound.consequence}
                </p>
              </div>
            </div>

            {/* Tutor LLM Synthesis Box */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
              <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider block">
                Forensic Tutor Synthesis & Remediation Guidance:
              </span>
              <p className="text-xs text-slate-300 italic leading-relaxed">
                "{profileData.latestRun.worstRound.tutorFeedback}"
              </p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
