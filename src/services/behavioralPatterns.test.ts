import { describe, expect, test } from 'bun:test';
import { detectBehavioralTags, EVENT_PLANNER_COSTS } from './behavioralPatterns';
import { RoundRecord } from '../types';

describe('behavioralPatterns performance & correctness optimizations', () => {
  test('detectBehavioralTags for event_disaster identifies Risk Ignorer and Strategic Allocator correctly', () => {
    const riskIgnorerRounds: RoundRecord[] = [
      {
        round: 1,
        decisions: { venue: 'Basic setup', safety: 'No safety plan', food: 'Low food order', entertainment: 'Cheap DJ' },
        results: { totalCost: 2100, reputation: 40 } as any,
      },
      {
        round: 2,
        decisions: { venue: 'Basic setup', safety: 'None', food: 'Low food order', entertainment: 'Cheap DJ' },
        results: { totalCost: 2100, reputation: 30 } as any,
      },
    ];

    const tags = detectBehavioralTags('event_disaster', riskIgnorerRounds);
    expect(tags).toContain('Risk Ignorer');
    expect(tags).not.toContain('Strategic Allocator');
  });

  test('detectBehavioralTags for event_disaster identifies Strategic Allocator when criteria met', () => {
    const strategicRounds: RoundRecord[] = [
      {
        round: 1,
        decisions: { venue: 'Proper setup', safety: 'Proper safety plan', food: 'Balanced food order', entertainment: 'Reliable DJ', backup: 'Rain backup' },
        results: { totalCost: 7500, reputation: 75 } as any,
      },
      {
        round: 2,
        decisions: { venue: 'Proper setup', safety: 'Proper safety plan', food: 'Balanced food order', entertainment: 'Reliable DJ', backup: 'Rain backup' },
        results: { totalCost: 7500, reputation: 80 } as any,
      },
    ];

    const tags = detectBehavioralTags('event_disaster', strategicRounds);
    expect(tags).toContain('Strategic Allocator');
    expect(tags).not.toContain('Risk Ignorer');
  });

  test('detectBehavioralTags for money_rules identifies Overcorrection and Capital Preservation', () => {
    const overcorrectionRounds: RoundRecord[] = [
      { round: 1, decisions: { chipsPrice: '10' }, results: { endingCash: 1000 } as any },
      { round: 2, decisions: { chipsPrice: '15' }, results: { endingCash: 950 } as any },
      { round: 3, decisions: { chipsPrice: '8' }, results: { endingCash: 920 } as any },
      { round: 4, decisions: { chipsPrice: '14' }, results: { endingCash: 910 } as any },
    ];

    const tags = detectBehavioralTags('money_rules', overcorrectionRounds);
    expect(tags).toContain('Overcorrection (Price Volatility)');
    expect(tags).toContain('Capital Preservation');
  });
});
