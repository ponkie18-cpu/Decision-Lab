import { simulateRound } from '../src/services/simulationService';
import {
  INITIAL_STATE_MODULE_1,
  INITIAL_STATE_MODULE_2,
  INITIAL_STATE_MODULE_3,
  INITIAL_STATE_MODULE_4,
  GameState,
  Decisions
} from '../src/types';

async function testModule1() {
  console.log('\n==================================================');
  console.log('TESTING MODULE 1: MONEY HAS RULES (12 ROUNDS)');
  console.log('==================================================');

  let state: GameState = { ...INITIAL_STATE_MODULE_1 };

  const m1Decisions: Decisions[] = [
    { chipsPrice: "7", drinksPrice: "8", sweetsPrice: "4", chipsRestock: "20", drinksRestock: "20", sweetsRestock: "20" },
    { chipsPrice: "8", drinksPrice: "9", sweetsPrice: "4", chipsRestock: "20", drinksRestock: "20", sweetsRestock: "20" },
    { chipsPrice: "8", drinksPrice: "10", sweetsPrice: "5", chipsRestock: "15", drinksRestock: "15", sweetsRestock: "15" },
    { chipsPrice: "8", drinksPrice: "10", sweetsPrice: "5", chipsRestock: "10", drinksRestock: "10", sweetsRestock: "10" },
    { chipsPrice: "9", drinksPrice: "10", sweetsPrice: "5", chipsRestock: "20", drinksRestock: "20", sweetsRestock: "20" },
    { chipsPrice: "9", drinksPrice: "10", sweetsPrice: "5", chipsRestock: "15", drinksRestock: "15", sweetsRestock: "15" },
    { chipsPrice: "9", drinksPrice: "11", sweetsPrice: "5", chipsRestock: "15", drinksRestock: "15", sweetsRestock: "15" },
    { chipsPrice: "9", drinksPrice: "11", sweetsPrice: "5", chipsRestock: "10", drinksRestock: "10", sweetsRestock: "10" },
    { chipsPrice: "10", drinksPrice: "11", sweetsPrice: "5", chipsRestock: "15", drinksRestock: "15", sweetsRestock: "15" },
    { chipsPrice: "10", drinksPrice: "12", sweetsPrice: "5", chipsRestock: "15", drinksRestock: "15", sweetsRestock: "15" },
    { chipsPrice: "10", drinksPrice: "12", sweetsPrice: "5", chipsRestock: "10", drinksRestock: "10", sweetsRestock: "10" },
    { chipsPrice: "10", drinksPrice: "12", sweetsPrice: "5", chipsRestock: "10", drinksRestock: "10", sweetsRestock: "10" },
  ];

  for (let r = 1; r <= 12; r++) {
    const dec = m1Decisions[r - 1];
    const res = await simulateRound(state, dec);
    console.log(`[Module 1] Round ${r}/12: Profit=R${res.profit}, TotalCost=R${res.totalCost}, EndingCash=R${res.endingCash || res.newState.cash}, Quality=${res.decisionQuality}`);

    state = {
      ...state,
      ...res.newState,
      round: res.newState.round || (r + 1),
      cash: res.newState.cash !== undefined ? res.newState.cash : (state.cash + (res.profit || 0)),
      history: [...state.history, { round: r, decisions: dec, results: res as any }]
    };
  }

  console.log(`[Module 1 Result]: Successfully completed all 12 rounds! Final Cash: R${state.cash}`);
}

async function testModule2() {
  console.log('\n==================================================');
  console.log('TESTING MODULE 2: SCHOOL EVENT DISASTER (5 DAYS)');
  console.log('==================================================');

  let state: GameState = { ...INITIAL_STATE_MODULE_2 };

  const m2Decisions: Decisions[] = [
    { venue: "Basic setup", entertainment: "Cheap DJ", food: "Low food order", safety: "Basic safety plan", backup: "None" },
    { venue: "Proper setup", entertainment: "Cheap DJ", food: "Balanced food order", safety: "Basic safety plan", backup: "Rain backup" },
    { venue: "Proper setup", entertainment: "Reliable DJ", food: "Balanced food order", safety: "Proper safety plan", backup: "Rain backup" },
    { venue: "Proper setup", entertainment: "Reliable DJ", food: "Balanced food order", safety: "Proper safety plan", backup: "Full backup plan" },
    { venue: "Premium setup", entertainment: "Reliable DJ", food: "Large food order", safety: "Proper safety plan", backup: "Full backup plan" },
  ];

  for (let d = 1; d <= 5; d++) {
    const dec = m2Decisions[d - 1];
    const res = await simulateRound(state, dec);
    console.log(`[Module 2] Day ${d}/5: Spend=R${res.totalCost}, Reputation=${res.reputation || res.newState.reputation}, Quality=${res.decisionQuality}`);

    state = {
      ...state,
      ...res.newState,
      round: res.newState.round || (d + 1),
      budget: res.newState.budget !== undefined ? res.newState.budget : (state.budget - res.totalCost),
      history: [...state.history, { round: d, decisions: dec, results: res as any }]
    };
  }

  console.log(`[Module 2 Result]: Successfully completed all 5 days! Final Reputation: ${state.reputation}/100`);
}

async function testModule3() {
  console.log('\n==================================================');
  console.log('TESTING MODULE 3: NOMSA GETS A FINE (6 MONTHS)');
  console.log('==================================================');

  let state: GameState = { ...INITIAL_STATE_MODULE_3 };

  const m3Decisions: Decisions[] = [
    { registration: "Register now", tax: "Delay", employees: "Ignore obligations", permit: "Apply for required permit", records: "Keep basic records" },
    { registration: "Register now", tax: "Register / file correctly", employees: "Register workers / keep records", permit: "Apply for required permit", records: "Keep proper invoices and records" },
    { registration: "Register now", tax: "Register / file correctly", employees: "Register workers / keep records", permit: "Apply for required permit", records: "Keep proper invoices and records" },
    { registration: "Register now", tax: "Register / file correctly", employees: "Register workers / keep records", permit: "Apply for required permit", records: "Keep proper invoices and records" },
    { registration: "Register now", tax: "Register / file correctly", employees: "Register workers / keep records", permit: "Apply for required permit", records: "Keep proper invoices and records" },
    { registration: "Register now", tax: "Register / file correctly", employees: "Register workers / keep records", permit: "Apply for required permit", records: "Keep proper invoices and records" },
  ];

  for (let m = 1; m <= 6; m++) {
    const dec = m3Decisions[m - 1];
    const res = await simulateRound(state, dec);
    console.log(`[Module 3] Month ${m}/6: Quality=${res.decisionQuality}, Trajectory=${res.trajectory}, OpportunityReadiness=${res.opportunityReadiness || state.opportunityReadiness}`);

    state = {
      ...state,
      ...res.newState,
      round: res.newState.round || (m + 1),
      history: [...state.history, { round: m, decisions: dec, results: res as any }]
    };
  }

  console.log(`[Module 3 Result]: Successfully completed all 6 months! Final Opportunity Readiness: ${state.opportunityReadiness}`);
}

async function testModule4() {
  console.log('\n==================================================');
  console.log('TESTING MODULE 4: THE DECISION GAME (15 ROUNDS)');
  console.log('==================================================');

  let state: GameState = { ...INITIAL_STATE_MODULE_4 };

  for (let r = 1; r <= 15; r++) {
    const dec: Decisions = r <= 5
      ? { price: "Medium Price", action: "Cooperate" }
      : (r <= 10 ? { action: "Cooperate" } : { offer: "Counter Fair" });

    const res = await simulateRound(state, dec);
    console.log(`[Module 4] Round ${r}/15: Payoff=R${res.profit}, Credibility=${res.credibilityScore}, Tier=${res.decisionIntegrityTier}`);

    state = {
      ...state,
      ...res.newState,
      round: res.newState.round || (r + 1),
      history: [...state.history, { round: r, decisions: dec, results: res as any }]
    };
  }

  console.log(`[Module 4 Result]: Successfully completed all 15 rounds! Final Credibility: ${state.learningState?.behaviorIdentity?.credibilityScore}`);
}

async function main() {
  console.log('STARTING ALL 4 SIMULATION MODULE PROGRESSION VERIFICATIONS');
  await testModule1();
  await testModule2();
  await testModule3();
  await testModule4();
  console.log('\nALL 4 SIMULATION MODULES VERIFIED SUCCESSFULLY!');
}

main().catch(err => {
  console.error("Simulation test failed:", err);
  process.exit(1);
});
