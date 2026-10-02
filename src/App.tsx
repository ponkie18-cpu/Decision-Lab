/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  AlertTriangle,
  History,
  Play,
  MapPin,
  Music,
  Utensils,
  ShieldAlert,
  ShieldCheck,
  CloudRain,
  FileText,
  X,
  CheckCircle2,
  Activity,
  TrendingDown,
  TrendingUp,
  Minus
} from 'lucide-react';
import { INITIAL_STATE, INITIAL_STATE_MODULE_1, INITIAL_STATE_MODULE_2, INITIAL_STATE_MODULE_3, INITIAL_STATE_MODULE_4, RoundRecord, GameState, Decisions, ModuleType, LearningState, M3_COSTS, DecisionLedgerEntry, ModuleRun } from './types';
import { UserAdminProfile } from './types/admin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { RegistrationForm } from './components/auth/RegistrationForm';
import { LoginForm } from './components/auth/LoginForm';
import { LearnerLogin } from './components/auth/LearnerLogin';
import { getCurrentSessionUser, logoutUser } from './services/authService';
import { 
  validateLearnerConsent, 
  getActiveRun, 
  startModuleRun, 
  saveRoundRecord, 
  completeModuleRun, 
  LearnerDoc, 
  FirestoreModuleRun 
} from './services/learnerPersistenceService';
import { UserPlus, LogIn, LogOut, User } from 'lucide-react';
import { simulateRound } from './services/simulationService';
import { calculateModule1Score, calculateModule3Score, generateIndividualReport } from './services/reportingService';
import Markdown from 'react-markdown';
import { Sidebar } from './components/Sidebar';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAdminProfile>(() => {
    return getCurrentSessionUser() || {
      id: 'usr_admin_tsadinaledi',
      name: 'TSA Dinaledi Master Admin',
      email: 'scrf@tsadinaledi.co.za',
      institutionId: 'inst_tsa_01',
      institutionName: 'TSA Dinaledi Headquarters',
      cohortId: 'cohort_2026_master',
      cohortName: '2026 National Executive Cohort',
      role: 'admin',
      isAdmin: true,
      createdAt: new Date().toISOString(),
      attemptsCount: 0,
      isMinorCohort: false,
    };
  });
  const [authRoute, setAuthRoute] = useState<'dashboard' | 'admin' | 'login' | 'register' | 'learner_login'>(() => {
    const cachedCode = localStorage.getItem('dinaledi360_active_learner_code');
    return cachedCode ? 'dashboard' : 'learner_login';
  });

  // Learner Anonymous Identity & Persistence State
  const [activeLearner, setActiveLearner] = useState<LearnerDoc | null>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [learningState, setLearningState] = useState<LearningState>(INITIAL_STATE.learningState!);

  const [decisions, setDecisions] = useState<Decisions>({
    venue: "Basic setup",
    entertainment: "None",
    food: "Low food order",
    safety: "No safety plan",
    backup: "None",
  });
  
  // Module 1 specific decisions
  const [m1Decisions, setM1Decisions] = useState<Decisions>({
    chipsPrice: "7",
    drinksPrice: "8",
    sweetsPrice: "4",
    chipsRestock: "20",
    drinksRestock: "20",
    sweetsRestock: "20",
  });
  
  // Module 3 specific decisions
  const [m3Decisions, setM3Decisions] = useState<Decisions>({
    registration: "Delay registration",
    tax: "Delay",
    employees: "Ignore obligations",
    permit: "Ignore",
    records: "Basic records",
  });
  const [m4Decisions, setM4Decisions] = useState({
    price: "Medium Price",
    action: "Cooperate",
    offer: "90"
  });

  const [loading, setLoading] = useState(false);
  const [showTutorMode, setShowTutorMode] = useState(false);
  const [showArtifact, setShowArtifact] = useState(false);
  const [showMarketIntel, setShowMarketIntel] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [pendingModule, setPendingModule] = useState<ModuleType | null>(null);
  const [currentRunReport, setCurrentRunReport] = useState<string | null>(null);
  const [lastRound, setLastRound] = useState<RoundRecord | null>(null);
  const [toasts, setToasts] = useState<Array<{
    id: string;
    message: string;
    metric: string;
    impact: 'positive' | 'negative' | 'neutral' | 'warning';
  }>>([]);

  const triggerDecisionToast = (category: string, value: string, prevValue: string) => {
    let message = "";
    let metric = "";
    let impact: 'positive' | 'negative' | 'neutral' | 'warning' = 'neutral';

    // Module 1 logic
    if (isModule1) {
      if (category.endsWith('Price')) {
        const itemType = category.replace('Price', '');
        const cost = itemType === 'chips' ? 5 : itemType === 'drinks' ? 6 : 3;
        const valNum = parseFloat(value) || 0;
        const prevNum = parseFloat(prevValue) || 0;

        if (valNum < cost) {
          metric = "Profit Margin";
          impact = "negative";
          message = `Selling ${itemType} at R${valNum} is below cost (R${cost})! This will result in direct losses.`;
        } else if (valNum > prevNum) {
          metric = "Profit Margin";
          impact = "positive";
          message = `Raised ${itemType} price to R${valNum}. Optimizes per-unit profit, but may reduce sales volume.`;
        } else if (valNum < prevNum) {
          metric = "Customer Demand";
          impact = "positive";
          message = `Lowered ${itemType} price to R${valNum}. Stimulates customer demand, but reduces unit margin.`;
        }
      } else if (category.endsWith('Restock')) {
        const itemType = category.replace('Restock', '');
        const valNum = parseInt(value) || 0;
        const prevNum = parseInt(prevValue) || 0;

        if (valNum > prevNum) {
          metric = "Operational Efficiency";
          impact = "positive";
          message = `Increased ${itemType} restock to ${valNum} units. Lowers stockout risk, but spends more cash upfront.`;
        } else if (valNum < prevNum) {
          metric = "Cash Preservation";
          impact = "positive";
          message = `Reduced ${itemType} restock to ${valNum} units. Saves immediate cash runway, but risks customer stockouts.`;
        }
      }
    } 
    // Module 2 logic
    else if (state.module === 'event_disaster') {
      const m2Ranks: Record<string, number> = {
        "None": 0, "Basic setup": 1, "Proper setup": 2, "Premium setup": 3,
        "Cheap DJ": 1, "Reliable DJ": 2,
        "Low food order": 1, "Balanced food order": 2, "Large food order": 3,
        "No safety plan": 0, "Basic safety plan": 1, "Proper safety plan": 2,
        "Rain backup": 1, "Supplier backup": 1, "Full backup plan": 2
      };

      const prevRank = m2Ranks[prevValue] || 0;
      const nextRank = m2Ranks[value] || 0;

      if (nextRank > prevRank) {
        metric = "Event Readiness";
        impact = "positive";
        message = `Upgraded ${category} to ${value}. Enhances crowd satisfaction & mitigates disaster risks.`;
      } else if (nextRank < prevRank) {
        metric = "Cash Preservation";
        impact = "warning";
        message = `Downgraded ${category} to ${value}. Saves immediate budget, but increases vulnerability to event failure.`;
      }
    } 
    // Module 3 logic
    else if (isModule3) {
      const isComply = (val: string) => {
        return ["Register now", "Register / file correctly", "Register workers / keep records", "Apply for required permit", "Keep proper invoices and records"].includes(val);
      };

      const valComply = isComply(value);
      const prevComply = isComply(prevValue);

      if (valComply && !prevComply) {
        metric = "Compliance Level";
        impact = "positive";
        message = `Selected: "${value}". Shields the business from legal fines and opens tender opportunities.`;
      } else if (!valComply && prevComply) {
        metric = "Cash Preservation";
        impact = "warning";
        message = `Delayed compliance: "${value}". Saves cash today, but risks compounding penalties and blocks contracts.`;
      }
    } 
    // Module 4 logic
    else if (isModule4) {
      if (category === 'price') {
        if (value === 'High Price') {
          metric = "Profit Margin";
          impact = "positive";
          message = "High Price targets premium margins, but risks losing market share if competitor undercuts.";
        } else if (value === 'Medium Price') {
          metric = "Market Balance";
          impact = "neutral";
          message = "Medium Price maintains stable shared market pricing and balances margin/volume.";
        } else {
          metric = "Market Share";
          impact = "warning";
          message = "Low Price pursues maximum sales volume, but risks triggering an aggressive price war.";
        }
      } else if (category === 'action') {
        if (value === 'Cooperate') {
          metric = "Strategic Trust";
          impact = "positive";
          message = "Cooperate signals stability and mutual goodwill, building high-value cooperative trust.";
        } else if (value === 'Compromise') {
          metric = "Defensive Balance";
          impact = "neutral";
          message = "Compromise balances risk, protecting your margins while avoiding full aggression.";
        } else {
          metric = "Aggressive Attack";
          impact = "warning";
          message = "Undercutting damages mutual trust and risks triggering permanent, costly retaliation.";
        }
      } else if (category === 'offer') {
        const valNum = parseInt(value) || 0;
        const prevNum = parseInt(prevValue) || 0;
        if (valNum > prevNum) {
          metric = "Negotiation Demand";
          impact = "positive";
          message = `Demanded R${valNum}. Aims to extract higher payoff, but risks deal collapse.`;
        } else {
          metric = "Deal Settlement";
          impact = "neutral";
          message = `Adjusted demand to R${valNum}. Increases probability of securing an agreement.`;
        }
      }
    }

    if (message && metric) {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts(prev => [...prev, { id, message, metric, impact }]);
      
      // Auto-remove toast after 4 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    }
  };

  const isModule3 = state.module === 'nomsa_fine';
  const isModule4 = state.module === 'decision_game';
  const isModule1 = state.module === 'money_rules';
  const isModuleReady = isModule1 || isModule3 || isModule4 || state.module === 'event_disaster';

  React.useEffect(() => {
    if (isModule1 && state.round === 1 && !lastRound && !showMarketIntel) {
      setShowMarketIntel(true);
    }
  }, [isModule1, state.round, lastRound]);

  // Validate learner and sync active run from Firestore
  React.useEffect(() => {
    const initLearnerSession = async () => {
      const cachedCode = localStorage.getItem('dinaledi360_active_learner_code');
      if (!cachedCode) {
        setAuthRoute('learner_login');
        return;
      }

      try {
        const validation = await validateLearnerConsent(cachedCode);
        if (!validation.valid || !validation.learner) {
          localStorage.removeItem('dinaledi360_active_learner_code');
          setActiveLearner(null);
          setAuthRoute('learner_login');
          return;
        }

        setActiveLearner(validation.learner);

        // Fetch or create run for active module
        const activeRes = await getActiveRun(validation.learner.learnerCode, state.module);
        if (activeRes.run) {
          setActiveRunId(activeRes.run.runId);
          // If rounds exist in Firestore, restore history
          if (activeRes.rounds && activeRes.rounds.length > 0) {
            const lastRd = activeRes.rounds[activeRes.rounds.length - 1];
            setLastRound(lastRd);
            setState(prev => ({
              ...prev,
              round: activeRes.run!.currentRound || (lastRd.round + 1),
              history: activeRes.rounds
            }));
          }
        } else {
          // Initialize new run strictly gated by consent
          const newRun = await startModuleRun(
            validation.learner.learnerCode,
            validation.learner.cohortId,
            state.module,
            'baseline'
          );
          setActiveRunId(newRun.runId);
        }
      } catch (e) {
        console.error('Failed to init Firestore learner session:', e);
      }
    };

    initLearnerSession();
  }, [state.module]);

  const switchModule = (mod: ModuleType, force = false) => {
    // Lock check
    const status = learningState.moduleStatus[mod] || 'locked';
    const isReplay = state.module === mod;
    
    if (status === 'locked' && !isReplay) {
      return; 
    }

    // Check if in progress
    const isInProgress = state.round > 1 && !state.completedModules.includes(state.module);
    if (isInProgress && !force && state.module !== mod) {
      setPendingModule(mod);
      setShowSwitchConfirm(true);
      return;
    }

    let baseState: GameState;
    if (mod === 'money_rules') {
      baseState = INITIAL_STATE_MODULE_1;
    } else if (mod === 'event_disaster') {
      baseState = INITIAL_STATE_MODULE_2;
    } else if (mod === 'nomsa_fine') {
      baseState = INITIAL_STATE_MODULE_3;
      
      // Cross-Module Influence: Stability & Profile affects starting position
      const m2Signals = learningState.moduleSignals['event_disaster'];
      const profile = learningState.behaviorProfile;
      
      if (m2Signals || profile.stability === 'low') {
         if (m2Signals?.status === 'error' || profile.stability === 'low') {
           baseState = { 
             ...baseState, 
             reputation: 35, 
             cash: 4500,
             risks: [...baseState.risks, "Residual instability from previous business activities"] 
           };
         }
      }

      if (profile.complianceDiscipline === 'weak') {
        baseState = {
          ...baseState,
          reputation: Math.max(20, baseState.reputation - 15),
          risks: [...baseState.risks, "Warning: Background checks indicate compliance drift"]
        };
      }
    } else if (mod === 'decision_game') {
      baseState = {
        ...INITIAL_STATE_MODULE_4,
        learningState: {
          ...INITIAL_STATE_MODULE_4.learningState!,
          moduleProgress: { 'decision_game': { current: 1, total: 15, unit: 'round' } }
        }
      };
    } else {
      baseState = { ...INITIAL_STATE_MODULE_2, module: mod };
    }

    const newState: GameState = {
      ...baseState,
      completedModules: state.completedModules,
      learningState: {
        ...learningState,
        currentModule: mod,
        history: learningState.history, // PERSISTENCE FIX
        userProfile: learningState.userProfile, // PERSISTENCE FIX
        moduleStatus: {
          ...learningState.moduleStatus,
          [mod]: learningState.moduleStatus[mod] === 'completed' ? 'completed' : 'in_progress'
        }
      }
    };

    setState(newState);
    setLearningState(newState.learningState!);
    
    setDecisions({
      venue: "Basic setup",
      entertainment: "None",
      food: "Low food order",
      safety: "No safety plan",
      backup: "None",
    });
    setM3Decisions({
      registration: "Delay registration",
      tax: "Delay",
      employees: "Ignore obligations",
      permit: "Ignore",
      records: "Basic records",
    });
    setM4Decisions({
      price: "Medium Price",
      action: "Cooperate",
      offer: "Accept Offer"
    });
    setM1Decisions({
      chipsPrice: "7",
      drinksPrice: "8",
      sweetsPrice: "4",
      chipsRestock: "20",
      drinksRestock: "20",
      sweetsRestock: "20",
    });
    setLastRound(null);
    setShowTutorMode(false);
  };

  const handleDecisionChange = (category: string, value: string) => {
    let prevValue = "";
    if (isModule4) {
      prevValue = (m4Decisions as any)[category] || "";
      setM4Decisions(prev => ({ ...prev, [category]: value }));
    } else if (isModule3) {
      prevValue = m3Decisions[category] || "";
      setM3Decisions(prev => ({ ...prev, [category]: value }));
    } else if (isModule1) {
      prevValue = m1Decisions[category] || "";
      setM1Decisions(prev => ({ ...prev, [category]: value }));
    } else {
      prevValue = decisions[category] || "";
      setDecisions(prev => ({ ...prev, [category]: value }));
    }

    if (prevValue !== value) {
      triggerDecisionToast(category, value, prevValue);
    }
  };

  const costs: Record<string, number> = {
    "None": 0,
    "Basic setup": 500, "Proper setup": 1200, "Premium setup": 2000,
    "Cheap DJ": 800, "Reliable DJ": 1500,
    "Low food order": 800, "Balanced food order": 1500, "Large food order": 2300,
    "Basic safety plan": 500, "Proper safety plan": 1000,
    "Rain backup": 700, "Supplier backup": 700, "Full backup plan": 1200,
  };

  const calculateRoundCost = () => {
    let total = 0;
    if (isModule1) {
      const cR = parseInt(m1Decisions.chipsRestock) || 0;
      const dR = parseInt(m1Decisions.drinksRestock) || 0;
      const sR = parseInt(m1Decisions.sweetsRestock) || 0;
      total = (cR * 5) + (dR * 6) + (sR * 3);
    } else if (isModule3) {
      if (m3Decisions.registration !== state.complianceState?.registration.level) total += M3_COSTS[m3Decisions.registration] || 0;
      if (m3Decisions.tax !== state.complianceState?.tax.level) total += M3_COSTS[m3Decisions.tax] || 0;
      if (m3Decisions.employees !== state.complianceState?.employees.level) total += M3_COSTS[m3Decisions.employees] || 0;
      if (m3Decisions.permit !== state.complianceState?.permit.level) total += M3_COSTS[m3Decisions.permit] || 0;
      if (m3Decisions.records !== state.complianceState?.records.level) total += M3_COSTS[m3Decisions.records] || 0;
    } else {
      if (decisions.venue !== state.eventReadiness?.venue.level) total += costs[decisions.venue] || 0;
      if (decisions.entertainment !== state.eventReadiness?.entertainment.level) total += costs[decisions.entertainment] || 0;
      if (decisions.food !== state.eventReadiness?.food.level) total += costs[decisions.food] || 0;
      if (decisions.safety !== state.eventReadiness?.safety.level) total += costs[decisions.safety] || 0;
      if (decisions.backup !== state.eventReadiness?.backup.level) total += costs[decisions.backup] || 0;
    }
    return total;
  };

  const totalSpend = calculateRoundCost();
  
  const handleExecuteRound = async () => {
    setLoading(true);
    setShowTutorMode(false);
    try {
      const currentDecisions = isModule4 ? m4Decisions : (isModule3 ? m3Decisions : (isModule1 ? m1Decisions : decisions));
      const totalSpend = calculateRoundCost();
      const stateWithCosts = { ...state, cash: state.cash - totalSpend };
      const { newState, ...results } = await simulateRound(stateWithCosts, currentDecisions);
      
      const record: RoundRecord = {
        round: state.round,
        decisions: JSON.parse(JSON.stringify(currentDecisions)),
        results: results as any,
      };

      setLastRound(record);

      // Firestore Persistent Sync
      if (activeRunId) {
        saveRoundRecord(
          activeRunId,
          state.round,
          currentDecisions,
          results as any,
          newState.round || (state.round + 1)
        ).catch((err) => console.error('Failed to persist round to Firestore:', err));
      }
      
      const isFinalRound = (isModule3 ? state.round === 6 : (isModule4 ? state.round === 15 : (isModule1 ? state.round === 12 : state.round === 5)));
      if (results.constraintViolation || isFinalRound || (isModule1 && results.decisionQuality === 'Unstable')) {
        setShowTutorMode(true);
      }

      setState(prev => {
        let updatedCompleted = [...prev.completedModules];
        let updatedModuleStatus = { ...learningState.moduleStatus };
        let updatedModuleSignals = { ...learningState.moduleSignals };
        let updatedAssets = [...learningState.assets];
        
        const isFinalRound = (isModule4 ? prev.round === 15 : (isModule3 ? prev.round === 6 : (isModule1 ? prev.round === 12 : prev.round === 5)));
        
        if (isFinalRound) {
          if (!updatedCompleted.includes(prev.module)) {
            updatedCompleted.push(prev.module);
          }
          updatedModuleStatus[prev.module] = 'completed';
          
          // Competency Unlock Logic
          if (prev.module === 'money_rules') {
            updatedModuleStatus['event_disaster'] = 'available';
          } else if (prev.module === 'event_disaster') {
            // Unlock M3 only if Stability is decent
            if (results.stabilityScore >= 2) {
              updatedModuleStatus['nomsa_fine'] = 'available';
            }
          } else if (prev.module === 'nomsa_fine') {
            // Unlock M4 if Reputation is decent
            if (prev.reputation >= 40) {
              updatedModuleStatus['decision_game'] = 'available';
            }
          } else if (prev.module === 'decision_game') {
             updatedModuleStatus['strategy'] = 'available';
          }

          // Create Asset in the Business File
          if (results.artifact) {
            let assetName = "Verification Report";
            if (prev.module === 'event_disaster') assetName = "School Event Risk Plan";
            else if (prev.module === 'nomsa_fine') assetName = "Compliance Health Report";
            else if (prev.module === 'decision_game') assetName = "Strategic Interaction Report";
            // Check if asset already exists for this module to handle versioning
            const existingAssets = updatedAssets.filter(a => a.module === prev.module);
            const latestVersion = existingAssets.length > 0 
                ? Math.max(...existingAssets.map(a => a.version))
                : 0;

            const newAsset = {
              id: `${prev.module}_v${latestVersion + 1}_${Date.now()}`,
              name: `${assetName} (V${latestVersion + 1})`,
              type: "Verification Report",
              module: prev.module,
              status: (results.decisionQuality === 'Strong' ? 'Verified' : (results.decisionQuality === 'Risky' ? 'Needs Improvement' : 'Draft')) as any,
              content: results.artifact,
              normalizedData: results.normalizedArtifact,
              date: new Date().toLocaleDateString(),
              version: latestVersion + 1,
              createdAt: Date.now()
            };
            
            updatedAssets.push(newAsset);
          }
        }

        // Behavior Profile Update Logic
        let updatedProfile = { ...learningState.behaviorProfile };
        if (results.stabilityScore < 2) updatedProfile.stability = 'low';
        else if (results.stabilityScore >= 4) updatedProfile.stability = 'high';
        
        if (isModule3) {
          if (prev.reputation < 40) updatedProfile.complianceDiscipline = 'weak';
          else if (prev.reputation > 80) updatedProfile.complianceDiscipline = 'strong';
        }

        // Diagnosis Update Logic
        const updatedDiagnosis = {
          stability: updatedProfile.stability === 'high' ? 'Solid' : (updatedProfile.stability === 'low' ? 'Unstable' : 'Moderate'),
          compliance: updatedProfile.complianceDiscipline === 'strong' ? 'Compliant' : 'Exposed',
          risk: results.stabilityScore < 2 ? 'High' : 'Controlled',
          overall: (updatedProfile.stability === 'low' && updatedProfile.complianceDiscipline === 'weak') ? 'NOT READY' : 
                   ((updatedProfile.stability === 'low' || updatedProfile.complianceDiscipline === 'weak') ? 'AT RISK' : 'READY')
        };

        const isFinal = (isModule4 ? prev.round === 15 : (isModule3 ? prev.round === 6 : (isModule1 ? prev.round === 12 : prev.round === 5)));
        let updatedHistory = [...learningState.history];
        
        if (isFinal) {
           const runHistory = [...prev.history, record];
           // Dedicated scoring functions for each module
           const score = prev.module === 'event_disaster' 
             ? calculateModule3Score(runHistory) 
             : calculateModule1Score(runHistory);
           
           const run: ModuleRun = {
             id: activeRunId || Math.random().toString(36).substr(2, 9),
             userId: activeLearner?.learnerCode || 'anonymous',
             moduleId: prev.module,
             timestamp: new Date().toISOString(),
             rounds: runHistory,
             finalState: { ...prev, ...newState, history: runHistory } as any,
             score,
             attemptType: learningState.history.some(h => h.moduleId === prev.module) ? 'replay' : 'baseline'
           };
           updatedHistory = [run, ...updatedHistory];

           if (activeRunId) {
             completeModuleRun(activeRunId).catch(err => console.error('Failed to complete Firestore run:', err));
           }
           
           setCurrentRunReport(generateIndividualReport(run));
           setShowReport(true);
        }

        const updatedBehaviorIdentity = newState?.learningState?.behaviorIdentity || learningState.behaviorIdentity;

        // Decision Ledger Entry
        let updatedLedger = [...learningState.decisionLedger];
        if (results.ledgerEntry) {
          updatedLedger.push({
            module: prev.module,
            round: prev.round,
            ...results.ledgerEntry
          });
        }

        // Always update signals to reflect latest performance
        const statusVal = results.opportunityReadiness || 'Low';
        if (prev.module === 'decision_game') {
          updatedModuleSignals[prev.module] = {
            label: 'Market Share',
            value: results.marketShare || '50/50',
            status: results.profit && results.profit > 60 ? 'success' : 'warning',
            trajectory: results.trajectory,
            stability: results.stabilityScore
          };
        } else {
          updatedModuleSignals[prev.module] = {
            label: isModule3 ? 'Compliance' : 'Stability',
            value: isModule3 ? (prev.reputation > 70 ? 'Healthy' : (prev.reputation > 40 ? 'Exposed' : 'Critical')) : (results.decisionQuality),
            status: (isModule3 ? (prev.reputation > 70 ? 'success' : (prev.reputation > 40 ? 'warning' : 'error')) : (results.decisionQuality === 'Strong' ? 'success' : 'warning')) as any,
            trajectory: results.trajectory,
            stability: results.stabilityScore
          };
        }

        const newLearningState: LearningState = {
          ...learningState,
          moduleStatus: updatedModuleStatus,
          moduleSignals: updatedModuleSignals,
          moduleProgress: {
             ...learningState.moduleProgress,
             [prev.module]: { 
                current: newState.round, 
                total: isModule4 ? 15 : (isModule3 ? 6 : (isModule1 ? 12 : 5)),
                unit: (isModule4 ? 'round' : (isModule3 ? 'month' : (isModule1 ? 'round' : 'day'))) as any
             }
          },
          behaviorProfile: updatedProfile,
          behaviorIdentity: updatedBehaviorIdentity,
          interactionHistory: newState?.learningState?.interactionHistory || learningState.interactionHistory,
          diagnosis: updatedDiagnosis,
          decisionLedger: updatedLedger,
          history: updatedHistory,
          nextRequirement: results.nextRequirement,
          assets: updatedAssets
        };
        
        setLearningState(newLearningState);

        return {
          ...prev,
          ...newState,
          history: [...prev.history, record],
          completedModules: updatedCompleted,
          learningState: newLearningState
        };
      });
    } catch (error) {
      console.error("Simulation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Route 0: Learner Anonymous Access Portal (POPIA & Minor Safe)
  if (authRoute === 'learner_login') {
    return (
      <LearnerLogin
        onValidated={(learner) => {
          setActiveLearner(learner);
          setAuthRoute('dashboard');
        }}
        onOpenFacilitatorPortal={() => setAuthRoute('login')}
      />
    );
  }

  // Route 1: Registration Form
  if (authRoute === 'register') {
    return (
      <div className="bg-[#0B0F19] min-h-screen text-slate-100 flex flex-col font-sans">
        <header className="bg-[#0F172A] border-b border-slate-800 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold tracking-widest text-indigo-400 uppercase">
              DINALEDI360 // REGISTRATION PORTAL
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAuthRoute('login')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogIn size={14} />
              Sign In
            </button>
            <button
              onClick={() => setAuthRoute('dashboard')}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-mono font-bold transition-colors cursor-pointer"
            >
              Simulation Dashboard
            </button>
          </div>
        </header>

        <RegistrationForm
          onSuccess={(registeredUser) => {
            setCurrentUser(registeredUser);
            if (registeredUser.isAdmin) {
              setAuthRoute('admin');
            } else {
              setAuthRoute('dashboard');
            }
          }}
          onSwitchToLogin={() => setAuthRoute('login')}
        />
      </div>
    );
  }

  // Route 2: Login Form
  if (authRoute === 'login') {
    return (
      <div className="bg-[#0B0F19] min-h-screen text-slate-100 flex flex-col font-sans">
        <header className="bg-[#0F172A] border-b border-slate-800 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold tracking-widest text-indigo-400 uppercase">
              DINALEDI360 // AUTHENTICATION PORTAL
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAuthRoute('register')}
              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <UserPlus size={14} />
              Register Account
            </button>
            <button
              onClick={() => setAuthRoute('dashboard')}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-mono font-bold transition-colors cursor-pointer"
            >
              Simulation Dashboard
            </button>
          </div>
        </header>

        <LoginForm
          onSuccess={(loggedInUser) => {
            setCurrentUser(loggedInUser);
            if (loggedInUser.isAdmin) {
              setAuthRoute('admin');
            } else {
              setAuthRoute('dashboard');
            }
          }}
          onSwitchToRegister={() => setAuthRoute('register')}
        />
      </div>
    );
  }

  // Route 3: Admin Portal
  if (authRoute === 'admin') {
    return (
      <AdminDashboard
        currentUser={currentUser}
        liveSimulationRun={{
          id: 'run_sim_live',
          moduleId: state.module,
          rounds: state.history,
          timestamp: new Date().toISOString()
        }}
        onExitAdmin={() => setAuthRoute('dashboard')}
        onToggleAdminRole={() => setCurrentUser(prev => {
          if (prev.isMinorCohort) {
            const adultProfile: UserAdminProfile = {
              id: prev.id,
              name: prev.maskedName,
              email: `${prev.id}@dinaledi360.co.za`,
              institutionId: prev.institutionId,
              institutionName: prev.institutionName,
              cohortId: prev.cohortId,
              cohortName: prev.cohortName,
              role: 'admin',
              isAdmin: true,
              createdAt: prev.createdAt,
              attemptsCount: prev.attemptsCount,
              isMinorCohort: false,
            };
            return adultProfile;
          }
          const adultPrev = prev as import('./types/admin').AdultParticipantProfile;
          const updated: UserAdminProfile = {
            ...adultPrev,
            isAdmin: !adultPrev.isAdmin,
            role: !adultPrev.isAdmin ? 'admin' : adultPrev.role,
          };
          return updated;
        })}
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#06080A] text-slate-200 overflow-hidden selection:bg-blue-500/30">
      <Sidebar 
        currentState={state} 
        onSelectModule={switchModule} 
        onViewReports={() => {
          if (learningState.history.length > 0) {
            setCurrentRunReport(generateIndividualReport(learningState.history[0]));
            setShowReport(true);
          }
        }}
        onOpenAdminPortal={() => setAuthRoute('admin')}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation / Status Bar */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-[#0F172A] sticky top-0 z-10 font-mono shrink-0">
          <div className="flex items-center gap-3 text-xs">
            <div className={`w-2 h-2 ${isModule4 ? 'bg-indigo-500' : (isModule3 ? 'bg-emerald-500' : (isModule1 ? 'bg-blue-500' : 'bg-red-500'))} rounded-full animate-pulse`}></div>
            <span className="font-bold tracking-widest text-[#64748B]">
              DINALEDI360 // {isModule4 ? "THE DECISION GAME" : (isModule3 ? "NOMSA GETS A FINE" : (isModule1 ? "MONEY HAS RULES" : "SCHOOL EVENT PLANNER"))}
            </span>
          </div>
          <div className="flex items-center gap-5 text-[10px]">
          <div className="flex flex-col">
            <span className="text-[#64748B] uppercase">{isModule3 ? "MONTH" : (isModule1 || isModule4 ? "ROUND" : "DAY")}</span>
            <span className="text-blue-400 font-bold">{state.round} / {isModule4 ? 15 : (isModule3 ? 6 : (isModule1 ? 12 : 5))}</span>
          </div>
          {isModule4 ? (
            <>
              <div className="flex flex-col">
                <span className="text-[#64748B] uppercase">INTEGRITY TIER</span>
                <span className={`font-bold ${
                  learningState.behaviorIdentity?.decisionIntegrityTier === 'Tier A' ? 'text-emerald-500' :
                  learningState.behaviorIdentity?.decisionIntegrityTier === 'Tier B' ? 'text-blue-400' :
                  learningState.behaviorIdentity?.decisionIntegrityTier === 'Tier C' ? 'text-amber-500' : 'text-red-500'
                }`}>
                  {learningState.behaviorIdentity?.decisionIntegrityTier || 'Pending'}
                </span>
                {learningState.behaviorIdentity?.percentileRank && (
                  <span className="text-[7px] text-slate-500 font-bold uppercase">{learningState.behaviorIdentity.percentileRank}th Percentile</span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-[#64748B] uppercase">CREDIBILITY</span>
                <div className="flex items-baseline gap-1">
                  <span className={`font-bold ${
                    (learningState.behaviorIdentity?.credibilityScore || 0) > 70 ? 'text-emerald-500' :
                    (learningState.behaviorIdentity?.credibilityScore || 0) > 40 ? 'text-blue-400' : 'text-red-500'
                  }`}>
                    {learningState.behaviorIdentity?.credibilityScore || 50}
                  </span>
                  {learningState.behaviorIdentity?.normalizedScore && (
                    <span className="text-[7px] text-indigo-400 font-bold" title="Normalized for difficulty">({learningState.behaviorIdentity.normalizedScore}N)</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[#64748B] uppercase">RELIABILITY</span>
                <span className={`font-bold uppercase ${
                  (learningState.behaviorIdentity?.reliabilityIndex === 'High') ? 'text-emerald-500' :
                  (learningState.behaviorIdentity?.reliabilityIndex === 'Low') ? 'text-red-500' : 'text-blue-400'
                }`}>
                  {learningState.behaviorIdentity?.reliabilityIndex || 'Medium'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[#64748B] uppercase">TRUST</span>
                <span className={`font-bold uppercase ${
                  state.reputation > 70 ? 'text-emerald-500' : 
                  state.reputation > 40 ? 'text-amber-500' : 'text-red-500'
                }`}>{state.reputation > 70 ? 'High' : state.reputation > 40 ? 'Med' : 'Low'}</span>
              </div>
            </>
          ) : (isModule3 ? (
            <div className="flex flex-col">
              <span className="text-[#64748B] uppercase">MONTHLY SALES</span>
              <span className="text-emerald-400 font-bold uppercase">R{state.sales?.toLocaleString()}</span>
            </div>
          ) : isModule1 ? (
            <div className="flex flex-col">
              <span className="text-[#64748B] uppercase">CASH STATUS</span>
              <span className={`font-bold uppercase ${
                state.cash > 500 ? 'text-emerald-500' : state.cash > 200 ? 'text-amber-500' : 'text-red-500'
              }`}>{state.cash > 500 ? 'Healthy' : state.cash > 200 ? 'Tight' : 'Critical'}</span>
            </div>
          ) : (
            <div className="flex flex-col">
              <span className="text-[#64748B] uppercase">EXPECTED ATTENDANCE</span>
              <span className="text-emerald-400 font-bold uppercase">{state.expectedAttendance}</span>
            </div>
          ))}
          <div className="flex flex-col items-end">
            <span className="text-[#64748B] uppercase">CASH</span>
            <span className="text-white font-bold">R{state.cash.toLocaleString()}</span>
          </div>

          {/* User Status & Navigation Header Bar */}
          <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
            {activeLearner ? (
              <div className="px-2.5 py-1 bg-emerald-950/40 border border-emerald-500/30 rounded flex items-center gap-1.5 text-[10px]">
                <ShieldCheck size={13} className="text-emerald-400" />
                <span className="text-emerald-200 font-mono font-bold tracking-wider" title="Facilitator-assigned anonymous code">
                  {activeLearner.learnerCode}
                </span>
                <span className="px-1 bg-emerald-500/20 text-emerald-400 font-bold text-[8px] rounded uppercase font-mono">
                  CONSENT VERIFIED
                </span>
              </div>
            ) : (
              <div className="px-2 py-1 bg-slate-900 border border-slate-800 rounded flex items-center gap-1.5 text-[9px]">
                <User size={12} className="text-indigo-400" />
                <span className="text-slate-300 font-bold max-w-[110px] truncate" title={currentUser.email}>
                  {currentUser.name}
                </span>
                {currentUser.isAdmin && (
                  <span className="px-1 bg-emerald-500/20 text-emerald-400 font-bold text-[8px] rounded uppercase">
                    Admin
                  </span>
                )}
              </div>
            )}

            <button
              onClick={() => {
                localStorage.removeItem('dinaledi360_active_learner_code');
                setActiveLearner(null);
                setAuthRoute('learner_login');
              }}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9px] font-mono font-bold uppercase flex items-center gap-1 transition-colors cursor-pointer"
              title="Switch Anonymous Learner Code"
            >
              <LogIn size={11} />
              Learner Code
            </button>

            <button 
              onClick={() => setAuthRoute('admin')}
              className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
              title="Open Admin Portal"
            >
              <ShieldCheck size={12} className="text-indigo-400" />
              <span>Admin</span>
            </button>

            <button 
              onClick={() => setShowResetConfirm(true)}
              className="p-1 hover:text-white text-[#64748B] transition-colors"
              title="Reset Simulation"
            >
              <History size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Simulation View */}
      <main className="flex-1 grid grid-cols-12 gap-px bg-slate-800 h-[calc(100vh-112px)] overflow-hidden">
        {!isModuleReady ? (
          <div className="col-span-12 bg-[#0A0C10] flex flex-col items-center justify-center text-center p-12">
            <div className="max-w-md space-y-6">
              <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center justify-center mx-auto">
                <Play className="text-blue-500" size={24} />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter">Module In Development</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                We are currently building the specialized simulation for <span className="text-blue-400 font-bold">{state.module === 'money_rules' ? 'Money Has Rules' : state.module}</span>. 
                <br /><br />
                Please start with <span className="text-white font-bold italic">Module 2: School Event Disaster</span> to begin your journey.
              </p>
              <button 
                onClick={() => switchModule('event_disaster')}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[10px] rounded-sm transition-all"
              >
                Jump to Module 2
              </button>
            </div>
          </div>
        ) : (
          <div className="contents">
            {/* Left Panel: Decision Making */}
        <div className="col-span-12 lg:col-span-4 bg-[#0A0C10] p-6 flex flex-col gap-6 overflow-y-auto border-r border-slate-800">
          <div className="flex justify-between items-center">
            <h2 className="text-[10px] font-bold text-[#64748B] uppercase tracking-tighter">
              {isModule4 ? "Strategic Decision Matrix" : (isModule3 ? "Compliance Strategy Deck" : (isModule1 ? "Tuck Shop Decision Engine" : "Strategic Planning Deck"))}
            </h2>
            <span className="text-[9px] font-mono text-indigo-400 font-bold italic">
              {isModule4 ? (
                state.round <= 5 ? `Scenario 1: Price War (R ${state.round})` :
                state.round <= 10 ? `Scenario 2: Partnership (R ${state.round - 5})` :
                `Scenario 3: Negotiation (R ${state.round - 10})`
              ) : (isModule3 ? `Month ${state.round} Decisions` : (isModule1 ? `Round ${state.round} Operations` : `Day ${state.round} Execution`))}
            </span>
          </div>
          
          <div className="bg-[#0D1117] border border-slate-800 p-6 space-y-6">
            {isModule4 && (
               <div className="space-y-6">
                  <div className="bg-indigo-500/5 border border-indigo-500/20 p-4 rounded-sm">
                    <h4 className="text-[9px] font-black uppercase text-indigo-400 mb-3 tracking-widest">
                       {state.round <= 5 ? "Market Intelligence" : (state.round <= 10 ? "Partner Relations" : "Counterparty Status")}
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="flex flex-col">
                          <span className="text-[7px] text-slate-500 uppercase font-bold">
                            {state.round <= 5 ? "Market Share" : (state.round <= 10 ? "Shared Payoff" : "Target Price")}
                          </span>
                          <span className="text-xl font-black text-white italic">
                            {state.round <= 5 ? (learningState.moduleSignals['decision_game']?.value || '50/50') : 
                             (state.round <= 10 ? 'None' : 'R85')}
                          </span>
                       </div>
                       <div className="flex flex-col items-end">
                          <span className="text-[7px] text-slate-500 uppercase font-bold">
                            {state.round <= 10 ? "Trust Level" : "Supplier Trust"}
                          </span>
                          <span className={`text-xl font-black ${
                            state.reputation > 70 ? 'text-emerald-500' : 
                            state.reputation > 40 ? 'text-amber-500' : 'text-red-500'
                          }`}>
                            {state.reputation > 70 ? 'HI' : state.reputation > 40 ? 'MED' : 'LOW'}
                          </span>
                       </div>
                    </div>
                    {state.round === 15 && lastRound && (
                      <button 
                        onClick={() => setShowArtifact(true)}
                        className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white py-2 text-[8px] font-black uppercase tracking-widest rounded-sm transition-all flex items-center justify-center gap-2"
                      >
                        <FileText size={12} />
                        View Strategic Interaction Report
                      </button>
                    )}
                  </div>

                  {state.round <= 5 && (
                    <ChoiceGroup 
                      label="Product Pricing" 
                      icon={<BarChart3 size={12} />}
                      value={m4Decisions.price} 
                      options={["High Price", "Medium Price", "Low Price"]} 
                      costs={{}}
                      round={state.round}
                      onChange={(v) => handleDecisionChange('price', v)} 
                    />
                  )}
                  {state.round > 5 && state.round <= 10 && (
                    <ChoiceGroup 
                      label="Partner Action" 
                      icon={<BarChart3 size={12} />}
                      value={m4Decisions.action} 
                      options={["Cooperate", "Defect"]} 
                      costs={{}}
                      round={state.round}
                      onChange={(v) => handleDecisionChange('action', v)} 
                    />
                  )}
                  {state.round > 10 && (
                    <ChoiceGroup 
                      label="Negotiation Move" 
                      icon={<BarChart3 size={12} />}
                      value={m4Decisions.offer} 
                      options={["Accept Offer", "Counter Fair", "Counter Low", "Walk Away"]} 
                      costs={{}}
                      round={state.round}
                      onChange={(v) => handleDecisionChange('offer', v)} 
                    />
                  )}
                  <div className="pt-4 border-t border-slate-800">
                    <DecisionLedger ledger={learningState.decisionLedger} />
                  </div>
               </div>
            )}
            {isModule1 && state.inventory && (
              <div className="space-y-4">
                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-sm">
                  <h4 className="text-[9px] font-black uppercase text-[#64748B] mb-3 tracking-widest">Market Intelligence</h4>
                  <div className="space-y-1.5 text-[9px] text-slate-400">
                    <p>• Typical prices: Chips R7–10, Drinks R8–12, Sweets R4–6</p>
                    <p>• <span className="text-indigo-400">Demand:</span> People react to price, not your cost.</p>
                    <p>• <span className="text-emerald-400">Volume:</span> Lower prices bring more customers.</p>
                  </div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-sm">
                  <h4 className="text-[9px] font-black uppercase text-[#64748B] mb-3 tracking-widest">Store Inventory</h4>
                  <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center">
                    <span className="text-[7px] text-slate-500 uppercase font-bold">Chips</span>
                    <span className="text-sm font-black text-white">{state.inventory.chips}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[7px] text-slate-500 uppercase font-bold">Drinks</span>
                    <span className="text-sm font-black text-white">{state.inventory.drinks}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[7px] text-slate-500 uppercase font-bold">Sweets</span>
                    <span className="text-sm font-black text-white">{state.inventory.sweets}</span>
                  </div>
                </div>
              </div>
            </div>
            )}
            {isModule3 && state.complianceState && (
              <div className="mb-4 bg-slate-900/50 border border-slate-800 p-4 rounded-sm">
                <h4 className="text-[9px] font-black uppercase text-[#64748B] mb-2 tracking-widest">Compliance Health</h4>
                <div className="space-y-2">
                  {Object.entries(state.complianceState).map(([area, status]) => (
                    <div key={area} className="flex justify-between items-center text-[10px]">
                      <span className="uppercase text-slate-400 font-bold">{area}:</span>
                      <span className={`font-mono font-bold ${
                        status.level === 'Clear' || status.level === 'Completed' ? 'text-emerald-500' :
                        status.level === 'Pending' ? 'text-blue-400' :
                        status.level === 'Overdue' ? 'text-amber-500' :
                        status.level === 'Penalized' || status.level === 'Critical' ? 'text-red-500' : 'text-slate-500'
                      }`}>
                        {status.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {state.round > 1 && state.history.length > 0 && (
              <div className="mb-4 bg-slate-900/50 border border-slate-800 p-4 rounded-sm">
                <h4 className="text-[9px] font-black uppercase text-[#64748B] mb-2 tracking-widest">Previous Decisions</h4>
                <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-slate-400">
                  {Object.entries(state.history[state.history.length - 1].decisions).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="uppercase opacity-60 font-bold">{k}:</span>
                      <span className="text-slate-200">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isModule3 && !isModule1 ? (
              <>
                <ChoiceGroup 
                  label="Venue Setup" 
                  icon={<MapPin size={12} />}
                  value={decisions.venue} 
                  options={["None", "Basic setup", "Proper setup", "Premium setup"]} 
                  costs={costs}
                  currentLevel={state.eventReadiness?.venue.level}
                  onChange={(v) => handleDecisionChange('venue', v)} 
                />
                <ChoiceGroup 
                  label="Entertainment" 
                  icon={<Music size={12} />}
                  value={decisions.entertainment} 
                  options={["None", "Cheap DJ", "Reliable DJ"]} 
                  costs={costs}
                  currentLevel={state.eventReadiness?.entertainment.level}
                  onChange={(v) => handleDecisionChange('entertainment', v)} 
                />
                <ChoiceGroup 
                  label="Food Planning" 
                  icon={<Utensils size={12} />}
                  value={decisions.food} 
                  options={["None", "Low food order", "Balanced food order", "Large food order"]} 
                  costs={costs}
                  currentLevel={state.eventReadiness?.food.level}
                  onChange={(v) => handleDecisionChange('food', v)} 
                />
                <ChoiceGroup 
                  label="Safety Planning" 
                  icon={<ShieldAlert size={12} />}
                  value={decisions.safety} 
                  options={["None", "Basic safety plan", "Proper safety plan"]} 
                  costs={costs}
                  currentLevel={state.eventReadiness?.safety.level}
                  onChange={(v) => handleDecisionChange('safety', v)} 
                />
                <ChoiceGroup 
                  label="Backup Plan" 
                  icon={<CloudRain size={12} />}
                  value={decisions.backup} 
                  options={["None", "Rain backup", "Supplier backup", "Full backup plan"]} 
                  costs={costs}
                  currentLevel={state.eventReadiness?.backup.level}
                  onChange={(v) => handleDecisionChange('backup', v)} 
                />
              </>
            ) : isModule1 ? (
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-indigo-400 border-b border-indigo-500/20 pb-2 flex items-center gap-2">
                    <BarChart3 size={12} /> Pricing (ZAR)
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <ChoiceGroup label="Chips Price" value={m1Decisions.chipsPrice} options={["5", "7", "10", "15"]} costs={{}} onChange={(v) => handleDecisionChange('chipsPrice', v)} help="Typical: R7–10" />
                    <ChoiceGroup label="Drinks Price" value={m1Decisions.drinksPrice} options={["6", "8", "12", "18"]} costs={{}} onChange={(v) => handleDecisionChange('drinksPrice', v)} help="Typical: R8–12" />
                    <ChoiceGroup label="Sweets Price" value={m1Decisions.sweetsPrice} options={["3", "4", "6", "10"]} costs={{}} onChange={(v) => handleDecisionChange('sweetsPrice', v)} help="Typical: R4–6" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase text-emerald-400 border-b border-emerald-500/20 pb-2 flex items-center gap-2">
                    <Utensils size={12} /> Restock Qty
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <ChoiceGroup label="Chips Qty" value={m1Decisions.chipsRestock} options={["0", "10", "20", "50"]} costs={{ "10": 50, "20": 100, "50": 250 }} onChange={(v) => handleDecisionChange('chipsRestock', v)} />
                    <ChoiceGroup label="Drinks Qty" value={m1Decisions.drinksRestock} options={["0", "10", "20", "50"]} costs={{ "10": 60, "20": 120, "50": 300 }} onChange={(v) => handleDecisionChange('drinksRestock', v)} />
                    <ChoiceGroup label="Sweets Qty" value={m1Decisions.sweetsRestock} options={["0", "10", "20", "50"]} costs={{ "10": 30, "20": 60, "50": 150 }} onChange={(v) => handleDecisionChange('sweetsRestock', v)} />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="pt-4 border-t border-slate-800">
                  <OpportunityGate state={state} />
                </div>
                <div className="pt-4 border-t border-slate-800">
                  <DecisionLedger ledger={learningState.decisionLedger} />
                </div>
                <div className="pt-4 border-t border-slate-800">
                  <ComplianceTimeline state={state} />
                </div>
                <ChoiceGroup 
                  label="Business Registration" 
                  icon={<FileText size={12} />}
                  value={m3Decisions.registration} 
                  options={["Register now", "Delay registration", "Ignore"]} 
                  costs={{}}
                  currentLevel={state.complianceState?.registration.level}
                  deadline={state.complianceState?.registration.deadlineRound}
                  round={state.round}
                  onChange={(v) => handleDecisionChange('registration', v)} 
                />
                <ChoiceGroup 
                  label="Tax Registration / Filing" 
                  icon={<BarChart3 size={12} />}
                  value={m3Decisions.tax} 
                  options={["Register / file correctly", "File late", "Delay", "Ignore"]} 
                  costs={{}}
                  currentLevel={state.complianceState?.tax.level}
                  deadline={state.complianceState?.tax.deadlineRound}
                  round={state.round}
                  onChange={(v) => handleDecisionChange('tax', v)} 
                />
                <ChoiceGroup 
                  label="Employee Compliance" 
                  icon={<ShieldAlert size={12} />}
                  value={m3Decisions.employees} 
                  options={["Register workers / keep records", "Pay casually without records", "Ignore obligations"]} 
                  costs={{}}
                  currentLevel={state.complianceState?.employees.level}
                  deadline={state.complianceState?.employees.deadlineRound}
                  round={state.round}
                  onChange={(v) => handleDecisionChange('employees', v)} 
                />
                <ChoiceGroup 
                  label="Operating Permit" 
                  icon={<MapPin size={12} />}
                  value={m3Decisions.permit} 
                  options={["Apply for required permit", "Operate while application pending", "Ignore"]} 
                  costs={{}}
                  currentLevel={state.complianceState?.permit.level}
                  deadline={state.complianceState?.permit.deadlineRound}
                  round={state.round}
                  onChange={(v) => handleDecisionChange('permit', v)} 
                />
                <ChoiceGroup 
                  label="Recordkeeping" 
                  icon={<History size={12} />}
                  value={m3Decisions.records} 
                  options={["Keep proper invoices and records", "Keep basic records", "Keep no records"]} 
                  costs={{}}
                  currentLevel={state.complianceState?.records.level}
                  deadline={state.complianceState?.records.deadlineRound}
                  round={state.round}
                  onChange={(v) => handleDecisionChange('records', v)} 
                />
              </>
            )}

            <div className="pt-4 border-t border-slate-800">
              {!isModule3 && (
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[9px] font-bold uppercase text-[#64748B]">{isModule1 ? "Restock Expense" : "Round Estimated Spend"}</span>
                  <span className={`font-mono text-sm font-bold ${totalSpend > (isModule1 ? state.cash : state.budget) ? 'text-red-500' : 'text-blue-400'}`}>
                    R{totalSpend}
                  </span>
                </div>
              )}
              
              {!isModule3 && totalSpend > (isModule1 ? state.cash : state.budget) && (
                <div className="mb-4 bg-red-500/10 border border-red-500/30 p-2 flex gap-2 items-center">
                  <AlertTriangle className="text-red-500 shrink-0" size={14} />
                  <p className="text-[8px] text-red-500 font-bold uppercase leading-tight tracking-tighter">
                    Critical: Cost exceeds {isModule1 ? 'Available Cash' : 'Budget'}. Decision will be ignored.
                  </p>
                </div>
              )}

              <button 
                onClick={handleExecuteRound}
                disabled={loading || state.round > (isModule3 ? 6 : (isModule4 ? 15 : (isModule1 ? 12 : 5)))}
                className="w-full bg-white text-black py-4 flex items-center justify-center gap-2 hover:bg-slate-200 transition-all font-mono font-black uppercase text-xs tracking-[0.2em] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full"></div>
                ) : (
                  <>
                    <Play size={14} fill="currentColor" />
                    {state.round === (isModule3 ? 6 : (isModule4 ? 15 : (isModule1 ? 12 : 5))) ? 
                      (isModule3 ? "Finalize Compliance Year" : (isModule4 ? "Finalize Strategic Interaction Report" : (isModule1 ? "Close Tuck Shop" : "Run Final Event"))) : 
                      (isModule3 ? "Process Month" : (isModule4 ? "Confirm Price Decision" : (isModule1 ? "Open Tuck Shop" : "Execute Planning Day")))}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Artifact Modal */}
        <AnimatePresence>
          {showArtifact && lastRound?.results.artifact && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[#06080A]/95 backdrop-blur-sm flex items-center justify-center p-8"
            >
              <div className="bg-[#0D1117] border border-slate-800 w-full max-w-4xl h-full max-h-[85vh] flex flex-col rounded-sm shadow-2xl">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#0A0C10]">
                  <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                    <FileText className="text-emerald-500" size={20} />
                    {isModule3 ? "Compliance Status Report" : "Final Event Plan + Risk Report"}
                  </h2>
                  <button 
                    onClick={() => setShowArtifact(false)}
                    className="p-2 hover:bg-slate-800 rounded-full text-slate-400"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-12 bg-white/5">
                  <div className="prose prose-invert prose-emerald max-w-none prose-sm">
                    <div className="markdown-body">
                      <Markdown>{lastRound.results.artifact}</Markdown>
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t border-slate-800 flex justify-end gap-4 bg-[#0A0C10]">
                  <button 
                    onClick={() => window.print()}
                    className="px-6 py-2 border border-slate-700 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white rounded-sm"
                  >
                    Print Report
                  </button>
                  <button 
                    onClick={() => setShowArtifact(false)}
                    className="px-8 py-2 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-sm shadow-lg shadow-emerald-900/20"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center Panel: Simulation Output */}
        <div className="col-span-12 lg:col-span-5 bg-[#0D1117] p-8 flex flex-col overflow-y-auto border-r border-slate-800">
          <AnimatePresence mode="wait">
            {!lastRound ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-center space-y-6"
              >
                <div className="max-w-md">
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-4 lowercase">
                    {isModule3 ? "Month 1: Growth & Rules" : (isModule1 ? "Round 1: Stock vs Cash" : "Phase 1: Planning")}
                  </h3>
                  <div className="space-y-4 text-xs text-slate-400 text-left bg-slate-900/50 p-6 border border-slate-800 rounded-sm leading-relaxed">
                    <p>
                      {isModule4
                        ? "You are competing against another vendor. Every round, your prices affect not only your sales, but your competitor's response. Watch for price wars."
                        : (isModule3 
                        ? "Nomsa's Catering is growing fast. To keep the school and church contracts, you need to handle formal rules. Delaying compliance saves cash now but risks everything later."
                        : (isModule1 ? "Sipho's Tuck Shop needs stock to make money. But if you spend all your cash on stock that doesn't sell, you'll be stuck. Balance is survival." : "The school event is 5 days away. Your goal is to run a successful fundraiser without overspending or missing critical risks."))}
                    </p>
                    <div>
                      <p className="font-bold text-slate-200 uppercase text-[9px] mb-2 tracking-widest">Known Challenges:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        {state.risks.map((risk, i) => (
                          <li key={i}>{risk}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key={lastRound.round}
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col"
              >
                {state.round === 4 && (
                  <div className="mb-6 bg-amber-500/10 border border-amber-500/30 p-4 rounded-sm">
                    <h4 className="text-[9px] font-black uppercase text-amber-500 mb-2">Pre-Resolution Warning</h4>
                    <div className="grid grid-cols-3 gap-4 text-[9px] font-mono text-amber-200">
                      <div>Attendance: MEDIUM RISK</div>
                      <div>Suppliers: LOW RISK</div>
                      <div>Safety: HIGH RISK</div>
                    </div>
                    <p className="mt-2 text-[10px] text-amber-200/60 leading-tight italic">Your final results will be locked in after tomorrow's planning stage.</p>
                  </div>
                )}

                <div className="mb-6 flex justify-between items-end">
                  <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tighter uppercase whitespace-pre">
                      {lastRound.round === (isModule4 ? 15 : (isModule3 ? 6 : (isModule1 ? 12 : 5))) ? 
                        (isModule4 ? "STRATEGIC INTERACTION REPORT" : (isModule3 ? "COMPLIANCE RECOVERY PLAN" : (isModule1 ? "TUCK SHOP PERFORMANCE REPORT" : "FINAL EVENT REPORT"))) : 
                        `${isModule3 ? "MONTH" : (isModule1 || isModule4 ? "ROUND" : "DAY")} ${lastRound.round} OUTCOME`}
                    </h1>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-sm ${
                          lastRound.results.decisionQuality === 'Strong' ? 'bg-emerald-500/20 text-emerald-400' :
                          lastRound.results.decisionQuality === 'Risky' ? 'bg-amber-500/20 text-amber-500' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {lastRound.results.decisionQuality}
                        </span>
                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-sm border ${
                          lastRound.results.trajectory === 'Improving' ? 'border-emerald-500/50 text-emerald-400' :
                          lastRound.results.trajectory === 'Declining' ? 'border-red-500/50 text-red-400' :
                          'border-slate-500/50 text-slate-400'
                        }`}>
                          {lastRound.results.trajectory}
                        </span>
                        {isModule3 ? (
                          <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-sm ${
                            lastRound.results.opportunityReadiness === 'High' ? 'bg-indigo-500/20 text-indigo-400' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            Opportunity: {lastRound.results.opportunityReadiness}
                          </span>
                        ) : (
                          lastRound.results.protectionEfficiency && (
                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-sm ${
                              lastRound.results.protectionEfficiency === 'Efficient' ? 'bg-indigo-500/20 text-indigo-400' :
                              'bg-slate-800 text-slate-400'
                            }`}>
                              {lastRound.results.protectionEfficiency} Protection
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {lastRound.round === 5 && lastRound.results.drivers && (
                  <div className="mb-8 grid grid-cols-3 gap-px bg-slate-800 border border-slate-800 rounded-sm overflow-hidden">
                    {lastRound.results.drivers.map((driver, i) => (
                      <div key={i} className="bg-[#0A0C10] p-4 flex flex-col items-center text-center">
                        <span className="text-[8px] font-black text-[#64748B] uppercase mb-1">{driver.category} Impact</span>
                        <span className="text-xl font-light text-white">{driver.impact}%</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-px bg-slate-800 border border-slate-800 mb-8 overflow-hidden rounded-sm">
                  <div className="bg-[#0A0C10] p-6 flex flex-col justify-between h-32">
                    <span className="text-[9px] text-[#64748B] uppercase font-bold tracking-widest">
                      {isModule4 ? "Round Payoff" : (isModule3 ? "Monthly Sales" : (isModule1 ? "Round Profit" : "Revenue Generated"))}
                    </span>
                    <span className={`text-3xl font-light ${isModule1 && (lastRound.results.profit || 0) < 0 ? 'text-red-500' : 'text-white'}`}>
                      R{((isModule4 ? lastRound.results.profit : (isModule3 ? state.sales : (isModule1 ? lastRound.results.profit : lastRound.results.revenue))) || 0)?.toLocaleString()}
                    </span>
                    <div className="w-full h-1 bg-slate-800 overflow-hidden">
                      <div className={`h-full ${isModule1 && (lastRound.results.profit || 0) < 0 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                           style={{ width: `${Math.min(100, (Math.abs((isModule4 ? lastRound.results.profit : (isModule3 ? state.sales : (isModule1 ? lastRound.results.profit : lastRound.results.revenue))) || 0) / (isModule4 ? 120 : (isModule3 ? 15000 : (isModule1 ? 500 : 6000)))) * 100)}%` }}></div>
                    </div>
                  </div>
                  <div className="bg-[#0A0C10] p-6 flex flex-col justify-between h-32">
                    <span className="text-[9px] text-[#64748B] uppercase font-bold tracking-widest">
                      {isModule4 ? "Market Share" : (isModule3 ? "Compliance Health" : (isModule1 ? "Ending Cash" : "Total Spend"))}
                    </span>
                    {isModule3 || isModule4 ? (
                      <span className={`text-2xl font-bold uppercase tracking-tighter ${
                        isModule4 ? (state.reputation > 50 ? 'text-indigo-400' : 'text-amber-500') :
                        (state.reputation > 70 ? 'text-emerald-500' : state.reputation > 40 ? 'text-amber-500' : 'text-red-500')
                      }`}>
                        {isModule4 ? 'Competitive' : (state.reputation > 70 ? 'Healthy' : state.reputation > 40 ? 'Exposed' : 'Critical')}
                      </span>
                    ) : (
                      <span className={`text-3xl font-light ${isModule1 ? 'text-blue-400' : 'text-white'}`}>
                        R{(isModule1 ? (lastRound.results.endingCash || state.cash) : lastRound.results.totalCost)?.toLocaleString()}
                      </span>
                    )}
                    <div className="w-full h-1 bg-slate-800 overflow-hidden">
                      <div className={`h-full ${isModule3 || isModule4 ? 'bg-blue-500' : (isModule1 ? 'bg-blue-500' : 'bg-red-500')}`} 
                           style={{ width: `${(isModule3 || isModule4 ? state.reputation : (isModule1 ? ((lastRound.results.endingCash || state.cash) / 2000) * 100 : (lastRound.results.totalCost / 5000) * 100))}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-6">
                  <div className="bg-slate-900/50 p-6 border-l-2 border-emerald-500 rounded-r-sm">
                    <h4 className="text-[10px] font-bold text-[#64748B] uppercase tracking-tighter mb-2 italic">Simulation Output</h4>
                    <p className="text-sm leading-relaxed text-slate-200">{lastRound.results.marketFeedback}</p>
                    
                    {isModule4 && lastRound.results.ledgerEntry && (
                      <div className="mt-4 pt-4 border-t border-slate-800">
                        <div className="flex gap-8 flex-wrap">
                          <div className="flex flex-col">
                            <span className="text-[7px] text-slate-500 uppercase font-black mb-1">Your Decision</span>
                            <span className="text-xs font-bold text-blue-400">{m4Decisions.price || m4Decisions.action || m4Decisions.offer}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[7px] text-slate-500 uppercase font-black mb-1">Response</span>
                            <span className="text-xs font-bold text-red-400">{lastRound.results.ledgerEntry.result.split('.')[0]}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[7px] text-slate-500 uppercase font-black mb-1">Credibility</span>
                            <span className={`text-xs font-bold ${
                              (lastRound.results.credibilityScore || 0) >= 70 ? 'text-emerald-500' :
                              (lastRound.results.credibilityScore || 0) <= 40 ? 'text-red-500' : 'text-blue-400'
                            }`}>{lastRound.results.credibilityScore || 50}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[7px] text-slate-500 uppercase font-black mb-1">Confidence</span>
                            <span className={`text-xs font-bold ${
                              lastRound.results.behaviorConfidence === 'High' ? 'text-emerald-500' :
                              lastRound.results.behaviorConfidence === 'Low' ? 'text-slate-500' : 'text-blue-400'
                            }`}>{lastRound.results.behaviorConfidence || 'Low'}</span>
                          </div>
                          {lastRound.results.impactLevel && (
                             <div className="flex flex-col">
                               <span className="text-[7px] text-slate-500 uppercase font-black mb-1">Causality</span>
                               <span className={`text-xs font-bold ${
                                 lastRound.results.impactLevel === 'High' ? 'text-red-500' :
                                 lastRound.results.impactLevel === 'Moderate' ? 'text-amber-500' : 'text-blue-400'
                               }`}>{lastRound.results.impactLevel} ({lastRound.results.carryoverImpactScore || 0}/20)</span>
                             </div>
                          )}
                          {lastRound.results.simulationHash && (
                            <div className="flex flex-col">
                              <span className="text-[7px] text-slate-500 uppercase font-black mb-1">Audit Trace</span>
                              <span className="text-[9px] font-mono text-slate-500">{lastRound.results.simulationHash} [{lastRound.results.engineVersion || 'v4.4'}/{lastRound.results.moduleVersion || 'M4.2'}]</span>
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-[7px] text-slate-500 uppercase font-black mb-1">Efficiency</span>
                            <span className={`text-xs font-bold ${
                              lastRound.results.outcomeEfficiency === 'High' ? 'text-emerald-500' :
                              lastRound.results.outcomeEfficiency === 'Low' ? 'text-red-500' : 'text-amber-500'
                            }`}>{lastRound.results.outcomeEfficiency || 'Med'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {isModule1 && lastRound.results.microSignals && lastRound.results.microSignals.length > 0 && (
                      <div className="mt-4 flex gap-2 flex-wrap">
                        {lastRound.results.microSignals.map((signal, i) => (
                          <div key={i} className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border flex items-center gap-1.5 transition-all animate-pulse ${
                            signal.toLowerCase().includes('low') || signal.toLowerCase().includes('finished') || signal.toLowerCase().includes('loss') || signal.toLowerCase().includes('expensive')
                              ? 'bg-red-500/10 border-red-500/30 text-red-400'
                              : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                          }`}>
                            <span className="w-1 h-1 bg-current rounded-full" />
                            {signal}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {isModule1 && (
                      <div className="mt-4 pt-4 border-t border-slate-800">
                        <div className="flex gap-8 flex-wrap">
                          <div className="flex flex-col">
                            <span className="text-[7px] text-slate-500 uppercase font-black mb-1">Decision Quality</span>
                            <span className={`text-xs font-bold ${
                              lastRound.results.decisionQuality === 'Strong' ? 'text-emerald-500' :
                              lastRound.results.decisionQuality === 'Risky' ? 'text-amber-500' : 'text-red-500'
                            }`}>{lastRound.results.decisionQuality}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[7px] text-slate-500 uppercase font-black mb-1">Cash Status</span>
                            <span className={`text-xs font-bold ${
                              lastRound.results.cashStatus === 'Healthy' ? 'text-emerald-500' :
                              lastRound.results.cashStatus === 'Tight' ? 'text-amber-500' : 'text-red-500'
                            }`}>{lastRound.results.cashStatus}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[7px] text-slate-500 uppercase font-black mb-1">Stability Score</span>
                            <div className="flex gap-1 mt-1">
                              {[1, 2, 3, 4, 5].map(s => (
                                <div key={s} className={`w-2 h-1 rounded-full ${s <= (lastRound.results.stabilityScore || 0) ? 'bg-blue-500' : 'bg-slate-800'}`} />
                              ))}
                            </div>
                          </div>
                          {lastRound.results.missedSales && lastRound.results.missedSales > 0 && (
                            <div className="flex flex-col bg-red-500/5 border border-red-500/20 p-2 rounded-sm">
                              <span className="text-[7px] text-red-500 uppercase font-black mb-1">Missed Opportunity</span>
                              <div className="flex items-baseline gap-1">
                                <span className="text-xs font-black text-white">-{lastRound.results.missedSales} Units</span>
                                {lastRound.results.missedRevenue && (
                                  <span className="text-[8px] text-red-400 font-bold">(~R{lastRound.results.missedRevenue})</span>
                                )}
                              </div>
                              <span className="text-[6px] text-red-400 font-bold uppercase mt-1">Lost Potential Revenue</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {lastRound.results.riskConfidences && (
                      <div className="mt-4 pt-4 border-t border-slate-800 flex gap-6">
                        {Object.entries(lastRound.results.riskConfidences).map(([category, info]) => {
                          const riskInfo = info as any;
                          return (
                            <div key={category} className="flex flex-col gap-1">
                              <span className="text-[8px] text-[#64748B] uppercase font-black">{category} Risk</span>
                              <div className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${
                                  riskInfo.level === 'High' ? 'bg-red-500' : 
                                  riskInfo.level === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                                }`} />
                                <span className="text-[9px] font-bold text-slate-400">Conf: {riskInfo.confidence}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  {showTutorMode && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="bg-slate-900 p-6 border border-slate-800 shadow-[0_0_15px_rgba(16,185,129,0.05)] rounded-sm">
                        <h4 className="font-bold flex items-center gap-2 mb-4 text-[#E2E8F0] tracking-widest font-mono text-[10px]">
                          <div className="w-1 h-3 bg-indigo-500"></div>
                          TUTOR MODE // DECISION INSIGHT PANEL
                        </h4>
                        <div className="text-[11px] leading-relaxed text-indigo-200 bg-indigo-500/5 p-4 border border-indigo-500/10 rounded-sm whitespace-pre-wrap font-mono">
                          {lastRound.results.tutorFeedback}
                        </div>

                        {lastRound.results.institutionalRiskAssessment && (
                          <div className="mt-6 p-4 bg-red-500/5 border border-red-500/20 rounded-sm">
                             <p className="text-[9px] uppercase font-bold text-red-400 tracking-widest mb-2 italic">Institutional Assessment Summary (Funder-Grade):</p>
                             <p className="text-xs text-red-200 leading-relaxed font-mono">{lastRound.results.institutionalRiskAssessment}</p>
                          </div>
                        )}

                        {isModule4 && learningState.behaviorIdentity && (
                          <div className="mt-6 pt-4 border-t border-slate-800">
                             <p className="text-[8px] uppercase font-bold text-[#64748B] tracking-widest mb-3 italic">Behavior Integrity Profile Decomposition:</p>
                             <div className="grid grid-cols-3 gap-2">
                               <div className="bg-slate-900/50 p-2 border border-slate-800 rounded-sm">
                                 <span className="text-[7px] text-[#64748B] block mb-1">Stability</span>
                                 <span className={`text-[10px] font-bold uppercase ${
                                   learningState.behaviorIdentity.stability === 'high' ? 'text-emerald-500' :
                                   learningState.behaviorIdentity.stability === 'low' ? 'text-red-500' : 'text-blue-400'
                                 }`}>{learningState.behaviorIdentity.stability}</span>
                               </div>
                               <div className="bg-slate-900/50 p-2 border border-slate-800 rounded-sm">
                                 <span className="text-[7px] text-[#64748B] block mb-1">Identity Confidence</span>
                                 <span className={`text-[10px] font-bold uppercase ${
                                   learningState.behaviorIdentity.confidence === 'high' ? 'text-emerald-500' :
                                   learningState.behaviorIdentity.confidence === 'low' ? 'text-slate-500' : 'text-blue-400'
                                 }`}>{learningState.behaviorIdentity.confidence}</span>
                               </div>
                               <div className="bg-slate-900/50 p-2 border border-slate-800 rounded-sm">
                                 <span className="text-[7px] text-[#64748B] block mb-1">Volatility Index</span>
                                 <span className={`text-[10px] font-bold uppercase ${
                                   (learningState.behaviorIdentity.volatilityIndex || 0) > 5 ? 'text-red-500' : 'text-slate-300'
                                 }`}>{learningState.behaviorIdentity.volatilityIndex || 0}</span>
                               </div>
                               <div className="bg-slate-900/50 p-2 border border-slate-800 rounded-sm">
                                 <span className="text-[7px] text-[#64748B] block mb-1">Path Difficulty</span>
                                 <span className={`text-[10px] font-bold uppercase ${
                                   (learningState.behaviorIdentity.difficultyIndex || 0) > 0.7 ? 'text-red-500' :
                                   (learningState.behaviorIdentity.difficultyIndex || 0) > 0.3 ? 'text-amber-500' : 'text-emerald-500'
                                 }`}>{learningState.behaviorIdentity.difficultyIndex || 'Neutral'}</span>
                               </div>
                               <div className="bg-slate-900/50 p-2 border border-slate-800 rounded-sm">
                                 <span className="text-[7px] text-[#64748B] block mb-1">Decision Trace</span>
                                 <span className="text-[10px] font-bold uppercase text-slate-300">{learningState.behaviorIdentity.decisionTraceScore || 0}%</span>
                               </div>
                             </div>
                          </div>
                        )}
                        {lastRound.results.patterns && lastRound.results.patterns.length > 0 && (
                          <div className="mt-4 flex gap-2 flex-wrap">
                            {lastRound.results.patterns.map((pattern, i) => (
                              <span key={i} className="text-[8px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full font-black uppercase tracking-widest flex items-center gap-2">
                                <Activity size={8} />
                                {pattern} {lastRound.results.recoveryProgress && <span className="opacity-60 text-[7px] text-emerald-400 font-bold border-l border-indigo-500/30 pl-2 ml-1 italic">{lastRound.results.recoveryProgress}</span>}
                              </span>
                            ))}
                          </div>
                        )}
                        {lastRound.results.counterfactuals && lastRound.results.counterfactuals.length > 0 && (
                          <div className="mt-6 pt-4 border-t border-slate-800">
                             <p className="text-[8px] uppercase font-bold text-[#64748B] tracking-widest mb-3 italic">Alternative Scenarios (Replay Reality):</p>
                             <div className="space-y-2">
                               {lastRound.results.counterfactuals.map((cf, i) => (
                                 <div key={i} className="bg-slate-900/80 p-3 border border-slate-800 rounded-sm text-[10px] text-slate-400 border-l-2 border-l-amber-500/50">
                                   {cf}
                                 </div>
                               ))}
                             </div>
                          </div>
                        )}
                        {lastRound.results.nextMove && (
                          <div className="mt-8 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-sm">
                             <p className="text-[10px] uppercase font-black text-emerald-500 tracking-widest mb-1 italic">Strategist Recommendation // Next Move:</p>
                             <p className="text-[11px] text-emerald-200 animate-pulse">{lastRound.results.nextMove}</p>
                          </div>
                        )}

                        {lastRound.results.secondaryInsights.length > 0 && (
                          <div className="mt-6 pt-4 border-t border-slate-800 space-y-2">
                             <p className="text-[8px] uppercase font-bold text-[#64748B] tracking-widest">System Observations:</p>
                             {lastRound.results.secondaryInsights.map((insight, i) => (
                               <div key={i} className="flex gap-2 items-start text-indigo-400/80 text-[10px]">
                                 <span className="mt-1.5 w-1 h-1 bg-indigo-500/30 rounded-full flex-shrink-0" />
                                 <p>{insight}</p>
                               </div>
                             ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="mt-8 flex flex-col gap-3">
                  {lastRound.round === (isModule4 ? 15 : (isModule3 ? 6 : (isModule1 ? 12 : 5))) && lastRound.results.artifact && (
                    <button 
                      onClick={() => setShowArtifact(true)}
                      className="w-full py-4 bg-indigo-600 text-white font-black uppercase tracking-widest text-[11px] hover:bg-indigo-500 transition-all rounded-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
                    >
                      <FileText size={16} />
                      View Final {isModule4 ? "Strategic Interaction Report" : (isModule3 ? "Compliance Recovery Plan" : (isModule1 ? "Tuck Shop Performance Report" : "Event Plan + Risk Report"))}
                    </button>
                  )}
                  <button 
                    onClick={() => setShowTutorMode(!showTutorMode)}
                    className="w-full py-4 bg-[#0A0C10] border border-slate-800 text-[#64748B] font-bold uppercase tracking-widest text-[10px] hover:text-white hover:border-slate-600 transition-all rounded-sm flex items-center justify-center gap-2"
                  >
                    <BarChart3 size={14} />
                    {showTutorMode ? "Hide Insights" : "Show Decision Insight Panel"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Panel: Ledger */}
        <div className="col-span-12 lg:col-span-3 bg-[#0A0C10] p-6 overflow-y-auto">
          <h2 className="text-[10px] font-bold text-[#64748B] uppercase tracking-tighter mb-6 underline decoration-slate-800 underline-offset-8">Planning History</h2>
          <div className="space-y-4">
            {state.history.slice().reverse().map((record) => (
              <div key={record.round} className="bg-[#0D1117] p-3 border border-slate-800 rounded-sm">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-mono font-bold text-blue-500">
                      {isModule3 ? `Month ${record.round} Decisions` : (isModule1 ? `Round ${record.round} Operations` : (isModule4 ? `Round ${record.round} Strategy` : `Day ${record.round} Actions`))}
                    </span>
                    {!isModule3 && !isModule1 && <span className="text-[10px] font-mono text-slate-500">R{record.results.totalCost}</span>}
                    {isModule1 && <span className="text-[10px] font-mono text-slate-500">R{record.results.profit || 0} Profit</span>}
                 </div>
                 <div className="flex gap-1 flex-wrap opacity-60">
                   {Object.entries(record.decisions).map(([k, v]) => (
                     <span key={k} className="text-[7px] uppercase bg-slate-800 px-1 py-0.5 rounded-sm">{v}</span>
                   ))}
                 </div>
              </div>
            ))}
            {state.history.length === 0 && (
              <div className="text-[11px] text-[#64748B] italic opacity-40 py-12 text-center">No decisions logged.</div>
            )}
            {state.round > (isModule3 ? 6 : (isModule4 ? 15 : (isModule1 ? 12 : 5))) && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 text-center space-y-2">
                <p className="text-xs font-bold text-emerald-500 uppercase">Simulation Complete</p>
                <button 
                  onClick={() => switchModule(state.module)}
                  className="text-[10px] uppercase font-bold text-white bg-emerald-600 px-4 py-2 rounded-sm cursor-pointer hover:bg-emerald-500 transition-colors"
                >
                  Start New Journey
                </button>
              </div>
            )}
          </div>
        </div>
          </div>
        )}
      </main>

      <footer className="h-12 bg-[#0F172A] flex items-center px-8 border-t border-slate-800 justify-between font-mono shrink-0">
        <div className="flex gap-6 text-[9px] text-[#64748B] uppercase tracking-widest">
          <span>Engine v3.0</span>
          <span>{isModule4 ? "Strategic Interaction Module" : (isModule3 ? "Compliance & Consequences Module" : (isModule1 ? "Money Has Rules Module" : "School Event Module"))}</span>
          <span>Status: {loading ? "Processing..." : "Ready"}</span>
        </div>
        <div className="text-[9px] text-[#64748B] font-bold uppercase">
          {state.round <= (isModule4 ? 15 : (isModule3 ? 6 : (isModule1 ? 12 : 5))) ? `${isModule3 ? "Month" : (isModule1 || isModule4 ? "Round" : "Day")} ${state.round}` : "Journey Complete"}
        </div>
      </footer>
      <AnimatePresence>
        {showMarketIntel && (
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
                onClick={() => setShowMarketIntel(false)}
                className="w-full bg-white text-black py-4 text-[11px] font-black uppercase tracking-widest rounded-sm hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                Understood. Let's Trade.
              </button>
            </motion.div>
          </motion.div>
        )}
        {showArtifact && lastRound?.results?.artifact && (
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
                  onClick={() => setShowArtifact(false)}
                  className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-12 markdown-body text-slate-300">
                <Markdown>{lastRound.results.artifact}</Markdown>
              </div>
              <div className="h-16 border-t border-slate-800 bg-[#0F172A] flex items-center justify-between px-8">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest italic">
                  Saved to Business File Artifacts
                </div>
                <button 
                  onClick={() => setShowArtifact(false)}
                  className="bg-white text-black px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-slate-200 transition-all shadow-lg"
                >
                  Close Report
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {showReport && currentRunReport && (
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
                  onClick={() => setShowReport(false)}
                  className="w-10 h-10 flex items-center justify-center border border-slate-800 hover:bg-slate-800 rounded-sm text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(15,23,42,1),rgba(0,0,0,1))]">
                {learningState.history.length > 1 && (
                  <div className="mb-8 flex gap-2 overflow-x-auto pb-4 border-b border-indigo-500/10">
                    {learningState.history.map((run, idx) => (
                      <button
                        key={run.id}
                        onClick={() => setCurrentRunReport(generateIndividualReport(run))}
                        className={`shrink-0 px-4 py-2 text-[8px] font-black uppercase tracking-widest border rounded-sm transition-all ${
                          currentRunReport === generateIndividualReport(run)
                          ? 'bg-indigo-600 border-indigo-400 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'
                        }`}
                      >
                        {run.attemptType === 'baseline' ? 'Baseline' : `Replay #${learningState.history.length - idx}`}
                        <div className="text-[6px] opacity-60 mt-1">{new Date(run.timestamp).toLocaleDateString()}</div>
                      </button>
                    ))}
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
                  onClick={() => setShowReport(false)}
                  className="flex-1 bg-white text-black py-4 text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                  Acknowledge & Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {showSwitchConfirm && (
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
                  onClick={() => {
                    setShowSwitchConfirm(false);
                    setPendingModule(null);
                  }}
                  className="flex-1 border border-slate-800 text-slate-400 py-3 text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-slate-800 transition-all"
                >
                  Stay Here
                </button>
                <button 
                  onClick={() => {
                    if (pendingModule) {
                      switchModule(pendingModule, true);
                      setShowSwitchConfirm(false);
                      setPendingModule(null);
                    }
                  }}
                  className="flex-1 bg-indigo-600 text-white py-3 text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-indigo-500 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                >
                  Confirm Switch
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {showResetConfirm && (
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
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 border border-slate-800 text-slate-400 py-3 text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    switchModule(state.module, true);
                    setShowResetConfirm(false);
                  }}
                  className="flex-1 bg-red-950/40 hover:bg-red-900/40 border border-red-500/30 text-red-400 py-3 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all shadow-[0_0_20px_rgba(239,68,68,0.15)] cursor-pointer"
                >
                  Confirm Reset
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            let IconComponent = Activity;
            let themeClass = "border-slate-800 text-slate-300 bg-[#0B0F1A]/95";
            let tagThemeClass = "bg-indigo-500/10 text-indigo-400";
            let iconColorClass = "text-indigo-400";

            if (toast.impact === 'positive') {
              IconComponent = TrendingUp;
              themeClass = "border-emerald-500/20 text-slate-300 bg-[#0B1A12]/95 shadow-[0_4px_24px_rgba(16,185,129,0.08)]";
              tagThemeClass = "bg-emerald-500/10 text-emerald-400";
              iconColorClass = "text-emerald-400";
            } else if (toast.impact === 'negative') {
              IconComponent = ShieldAlert;
              themeClass = "border-rose-500/20 text-slate-300 bg-[#1A0B0E]/95 shadow-[0_4px_24px_rgba(244,63,94,0.08)]";
              tagThemeClass = "bg-rose-500/10 text-rose-400";
              iconColorClass = "text-rose-400";
            } else if (toast.impact === 'warning') {
              IconComponent = AlertTriangle;
              themeClass = "border-amber-500/20 text-slate-300 bg-[#1A140B]/95 shadow-[0_4px_24px_rgba(245,158,11,0.08)]";
              tagThemeClass = "bg-amber-500/10 text-amber-400";
              iconColorClass = "text-amber-400";
            }

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, x: 30, transition: { duration: 0.2 } }}
                layout
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-sm border ${themeClass} backdrop-blur-md shadow-2xl transition-colors duration-200 relative`}
              >
                <div className={`mt-0.5 shrink-0 ${iconColorClass}`}>
                  <IconComponent size={16} />
                </div>
                <div className="flex-1 pr-4">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-xs ${tagThemeClass}`}>
                      {toast.metric}
                    </span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 bg-slate-800/40 px-1.5 py-0.5 rounded-xs">
                      Impact
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 font-medium leading-relaxed">
                    {toast.message}
                  </p>
                </div>
                <button
                  onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 transition-colors pointer-events-auto cursor-pointer"
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  </div>
);
}

function ChoiceGroup({ label, options, costs, value, onChange, icon, currentLevel, deadline, round, help }: { label: string; options: string[]; costs: Record<string, number>; value: string; onChange: (v: string) => void; icon?: React.ReactNode; currentLevel?: string; deadline?: number; round?: number; help?: string }) {
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

function OpportunityGate({ state }: { state: GameState }) {
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

function DecisionLedger({ ledger }: { ledger: DecisionLedgerEntry[] }) {
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

function ComplianceTimeline({ state }: { state: GameState }) {
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
