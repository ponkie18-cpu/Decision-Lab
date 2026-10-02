/**
 * Admin Dashboard Container
 * Main hub for Institutional Buyers and Evaluators.
 * Wraps view switching between Individual Behavioral Radar View and Aggregate Cohort Evidence Report,
 * protected by AdminRoute RBAC guard.
 */

import React, { useState } from 'react';
import { UserAdminProfile } from '../../types/admin';
import { AdminRoute } from './AdminRoute';
import { BehavioralRadarView } from './BehavioralRadarView';
import { CohortEvidenceReport } from './CohortEvidenceReport';
import { FacilitatorConsentManager } from './FacilitatorConsentManager';
import { AdminAuditLog } from './AdminAuditLog';
import { TraderRadarReport } from './TraderRadarReport';
import { ShieldCheck, UserCheck, Building2, ArrowLeft, KeyRound, Sparkles, UserPlus, Activity, Radio } from 'lucide-react';

interface AdminDashboardProps {
  currentUser: UserAdminProfile;
  liveSimulationRun?: any;
  onExitAdmin: () => void;
  onToggleAdminRole: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  liveSimulationRun,
  onExitAdmin,
  onToggleAdminRole,
}) => {
  const [activeTab, setActiveTab] = useState<'individual' | 'cohort' | 'consent' | 'audit' | 'trader_radar'>('audit');

  return (
    <AdminRoute
      user={currentUser}
      onRedirectToDashboard={onExitAdmin}
      onGrantDemoAdminAccess={onToggleAdminRole}
    >
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 p-4 md:p-8 font-sans space-y-8">
        {/* Admin Navigation Top Header */}
        <header className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <ShieldCheck size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-400 uppercase">
                  DINALEDI360 // INSTITUTIONAL ADMIN PORTAL
                </span>
                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[9px] font-bold rounded uppercase">
                  RBAC: Verified Admin
                </span>
              </div>
              <h1 className="text-xl font-black text-white tracking-tight">
                Forensic Analytics & Behavioral Radar
              </h1>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onToggleAdminRole}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Toggle role flag for testing"
            >
              <KeyRound size={14} className="text-amber-400" />
              Toggle Admin Flag ({currentUser.isAdmin ? 'TRUE' : 'FALSE'})
            </button>

            <button
              onClick={onExitAdmin}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-indigo-900/20"
            >
              <ArrowLeft size={14} />
              Return to User Dashboard
            </button>
          </div>
        </header>

        {/* Tab Navigation Controls */}
        <div className="flex border-b border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab('consent')}
            className={`py-3 px-6 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'consent'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 rounded-t-lg'
            }`}
          >
            <ShieldCheck size={16} />
            1. Learner Anonymous Codes & Consent (POPIA)
          </button>

          <button
            onClick={() => setActiveTab('individual')}
            className={`py-3 px-6 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'individual'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 rounded-t-lg'
            }`}
          >
            <UserCheck size={16} />
            2. Behavioral Radar View (Individual Search)
          </button>

          <button
            onClick={() => setActiveTab('cohort')}
            className={`py-3 px-6 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'cohort'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 rounded-t-lg'
            }`}
          >
            <Building2 size={16} />
            3. Cohort Evidence Report (Aggregate Buyers)
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-6 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'audit'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 rounded-t-lg'
            }`}
          >
            <Activity size={16} />
            4. Real-Time Audit Log (Decision Activity)
          </button>

          <button
            onClick={() => setActiveTab('trader_radar')}
            className={`py-3 px-6 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'trader_radar'
                ? 'border-rose-500 text-rose-400 bg-rose-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 rounded-t-lg'
            }`}
          >
            <Radio size={16} className="text-rose-400 animate-pulse" />
            5. Trader Radar (Confidential Technical Report)
          </button>
        </div>

        {/* Render Tab Contents */}
        <main className="space-y-8">
          {activeTab === 'consent' ? (
            <FacilitatorConsentManager />
          ) : activeTab === 'individual' ? (
            <BehavioralRadarView 
              currentUser={currentUser} 
              liveSimulationRun={liveSimulationRun} 
            />
          ) : activeTab === 'cohort' ? (
            <CohortEvidenceReport />
          ) : activeTab === 'trader_radar' ? (
            <TraderRadarReport />
          ) : (
            <AdminAuditLog />
          )}
        </main>
      </div>
    </AdminRoute>
  );
};
