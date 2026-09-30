/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ReadinessLevel = 'None' | 'Basic' | 'Proper' | 'Premium' | 'Low' | 'Medium' | 'High' | 'Not registered' | 'Required' | 'Due Soon' | 'Overdue' | 'Critical' | 'Pending' | 'Completed' | 'Penalized' | 'Exposed' | 'Clear' | 'Weak' | 'Strong';
export type RiskLevel = 'Low' | 'Medium' | 'High';

export type ModuleType = 'money_rules' | 'event_disaster' | 'nomsa_fine' | 'decision_game' | 'strategy';

export interface BusinessAsset {
  id: string;
  name: string;
  type: string;
  module: ModuleType;
  status: 'Verified' | 'Draft' | 'Needs Improvement';
  content: string;
  normalizedData?: any; // Machine-readable representation
  date: string;
  version: number;
  createdAt: number;
}

export interface BehaviorProfile {
  stability: 'high' | 'medium' | 'low';
  riskTolerance: 'high' | 'low';
  complianceDiscipline: 'strong' | 'weak';
}

export interface DecisionLedgerEntry {
  module: ModuleType;
  round: number;
  obligation: string;
  decision: string;
  result: string;
  statusChange: string;
  type?: 'Risk' | 'Obligation' | 'Interaction';
  impact?: 'Immediate' | 'Delayed' | 'CrossModule';
}

export interface LearningState {
  currentModule: ModuleType;
  moduleStatus: Partial<Record<ModuleType, 'locked' | 'available' | 'in_progress' | 'completed'>>;
  moduleProgress: Partial<Record<ModuleType, { current: number; total: number; unit: 'day' | 'month' | 'level' | 'round' }>>;
  moduleSignals: Partial<Record<ModuleType, { 
    label: string; 
    value: string; 
    status: 'success' | 'warning' | 'error';
    trajectory?: string;
    stability?: number;
  }>>;
  behaviorProfile: BehaviorProfile;
  diagnosis: {
    stability: string;
    compliance: string;
    risk: string;
    overall: string;
  };
  assets: BusinessAsset[];
  decisionLedger: DecisionLedgerEntry[];
  history: ModuleRun[];
  userProfile?: UserProfile;
  nextRequirement?: string;
  interactionHistory?: Array<{
    round: number;
    playerMove: string;
    opponentMove: string;
    outcome: string;
  }>;
  reputationProfile?: {
    cooperation: number;
    reliability: number;
  };
  interactionMode: 'single' | 'competitive' | 'negotiation';
  behaviorIdentity?: {
    stability: 'low' | 'medium' | 'high';
    aggressiveness: 'low' | 'medium' | 'high';
    cooperation: 'low' | 'medium' | 'high';
    confidence: 'low' | 'medium' | 'high';
    credibilityScore: number;
    normalizedScore?: number;
    difficultyIndex?: number;
    percentileRank?: number;
    decisionIntegrityTier?: 'Tier A' | 'Tier B' | 'Tier C' | 'Tier D';
    reliabilityIndex: 'Low' | 'Medium' | 'High';
    volatilityIndex: number;
    decisionTraceScore?: number;
    correctiveRounds: number;
    penaltyMultiplier: number;
    penalties: { trust: number; flexibility: number };
  };
}

export interface ReadinessState {
  level: string;
  lastUpdatedRound: number;
  deadlineRound?: number;
  maintenanceRequired: boolean;
  history: string[];
}

export interface RiskConfidence {
  level: RiskLevel;
  confidence: RiskLevel;
}

export interface EventReadiness {
  venue: ReadinessState;
  entertainment: ReadinessState;
  food: ReadinessState;
  safety: ReadinessState;
  backup: ReadinessState;
}

export interface ComplianceState {
  registration: ReadinessState;
  tax: ReadinessState;
  employees: ReadinessState;
  permit: ReadinessState;
  records: ReadinessState;
}

export interface RoundRecord {
  round: number;
  decisions: Record<string, string>;
  results: RoundResults;
}

export interface GameState {
  module: ModuleType;
  round: number;
  cash: number;
  budget: number;
  inventory?: {
    chips: number;
    drinks: number;
    sweets: number;
  };
  eventReadiness?: EventReadiness;
  complianceState?: ComplianceState;
  expectedAttendance?: number;
  ticketPrice?: number;
  reputation: number;
  history: RoundRecord[];
  risks: string[];
  totalProtectionSpend?: number;
  sales?: number;
  rollingHistory?: {
    prices: Record<string, string[]>;
    restocks: Record<string, string[]>;
    cash: number[];
  };
  opportunityReadiness?: 'Low' | 'Medium' | 'High';
  completedModules: ModuleType[];
  learningState?: LearningState;
}

export interface Decisions {
  [key: string]: string;
}

export interface RoundResults {
  revenue?: number;
  reputation?: number;
  totalCost: number;
  profit?: number;
  marketFeedback: string;
  tutorFeedback: string;
  decisionQuality: 'Strong' | 'Risky' | 'Unstable';
  decisionQualityReason?: string;
  trajectory: 'Improving' | 'Declining' | 'Unstable' | 'Stable' | 'Critical';
  stabilityScore: number;
  secondaryInsights: string[];
  constraintViolation?: boolean;
  violationType?: 'budget_exceeded' | 'other';
  rejectedCost?: number;
  protectionCostRatio?: number;
  protectionEfficiency?: 'Efficient' | 'Balanced' | 'Heavy';
  riskConfidences?: Record<string, RiskConfidence>;
  drivers?: { category: string; impact: number }[];
  patterns?: string[];
  counterfactuals?: string[];
  nextMove?: string;
  endingCash?: number;
  cashStatus?: 'Healthy' | 'Tight' | 'Critical';
  inventory?: {
    chips: number;
    drinks: number;
    sweets: number;
  };
  opportunityReadiness?: 'Low' | 'Medium' | 'High';
  marketShare?: string;
  outcomeEfficiency?: 'High' | 'Medium' | 'Low';
  strategyStability?: 'Stable' | 'Unstable';
  recoveryProgress?: string;
  cashTrend?: 'Increasing' | 'Stable' | 'Declining';
  credibilityScore?: number;
  normalizedCredibilityScore?: number;
  difficultyIndex?: number;
  percentileRank?: number;
  decisionIntegrityTier?: 'Tier A' | 'Tier B' | 'Tier C' | 'Tier D';
  reliabilityIndex?: 'Low' | 'Medium' | 'High';
  behaviorConfidence?: 'Low' | 'Medium' | 'High';
  impactLevel?: 'Low' | 'Moderate' | 'High';
  carryoverImpactScore?: number;
  outsideOptionTriggered?: boolean;
  bestAchievableDeal?: string;
  simulationHash?: string;
  engineVersion?: string;
  moduleVersion?: string;
  decisionTraceScore?: number;
  institutionalRiskAssessment?: string;
  ledgerEntry?: {
    obligation: string;
    decision: string;
    result: string;
    statusChange: string;
    type?: 'Risk' | 'Obligation' | 'Interaction';
    impact?: 'Immediate' | 'Delayed' | 'CrossModule';
  };
  nextRequirement?: string;
  normalizedArtifact?: any;
  microSignals?: string[];
  artifact?: string;
  missedSales?: number;
  missedRevenue?: number;
  engineType?: 'ai' | 'deterministic';
}

export const INITIAL_STATE_MODULE_1: GameState = {
  module: 'money_rules',
  round: 1,
  cash: 1000,
  budget: 1000,
  inventory: { chips: 0, drinks: 0, sweets: 0 },
  reputation: 50,
  history: [],
  risks: ["No stock in hand", "Limited cash runway"],
  completedModules: [],
  learningState: {
    currentModule: 'money_rules',
    moduleStatus: { 'money_rules': 'available', 'event_disaster': 'locked', 'nomsa_fine': 'locked', 'decision_game': 'locked', 'strategy': 'locked' },
    moduleProgress: { 'money_rules': { current: 1, total: 12, unit: 'round' } },
    moduleSignals: {
      'money_rules': { label: 'Balance', value: 'Healthy', status: 'success' }
    },
    behaviorProfile: { stability: 'medium', riskTolerance: 'low', complianceDiscipline: 'strong' },
    diagnosis: { stability: 'N/A', compliance: 'N/A', risk: 'N/A', overall: 'Scanning...' },
    assets: [],
    decisionLedger: [],
    history: [],
    interactionMode: 'single'
  }
};

export const INITIAL_STATE_MODULE_2: GameState = {
  module: 'event_disaster',
  round: 1,
  cash: 5000,
  budget: 5000,
  eventReadiness: {
    venue: { level: 'None', lastUpdatedRound: 0, maintenanceRequired: false, history: [] },
    entertainment: { level: 'None', lastUpdatedRound: 0, maintenanceRequired: false, history: [] },
    food: { level: 'None', lastUpdatedRound: 0, maintenanceRequired: false, history: [] },
    safety: { level: 'None', lastUpdatedRound: 0, maintenanceRequired: false, history: [] },
    backup: { level: 'None', lastUpdatedRound: 0, maintenanceRequired: false, history: [] },
  },
  expectedAttendance: 120,
  ticketPrice: 50,
  reputation: 50,
  history: [],
  risks: [
    "Weather may affect attendance",
    "DJ may cancel without deposit",
    "Food may run out",
    "Overspending may leave no emergency cash",
    "School management may stop the event if safety is ignored",
  ],
  totalProtectionSpend: 0,
  completedModules: [],
  learningState: {
    currentModule: 'event_disaster',
    moduleStatus: { 'money_rules': 'completed', 'event_disaster': 'in_progress' },
    moduleProgress: { 'event_disaster': { current: 1, total: 5, unit: 'day' } },
    moduleSignals: {},
    behaviorProfile: { stability: 'medium', riskTolerance: 'low', complianceDiscipline: 'strong' },
    diagnosis: { stability: 'N/A', compliance: 'N/A', risk: 'N/A', overall: 'Scanning...' },
    assets: [],
    decisionLedger: [],
    history: [],
    interactionMode: 'single'
  }
};

export const INITIAL_STATE_MODULE_3: GameState = {
  module: 'nomsa_fine',
  round: 1,
  cash: 6000,
  budget: 8000, // Monthly sales
  sales: 8000,
  complianceState: {
    registration: { level: 'Required', lastUpdatedRound: 0, deadlineRound: 2, maintenanceRequired: false, history: [] },
    tax: { level: 'Required', lastUpdatedRound: 0, deadlineRound: 3, maintenanceRequired: false, history: [] },
    employees: { level: 'Weak', lastUpdatedRound: 0, deadlineRound: 4, maintenanceRequired: false, history: [] },
    permit: { level: 'Required', lastUpdatedRound: 0, deadlineRound: 5, maintenanceRequired: false, history: [] },
    records: { level: 'Basic', lastUpdatedRound: 0, deadlineRound: 1, maintenanceRequired: false, history: [] },
  },
  reputation: 50,
  opportunityReadiness: 'Low',
  history: [],
  risks: [
    "Business not registered formally",
    "Tax registration not done",
    "Employee records are weak",
    "Permit status unknown",
    "Recordkeeping is sparse",
  ],
  completedModules: [],
  learningState: {
    currentModule: 'nomsa_fine',
    moduleStatus: { 'money_rules': 'completed', 'event_disaster': 'completed', 'nomsa_fine': 'in_progress' },
    moduleProgress: { 'nomsa_fine': { current: 1, total: 6, unit: 'month' } },
    moduleSignals: {},
    behaviorProfile: { stability: 'high', riskTolerance: 'low', complianceDiscipline: 'strong' },
    diagnosis: { stability: 'Controlled', compliance: 'At Risk', risk: 'Exposed', overall: 'AT RISK' },
    assets: [],
    decisionLedger: [],
    history: [],
    interactionMode: 'single'
  }
};

export const INITIAL_STATE_MODULE_4: GameState = {
  module: 'decision_game',
  round: 1,
  cash: 10000,
  budget: 10000,
  reputation: 50, // Trust anchored at Neutral (50)
  history: [],
  risks: [
    "Competitor may undercut prices",
    "Market share loss if slow to react",
    "Profit margin collapse in price war",
  ],
  completedModules: ['money_rules', 'event_disaster', 'nomsa_fine'],
  learningState: {
    currentModule: 'decision_game',
    moduleStatus: { 'money_rules': 'completed', 'event_disaster': 'completed', 'nomsa_fine': 'completed', 'decision_game': 'in_progress' },
    moduleProgress: { 'decision_game': { current: 1, total: 15, unit: 'round' } },
    moduleSignals: {
      'decision_game': { label: 'Market Share', value: '50/50', status: 'success', trajectory: 'Stable' }
    },
    behaviorProfile: { stability: 'high', riskTolerance: 'low', complianceDiscipline: 'strong' },
    diagnosis: { stability: 'Solid', compliance: 'Clear', risk: 'Controlled', overall: 'READY' },
    assets: [],
    decisionLedger: [],
    history: [],
    interactionMode: 'competitive',
    reputationProfile: { cooperation: 0.5, reliability: 0.5 },
    interactionHistory: [],
    behaviorIdentity: {
      stability: 'medium',
      aggressiveness: 'low',
      cooperation: 'medium',
      confidence: 'low',
      credibilityScore: 50,
      reliabilityIndex: 'Medium',
      volatilityIndex: 0,
      correctiveRounds: 0,
      penaltyMultiplier: 1.0,
      penalties: { trust: 0, flexibility: 0 }
    }
  }
};

export const M3_COSTS: Record<string, number> = {
  "Register now": 800,
  "Register / file correctly": 1200,
  "File late": 450,
  "Register workers / keep records": 1500,
  "Apply for required permit": 1000,
  "Keep proper invoices and records": 300,
};

export interface ModuleRun {
  id: string;
  userId: string;
  moduleId: ModuleType;
  timestamp: string;
  rounds: RoundRecord[];
  finalState: GameState;
  score: ModuleScore;
  attemptType: 'baseline' | 'replay';
}

export interface ModuleScore {
  totalScore: number; // 0-100
  financialControl: number;
  operationalEfficiency: number;
  stabilityScore: number;
  signals: {
    cashLockOccurred: boolean;
    negativeMarginsOccurred: boolean;
    unstablePricing: boolean;
    stockoutFrequency: number;
    recoveryDemonstrated: boolean;
    totalMissedRevenue: number;
  };
  readinessBand: ReadinessBand;
}

export type ReadinessBand = 'High Risk' | 'At Risk' | 'Developing' | 'Reliable' | 'Strong';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  cohortId?: string;
  businessType?: string;
}

export interface Cohort {
  id: string;
  name: string;
  users: string[]; // User IDs
}

export interface BenchmarkSummary {
  version: string;
  totalParticipants: number;
  averageScore: number;
  percentiles: Record<number, number>;
  commonFails: Record<string, number>;
}

export const INITIAL_STATE = INITIAL_STATE_MODULE_1;
