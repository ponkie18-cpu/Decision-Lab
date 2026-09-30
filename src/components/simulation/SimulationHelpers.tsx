import React from 'react';
import { GameState, Decisions, DecisionLedgerEntry } from '../../types';
import { CheckCircle2, X } from 'lucide-react';

export function ChoiceGroup({ label, options, costs, value, onChange, icon, currentLevel, deadline, round, help }: { label: string; options: string[]; costs: Record<string, number>; value: string; onChange: (v: string) => void; icon?: React.ReactNode; currentLevel?: string; deadline?: number; round?: number; help?: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between opacity-50">
        <div className="flex items-center gap-2">
          {icon}
          <div className="flex flex-col">
            <h4 className="text-[9px] uppercase font-black tracking-widest text-[#64748B]">{label}</h4>
            {help && <span className="text-[7px] text-[#475569] font-bold">{help}</span>}
          </div>
        </div>
        {deadline && round && (
          <div className={`text-[8px] font-mono font-bold uppercase transition-colors ${
            round > deadline ? 'text-red-500 animate-pulse' :
            round === deadline ? 'text-amber-500' : 'text-slate-500'
          }`}>
            {round > deadline ? 'CRITICAL' : round === deadline ? 'DUE NOW' : `DUE MONTH ${deadline}`}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 gap-2">
        {options.map(opt => {
          const isCurrent = currentLevel === opt || (currentLevel?.includes(opt.split(' ')[0]) && opt !== "None" && opt !== "Ignore");
          const isActive = value === opt;
          return (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={`p-3 text-left transition-all border rounded-sm flex justify-between items-center text-[10px] font-bold ${
                isActive
                  ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                  : isCurrent
                    ? 'bg-slate-900 border-emerald-500/30 text-emerald-500/80'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'
              }`}
            >
              <div className="flex flex-col">
                <span>{opt}</span>
                {isCurrent && !isActive && <span className="text-[7px] text-emerald-500 font-mono">CURRENT STATUS</span>}
              </div>
              {!costs[opt] ? null : <span className="font-mono text-[9px] opacity-60">R{costs[opt]}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function OpportunityGate({ state }: { state: GameState }) {
  if (state.module !== 'nomsa_fine') return null;

  const isReg = state.complianceState?.registration.level === 'Completed';
  const isTax = state.complianceState?.tax.level === 'Completed' || state.complianceState?.tax.level === 'Pending';
  const isRecords = state.complianceState?.records.level === 'Strong' || state.complianceState?.records.level === 'Proper';

  const nextOpp = state.round < 4 ? "School Catering Contract" : "Growth Funding Gate";
  const required = state.round < 4 ?
    [{ label: "Business Registration", ok: isReg, critical: true, consequence: "Bids will be disqualified" }, { label: "Tax Clearance", ok: isTax, critical: true, consequence: "Payment cannot be processed" }] :
    [{ label: "Business Registration", ok: isReg, critical: true, consequence: "Application rejected instantly" }, { label: "Tax Clearance", ok: isTax, critical: true, consequence: "Strict funding block" }, { label: "High-Quality Records", ok: isRecords, critical: false, consequence: "Risk score too high for approval" }];

  const isBlocked = required.some(r => !r.ok && (r.critical || state.round >= 4));

  return (
    <div className="bg-[#0D1117] border border-slate-800 p-4 rounded-sm">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-[9px] font-black uppercase text-[#64748B] tracking-widest">Opportunity Readiness</h3>
        <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-sm ${isBlocked ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
          {isBlocked ? 'BLOCKED' : 'READY'}
        </span>
      </div>
      <div className="text-[10px] font-bold text-white uppercase mb-2">Gate: {nextOpp}</div>
      <div className="space-y-1.5">
        {required.map((r, i) => (
          <div key={i} className="group relative">
            <div className="flex items-center justify-between">
              <span className={`text-[8px] uppercase ${r.ok ? 'text-slate-500' : 'text-slate-300 font-bold'}`}>
                {r.label}
                {!r.ok && r.critical && <span className="ml-1 text-[7px] text-red-500 font-black">!</span>}
              </span>
              {r.ok ? <CheckCircle2 size={10} className="text-emerald-500" /> : <X size={10} className="text-red-500" />}
            </div>
            {!r.ok && (
              <div className="hidden group-hover:block absolute left-0 top-full mt-1 z-20 bg-red-950 border border-red-500/30 p-2 rounded-sm shadow-xl w-full">
                <p className="text-[7px] text-red-300 font-black uppercase italic tracking-widest mb-1">Consequence:</p>
                <p className="text-[9px] text-red-200 leading-tight">{r.consequence}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DecisionLedger({ ledger }: { ledger: DecisionLedgerEntry[] }) {
  if (ledger.length === 0) return null;

  return (
    <div className="bg-[#0D1117] border border-slate-800 p-4 rounded-sm">
      <h3 className="text-[9px] font-black uppercase text-[#64748B] tracking-widest mb-3">Audit Trail (Decision Ledger)</h3>
      <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
        {ledger.map((entry, i) => {
          const unit = entry.module === 'event_disaster' ? 'DAY' : (entry.module === 'money_rules' ? 'RND' : 'MONTH');
          const modLabel = entry.module === 'money_rules' ? 'M1' : (entry.module === 'event_disaster' ? 'M2' : 'M3');

          return (
            <div key={i} className="border-l-2 border-slate-800 pl-3 py-1">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[7px] font-black text-slate-500 bg-slate-900 px-1 rounded-sm">{modLabel}</span>
                  <span className="text-[8px] font-black text-blue-400">{unit} {entry.round}</span>
                </div>
                <div className="flex items-center gap-2">
                  {entry.type && <span className="text-[6px] font-black bg-slate-800 text-slate-400 px-1 rounded-[1px] uppercase">{entry.type}</span>}
                  <span className="text-[7px] font-mono text-slate-500 uppercase">{entry.statusChange}</span>
                </div>
              </div>
              <div className="text-[9px] text-slate-200 font-bold uppercase mb-1">{entry.obligation}</div>
              <div className="text-[8px] text-slate-400 leading-tight">
                Action: <span className="text-slate-200">{entry.decision}</span>
              </div>
              <div className="text-[8px] text-slate-500 italic mt-1 flex justify-between items-center">
                <span>{entry.result}</span>
                {entry.impact && <span className={`text-[6px] font-black px-1 rounded-[1px] ${
                  entry.impact === 'CrossModule' ? 'text-indigo-400 bg-indigo-500/10' :
                  entry.impact === 'Delayed' ? 'text-amber-400 bg-amber-500/10' : 'text-blue-400 bg-blue-500/10'
                }`}>{entry.impact} IMPACT</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ComplianceTimeline({ state }: { state: GameState }) {
  if (state.module !== 'nomsa_fine') return null;

  const events = [
    { month: 1, label: 'Records Required' },
    { month: 2, label: 'Registration Due' },
    { month: 3, label: 'Tax Registration' },
    { month: 4, label: 'Contract Opening' },
    { month: 5, label: 'Permit Check' },
    { month: 6, label: 'Funding Gate' },
  ];

  return (
    <div className="bg-[#0D1117] border border-slate-800 p-4 rounded-sm">
      <h3 className="text-[9px] font-black uppercase text-[#64748B] mb-4 tracking-widest">Compliance Timeline</h3>
      <div className="relative">
        <div className="absolute top-1/2 left-0 w-full h-px bg-slate-800 -translate-y-1/2" />
        <div className="flex justify-between relative z-10">
          {events.map((e) => {
            const isCurrent = state.round === e.month;
            const isPast = state.round > e.month;
            return (
              <div key={e.month} className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full border-2 border-[#0A0C10] ${
                  isCurrent ? 'bg-blue-500 ring-2 ring-blue-500/20 scale-125' :
                  isPast ? 'bg-emerald-500' : 'bg-slate-800'
                }`} />
                <div className="mt-2 text-center">
                  <div className={`text-[7px] font-black uppercase tracking-tight ${isCurrent ? 'text-white' : 'text-slate-600'}`}>M{e.month}</div>
                  <div className={`text-[6px] font-mono whitespace-pre w-8 leading-tight ${isCurrent ? 'text-blue-400' : 'text-slate-700'}`}>
                    {e.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
