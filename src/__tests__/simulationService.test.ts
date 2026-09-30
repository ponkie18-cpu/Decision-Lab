import { describe, it, expect, vi } from 'vitest';
import { simulateRound } from '../services/simulationService';
import { INITIAL_STATE_MODULE_1, GameState } from '../types';

const mockHttpsCallable = vi.fn().mockRejectedValue(new Error('Firebase function mock offline'));

vi.mock('../firebase', () => ({
  functions: {}
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: () => mockHttpsCallable
}));

describe('simulateRound (Deterministic Engine)', () => {
  it('executes Module 1 deterministic simulation with standard decisions', async () => {
    const state: GameState = {
      ...INITIAL_STATE_MODULE_1,
      module: 'money_rules',
      round: 1,
      cash: 1000
    };

    const decisions = {
      chipsPrice: '10',
      drinksPrice: '12',
      sweetsPrice: '5',
      chipsRestock: '10',
      drinksRestock: '10',
      sweetsRestock: '10'
    };

    const res = await simulateRound(state, decisions);
    expect(res.engineType).toBe('deterministic');
    expect(res.endingCash).toBeDefined();
    expect(typeof res.profit).toBe('number');
    expect(typeof res.totalCost).toBe('number');
  });

  it('handles empty decisions gracefully without throwing', async () => {
    const state: GameState = {
      ...INITIAL_STATE_MODULE_1,
      module: 'money_rules',
      round: 1,
      cash: 500
    };

    const res = await simulateRound(state, {});
    expect(res.engineType).toBe('deterministic');
    expect(res.decisionQuality).toBeDefined();
  });

  it('enforces budget constraints and bounds', async () => {
    const state: GameState = {
      ...INITIAL_STATE_MODULE_1,
      module: 'money_rules',
      round: 2,
      cash: 100
    };

    const decisions = {
      chipsRestock: '100'
    };

    const res = await simulateRound(state, decisions);
    expect(res.engineType).toBe('deterministic');
    expect(res.endingCash).toBeLessThan(100);
  });

  it('confines user decisions to isolated payload parameter during callable function invocation', async () => {
    const state: GameState = {
      ...INITIAL_STATE_MODULE_1,
      module: 'money_rules',
      round: 1,
      cash: 1000
    };

    const userDecisions = {
      chipsPrice: '7',
      chipsRestock: '20'
    };

    const mockSuccessCallable = vi.fn().mockResolvedValue({
      data: {
        totalCost: 100,
        profit: 50,
        marketFeedback: 'Mock AI market response',
        tutorFeedback: 'Mock AI tutor guidance',
        decisionQuality: 'Strong',
        trajectory: 'Stable',
        stabilityScore: 4,
        secondaryInsights: []
      }
    });

    mockHttpsCallable.mockImplementationOnce(mockSuccessCallable);

    const res = await simulateRound(state, userDecisions);
    expect(res.engineType).toBe('ai');
    expect(mockSuccessCallable).toHaveBeenCalledWith(
      expect.objectContaining({
        userDecisions: {
          chipsPrice: '7',
          chipsRestock: '20'
        }
      })
    );
  });
});
