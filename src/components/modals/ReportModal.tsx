import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import Markdown from 'react-markdown';
import { ModuleRun } from '../../types';
import { generateIndividualReport } from '../../services/reportingService';

interface ReportModalProps {
  currentRunReport: string;
  history: ModuleRun[];
  onSelectReport: (report: string) => void;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  currentRunReport,
  history,
  onSelectReport,
  onClose
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-8 bg-[#0F172A]/95 backdrop-blur-xl"
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-[#000000] border border-indigo-500/30 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col rounded-sm shadow-[0_0_100px_rgba(79,70,229,0.15)]"
      >
        <div className="h-20 border-b border-indigo-500/20 flex items-center justify-between px-10 bg-gradient-to-r from-indigo-950/40 to-transparent">
          <div>
            <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.3em] mb-1">Decision Intelligence Report</h3>
            <h2 className="text-xl font-black uppercase text-white tracking-tighter italic">SME Readiness Benchmark</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center border border-slate-800 hover:bg-slate-800 rounded-sm text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(15,23,42,1),rgba(0,0,0,1))]">
          {history.length > 1 && (
            <div className="mb-8 flex gap-2 overflow-x-auto pb-4 border-b border-indigo-500/10">
              {history.map((run, idx) => {
                const rText = generateIndividualReport(run);
                return (
                  <button
                    key={run.id}
                    onClick={() => onSelectReport(rText)}
                    className={`shrink-0 px-4 py-2 text-[8px] font-black uppercase tracking-widest border rounded-sm transition-all ${
                      currentRunReport === rText
                      ? 'bg-indigo-600 border-indigo-400 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'
                    }`}
                  >
                    {run.attemptType === 'baseline' ? 'Baseline' : `Replay #${history.length - idx}`}
                    <div className="text-[6px] opacity-60 mt-1">{new Date(run.timestamp).toLocaleDateString()}</div>
                  </button>
                );
              })}
            </div>
          )}
          <div className="markdown-body prose prose-invert prose-sm max-w-none">
            <Markdown>{currentRunReport}</Markdown>
          </div>
        </div>

        <div className="p-8 border-t border-indigo-500/20 bg-indigo-950/20 flex gap-4">
          <button
            onClick={() => {
              const blob = new Blob([currentRunReport], { type: 'text/markdown' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `SME_Report_${new Date().toISOString().split('T')[0]}.md`;
              a.click();
            }}
            className="flex-1 border border-indigo-500/40 text-indigo-300 py-4 text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-indigo-500/10 transition-all font-mono"
          >
            Download Evidence (.MD)
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-white text-black py-4 text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            Acknowledge & Continue
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
