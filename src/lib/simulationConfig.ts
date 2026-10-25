/**
 * Centralized Simulation Configuration & Constants
 * Dinaledi360 Decision Engine v3.0 / v4.4
 */

// Module 1: Money Has Rules (Tuck Shop) Constants
// Source: src/services/simulationService.ts:182-184 & src/services/behavioralPatterns.ts:32-34
export const M1_UNIT_COSTS = {
  chips: 5,   // Source: src/services/behavioralPatterns.ts:32
  drinks: 6,  // Source: src/services/behavioralPatterns.ts:33
  sweets: 3,  // Source: src/services/behavioralPatterns.ts:34
};

export const M1_COLD_STORAGE_COST = 200; // Source: src/services/simulationService.ts:184

// Module 2: School Event Disaster (Event Planner) Constants
// Source: src/services/behavioralPatterns.ts:10-27
export const EVENT_PLANNER_OPERATING_BUDGET = 25000;  // Source: src/services/behavioralPatterns.ts:10
export const EVENT_PLANNER_FUNDRAISING_TARGET = 40000; // Source: src/services/behavioralPatterns.ts:11

export const EVENT_PLANNER_COSTS: Record<string, number> = {
  "None": 0,
  "No safety plan": 0,
  "Basic setup": 500,
  "Proper setup": 1200,
  "Premium setup": 2000,
  "Cheap DJ": 800,
  "Reliable DJ": 1500,
  "Low food order": 800,
  "Balanced food order": 1500,
  "Large food order": 2300,
  "Basic safety plan": 500,
  "Proper safety plan": 1000,
  "Rain backup": 700,
  "Supplier backup": 700,
  "Full backup plan": 1200,
}; // Source: src/services/behavioralPatterns.ts:13-27

// Module 3: Nomsa Gets a Fine (Spaza / Catering Compliance) Constants
// Source: src/types.ts:298-305, 375-382 & src/services/simulationService.ts:278-289

export const M3_INITIAL_SALES = 8000; // Source: src/types.ts:299
export const M3_INITIAL_CASH = 6000;  // Source: src/types.ts:297

export const M3_DEADLINE_ROUNDS = {
  recordkeeping: 1, // Source: src/types.ts:305
  registration: 2,  // Source: src/types.ts:301
  tax: 3,           // Source: src/types.ts:302
  employees: 4,     // Source: src/types.ts:303
  permit: 5,        // Source: src/types.ts:304
};

// Voluntary Statutory Compliance Fees (UI Choice Group Costs)
// Source: src/types.ts:375-382
export const M3_COSTS: Record<string, number> = {
  "Register now": 800,
  "Register / file correctly": 1200,
  "File late": 450,
  "Register workers / keep records": 1500,
  "Apply for required permit": 1000, // OWNER-DECISION-PENDING (D#1): R1,000 in code M3_COSTS vs R300 in release illustration
  "Keep proper invoices and records": 300,
};

// OWNER-DECISION-PENDING (D#1): Duplicate export for cashflow illustration permit fee constant
export const M3_ILLUSTRATION_PERMIT_FEE = 300; // Source: Released cashflow illustration material

// Engine 2-Action Obsolete Fine Constants
// Source: src/services/simulationService.ts:278-289
export const M3_ENGINE_OBSOLETE_FINES = {
  municipalByLawFineMonth2: 1200, // Source: src/services/simulationService.ts:280
  dohAuditFailureMonth4: 3500,    // OWNER-DECISION-PENDING (D#2): Obsolete 2-action schema fine vs 5-key statutory penalty
  sarsUifReviewMonth5: 8400,      // OWNER-DECISION-PENDING (D#2): Obsolete 2-action schema fine vs 5-key statutory penalty
};

// Module 4: The Decision Game Constants
// Source: src/services/simulationService.ts:50-95
export const M4_PAYOFF_MATRIX = {
  cooperateCooperate: { user: 1800, rival: 1800 }, // Source: src/services/simulationService.ts:54
  cooperateCompete:   { user: 400,  rival: 2600 }, // Source: src/services/simulationService.ts:57
  competeCooperate:   { user: 2600, rival: 400 },  // Source: src/services/simulationService.ts:60
  competeCompete:     { user: 900,  rival: 900 },  // Source: src/services/simulationService.ts:63
  dominateAny:        { user: 1200, rival: 1200 }, // Source: src/services/simulationService.ts:51
};
