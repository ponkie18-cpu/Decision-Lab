/**
 * Shared Simulation Payload Validation Module
 * Validates raw LLM outputs against domain schema and bounds prior to applying results.
 */

export interface ValidatedSimulationPayload {
  totalCost: number;
  profit: number;
  marketFeedback: string;
  tutorFeedback: string;
  decisionQuality: 'Strong' | 'Risky' | 'Unstable';
  trajectory: 'Improving' | 'Declining' | 'Unstable' | 'Stable' | 'Critical';
  stabilityScore: number;
  secondaryInsights: string[];
  microSignals?: string[];
  patterns?: string[];
  newState?: Record<string, any>;
  [key: string]: any;
}

export function validateSimulationPayload(raw: any): { valid: boolean; payload?: ValidatedSimulationPayload; error?: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, error: 'Payload is not a non-null object.' };
  }

  // Required core fields
  if (typeof raw.marketFeedback !== 'string' || !raw.marketFeedback.trim()) {
    return { valid: false, error: 'Missing or invalid marketFeedback string.' };
  }

  if (typeof raw.tutorFeedback !== 'string') {
    return { valid: false, error: 'Missing or invalid tutorFeedback string.' };
  }

  if (typeof raw.totalCost !== 'number' || isNaN(raw.totalCost) || raw.totalCost < 0) {
    return { valid: false, error: 'totalCost must be a non-negative number.' };
  }

  if (typeof raw.profit !== 'number' || isNaN(raw.profit)) {
    return { valid: false, error: 'profit must be a valid number.' };
  }

  // Domain bound checks
  const allowedQualities = ['Strong', 'Risky', 'Unstable'];
  if (raw.decisionQuality && !allowedQualities.includes(raw.decisionQuality)) {
    return { valid: false, error: `Invalid decisionQuality value: ${raw.decisionQuality}` };
  }

  const allowedTrajectories = ['Improving', 'Declining', 'Unstable', 'Stable', 'Critical'];
  if (raw.trajectory && !allowedTrajectories.includes(raw.trajectory)) {
    return { valid: false, error: `Invalid trajectory value: ${raw.trajectory}` };
  }

  if (typeof raw.stabilityScore === 'number') {
    if (isNaN(raw.stabilityScore) || raw.stabilityScore < 0 || raw.stabilityScore > 100) {
      return { valid: false, error: 'stabilityScore out of bounds (0-100).' };
    }
  }

  if (raw.secondaryInsights && !Array.isArray(raw.secondaryInsights)) {
    return { valid: false, error: 'secondaryInsights must be an array of strings.' };
  }

  return {
    valid: true,
    payload: {
      totalCost: Number(raw.totalCost),
      profit: Number(raw.profit),
      marketFeedback: String(raw.marketFeedback),
      tutorFeedback: String(raw.tutorFeedback),
      decisionQuality: allowedQualities.includes(raw.decisionQuality) ? raw.decisionQuality : 'Strong',
      trajectory: allowedTrajectories.includes(raw.trajectory) ? raw.trajectory : 'Stable',
      stabilityScore: typeof raw.stabilityScore === 'number' ? raw.stabilityScore : 3,
      secondaryInsights: Array.isArray(raw.secondaryInsights) ? raw.secondaryInsights.map(String) : [],
      microSignals: Array.isArray(raw.microSignals) ? raw.microSignals.map(String) : [],
      patterns: Array.isArray(raw.patterns) ? raw.patterns.map(String) : [],
      ...raw
    }
  };
}
