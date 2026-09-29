import React from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  Lock, 
  PlayCircle, 
  ShieldCheck, 
  AlertTriangle,
  Award,
  BookOpen,
  LayoutDashboard,
  ChevronRight,
  TrendingUp,
  Circle,
  FileText,
  Target
} from 'lucide-react';
import { ModuleType, GameState } from '../types';

interface SidebarProps {
  currentState: GameState;
  onSelectModule: (mod: ModuleType) => void;
  onViewReports: () => void;
  onOpenAdminPortal?: () => void;
}

interface CurriculumModule {
  id: ModuleType;
  title: string;
  subtitle: string;
  category: 'FOUNDATIONS' | 'APPLIED BUSINESS';
  icon: React.ReactNode;
  rounds: number;
  unit: 'Day' | 'Month' | 'Level' | 'Round';
  objectives?: string[];
}

const CURRICULUM: CurriculumModule[] = [
  {
    id: 'money_rules',
    title: 'Money Has Rules',
    subtitle: 'Finance Basics',
    category: 'FOUNDATIONS',
    icon: <BookOpen size={14} />,
    rounds: 12,
    unit: 'Round',
    objectives: ['Money tracking', 'Budgeting basics', 'Flow control']
  },
  {
    id: 'event_disaster',
    title: 'School Event Disaster',
    subtitle: 'Risk & Strategy',
    category: 'FOUNDATIONS',
    icon: <ShieldCheck size={14} />,
    rounds: 5,
    unit: 'Day',
    objectives: ['Risk assessment', 'Resource allocation', 'Contingency planning']
  },
  {
    id: 'nomsa_fine',
    title: 'Nomsa Gets a Fine',
    subtitle: 'Compliance & Growth',
    category: 'FOUNDATIONS',
    icon: <AlertTriangle size={14} />,
    rounds: 6,
    unit: 'Month',
    objectives: ['Compliance rules', 'Penalty management', 'Funding readiness']
  },
  {
    id: 'decision_game',
    title: 'The Decision Game',
    subtitle: 'Strategic Interaction',
    category: 'APPLIED BUSINESS',
    icon: <Target size={14} />,
    rounds: 15,
    unit: 'Round',
    objectives: ['Strategic pricing', 'Trust building', 'Bargaining power']
  },
  {
    id: 'strategy',
    title: 'What is Strategy?',
    subtitle: 'Long-term Planning',
    category: 'APPLIED BUSINESS',
    icon: <TrendingUp size={14} />,
    rounds: 5,
    unit: 'Level',
    objectives: ['Market positioning', 'Competitive advantage', 'Vision alignment']
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ currentState, onSelectModule, onViewReports, onOpenAdminPortal }) => {
  const learningState = currentState.learningState;
  const completedCount = currentState.completedModules.length;
  const totalCount = CURRICULUM.length;
  const globalProgress = (completedCount / totalCount) * 100;

  const currentModuleData = CURRICULUM.find(m => m.id === currentState.module);
  const currentSignal = learningState?.moduleSignals[currentState.module];

  const getTrendIcon = (trajectory?: string) => {
    if (!trajectory) return null;
    if (trajectory.includes('Improving')) return <TrendingUp size={10} className="text-emerald-500" />;
    if (trajectory.includes('Declining')) return <TrendingUp size={10} className="text-red-500 rotate-180" />;
    return <TrendingUp size={10} className="text-amber-500 rotate-90" />;
  };

  const renderModuleCard = (mod: CurriculumModule, index: number) => {
    const status = learningState?.moduleStatus[mod.id] || 'locked';
    const isCompleted = status === 'completed';
    const isActive = currentState.module === mod.id;
    const isLocked = status === 'locked';

    const progressInfo = learningState?.moduleProgress[mod.id] || { current: 0, total: mod.rounds, unit: mod.unit.toLowerCase() as any };
    const progress = isActive ? currentState.round : progressInfo.current;
    const progressUnit = (isActive ? mod.unit : progressInfo.unit).toLowerCase();
    
    // Get performance signals
    const performanceSignal = learningState?.moduleSignals[mod.id] || (isActive || isCompleted ? (() => {
       if (mod.id === 'event_disaster') {
         const lastResult = currentState.history[currentState.history.length - 1]?.results;
         return {
           label: 'Stability',
           value: lastResult?.decisionQuality || 'N/A',
           status: lastResult?.decisionQuality === 'Strong' ? 'success' as const : 'warning' as const
         };
       } else if (mod.id === 'nomsa_fine') {
         const lastResult = currentState.history[currentState.history.length - 1]?.results;
         const statusVal = currentState.reputation > 70 ? 'Healthy' : (currentState.reputation > 40 ? 'Exposed' : 'Critical');
         return {
           label: 'Status',
           value: `${statusVal} / ${lastResult?.trajectory || 'N/A'}`,
           status: statusVal === 'Healthy' ? 'success' as const : (statusVal === 'Critical' ? 'error' as const : 'warning' as const)
         };
       } else if (mod.id === 'money_rules') {
         const statusVal = currentState.cash > 500 ? 'Healthy' : (currentState.cash > 200 ? 'Tight' : 'Critical');
         return {
           label: 'Cash Status',
           value: `${statusVal} (R${currentState.cash.toLocaleString()})`,
           status: statusVal === 'Healthy' ? 'success' as const : (statusVal === 'Critical' ? 'error' as const : 'warning' as const)
         };
       } else if (mod.id === 'decision_game') {
         const cred = learningState?.behaviorIdentity?.credibilityScore || 50;
         const statusVal = cred > 70 ? 'High' : (cred > 40 ? 'Medium' : 'Low');
         return {
           label: 'Credibility',
           value: `${statusVal} (${cred})`,
           status: cred > 70 ? 'success' as const : (cred < 40 ? 'error' as const : 'warning' as const)
         };
       }
       return null;
    })() : null);

    return (
      <button
        key={mod.id}
        disabled={isLocked}
        onClick={() => onSelectModule(mod.id)}
        className={`w-full text-left p-3 rounded-sm border transition-all relative group mb-2 ${
          isActive 
            ? 'bg-slate-900 border-blue-500/50 shadow-lg shadow-blue-500/10' 
            : isLocked 
              ? 'border-slate-800 opacity-40 grayscale cursor-not-allowed'
              : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex justify-between items-start mb-2">
          <div className={`p-1.5 rounded-sm ${isActive ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
            {isLocked ? <Lock size={12} /> : mod.icon}
          </div>
          {isCompleted ? (
            <CheckCircle2 size={14} className="text-emerald-500" />
          ) : isActive ? (
            <div className="text-[9px] font-mono font-bold text-blue-400 uppercase animate-pulse">Live</div>
          ) : null}
        </div>

        <div className="mb-2">
          <h4 className={`text-[11px] font-black uppercase tracking-tighter mb-0.5 ${isActive ? 'text-white' : 'text-slate-300'}`}>
            {mod.title}
          </h4>
          <p className="text-[9px] text-slate-500 font-medium">{mod.subtitle}</p>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1">
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(Math.min(progress, mod.rounds) / mod.rounds) * 100}%` }}
                className={`h-full ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`}
              />
            </div>
          </div>
          <span className="text-[8px] font-mono text-slate-500 shrink-0 uppercase">
            {isActive ? `${mod.unit} ${progress}` : (isCompleted ? 'Finalized' : 'Locked')}
          </span>
        </div>

        {isActive && mod.objectives && (
          <div className="mt-2 space-y-1">
            {mod.objectives.map((obj, i) => (
              <div key={i} className="flex items-center gap-2 text-[8px] text-slate-400 font-mono tracking-tighter">
                <div className="w-1 h-1 bg-blue-500 rounded-full" />
                <span>{obj}</span>
              </div>
            ))}
          </div>
        )}

        {performanceSignal && (
          <div className="mt-3 pt-2 border-t border-slate-800/50 flex justify-between items-center">
            <span className="text-[8px] font-black uppercase tracking-widest text-[#64748B]">{performanceSignal.label}:</span>
            <span className={`text-[8px] font-mono font-bold uppercase ${
              performanceSignal.status === 'success' ? 'text-emerald-500' :
              performanceSignal.status === 'error' ? 'text-red-500' : 'text-amber-500'
            }`}>
              {performanceSignal.value}
            </span>
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0C10] border-r border-slate-800 w-72 shrink-0 overflow-hidden font-sans">
      {/* Header & Global Progress */}
      <div className="p-6 border-b border-slate-800 bg-[#0F172A]">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-blue-600 rounded-sm flex items-center justify-center font-black text-xs">D</div>
          <h1 className="text-sm font-black text-white tracking-widest uppercase">DINALEDI360</h1>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
            <span>Overall Training Progress</span>
            <span className="text-white">{completedCount} / {totalCount} Modules</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${globalProgress}%` }}
              className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
            />
          </div>
        </div>
      </div>

      {/* Current Focus Panel */}
      <div className="p-4 bg-slate-900/50 border-b border-slate-800">
        <h3 className="text-[9px] font-black uppercase text-blue-500 tracking-widest mb-3 flex items-center gap-2">
          <Target size={10} />
          Current Focus
        </h3>
        <div className="space-y-2">
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-white uppercase">{currentModuleData?.title}</span>
            <span className="text-[8px] text-slate-500 font-mono tracking-widest uppercase">
              {currentModuleData?.unit} {currentState.round} of {currentModuleData?.rounds}
            </span>
          </div>
          
          <div className="flex justify-between items-center bg-[#0A0C10] p-2 rounded-sm border border-slate-800">
             <div className="flex flex-col">
                <span className="text-[8px] text-slate-500 uppercase font-bold">Signal</span>
                <span className={`text-[9px] font-black uppercase ${
                  currentSignal?.status === 'success' ? 'text-emerald-500' :
                  currentSignal?.status === 'error' ? 'text-red-500' : 'text-amber-500'
                }`}>
                  {currentSignal?.value || 'Calibrating...'}
                </span>
             </div>
             {currentSignal?.trajectory && (
               <div className="flex flex-col items-end">
                  <span className="text-[8px] text-slate-500 uppercase font-bold">Trajectory</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-black text-blue-400 uppercase">{currentSignal.trajectory}</span>
                    {getTrendIcon(currentSignal.trajectory)}
                  </div>
               </div>
             )}
          </div>
          
          {learningState?.nextRequirement && (
            <div className="p-2 bg-blue-500/5 border border-blue-500/20 rounded-sm">
               <div className="text-[7px] text-blue-400 uppercase font-black tracking-widest mb-1 italic">Tactical Priority:</div>
               <div className="text-[9px] text-blue-300 font-bold uppercase">{learningState.nextRequirement}</div>
            </div>
          )}
        </div>
      </div>

      {/* System Diagnosis Panel */}
      {learningState?.diagnosis && (
        <div className="p-4 bg-[#0F172A] border-b border-slate-800">
          <h3 className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-3 flex items-center gap-2">
            <ShieldCheck size={10} />
            Decision Intelligence
          </h3>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="flex flex-col p-1.5 bg-[#06080A] border border-slate-800 rounded-sm">
              <span className="text-[7px] text-slate-500 uppercase font-bold">Stability</span>
              <span className="text-[8px] font-black text-slate-200 uppercase">{learningState.diagnosis.stability}</span>
            </div>
            <div className="flex flex-col p-1.5 bg-[#06080A] border border-slate-800 rounded-sm">
              <span className="text-[7px] text-slate-500 uppercase font-bold">Ready Score</span>
              <span className="text-[8px] font-black text-slate-200 uppercase">
                {learningState.history.length > 0 ? `${learningState.history[0].score.totalScore}%` : 'N/A'}
              </span>
            </div>
          </div>
          
          <button 
            onClick={onViewReports}
            className="w-full p-2 bg-indigo-600/10 border border-indigo-500/30 rounded-sm flex justify-between items-center group hover:bg-indigo-600/20 transition-all"
          >
            <div className="flex flex-col items-start">
              <span className="text-[8px] font-black text-indigo-300 uppercase tracking-widest">Evidence Layer</span>
              <span className="text-[9px] font-black text-white uppercase italic">Benchmarks & Reports</span>
            </div>
            <Award size={14} className="text-indigo-400 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      )}

      {/* Curriculum List */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#0A0C10]">
        <section className="mb-6">
          <h3 className="text-[9px] font-black uppercase text-[#64748B] tracking-widest mb-4 px-2 flex items-center gap-2">
            <Circle size={8} fill="currentColor" className="text-blue-500" />
            Foundations
          </h3>
          {CURRICULUM.filter(m => m.category === 'FOUNDATIONS').map((mod, i) => renderModuleCard(mod, i))}
        </section>

        <section className="mb-6">
          <h3 className="text-[9px] font-black uppercase text-[#64748B] tracking-widest mb-4 px-2 flex items-center gap-2">
            <Circle size={8} fill="currentColor" className="text-slate-700" />
            Applied Business
          </h3>
          {CURRICULUM.filter(m => m.category === 'APPLIED BUSINESS').map((mod, i) => renderModuleCard(mod, CURRICULUM.findIndex(cat => cat.id === mod.id)))}
        </section>

        <section>
          <h3 className="text-[9px] font-black uppercase text-[#64748B] tracking-widest mb-4 px-2 flex items-center gap-2">
            <FileText size={10} />
            My Business File
          </h3>
          <div className="space-y-4">
            {/* Verified Assets */}
            <div className="space-y-1.5">
              <span className="text-[7px] text-emerald-500 uppercase font-black tracking-widest ml-1">Verified Assets</span>
              {learningState?.assets.filter(a => a.status === 'Verified').length === 0 ? (
                 <div className="p-2 border border-dashed border-slate-800 rounded-sm text-center">
                   <p className="text-[7px] text-slate-700 uppercase font-bold italic">No verified records</p>
                 </div>
              ) : (
                learningState?.assets.filter(a => a.status === 'Verified').map(asset => (
                  <button key={asset.id} className="w-full flex items-center justify-between p-2 bg-[#06080A] border border-slate-800 rounded-sm hover:bg-slate-900 transition-colors group">
                    <div className="flex flex-col items-start">
                      <span className="text-[9px] font-bold uppercase text-slate-300">{asset.name}</span>
                      <span className="text-[7px] font-mono tracking-tighter text-emerald-500">v{asset.version} • {asset.date}</span>
                    </div>
                    <ChevronRight size={10} className="text-slate-600 group-hover:text-slate-400" />
                  </button>
                ))
              )}
            </div>

            {/* Needs Improvement */}
            {learningState?.assets.some(a => a.status !== 'Verified') && (
              <div className="space-y-1.5">
                <span className="text-[7px] text-amber-500 uppercase font-black tracking-widest ml-1">Needs Improvement</span>
                {learningState?.assets.filter(a => a.status !== 'Verified').map(asset => (
                  <button key={asset.id} className="w-full flex items-center justify-between p-2 bg-[#06080A] border border-slate-800/50 rounded-sm hover:bg-slate-900 transition-colors group opacity-70 hover:opacity-100">
                    <div className="flex flex-col items-start">
                      <span className="text-[9px] font-bold uppercase text-slate-400 italic line-through decoration-slate-700">{asset.name}</span>
                      <span className="text-[7px] font-mono tracking-tighter text-amber-500">{asset.status}</span>
                    </div>
                    <ChevronRight size={10} className="text-slate-700" />
                  </button>
                ))}
              </div>
            )}

            {/* Decision Evidence */}
            <div className="space-y-1.5 p-2 bg-indigo-500/5 border border-indigo-500/20 rounded-sm">
              <span className="text-[7px] text-indigo-400 uppercase font-black tracking-widest">Decision Evidence</span>
              <div className="space-y-1 px-1">
                <div className="flex items-center gap-2 text-[8px] text-slate-300 font-mono tracking-tighter">
                  <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                  <span>Stability: <span className="text-indigo-400">{learningState?.diagnosis.stability}</span></span>
                </div>
                <div className="flex items-center gap-2 text-[8px] text-slate-300 font-mono tracking-tighter">
                  <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                  <span>Compliance: <span className="text-indigo-400 uppercase">{learningState?.diagnosis.compliance}</span></span>
                </div>
                <div className="flex items-center gap-2 text-[8px] text-slate-300 font-mono tracking-tighter">
                  <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                  <span>Risk Mgmt: <span className="text-indigo-400 uppercase">{learningState?.diagnosis.risk}</span></span>
                </div>
              </div>
            </div>
            
            <button className="w-full flex items-center justify-between p-2 border border-slate-800 rounded-sm hover:bg-slate-900 transition-colors group">
              <span className="text-[9px] font-bold uppercase text-slate-300">Detailed Training Ledger</span>
              <Award size={12} className="text-slate-600 group-hover:text-slate-400" />
            </button>

            {onOpenAdminPortal && (
              <button 
                onClick={onOpenAdminPortal}
                className="w-full flex items-center justify-between p-2.5 bg-indigo-950/40 border border-indigo-500/40 rounded-sm hover:bg-indigo-900/40 transition-colors group cursor-pointer mt-2"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-indigo-400" />
                  <span className="text-[9px] font-bold uppercase text-indigo-300 tracking-wider">Admin Portal</span>
                </div>
                <ChevronRight size={12} className="text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        </section>
      </div>

      {/* Coach Info */}
      <div className="p-4 border-t border-slate-800 bg-[#06080A]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-ping" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-200 uppercase">Coach Aara</span>
            <span className="text-[8px] text-emerald-500 font-mono tracking-widest uppercase">Intellectual Partner Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
