import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

interface SwitchConfirmModalProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export const SwitchConfirmModal: React.FC<SwitchConfirmModalProps> = ({ onCancel, onConfirm }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-[#0B0F1A] border border-slate-800 p-8 rounded-sm max-w-md w-full shadow-2xl"
      >
        <h3 className="text-sm font-black uppercase text-white tracking-widest mb-4">Confirm Module Switch</h3>
        <p className="text-xs text-slate-400 mb-8 leading-relaxed font-medium">
          Are you sure you want to leave this module?
          <br /><br />
          Your current session progress will be finalized and a decision report will be generated. You can always come back and replay this module later.
        </p>
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 border border-slate-800 text-slate-400 py-3 text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-slate-800 transition-all"
          >
            Stay Here
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-indigo-600 text-white py-3 text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-indigo-500 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]"
          >
            Confirm Switch
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

interface ResetConfirmModalProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({ onCancel, onConfirm }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-[#0B0F1A] border border-red-500/20 p-8 rounded-sm max-w-md w-full shadow-2xl shadow-red-500/5"
      >
        <div className="flex items-center gap-3 mb-4 text-red-500">
          <AlertTriangle size={20} />
          <h3 className="text-sm font-black uppercase tracking-widest">Reset Simulation</h3>
        </div>
        <p className="text-xs text-slate-400 mb-8 leading-relaxed font-medium">
          Are you sure you want to reset your current simulation history for this module?
          <br /><br />
          This will wipe out all decisions and results for the current run, starting you back at the baseline round. This action cannot be undone.
        </p>
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 border border-slate-800 text-slate-400 py-3 text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-slate-800 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-950/40 hover:bg-red-900/40 border border-red-500/30 text-red-400 py-3 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all shadow-[0_0_20px_rgba(239,68,68,0.15)] cursor-pointer"
          >
            Confirm Reset
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
