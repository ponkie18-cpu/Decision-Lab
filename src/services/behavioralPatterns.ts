/**
 * Behavioral Pattern Detection Engine
 * 
 * STRICT ARCHITECTURAL RULE:
 * Pure TypeScript functions only. NO LLM calls (Gemini or otherwise).
 * NO name-based or ID-based conditionals.
 * Deterministic: identical round history input produces identical tags every time.
 */

import { RoundRecord, ModuleType } from '../types';

export const EVENT_PLANNER_OPERATING_BUDGET = 25000;
export const EVENT_PLANNER_FUNDRAISING_TARGET = 40000;

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
};

/**
 * Module 1: Money Has Rules (Tuckshop) Deterministic Tag Detection
 * Applies literal conditional thresholds from pedagogical design:
 * - Overcorrection (Price Instability): Price change >30% in 2 of last 3 rounds OR >=4 price swings
 * - Cash Lock (Liquidity Failure): Inventory >80% of assets AND Cash < 150 (or critical status)
 * - Capital Depletion: Rapid cash drain in early rounds
 * - Negative Margin: Selling price < unit cost (Chips < 5, Drinks < 6, Sweets < 3)
 * - Stockout Frequency: missedSales > 0 or demand > stock
 * - Calculated Agility: Recovered profit margin following feedback
 * - Capital Preservation: Maintained healthy cash buffer throughout
 */
export function detectModule1BehavioralTags(rounds: RoundRecord[]): string[] {
  if (!rounds || rounds.length === 0) return [];

  const tags: Set<string> = new Set();

  let priceChangesCount = 0;
  let largeSwingsInLast3 = 0;
  let negativeMarginFound = false;
  let cashLockFound = false;
  let stockoutFound = false;
  let lowestCash = 99999;
  let initialCash = 1000;

  // Track price history per item
  const priceHistory: { chips: number[]; drinks: number[]; sweets: number[] } = {
    chips: [],
    drinks: [],
    sweets: []
  };

  for (let i = 0; i < rounds.length; i++) {
    const r = rounds[i];
    const d = r.decisions || {};
    const res = r.results || ({} as any);

    const cP = parseFloat(d.chipsPrice) || 0;
    const dP = parseFloat(d.drinksPrice) || 0;
    const sP = parseFloat(d.sweetsPrice) || 0;

    const endingCash = res.endingCash ?? (res.cash ?? 1000);
    if (endingCash < lowestCash) lowestCash = endingCash;
    if (i === 0) initialCash = endingCash;

    // Check Negative Margin: Chips cost 5, Drinks cost 6, Sweets cost 3
    if ((cP > 0 && cP < 5) || (dP > 0 && dP < 6) || (sP > 0 && sP < 3)) {
      negativeMarginFound = true;
    }

    // Check Stockout
    if ((res.missedSales && res.missedSales > 0) || (res.stockoutFrequency && res.stockoutFrequency > 0)) {
      stockoutFound = true;
    }
    if (res.patterns && Array.isArray(res.patterns) && res.patterns.some((p: string) => p.toLowerCase().includes('stockout'))) {
      stockoutFound = true;
    }
    if (res.microSignals && Array.isArray(res.microSignals) && res.microSignals.some((m: string) => m.toLowerCase().includes('stockout') || m.toLowerCase().includes('sold out'))) {
      stockoutFound = true;
    }
    if (res.secondaryInsights && Array.isArray(res.secondaryInsights) && res.secondaryInsights.some((s: string) => s.toLowerCase().includes('stockout'))) {
      stockoutFound = true;
    }

    // Check Cash Lock: Inventory > 80% of assets AND cash < 150
    const chipsStock = res.inventory?.chips ?? parseInt(d.chipsRestock || '0', 10);
    const drinksStock = res.inventory?.drinks ?? parseInt(d.drinksRestock || '0', 10);
    const sweetsStock = res.inventory?.sweets ?? parseInt(d.sweetsRestock || '0', 10);
    const inventoryVal = (chipsStock * 5) + (drinksStock * 6) + (sweetsStock * 3);
    const totalAssets = endingCash + inventoryVal;

    if ((totalAssets > 0 && (inventoryVal / totalAssets) > 0.80 && endingCash < 150) || res.cashStatus === 'Critical') {
      cashLockFound = true;
    }

    // Price change tracking
    if (i > 0) {
      const prevCP = priceHistory.chips[i - 1];
      const prevDP = priceHistory.drinks[i - 1];
      const prevSP = priceHistory.sweets[i - 1];

      let roundHadLargeSwing = false;

      if (prevCP > 0 && Math.abs(cP - prevCP) / prevCP > 0.30) {
        priceChangesCount++;
        roundHadLargeSwing = true;
      }
      if (prevDP > 0 && Math.abs(dP - prevDP) / prevDP > 0.30) {
        priceChangesCount++;
        roundHadLargeSwing = true;
      }
      if (prevSP > 0 && Math.abs(sP - prevSP) / prevSP > 0.30) {
        priceChangesCount++;
        roundHadLargeSwing = true;
      }

      // Check if within last 3 rounds of the current slice
      if (i >= rounds.length - 3 && roundHadLargeSwing) {
        largeSwingsInLast3++;
      }
    }

    priceHistory.chips.push(cP);
    priceHistory.drinks.push(dP);
    priceHistory.sweets.push(sP);
  }

  // Tag: Price Instability / Overcorrection
  // Threshold: Price change >30% in 2 of last 3 rounds OR >= 4 price changes across run
  if (largeSwingsInLast3 >= 2 || priceChangesCount >= 4) {
    tags.add('Overcorrection (Price Volatility)');
  }

  // Tag: Cash Lock / Liquidity Failure
  if (cashLockFound) {
    tags.add('Cash Lock (Liquidity Failure)');
  }

  // Tag: Capital Depletion (Early Rounds)
  if (lowestCash < 250 || (rounds.length >= 2 && lowestCash < initialCash * 0.4)) {
    tags.add('Capital Depletion (Early Rounds)');
  }

  // Tag: Negative Margin (Selling below cost)
  if (negativeMarginFound) {
    tags.add('Negative Margin (Value Destruction)');
  }

  // Tag: Stockout Frequency
  if (stockoutFound) {
    tags.add('Stockout Frequency');
  }

  // Tag: Calculated Agility (Post-Feedback)
  if (rounds.length >= 3) {
    const lastR = rounds[rounds.length - 1].results;
    const prevR = rounds[rounds.length - 2].results;
    if (lastR?.profit && prevR?.profit && lastR.profit > prevR.profit + 30 && !negativeMarginFound) {
      tags.add('Calculated Agility (Post-Feedback)');
    }
  }

  // Tag: Capital Preservation
  if (lowestCash >= 900 && !negativeMarginFound && !cashLockFound) {
    tags.add('Capital Preservation');
  }

  return Array.from(tags);
}

function getEventPlannerCost(item: string): number {
  if (!item || item === 'None' || item.toLowerCase().includes('none') || item.toLowerCase().includes('no safety')) return 0;
  if (EVENT_PLANNER_COSTS[item] !== undefined) return EVENT_PLANNER_COSTS[item];
  const match = item.match(/R([\d,]+)/i);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''), 10) || 0;
  }
  for (const [key, cost] of Object.entries(EVENT_PLANNER_COSTS)) {
    if (item.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(item.toLowerCase())) {
      return cost;
    }
  }
  return 0;
}

/**
 * Module 3: School Event Planner (event_disaster) Deterministic Tag Detection
 * Applies literal conditional thresholds for the 6 core pedagogical behavioral identities:
 * 1. Risk Ignorer: Safety plan remains None/No safety plan in Day 2+, or safety never upgraded to Proper safety plan
 * 2. Budget Conservator: Total spend <= 50% of R5,000 budget (<= R2,500), leaving event under-resourced
 * 3. Overconfigured Planner: Premium setup + Large food + Full backup, or spend > R5,000 (exceeded budget)
 * 4. Stakeholder Neglect: Food is None or Entertainment is None while spending on venue/safety, or reputation < 45
 * 5. Strategic Allocator: Balanced setup, DJ, food, and safety within R5,000 budget with reputation >= 65
 * 6. Contingency Tactician: Proactive backup plan (Rain/Supplier/Full) by Day 2-3 before risks hit, with Proper safety
 */
export function detectModule3BehavioralTags(rounds: RoundRecord[]): string[] {
  if (!rounds || rounds.length === 0) return [];

  const tags: Set<string> = new Set();

  let totalCumulativeSpend = 0;
  let finalReputation = 50;
  let safetyEverProper = false;
  let safetyNoneInLateRound = false;
  let backupEverActivated = false;
  let backupActivatedEarly = false; // By Day 2 or 3
  let foodEverNone = false;
  let entertainmentEverNone = false;
  let overconfiguredFound = false;

  rounds.forEach((r) => {
    const d = r.decisions || {};
    const res = r.results || ({} as any);

    // Robust extraction of reputation from multiple possible locations
    let roundRep = res.reputation;
    if (roundRep === undefined && Array.isArray(res.secondaryInsights)) {
      const repInsight = res.secondaryInsights.find((s: string) => typeof s === 'string' && s.startsWith('Reputation:'));
      if (repInsight) {
        const val = parseInt(repInsight.replace('Reputation:', '').trim(), 10);
        if (!isNaN(val)) roundRep = val;
      }
    }
    if (roundRep === undefined && typeof res.tutorFeedback === 'string') {
      const match = res.tutorFeedback.match(/Reputation at (\d+)\/100/);
      if (match) roundRep = parseInt(match[1], 10);
    }
    if (roundRep === undefined && typeof res.stabilityScore === 'number') {
      roundRep = Math.min(100, res.stabilityScore * 20);
    }
    if (roundRep !== undefined) {
      finalReputation = roundRep;
    }

    const venue = d.venue || 'None';
    const entertainment = d.entertainment || 'None';
    const food = d.food || 'None';
    const safety = d.safety || 'None';
    const backup = d.backup || 'None';

    // Calculate spend using real cost schedule
    const roundSpend =
      getEventPlannerCost(venue) +
      getEventPlannerCost(entertainment) +
      getEventPlannerCost(food) +
      getEventPlannerCost(safety) +
      getEventPlannerCost(backup);

    totalCumulativeSpend += (res.totalCost !== undefined ? res.totalCost : roundSpend);

    // Check safety levels
    if (safety.toLowerCase().includes('proper') || safety.toLowerCase().includes('security')) {
      safetyEverProper = true;
    }
    if ((safety === 'None' || safety.toLowerCase().includes('no safety')) && r.round >= 2) {
      safetyNoneInLateRound = true;
    }

    // Check backup plan
    if (backup && backup !== 'None' && !backup.toLowerCase().includes('none')) {
      backupEverActivated = true;
      if (r.round <= 3) backupActivatedEarly = true;
    }

    // Check stakeholder neglect
    if (food === 'None' || food.toLowerCase().includes('none')) foodEverNone = true;
    if (entertainment === 'None' || entertainment.toLowerCase().includes('none')) entertainmentEverNone = true;

    // Check overconfigured
    if (
      (venue.toLowerCase().includes('premium') || venue.toLowerCase().includes('community')) &&
      (food.toLowerCase().includes('large') || food.toLowerCase().includes('buffet')) &&
      (backup.toLowerCase().includes('full') || backup.toLowerCase().includes('indoor'))
    ) {
      overconfiguredFound = true;
    }
  });

  // 1. Risk Ignorer
  if (safetyNoneInLateRound || (!safetyEverProper && rounds.length >= 2)) {
    tags.add('Risk Ignorer');
  }

  // 2. Budget Conservator (Total spend <= 50% of R25,000 budget, i.e., <= R12,500)
  if (totalCumulativeSpend <= 12500 && rounds.length >= 2) {
    tags.add('Budget Conservator');
  }

  // 3. Overconfigured Planner (Exceeded R25,000 budget or selected maximum configuration)
  if (totalCumulativeSpend > EVENT_PLANNER_OPERATING_BUDGET || overconfiguredFound) {
    tags.add('Overconfigured Planner');
  }

  // 4. Stakeholder Neglect (Food or entertainment omitted while other items funded, or reputation collapsed)
  if ((foodEverNone || entertainmentEverNone || finalReputation < 45) && totalCumulativeSpend > 5000) {
    tags.add('Stakeholder Neglect');
  }

  // 5. Strategic Allocator (Balanced choices within R25,000 budget, reputation >= 65, safety addressed)
  if (
    totalCumulativeSpend <= EVENT_PLANNER_OPERATING_BUDGET &&
    totalCumulativeSpend >= 12500 &&
    safetyEverProper &&
    !foodEverNone &&
    !entertainmentEverNone &&
    finalReputation >= 65
  ) {
    tags.add('Strategic Allocator');
  }

  // 6. Contingency Tactician (Proactively activated backup plan by Day 2 or 3, with proper safety within budget buffer)
  if (backupActivatedEarly && safetyEverProper && totalCumulativeSpend <= (EVENT_PLANNER_OPERATING_BUDGET * 1.04)) {
    tags.add('Contingency Tactician');
  }

  return Array.from(tags);
}

/**
 * Universal deterministic tag dispatcher by module
 */
export function detectBehavioralTags(module: ModuleType, rounds: RoundRecord[]): string[] {
  if (module === 'money_rules') {
    return detectModule1BehavioralTags(rounds);
  }
  if (module === 'event_disaster') {
    return detectModule3BehavioralTags(rounds);
  }
  // Fallback for other modules (Nomsa compliance, decision game)
  if (rounds && rounds.length > 0) {
    const tags: string[] = [];
    rounds.forEach(r => {
      if (r.results?.secondaryInsights) {
        tags.push(...r.results.secondaryInsights);
      }
    });
    return Array.from(new Set(tags));
  }
  return [];
}
