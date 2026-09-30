import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

interface MarketIntelModalProps {
  onClose: () => void;
}

export const MarketIntelModal: React.FC<MarketIntelModalProps> = ({ onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-8 bg-[#0F172A]/90 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-[#0D1117] border border-slate-700 w-full max-w-lg p-10 space-y-8 rounded-sm shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
        <div className="space-y-2">
          <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em]">Market Intelligence</h3>
          <h2 className="text-2xl font-black uppercase text-white tracking-tighter">Decision Constraint Framing</h2>
        </div>

        <div className="space-y-6">
          <p className="text-slate-400 text-sm leading-relaxed">
            Before you begin, Sipho, you must understand how customers in Thabong react to prices.
            Market research shows most tuck shops sell at these ranges:
          </p>

          <div className="grid grid-cols-1 gap-3">
            {[
              { item: "Chips", range: "R7 – R10", color: "bg-blue-500" },
              { item: "Drinks", range: "R8 – R12", color: "bg-emerald-500" },
              { item: "Sweets", range: "R4 – R6", color: "bg-amber-500" }
            ].map((entry) => (
              <div key={entry.item} className="flex justify-between items-center bg-slate-900/50 p-4 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full ${entry.color}`}></div>
                  <span className="text-[10px] font-black uppercase text-slate-300">{entry.item}</span>
                </div>
                <span className="text-sm font-mono font-bold text-white">{entry.range}</span>
              </div>
            ))}
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-sm flex items-start gap-4">
            <AlertTriangle className="text-amber-500 shrink-0" size={16} />
            <p className="text-[11px] text-amber-200/70 leading-relaxed font-bold uppercase italic">
              "If your price is outside this range, customers will react strongly. They don't care about your costs—they care about their pockets."
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-white text-black py-4 text-[11px] font-black uppercase tracking-widest rounded-sm hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          Understood. Let's Trade.
        </button>
      </motion.div>
    </motion.div>
  );
};
