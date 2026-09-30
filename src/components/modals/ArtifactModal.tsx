import React from 'react';
import { motion } from 'motion/react';
import { FileText, X } from 'lucide-react';
import Markdown from 'react-markdown';

interface ArtifactModalProps {
  artifact: string;
  isModule3: boolean;
  isModule4: boolean;
  isModule1: boolean;
  onClose: () => void;
}

export const ArtifactModal: React.FC<ArtifactModalProps> = ({
  artifact,
  isModule3,
  isModule4,
  isModule1,
  onClose
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-[#0F172A]/90 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-[#0A0C10] border border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-sm shadow-2xl"
      >
        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-[#0F172A]">
          <div className="flex items-center gap-3">
            <FileText className="text-blue-400" size={18} />
            <span className="text-xs font-black uppercase tracking-widest text-white">
              {isModule4 ? "Strategic Interaction Report" : (isModule3 ? "Compliance Recovery Plan" : (isModule1 ? "Tuck Shop Performance Report" : "Strategic Artifact"))}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-12 markdown-body text-slate-300">
          <Markdown>{artifact}</Markdown>
        </div>
        <div className="h-16 border-t border-slate-800 bg-[#0F172A] flex items-center justify-between px-8">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest italic">
            Saved to Business File Artifacts
          </div>
          <button
            onClick={onClose}
            className="bg-white text-black px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-slate-200 transition-all shadow-lg"
          >
            Close Report
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
