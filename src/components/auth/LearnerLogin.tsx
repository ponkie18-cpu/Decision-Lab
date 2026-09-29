import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, AlertTriangle, KeyRound } from 'lucide-react';
import { bindLearnerSession, LearnerDoc } from '../../services/learnerPersistenceService';

interface LearnerLoginProps {
  onValidated: (learner: LearnerDoc) => void;
  onOpenFacilitatorPortal?: () => void;
}

export const LearnerLogin: React.FC<LearnerLoginProps> = ({ onValidated, onOpenFacilitatorPortal }) => {
  const [learnerCode, setLearnerCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanCode = learnerCode.trim().toUpperCase();

    if (!cleanCode) {
      setError('Please enter your facilitator-assigned code.');
      return;
    }

    setLoading(true);
    try {
      const result = await bindLearnerSession(cleanCode);
      if (!result.valid || !result.learner) {
        setError(result.error || 'Invalid or unactivated learner code.');
      } else {
        localStorage.setItem('dinaledi360_active_learner_code', cleanCode);
        onValidated(result.learner);
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with database.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 mb-2">
            <KeyRound size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Learner Access Portal</h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Enter your facilitator-assigned anonymous code to access your simulation session.
          </p>
        </div>

        {/* POPIA / Child Protection Shield Note */}
        <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-3.5 flex items-start gap-3">
          <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-emerald-200/80 leading-relaxed">
            <span className="font-semibold text-emerald-300">Privacy Protection Active:</span> No names, emails, or personal details are required or stored. Your identity is held exclusively offline by your facilitator.
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-3.5 flex items-start gap-2.5 text-rose-300 text-xs animate-shake">
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-400" />
            <div className="leading-snug">{error}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
              Anonymous Learner Code
            </label>
            <input
              type="text"
              value={learnerCode}
              onChange={(e) => {
                setLearnerCode(e.target.value.toUpperCase());
                if (error) setError(null);
              }}
              placeholder="e.g. TUCK-2026-014"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-base text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 tracking-wider text-center uppercase"
              disabled={loading}
              autoFocus
            />
            <p className="text-[10px] text-slate-500 text-center font-mono">
              Ask your teacher or facilitator if you do not have your code.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Enter Simulation</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Facilitator Escape Link */}
        {onOpenFacilitatorPortal && (
          <div className="pt-4 border-t border-slate-800 text-center">
            <button
              onClick={onOpenFacilitatorPortal}
              className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors font-mono underline underline-offset-4 cursor-pointer"
            >
              Facilitator / Admin Portal Access
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
