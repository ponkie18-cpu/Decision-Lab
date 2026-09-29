/**
 * Admin & Cohort Reporting Types for Dinaledi360 Forensic Engine
 */

import { ModuleType, RoundRecord, ModuleRun } from '../types';

export interface MinorParticipantProfile {
  id: string; // Anonymous learner code
  maskedName: string; // e.g. "Participant #001"
  name?: never; // Structurally forbidden: impossible to set
  email?: never; // Structurally forbidden: impossible to set
  schoolName?: never; // Structurally forbidden
  grade?: never; // Structurally forbidden
  institutionId: string;
  institutionName: string;
  cohortId: string;
  cohortName: string;
  role: 'student';
  isAdmin: false;
  createdAt: string;
  attemptsCount: number;
  isMinorCohort: true;
}

export interface AdultParticipantProfile {
  id: string;
  name: string;
  email: string;
  institutionId: string;
  institutionName: string;
  cohortId: string;
  cohortName: string;
  role: 'student' | 'entrepreneur' | 'admin' | 'institution_evaluator';
  isAdmin: boolean;
  createdAt: string;
  attemptsCount: number;
  isMinorCohort: false;
}

export type UserAdminProfile = MinorParticipantProfile | AdultParticipantProfile;

export interface BehavioralRadarDomain {
  domain: string;
  score: number; // 0 - 100
  benchmark: number; // Cohort or National benchmark
  fullMark: number;
  description: string;
}

export interface UserBehavioralProfileData {
  user: UserAdminProfile;
  latestRun: {
    id: string;
    moduleId: ModuleType;
    simulationHash: string;
    timestamp: string;
    totalRounds: number;
    decisionIntegrityTier: 'Tier A' | 'Tier B' | 'Tier C' | 'Tier D';
    percentileRank: number;
    reliabilityIndex: 'High' | 'Medium' | 'Low';
    credibilityScore: number;
    difficultyIndex: number;
    volatilityIndex: number;
    behavioralTags: string[];
    radarDomains: BehavioralRadarDomain[];
    dtsTimeline: Array<{
      round: number;
      dts: number; // Decision Trace Score
      cashStatus: string;
      decisionQuality: string;
    }>;
    rounds: RoundRecord[];
    worstRound: {
      round: number;
      dts: number;
      obligation: string;
      decision: string;
      consequence: string;
      tutorFeedback: string;
      secondaryInsights: string[];
    };
  };
}

export interface MinorLedgerParticipant {
  id: string; // Anonymous learner code
  maskedName: string; // "Participant #001"
  name?: never; // Structurally forbidden
  email?: never; // Structurally forbidden
  tier: string;
  attempt1Score: number;
  attempt2Score: number;
  delta: number;
  primaryPitfall: string;
  reliability: string;
}

export interface AdultLedgerParticipant {
  id: string;
  maskedName: string;
  name?: string;
  email?: string;
  tier: string;
  attempt1Score: number;
  attempt2Score: number;
  delta: number;
  primaryPitfall: string;
  reliability: string;
}

export interface MinorCohortAggregateData {
  isMinorCohort: true;
  cohortId: string;
  cohortName: string;
  institutionName: string;
  totalParticipants: number;
  completedSimulations: number;
  averageDTS: number;
  averageCredibility: number;
  roiImprovementPercent: number;
  tierDistribution: Array<{
    tier: 'Tier A' | 'Tier B' | 'Tier C' | 'Tier D';
    count: number;
    percentage: number;
    description: string;
    color: string;
  }>;
  topBehavioralTags: Array<{
    tag: string;
    category: 'Risk' | 'Financial' | 'Compliance' | 'Strategic';
    count: number;
    percentage: number;
    impact: 'High' | 'Medium' | 'Low';
  }>;
  attemptComparison: Array<{
    dimension: string;
    attempt1: number;
    attempt2: number;
    improvement: number;
  }>;
  anonymizedUsers: MinorLedgerParticipant[];
}

export interface AdultCohortAggregateData {
  isMinorCohort: false;
  cohortId: string;
  cohortName: string;
  institutionName: string;
  totalParticipants: number;
  completedSimulations: number;
  averageDTS: number;
  averageCredibility: number;
  roiImprovementPercent: number;
  tierDistribution: Array<{
    tier: 'Tier A' | 'Tier B' | 'Tier C' | 'Tier D';
    count: number;
    percentage: number;
    description: string;
    color: string;
  }>;
  topBehavioralTags: Array<{
    tag: string;
    category: 'Risk' | 'Financial' | 'Compliance' | 'Strategic';
    count: number;
    percentage: number;
    impact: 'High' | 'Medium' | 'Low';
  }>;
  attemptComparison: Array<{
    dimension: string;
    attempt1: number;
    attempt2: number;
    improvement: number;
  }>;
  anonymizedUsers: AdultLedgerParticipant[];
}

export type CohortAggregateData = MinorCohortAggregateData | AdultCohortAggregateData;

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO string
  createdAtMs: number;
  learnerCode: string;
  cohortId: string;
  moduleId: string;
  moduleName: string;
  roundNumber: number;
  actionType: 'decision_submitted' | 'run_started' | 'run_completed';
  decisionSummary: string;
  resultSummary: string;
  decisions: Record<string, any>;
  results: Record<string, any>;
  behavioralTags: string[];
  severity: 'normal' | 'warning' | 'critical' | 'success';
}
