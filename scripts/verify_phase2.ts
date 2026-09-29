import { calculateModule3Score, calculateModule1Score } from '../src/services/reportingService';
import { 
  detectModule1BehavioralTags, 
  detectModule3BehavioralTags, 
  detectBehavioralTags,
  EVENT_PLANNER_COSTS 
} from '../src/services/behavioralPatterns';
import { RoundRecord } from '../src/types';

console.log("=== BEGIN PHASE 2 VERIFICATION SUITE ===");

// -------------------------------------------------------------
// V9: calculateModule3Score verification
// -------------------------------------------------------------
console.log("\n[V9] Testing calculateModule3Score deterministic behavior:");

const module3RoundsBalanced: RoundRecord[] = [
  {
    round: 1,
    decisions: { venue: 'School hall (free)', entertainment: 'Student DJ (R200)', food: 'Snack platters (R600)', safety: 'First-aid kit (R150)', backup: 'None' },
    results: { totalCost: 950, endingCash: 4050, reputation: 60 } as any
  },
  {
    round: 2,
    decisions: { venue: 'School hall (free)', entertainment: 'Student DJ (R200)', food: 'Snack platters (R600)', safety: 'First-aid kit (R150)', backup: 'Gazebo (R300)' },
    results: { totalCost: 1250, endingCash: 2800, reputation: 70 } as any
  },
  {
    round: 3,
    decisions: { venue: 'School hall (free)', entertainment: 'Community band (R500)', food: 'Food truck (R1,200)', safety: 'Security guard (R400)', backup: 'Indoor option (R500)' },
    results: { totalCost: 2600, endingCash: 200, reputation: 85, revenue: 5000 } as any
  }
];

const score1 = calculateModule3Score(module3RoundsBalanced);
const score1_repeat = calculateModule3Score(module3RoundsBalanced);

console.log("Balanced Run Result:", JSON.stringify(score1, null, 2));
console.log("Determinism Check (score1 === score1_repeat):", JSON.stringify(score1) === JSON.stringify(score1_repeat));

// Unsafe run (zero safety spend)
const module3RoundsUnsafe: RoundRecord[] = [
  {
    round: 1,
    decisions: { venue: 'Outdoor field (R500)', entertainment: 'Celebrity MC (R2,000)', food: 'Buffet (R2,500)', safety: 'None', backup: 'None' },
    results: { totalCost: 5000, endingCash: 0, reputation: 40 } as any
  }
];
const scoreUnsafe = calculateModule3Score(module3RoundsUnsafe);
console.log("Unsafe Run Result (expected low score & safety penalty):", JSON.stringify(scoreUnsafe, null, 2));

// -------------------------------------------------------------
// V10: detectModule1BehavioralTags verification
// -------------------------------------------------------------
console.log("\n[V10] Testing detectModule1BehavioralTags:");

const m1Overcorrection: RoundRecord[] = [
  { round: 1, decisions: { chipsPrice: "10" }, results: {} as any },
  { round: 2, decisions: { chipsPrice: "16" }, results: {} as any }, // +60%
  { round: 3, decisions: { chipsPrice: "11" }, results: {} as any }, // -31%
];
const tagsOvercorrection = detectModule1BehavioralTags(m1Overcorrection);
console.log("Overcorrection tags:", tagsOvercorrection);

const m1CashLock: RoundRecord[] = [
  { round: 1, decisions: {}, results: { endingCash: 120 } as any },
  { round: 2, decisions: {}, results: { endingCash: 80 } as any },
];
const tagsCashLock = detectModule1BehavioralTags(m1CashLock);
console.log("Cash lock tags:", tagsCashLock);

const m1NegativeMargin: RoundRecord[] = [
  { round: 1, decisions: { chipsPrice: "2", drinksPrice: "2" }, results: {} as any },
  { round: 2, decisions: { chipsPrice: "3", drinksPrice: "3" }, results: {} as any },
];
const tagsNegativeMargin = detectModule1BehavioralTags(m1NegativeMargin);
console.log("Negative margin tags:", tagsNegativeMargin);

const m1Stockout: RoundRecord[] = [
  { round: 1, decisions: {}, results: { microSignals: ["[STOCKOUT OCCURRED] Sold out chips"] } as any },
  { round: 2, decisions: {}, results: { secondaryInsights: ["Stockout Frequency: High"] } as any },
];
const tagsStockout = detectModule1BehavioralTags(m1Stockout);
console.log("Stockout tags:", tagsStockout);

// -------------------------------------------------------------
// V11: detectModule3BehavioralTags verification
// -------------------------------------------------------------
console.log("\n[V11] Testing detectModule3BehavioralTags:");

// Budget conservator: total spend < 2500
const m3Conservator: RoundRecord[] = [
  { round: 1, decisions: { venue: 'School hall (free)', entertainment: 'Student DJ (R200)', food: 'None', safety: 'First-aid kit (R150)', backup: 'None' }, results: {} as any },
  { round: 2, decisions: { venue: 'School hall (free)', entertainment: 'Student DJ (R200)', food: 'Snack platters (R600)', safety: 'First-aid kit (R150)', backup: 'None' }, results: {} as any },
];
console.log("Budget conservator tags:", detectModule3BehavioralTags(m3Conservator));

// Risk ignorer: safety is None or R0
const m3RiskIgnorer: RoundRecord[] = [
  { round: 1, decisions: { venue: 'School hall (free)', entertainment: 'Student DJ (R200)', food: 'Snack platters (R600)', safety: 'None', backup: 'None' }, results: {} as any },
  { round: 2, decisions: { venue: 'School hall (free)', entertainment: 'Student DJ (R200)', food: 'Snack platters (R600)', safety: 'No safety plan', backup: 'None' }, results: {} as any },
];
console.log("Risk ignorer tags:", detectModule3BehavioralTags(m3RiskIgnorer));

// Overconfigured planner: > 5000 spend
const m3Overconfigured: RoundRecord[] = [
  { round: 1, decisions: { venue: 'Community centre (R1,500)', entertainment: 'Celebrity MC (R2,000)', food: 'Buffet (R2,500)', safety: 'Security guard (R400)', backup: 'Indoor option (R500)' }, results: {} as any },
];
console.log("Overconfigured planner tags:", detectModule3BehavioralTags(m3Overconfigured));

// Contingency tactician: backup booked in 2+ rounds
const m3Contingency: RoundRecord[] = [
  { round: 1, decisions: { venue: 'School hall (free)', entertainment: 'Student DJ (R200)', food: 'Snack platters (R600)', safety: 'Security guard (R400)', backup: 'Gazebo (R300)' }, results: {} as any },
  { round: 2, decisions: { venue: 'School hall (free)', entertainment: 'Student DJ (R200)', food: 'Snack platters (R600)', safety: 'Security guard (R400)', backup: 'Indoor option (R500)' }, results: {} as any },
];
console.log("Contingency tactician tags:", detectModule3BehavioralTags(m3Contingency));

// -------------------------------------------------------------
// V14: Fairness & Scientific Validity: Identical Decisions = Identical Results
// -------------------------------------------------------------
console.log("\n[V14] Testing Fairness (Identical Decisions -> Identical Results):");

const learnerA_rounds: RoundRecord[] = [
  { round: 1, decisions: { chipsPrice: "12", drinksPrice: "10", chipsRestock: "50", drinksRestock: "40" }, results: { endingCash: 2400, revenue: 900, totalCost: 500, profit: 400 } as any },
  { round: 2, decisions: { chipsPrice: "12", drinksPrice: "10", chipsRestock: "50", drinksRestock: "40" }, results: { endingCash: 2800, revenue: 900, totalCost: 500, profit: 400 } as any },
  { round: 3, decisions: { chipsPrice: "12", drinksPrice: "10", chipsRestock: "50", drinksRestock: "40" }, results: { endingCash: 3200, revenue: 900, totalCost: 500, profit: 400 } as any }
];

const learnerB_rounds: RoundRecord[] = [
  { round: 1, decisions: { chipsPrice: "12", drinksPrice: "10", chipsRestock: "50", drinksRestock: "40" }, results: { endingCash: 2400, revenue: 900, totalCost: 500, profit: 400 } as any },
  { round: 2, decisions: { chipsPrice: "12", drinksPrice: "10", chipsRestock: "50", drinksRestock: "40" }, results: { endingCash: 2800, revenue: 900, totalCost: 500, profit: 400 } as any },
  { round: 3, decisions: { chipsPrice: "12", drinksPrice: "10", chipsRestock: "50", drinksRestock: "40" }, results: { endingCash: 3200, revenue: 900, totalCost: 500, profit: 400 } as any }
];

const tagsA = detectBehavioralTags('money_rules', learnerA_rounds);
const tagsB = detectBehavioralTags('money_rules', learnerB_rounds);
const scoreA = calculateModule1Score(learnerA_rounds);
const scoreB = calculateModule1Score(learnerB_rounds);

console.log("Learner A Tags:", tagsA);
console.log("Learner B Tags:", tagsB);
console.log("Tags Exact Match:", JSON.stringify(tagsA) === JSON.stringify(tagsB));
console.log("Score Exact Match:", JSON.stringify(scoreA) === JSON.stringify(scoreB));

if (JSON.stringify(tagsA) === JSON.stringify(tagsB) && JSON.stringify(scoreA) === JSON.stringify(scoreB)) {
  console.log(">>> FAIRNESS & SCIENTIFIC VALIDITY GUARANTEE CONFIRMED <<<");
} else {
  console.error(">>> FAILED FAIRNESS TEST <<<");
}

console.log("\n[V12] Testing getCohortAggregateReport (Live aggregation & caching):");
import { getCohortAggregateReport, getUserBehavioralProfile } from '../src/services/adminService';

const cohortReport1 = await getCohortAggregateReport('cohort_2026_q1');
console.log("Cohort Report 1 Total Participants:", cohortReport1.totalParticipants);
console.log("Cohort Report 1 Top Behavioral Tags:", cohortReport1.topBehavioralTags.slice(0, 3));
console.log("Cohort Report 1 Attempt Comparison:", cohortReport1.attemptComparison.slice(0, 2));

// Test cache hit
const t0 = Date.now();
const cohortReportCached = await getCohortAggregateReport('cohort_2026_q1');
const tDelta = Date.now() - t0;
console.log("Cache Retrieval Latency (ms):", tDelta);
console.log("Cached Report Matches Initial:", JSON.stringify(cohortReport1) === JSON.stringify(cohortReportCached));

// Test individual profile determinism (zero name-based logic)
console.log("\n[V13 & V14] Testing getUserBehavioralProfile determinism:");
const profile1 = await getUserBehavioralProfile('USR_TEST_ALPHA', {
  id: 'run_1',
  learnerCode: 'USR_TEST_ALPHA',
  moduleId: 'event_disaster',
  attemptType: 'baseline',
  rounds: module3RoundsBalanced
} as any);

const profile2 = await getUserBehavioralProfile('USR_TEST_BETA', {
  id: 'run_2',
  learnerCode: 'USR_TEST_BETA',
  moduleId: 'event_disaster',
  attemptType: 'baseline',
  rounds: module3RoundsBalanced
} as any);

console.log("Profile Alpha Tier & Score:", profile1.latestRun?.decisionIntegrityTier, profile1.latestRun?.credibilityScore);
console.log("Profile Beta Tier & Score:", profile2.latestRun?.decisionIntegrityTier, profile2.latestRun?.credibilityScore);
console.log("Identical Decisions yield identical Radar Scores across different IDs:", 
  JSON.stringify(profile1.latestRun?.radarDomains) === JSON.stringify(profile2.latestRun?.radarDomains)
);

console.log("\n=== PHASE 2 VERIFICATION SUITE COMPLETED ===");
