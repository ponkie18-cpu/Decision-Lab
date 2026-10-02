import React, { useState } from 'react';
import {
  ShieldCheck,
  Radio,
  Mic,
  WifiOff,
  Cpu,
  Lock,
  AlertTriangle,
  BarChart3,
  Zap,
  CloudRain,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Clock,
  Layers,
  FileText,
  Flame,
  Sparkles,
  Server,
  ShieldAlert,
  Activity,
  RefreshCw,
  Download,
  Printer,
  UserCheck
} from 'lucide-react';

export const TraderRadarReport: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const sections = [
    { id: 'purpose', title: '1. Purpose & Value' },
    { id: 'capabilities', title: '2. Technical Capabilities' },
    { id: 'metrics', title: '3. Metrics Tracked' },
    { id: 'voice', title: '4. Voice-First Capture' },
    { id: 'offline', title: '5. Offline-First' },
    { id: 'frameworks', title: '6. Frameworks & Stack' },
    { id: 'security', title: '7. Security & Rollout' },
    { id: 'limitations', title: '8. Known Limitations' },
  ];

  const handlePrint = () => {
    window.print();
  };

  const isVisible = (sectionId: string, textContent: string) => {
    if (activeSection !== 'all' && activeSection !== sectionId) return false;
    if (searchFilter.trim() && !textContent.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    return true;
  };

  return (
    <div className="space-y-8 font-sans text-slate-100 print:bg-white print:text-black">
      {/* confidential Banner & Control Bar */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-6 shadow-2xl relative overflow-hidden print:border-none print:shadow-none print:p-0">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] font-mono font-bold rounded uppercase tracking-wider">
                ADMIN ONLY — CONFIDENTIAL
              </span>
              <span className="px-2.5 py-0.5 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-mono font-bold rounded uppercase tracking-wider">
                SNAPSHOT: OCTOBER 2026
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold rounded uppercase tracking-wider flex items-center gap-1">
                <Radio size={12} className="animate-pulse" /> LIVE BUILD STATUS
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              D360 Trader Radar — Technical Capability Report
            </h1>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Comprehensive architectural breakdown detailing how the Trader Radar operates, what metrics it measures, and how it supports cash-based informal traders (spaza shops, street vendors, and market traders). Features behind switched-off flags are explicitly identified.
            </p>
          </div>

          <div className="flex items-center gap-3 print:hidden shrink-0">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-indigo-900/30 cursor-pointer"
            >
              <Printer size={15} />
              Export / Print PDF
            </button>
          </div>
        </div>

        {/* Feature Flag Status Summary Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800 print:hidden">
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg">
            <span className="text-[9px] font-mono uppercase text-slate-400 block font-bold">Trader Insights Alerts</span>
            <span className="text-xs font-mono font-black text-emerald-400 flex items-center gap-1 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Pilot (1 Tester)
            </span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg">
            <span className="text-[9px] font-mono uppercase text-slate-400 block font-bold">Cash Runway Engine</span>
            <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1 mt-1">
              <Clock size={12} /> Shadow / Flag Off
            </span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg">
            <span className="text-[9px] font-mono uppercase text-slate-400 block font-bold">Data Confidence Layer</span>
            <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1 mt-1">
              <Activity size={12} /> Shadow / Flag Off
            </span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg">
            <span className="text-[9px] font-mono uppercase text-slate-400 block font-bold">Voice-First Capture</span>
            <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1 mt-1">
              <Mic size={12} /> Restricted Flag
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3 print:hidden">
        <button
          onClick={() => setActiveSection('all')}
          className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
            activeSection === 'all'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          View All Sections
        </button>
        {sections.map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(sec.id)}
            className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
              activeSection === sec.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {sec.title}
          </button>
        ))}
      </div>

      {/* SECTION 1: Purpose and Value */}
      {isVisible('purpose', 'Purpose and value for the informal trader spaza shops street vendors market traders cash runway weather signals non-advisory SAICA SAIT ZAR Rand') && (
        <section className="bg-[#0F172A] border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
              <BarChart3 size={22} />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest block">
                SECTION 1
              </span>
              <h2 className="text-xl font-bold text-white">
                Purpose and Value for the Informal Trader
              </h2>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            A survival-focused command centre for spaza shops, street vendors and market traders who run on cash and have little time for bookkeeping. Informal traders typically operate under high pressure and low visibility: cash moves fast, stock is bought daily, customers buy on credit, and there is rarely a written record. Conventional accounting software assumes literacy in ledgers and regular desk time. The Trader Radar replaces that with a short daily check-in and plain-language signals.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-bold uppercase">
                <Clock size={16} /> Runway Estimate
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Know how long cash will last — a cash runway estimate in days, not a balance sheet.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase">
                <CloudRain size={16} /> Weather Metaphor Signals
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Spot trouble early — weather-style signals (Clear, Cloudy, Storm, Flash Flood emergency mode).
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase">
                <TrendingUp size={16} /> Missed Sales Visibility
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Track who owes money and which items keep running out, so missed sales become visible.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-mono font-bold uppercase">
                <Mic size={16} /> Voice & Text Review
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Speak or type instead of filling forms — the update is checked by the trader before it is saved.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-sky-400 text-xs font-mono font-bold uppercase">
                <WifiOff size={16} /> Offline Caching
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Keep working with poor signal — cached screens and queued actions sync when connectivity returns.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-mono font-bold uppercase">
                <ShieldAlert size={16} /> Non-Advisory Principle
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                D360 shows patterns and suggested next steps; it never gives regulated financial or tax advice. Prices in South African Rand (ZAR) with local date handling.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 2: Technical Capabilities Table */}
      {isVisible('capabilities', 'Technical capabilities Dual-mode platform Morning Pulse Quick Start Survival Horizon Action Center Money Sales Inventory Voice Runway Intelligence Data Confidence Trader Insights Pilot analytics') && (
        <section className="bg-[#0F172A] border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
              <Zap size={22} />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">
                SECTION 2
              </span>
              <h2 className="text-xl font-bold text-white">
                Technical Capabilities Overview
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                  <th className="py-3 px-4 w-1/4">Capability</th>
                  <th className="py-3 px-4">What it does</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                <tr className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-bold text-indigo-300">Dual-mode platform</td>
                  <td className="py-3 px-4 text-slate-300">Users choose Full D360 (SME) or Trader Radar after login. A persistent mode switch with route guards keeps the two experiences separate; trader inputs never alter Full D360 calculations.</td>
                </tr>
                <tr className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-bold text-indigo-300">Morning Pulse</td>
                  <td className="py-3 px-4 text-slate-300">A 60-second daily check-in (cash on hand, sales, stock spend) that feeds the dashboard gauges in real time.</td>
                </tr>
                <tr className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-bold text-indigo-300">Quick Start</td>
                  <td className="py-3 px-4 text-slate-300">Six-question onboarding that produces an immediate Survival Score and routes straight to the dashboard — no blocking setup.</td>
                </tr>
                <tr className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-bold text-indigo-300">Survival Horizon</td>
                  <td className="py-3 px-4 text-slate-300">Weather metaphor for risk level, including Flash Flood emergency mode with a focused action list.</td>
                </tr>
                <tr className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-bold text-indigo-300">Action Center</td>
                  <td className="py-3 px-4 text-slate-300">Short, prioritised "do this next" cards generated from the trader's own data.</td>
                </tr>
                <tr className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-bold text-indigo-300">Money, Sales, Inventory</td>
                  <td className="py-3 px-4 text-slate-300">Quick sales buttons, stock in/out movements, reorder points using supplier reliability, credit sales and savings/tax jars.</td>
                </tr>
                <tr className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-bold text-indigo-300">Voice / text capture</td>
                  <td className="py-3 px-4 text-slate-300">Short spoken or typed daily update, AI extraction of key numbers, and a mandatory "Check your update" review.</td>
                </tr>
                <tr className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-bold text-amber-300 flex items-center gap-1.5">
                    Runway Intelligence <span className="text-[8px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">Shadow</span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">Server-calculated estimate of days of cash left from confirmed entries (EWMA trend).</td>
                </tr>
                <tr className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-bold text-amber-300 flex items-center gap-1.5">
                    Data Confidence layer <span className="text-[8px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">Shadow</span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">Scores how complete, consistent and well-explained the trader's data is, so insights are presented with appropriate certainty.</td>
                </tr>
                <tr className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-bold text-emerald-300 flex items-center gap-1.5">
                    Trader Insights alerts <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">Pilot</span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">Separate alert stream (cash running low, outstanding customer balance, repeated stock-out, still-learning). Auto-resolves when conditions clear; deduplicated.</td>
                </tr>
                <tr className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-bold text-indigo-300">Pilot analytics</td>
                  <td className="py-3 px-4 text-slate-300">Tracks alerts created, opened, resolved, dismissed, false-positive reports, clarity feedback and continued voice use.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* SECTION 3: Metrics Tracked */}
      {isVisible('metrics', 'Metrics tracked Survival Score SS-6 Liquidity Burn rate Gross margin Efficiency Daily inputs Cash Runway Data Confidence Trader Insights alerts Pilot metrics') && (
        <section className="bg-[#0F172A] border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-400">
              <Activity size={22} />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-widest block">
                SECTION 3
              </span>
              <h2 className="text-xl font-bold text-white">
                Metrics Tracked & Server-Side Formulas
              </h2>
            </div>
          </div>

          <p className="text-xs text-slate-400 font-mono italic">
            Note: All calculations run server-side on the trader's own records to prevent client manipulation.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 3.1 SS-6 Survival Score */}
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-white font-mono flex items-center justify-between border-b border-slate-800 pb-2">
                <span>3.1 Survival Score (SS-6)</span>
                <span className="text-xs text-emerald-400">0 – 100 Score Band</span>
              </h3>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-300">Liquidity (40%)</span>
                  <span className="text-indigo-400 font-bold">Cash on hand relative to short-term needs</span>
                </div>
                <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-300">Burn Rate (30%)</span>
                  <span className="text-amber-400 font-bold">How quickly cash is consumed</span>
                </div>
                <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-300">Gross Margin (15%)</span>
                  <span className="text-emerald-400 font-bold">Profit kept on each sale</span>
                </div>
                <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-300">Efficiency (15%)</span>
                  <span className="text-sky-400 font-bold">Collection speed & current ratio</span>
                </div>
              </div>
            </div>

            {/* 3.2 Daily Inputs & Tags */}
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-white font-mono border-b border-slate-800 pb-2">
                3.2 Daily Inputs Captured
              </h3>
              <ul className="text-xs font-mono space-y-2 text-slate-300">
                <li className="flex justify-between"><span className="text-slate-400">• Cash in safe:</span> Morning Pulse or confirmed update</li>
                <li className="flex justify-between"><span className="text-slate-400">• Daily sales:</span> Quick sales, Morning Pulse or confirmed update</li>
                <li className="flex justify-between"><span className="text-slate-400">• Daily stock spend:</span> Stock movements or confirmed update</li>
                <li className="flex justify-between"><span className="text-slate-400">• Customer balances:</span> Who owes / whom owed (amount, direction, status)</li>
                <li className="flex justify-between"><span className="text-slate-400">• Stock-out events:</span> Items ran out, normalised by case/spacing</li>
              </ul>
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-mono text-slate-400 block font-bold mb-1.5">12 Approved Context Tags:</span>
                <div className="flex flex-wrap gap-1.5 text-[9px] font-mono">
                  {['Market Day', 'Payday', 'Bulk Restock', 'Supplier Credit', 'Rainy Day', 'Public Holiday', 'Pension Day', 'School Event', 'Price Hike', 'Transport Delay', 'Loadshedding', 'Quiet Day'].map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 3.3 Cash Runway */}
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-white font-mono">3.3 Cash Runway</h3>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold rounded">
                  Shadow / Flag Off
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono leading-relaxed">
                Uses confirmed entries only. Daily cash changes divided by days elapsed and smoothed with EWMA (alpha 0.2). Requires at least 3 entries (otherwise "Building").
              </p>
              <div className="flex flex-wrap gap-2 text-[10px] font-mono pt-1">
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">Growing</span>
                <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded">Stable</span>
                <span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded">At Risk (≤14 days)</span>
                <span className="px-2 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded">Critical (≤3 days)</span>
              </div>
            </div>

            {/* 3.4 Data Confidence */}
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-white font-mono">3.4 Data Confidence Engine</h3>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold rounded">
                  Shadow / Flag Off
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="bg-slate-950 p-2 rounded border border-slate-800">Completeness (25%): 30-day window</div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">Consistency (25%): Gaps between entries</div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">Stat Validity (30%): Invalid values check</div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">Context Coverage (20%): Tagged unusual days</div>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono pt-1">
                <span className="text-slate-400">Confidence Bands:</span>
                <span className="text-amber-400">Building 0–39</span>
                <span className="text-sky-400">Developing 40–69</span>
                <span className="text-emerald-400">Reliable 70–100</span>
              </div>
            </div>
          </div>

          {/* 3.5 Trader Insights Alerts Table */}
          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-sm font-bold text-white font-mono mb-3 flex items-center justify-between">
              <span>3.5 Trader Insights Alert Rules (Pilot — 1 Tester)</span>
              <span className="text-xs text-emerald-400 font-normal">Auto-resolving & Deduplicated</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                    <th className="py-2.5 px-3">Alert</th>
                    <th className="py-2.5 px-3">Trigger Condition</th>
                    <th className="py-2.5 px-3">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  <tr className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-3 font-bold text-rose-300">Cash is running low</td>
                    <td className="py-2.5 px-3">Runway Critical or ≤3 days</td>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded">Urgent</span></td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-3 font-bold text-amber-300">Cash position needs attention</td>
                    <td className="py-2.5 px-3">4–14 days runway (never alongside Critical)</td>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded">Action</span></td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-3 font-bold text-sky-300">Customer balance still open</td>
                    <td className="py-2.5 px-3">Open balance older than 7 days (no customer names shown)</td>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 bg-sky-500/20 text-sky-400 rounded">Watch</span></td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-3 font-bold text-indigo-300">Repeated stock-out</td>
                    <td className="py-2.5 px-3">Same item 3+ times in 14 days</td>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded">Watch</span></td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-3 font-bold text-slate-300">Still learning your trading pattern</td>
                    <td className="py-2.5 px-3">Data Confidence = Building</td>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded">Info</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 4: Voice-first capture */}
      {sectionVisibility('voice', 'Voice-first capture microphone session storage Gemini 2.5 Flash Lovable AI Gateway mandatory review validation feature flag transcript')}

      {/* SECTION 5: Offline-first capabilities */}
      {sectionVisibility('offline', 'Offline-first capabilities service worker local cache offline queries sync queue status indicators data export 16px touch targets')}

      {/* SECTION 6: Frameworks underpinning platform */}
      {sectionVisibility('frameworks', 'Frameworks underpinning the platform Survival Intelligence SS-6 Weather engine Human-in-the-loop AI Data Truth ALCOA audit controls Shadow-mode React 18 Vite Supabase Gemini 2.5 Flash Resend Sentry Vitest')}

      {/* SECTION 7: Security, governance and rollout */}
      {sectionVisibility('security', 'Security governance and rollout owner-scoped row-level security RLS feature flags percentage rollout server functions')}

      {/* SECTION 8: Known limitations */}
      {sectionVisibility('limitations', 'Known limitations speech-to-text transcript offline queue alerts refresh context tags Resend domain verified')}
    </div>
  );

  function sectionVisibility(sectionId: string, textContent: string) {
    if (!isVisible(sectionId, textContent)) return null;

    if (sectionId === 'voice') {
      return (
        <section className="bg-[#0F172A] border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400">
              <Mic size={22} />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-widest block">
                SECTION 4
              </span>
              <h2 className="text-xl font-bold text-white">
                Voice-First Capture & AI Extraction Architecture
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
              <span className="text-indigo-400 font-bold block">1. Capture & Fallback</span>
              <p className="text-slate-300 leading-relaxed">
                Trader records a short note in browser or types update. Typing is always available as a fallback when microphone is blocked or unsupported.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
              <span className="text-indigo-400 font-bold block">2. Private Session Storage</span>
              <p className="text-slate-300 leading-relaxed">
                Saved as a private voice session owned by the trader. Original wording is always preserved for audit and verification.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
              <span className="text-indigo-400 font-bold block">3. Server AI Extraction (Gemini 2.5 Flash)</span>
              <p className="text-slate-300 leading-relaxed">
                Protected server function (Gemini 2.5 Flash via Lovable AI Gateway) extracts 9 fields: cash in safe, daily sales, stock spend, customer balance, stock-out item, context tags, clarification flag, clarification question, notes.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
              <span className="text-indigo-400 font-bold block">4. Strict Validation Layer</span>
              <p className="text-slate-300 leading-relaxed">
                Non-negative numeric validation; tags restricted to 12-tag allowlist. Malformed AI output is rejected rather than "repaired". AI never writes directly to business records.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
              <span className="text-indigo-400 font-bold block">5. "Check Your Update" Review</span>
              <p className="text-slate-300 leading-relaxed">
                Trader views parsed results, edits values/tags, then confirms or rejects. States: <span className="text-amber-400">Pending</span>, <span className="text-sky-400">Clarification Required</span>, <span className="text-emerald-400">Ready to Confirm</span>, <span className="text-rose-400">Rejected</span>.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
              <span className="text-indigo-400 font-bold block">6. Persistence & Audit Trail</span>
              <p className="text-slate-300 leading-relaxed">
                Only confirmed updates become daily entries, customer balances, and stock-out records, each with full audit trail and duplicate protection.
              </p>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl text-xs font-mono text-amber-200 space-y-1">
            <span className="font-bold flex items-center gap-1.5 text-amber-400">
              <AlertTriangle size={14} /> Honest Architecture Note
            </span>
            <p>
              Automatic speech-to-text of recorded audio is not yet active; extraction runs on the transcript the trader provides. Voice capture is behind a feature flag and enabled for selected users only.
            </p>
          </div>
        </section>
      );
    }

    if (sectionId === 'offline') {
      return (
        <section className="bg-[#0F172A] border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-400">
              <WifiOff size={22} />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-widest block">
                SECTION 5
              </span>
              <h2 className="text-xl font-bold text-white">
                Offline-First Architecture & Low-Data Budgeting
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1.5">
              <span className="text-emerald-400 font-bold">Service Worker</span>
              <p className="text-slate-300">Caches app shell in production so app opens without signal. Images cache-first; data requests network-first with cached fallback.</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1.5">
              <span className="text-emerald-400 font-bold">Local Cache & Storage</span>
              <p className="text-slate-300">Recent data stored on device with explicit expiry times, ensuring dashboards display last known figures offline.</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1.5">
              <span className="text-emerald-400 font-bold">Offline Mutations Queue</span>
              <p className="text-slate-300">Actions taken offline enter a local sync queue and replay automatically when connectivity returns, showing a "queued" status.</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1.5">
              <span className="text-emerald-400 font-bold">Status Indicators</span>
              <p className="text-slate-300">Offline banner and sync status bar show connection state and queued payload items awaiting synchronization.</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1.5">
              <span className="text-emerald-400 font-bold">Data Export</span>
              <p className="text-slate-300">Traders can export their complete record for safekeeping independently of network availability.</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1.5">
              <span className="text-emerald-400 font-bold">Lightweight UI Targets</span>
              <p className="text-slate-300">Code splitting, query caching (30s – 10m), 16px font inputs (prevents iOS auto-zoom) and 44px touch targets for entry-level phones.</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs font-mono text-slate-400">
            <span className="font-bold text-slate-300 block mb-1">Honest Note on Offline Scope:</span>
            Voice/text updates and AI extraction require an active network connection — they are not yet queued offline. On sign-out, cached data is cleared from the device.
          </div>
        </section>
      );
    }

    if (sectionId === 'frameworks') {
      return (
        <section className="bg-[#0F172A] border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
              <Cpu size={22} />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest block">
                SECTION 6
              </span>
              <h2 className="text-xl font-bold text-white">
                Frameworks & Technology Stack
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono text-xs">
            {/* 6.1 Conceptual */}
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl space-y-3">
              <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">6.1 Conceptual Frameworks</h3>
              <ul className="space-y-2 text-slate-300">
                <li><strong className="text-indigo-300">Survival Intelligence:</strong> Cash, runway, risk focus over compliance accounting.</li>
                <li><strong className="text-indigo-300">SS-6 Survival Score:</strong> Weighted liquidity, burn, margin, efficiency.</li>
                <li><strong className="text-indigo-300">Weather Engine:</strong> Clear/cloudy/storm/Flash Flood readability metaphor.</li>
                <li><strong className="text-indigo-300">Human-in-the-loop AI:</strong> AI suggests, trader confirms before writing.</li>
                <li><strong className="text-indigo-300">Data Truth Layer:</strong> Confidence scoring prevents false conclusions on sparse data.</li>
                <li><strong className="text-indigo-300">Non-advisory Principle:</strong> Disclaimer & SAICA/SAIT professional links.</li>
                <li><strong className="text-indigo-300">ALCOA Audit Controls:</strong> Attributable, legible, contemporaneous, original, accurate DB triggers.</li>
                <li><strong className="text-indigo-300">Shadow-mode Rollout:</strong> Hidden execution before controlled pilot testing.</li>
              </ul>
            </div>

            {/* 6.2 Tech Stack */}
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl space-y-3">
              <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">6.2 Technology Stack</h3>
              <ul className="space-y-2 text-slate-300">
                <li><strong className="text-emerald-300">Interface:</strong> React 18, TypeScript, Vite 5, Tailwind CSS, shadcn/ui, Framer Motion, Recharts.</li>
                <li><strong className="text-emerald-300">Data Fetching:</strong> TanStack Query with offline-aware hooks; Zod validation.</li>
                <li><strong className="text-emerald-300">Backend:</strong> Supabase: Postgres, RLS, Edge Functions (Deno), pg_cron.</li>
                <li><strong className="text-emerald-300">AI:</strong> Lovable AI Gateway — Gemini 2.5 Flash for extraction/insights behind auth functions.</li>
                <li><strong className="text-emerald-300">Email:</strong> Resend for password resets and security notifications.</li>
                <li><strong className="text-emerald-300">Monitoring:</strong> Sentry runtime capture, centralised logger, audit logs, scheduled security scans.</li>
                <li><strong className="text-emerald-300">Quality:</strong> Vitest unit/integration tests, Playwright end-to-end, GitHub Actions CI.</li>
              </ul>
            </div>
          </div>
        </section>
      );
    }

    if (sectionId === 'security') {
      return (
        <section className="bg-[#0F172A] border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400">
              <Lock size={22} />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-widest block">
                SECTION 7
              </span>
              <h2 className="text-xl font-bold text-white">
                Security, Governance & Rollout Controls
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-rose-400 font-bold block">• Row-Level Security (RLS)</span>
              <p className="text-slate-300">Every trader table is owner-scoped; signed-out or cross-tenant access is strictly refused by Postgres policy.</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-rose-400 font-bold block">• Untrusted Client Inputs</span>
              <p className="text-slate-300">All writes execute via secure server functions; client-supplied user IDs or amounts are re-validated server-side.</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-rose-400 font-bold block">• Feature Flags & Overrides</span>
              <p className="text-slate-300">Per-user overrides with percentage rollout. Any failed feature flag evaluation defaults safely to "off".</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-rose-400 font-bold block">• Role Isolation</span>
              <p className="text-slate-300">Admin and evaluator roles are stored separately and checked on the server; this confidential report is protected by identical RBAC guards.</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs font-mono text-slate-300">
            <span className="font-bold text-emerald-400 block mb-1">Current Production Rollout State:</span>
            Trader Insights alerts are live for one pilot tester. Runway Intelligence, Data Confidence Engine, and Voice-First Capture remain off by default for general users.
          </div>
        </section>
      );
    }

    if (sectionId === 'limitations') {
      return (
        <section className="bg-[#0F172A] border border-amber-500/30 rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
              <AlertTriangle size={22} />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">
                SECTION 8
              </span>
              <h2 className="text-xl font-bold text-white">
                Known Limitations & Future Roadmap
              </h2>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-lg text-slate-300 flex items-start gap-2.5">
              <span className="text-amber-400 font-bold">1.</span>
              <p>No automatic speech-to-text audio processing yet; voice updates require a transcript provided by the user.</p>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-lg text-slate-300 flex items-start gap-2.5">
              <span className="text-amber-400 font-bold">2.</span>
              <p>Voice / text updates and AI extractions are not queued offline.</p>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-lg text-slate-300 flex items-start gap-2.5">
              <span className="text-amber-400 font-bold">3.</span>
              <p>Alerts refresh when the dashboard opens, not on a server cron schedule; no SMS/email/push notifications by design.</p>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-lg text-slate-300 flex items-start gap-2.5">
              <span className="text-amber-400 font-bold">4.</span>
              <p>Context tags are recorded but do not yet automatically alter alert severity calculations.</p>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-lg text-slate-300 flex items-start gap-2.5">
              <span className="text-amber-400 font-bold">5.</span>
              <p>Password reset and security emails depend on the sending domain being verified with Resend.</p>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-lg text-slate-300 flex items-start gap-2.5">
              <span className="text-amber-400 font-bold">6.</span>
              <p>No Business Health Score, peer benchmarking, or cash-gap alerts — planned only after pilot evaluation completes.</p>
            </div>
          </div>
        </section>
      );
    }

    return null;
  }
};
