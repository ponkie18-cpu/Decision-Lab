// @ts-ignore
import { describe, it, expect, beforeEach } from 'vitest';
import { runDeterministicSimulation } from '../services/simulationService';
import { 
  INITIAL_STATE_MODULE_1, 
  INITIAL_STATE_MODULE_2, 
  INITIAL_STATE_MODULE_3, 
  INITIAL_STATE_MODULE_4, 
  GameState, 
  Decisions 
} from '../types';

describe('Module Progression Simulations (Deterministic Engine)', () => {

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  it('Module 1: Money Has Rules (12 Rounds)', () => {
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

    const roundSnapshots: any[] = [];

    for (let r = 1; r <= 12; r++) {
      const startRound = state.round;
      const dec = m1Decisions[r - 1];
      const res = runDeterministicSimulation(state, dec);

      // Invariants
      expect(res.newState.round).toBe(startRound + 1);
      expect(state.reputation).toBeGreaterThanOrEqual(0);
      expect(state.reputation).toBeLessThanOrEqual(100);
      expect(Number.isNaN(res.totalCost)).toBe(false);
      expect(Number.isNaN(res.profit)).toBe(false);
      expect(Number.isNaN(res.endingCash)).toBe(false);

      const endingCash = res.endingCash ?? (res.newState.cash ?? state.cash);
      roundSnapshots.push({
        round: r,
        totalCost: res.totalCost,
        profit: res.profit,
        endingCash,
        decisionQuality: res.decisionQuality,
      });

      state = {
        ...state,
        ...res.newState,
        round: res.newState.round || (r + 1),
        cash: res.newState.cash !== undefined ? res.newState.cash : (state.cash + (res.profit || 0)),
        history: [...state.history, { round: r, decisions: dec, results: res as any }]
      };
    }

    expect(state.round).toBe(13);
    expect(roundSnapshots).toMatchSnapshot();
  });

  it('Module 2: School Event Disaster (5 Days)', () => {
    let state: GameState = { ...INITIAL_STATE_MODULE_2 };

    const m2Decisions: Decisions[] = [
      { venue: "Basic setup", entertainment: "Cheap DJ", food: "Low food order", safety: "Basic safety plan", backup: "None" },
      { venue: "Proper setup", entertainment: "Cheap DJ", food: "Balanced food order", safety: "Basic safety plan", backup: "Rain backup" },
      { venue: "Proper setup", entertainment: "Reliable DJ", food: "Balanced food order", safety: "Proper safety plan", backup: "Rain backup" },
      { venue: "Proper setup", entertainment: "Reliable DJ", food: "Balanced food order", safety: "Proper safety plan", backup: "Full backup plan" },
      { venue: "Premium setup", entertainment: "Reliable DJ", food: "Large food order", safety: "Proper safety plan", backup: "Full backup plan" },
    ];

    const roundSnapshots: any[] = [];

    for (let d = 1; d <= 5; d++) {
      const startRound = state.round;
      const dec = m2Decisions[d - 1];
      const res = runDeterministicSimulation(state, dec);

      // Invariants
      expect(res.newState.round).toBe(startRound + 1);
      const rep = res.reputation ?? res.newState.reputation ?? state.reputation;
      expect(rep).toBeGreaterThanOrEqual(0);
      expect(rep).toBeLessThanOrEqual(100);
      expect(Number.isNaN(res.totalCost)).toBe(false);

      roundSnapshots.push({
        day: d,
        totalCost: res.totalCost,
        reputation: rep,
        decisionQuality: res.decisionQuality,
      });

      state = {
        ...state,
        ...res.newState,
        round: res.newState.round || (d + 1),
        budget: res.newState.budget !== undefined ? res.newState.budget : (state.budget - res.totalCost),
        reputation: rep,
        history: [...state.history, { round: d, decisions: dec, results: res as any }]
      };
    }

    expect(state.round).toBe(6);
    expect(roundSnapshots).toMatchSnapshot();
  });

  it('Module 3: Nomsa Gets a Fine (6 Months)', () => {
    let state: GameState = { ...INITIAL_STATE_MODULE_3 };

    const m3Decisions: Decisions[] = [
      { registration: "Register now", tax: "Delay", employees: "Ignore obligations", permit: "Apply for required permit", records: "Keep basic records" },
      { registration: "Register now", tax: "Register / file correctly", employees: "Register workers / keep records", permit: "Apply for required permit", records: "Keep proper invoices and records" },
      { registration: "Register now", tax: "Register / file correctly", employees: "Register workers / keep records", permit: "Apply for required permit", records: "Keep proper invoices and records" },
      { registration: "Register now", tax: "Register / file correctly", employees: "Register workers / keep records", permit: "Apply for required permit", records: "Keep proper invoices and records" },
      { registration: "Register now", tax: "Register / file correctly", employees: "Register workers / keep records", permit: "Apply for required permit", records: "Keep proper invoices and records" },
      { registration: "Register now", tax: "Register / file correctly", employees: "Register workers / keep records", permit: "Apply for required permit", records: "Keep proper invoices and records" },
    ];

    const roundSnapshots: any[] = [];
    const empiricalSalesCashTable: Array<{ month: number; sales: number; cash: number }> = [];

    for (let m = 1; m <= 6; m++) {
      const startRound = state.round;
      const dec = m3Decisions[m - 1];
      const res = runDeterministicSimulation(state, dec);

      // Invariants
      expect(res.newState.round).toBe(startRound + 1);
      expect(state.reputation).toBeGreaterThanOrEqual(0);
      expect(state.reputation).toBeLessThanOrEqual(100);
      expect(Number.isNaN(res.totalCost)).toBe(false);

      const currentSales = state.sales ?? 0;
      const currentCash = res.endingCash ?? (res.newState.cash ?? state.cash);

      empiricalSalesCashTable.push({
        month: m,
        sales: currentSales,
        cash: currentCash
      });

      roundSnapshots.push({
        month: m,
        totalCost: res.totalCost,
        profit: res.profit,
        endingCash: currentCash,
        sales: currentSales,
        opportunityReadiness: res.opportunityReadiness || state.opportunityReadiness,
        decisionQuality: res.decisionQuality,
      });

      state = {
        ...state,
        ...res.newState,
        round: res.newState.round || (m + 1),
        cash: currentCash,
        history: [...state.history, { round: m, decisions: dec, results: res as any }]
      };
    }

    expect(state.round).toBe(7);
    expect(roundSnapshots).toMatchSnapshot();

    // Empirical table print
    console.log('\n==================================================');
    console.log('EMPIRICAL MODULE 3 MONTH-BY-MONTH SALES / CASH TABLE');
    console.log('==================================================');
    console.table(empiricalSalesCashTable);
  });

  it('Module 4: The Decision Game (15 Rounds)', () => {
    let state: GameState = { ...INITIAL_STATE_MODULE_4 };

    const roundSnapshots: any[] = [];

    for (let r = 1; r <= 15; r++) {
      const startRound = state.round;
      const dec: Decisions = r <= 5 
        ? { price: "Medium Price", action: "Cooperate" }
        : (r <= 10 ? { action: "Cooperate" } : { offer: "Counter Fair" });

      const res = runDeterministicSimulation(state, dec);

      // Invariants
      expect(res.newState.round).toBe(startRound + 1);
      expect(res.credibilityScore).toBeGreaterThanOrEqual(0);
      expect(res.credibilityScore).toBeLessThanOrEqual(100);
      expect(Number.isNaN(res.profit)).toBe(false);

      roundSnapshots.push({
        round: r,
        profit: res.profit,
        credibilityScore: res.credibilityScore,
        decisionIntegrityTier: res.decisionIntegrityTier,
        marketShare: res.marketShare,
        decisionQuality: res.decisionQuality,
      });

      state = {
        ...state,
        ...res.newState,
        round: res.newState.round || (r + 1),
        history: [...state.history, { round: r, decisions: dec, results: res as any }]
      };
    }

    expect(state.round).toBe(16);
    expect(roundSnapshots).toMatchSnapshot();
  });
});
