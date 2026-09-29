import { ModuleRun, ModuleScore, ReadinessBand, RoundRecord } from "../types";
import { 
  EVENT_PLANNER_COSTS, 
  EVENT_PLANNER_OPERATING_BUDGET, 
  EVENT_PLANNER_FUNDRAISING_TARGET 
} from "./behavioralPatterns";

export { EVENT_PLANNER_OPERATING_BUDGET, EVENT_PLANNER_FUNDRAISING_TARGET };

export const getMicroSignalResponsivenessRating = (actedCount: number, totalCount: number = 4): 'HIGH' | 'MODERATE' | 'LOW' | 'CRITICAL' => {
  const ratio = totalCount > 0 ? (actedCount / totalCount) : 0;
  if (ratio >= 0.75) return 'HIGH';
  if (ratio >= 0.5) return 'MODERATE';
  if (ratio >= 0.25) return 'LOW';
  return 'CRITICAL';
};

export const calculateModule1Score = (rounds: RoundRecord[]): ModuleScore => {
  let financialControl = 100;
  let operationalEfficiency = 100;
  
  const signals = {
    cashLockOccurred: false,
    negativeMarginsOccurred: false,
    unstablePricing: false,
    stockoutFrequency: 0,
    recoveryDemonstrated: false,
    totalMissedRevenue: 0,
  };

  let stabilityTrend: number[] = [];
  let priceHistory: { chips: number[]; drinks: number[]; sweets: number[] } = { chips: [], drinks: [], sweets: [] };
  let initialCash = 1000;

  rounds.forEach((round, i) => {
    const d = round.decisions || {};
    const results = (round.results || {}) as any;
    const endingCash = results.endingCash ?? (results.cash ?? 1000);
    if (i === 0) initialCash = endingCash;

    const cP = parseFloat(d.chipsPrice) || 0;
    const dP = parseFloat(d.drinksPrice) || 0;
    const sP = parseFloat(d.sweetsPrice) || 0;

    // Financial Control: Below cost pricing / negative margins
    const isBelowCost = (cP > 0 && cP < 5) || (dP > 0 && dP < 6) || (sP > 0 && sP < 3);
    const feedbackText = (results.feedback || results.tutorFeedback || results.marketFeedback || '').toLowerCase();
    if (isBelowCost || feedbackText.includes('below cost') || feedbackText.includes('negative margin')) {
      signals.negativeMarginsOccurred = true;
      financialControl -= 15;
    }

    // Financial Control: Cash depletion / Cash Lock / Constraint violation
    if (results.constraintViolation) financialControl -= 20;
    if (results.cashStatus === 'Critical' || endingCash < 250) {
      signals.cashLockOccurred = true;
      financialControl -= 15;
    }

    // Operational Efficiency: Stockouts
    const hadStockout = results.stockout === true || 
      (results.missedSales !== undefined && results.missedSales > 0) || 
      (results.stockoutFrequency !== undefined && results.stockoutFrequency > 0);
    if (hadStockout) {
      signals.stockoutFrequency++;
      operationalEfficiency -= 10;
    }

    // Operational Efficiency: Spoilage / waste
    if (results.spoilage === true || (results.spoilageLoss !== undefined && results.spoilageLoss > 0)) {
      operationalEfficiency -= 5;
    }

    // Missed revenue tracking
    if (results.missedRevenue !== undefined && results.missedRevenue > 0) {
      signals.totalMissedRevenue += results.missedRevenue;
    } else if (hadStockout) {
      signals.totalMissedRevenue += 60; // Estimated lost revenue per stockout occurrence
    }

    // Price Instability / Volatility (>30% swing between consecutive rounds)
    if (i > 0) {
      const prevCP = priceHistory.chips[i - 1];
      const prevDP = priceHistory.drinks[i - 1];
      const prevSP = priceHistory.sweets[i - 1];
      if (
        (prevCP > 0 && Math.abs(cP - prevCP) / prevCP > 0.30) ||
        (prevDP > 0 && Math.abs(dP - prevDP) / prevDP > 0.30) ||
        (prevSP > 0 && Math.abs(sP - prevSP) / prevSP > 0.30)
      ) {
        signals.unstablePricing = true;
        financialControl -= 5;
      }
    }
    priceHistory.chips.push(cP);
    priceHistory.drinks.push(dP);
    priceHistory.sweets.push(sP);

    if (results.decisionQuality === 'Unstable') {
      signals.unstablePricing = true;
      financialControl -= 5;
    }

    // Round Stability Score (1-5 scale)
    if (results.stabilityScore !== undefined) {
      stabilityTrend.push(results.stabilityScore);
    } else {
      let roundStability = 4;
      const profit = results.profit ?? 0;
      if (profit > 100 && endingCash >= 1100 && !hadStockout && !isBelowCost) {
        roundStability = 5;
      } else if (isBelowCost || endingCash < 500) {
        roundStability = 2;
      } else if (hadStockout || results.spoilage) {
        roundStability = 3;
      }
      stabilityTrend.push(roundStability);
    }
  });

  // Check for recovery: did profits or cash improve after adversity?
  if (rounds.length >= 3) {
    const firstRoundProfit = rounds[0].results?.profit ?? 0;
    const lastRoundProfit = rounds[rounds.length - 1].results?.profit ?? 0;
    const lastRes = (rounds[rounds.length - 1].results || {}) as any;
    const lastCash = lastRes.endingCash ?? (lastRes.cash ?? 1000);
    if (lastRoundProfit > firstRoundProfit && lastCash > initialCash) {
      signals.recoveryDemonstrated = true;
      financialControl = Math.min(100, financialControl + 10);
    }
  }

  // Final Health Bonus
  const lastRound = rounds[rounds.length - 1];
  const lastRoundRes = (lastRound?.results || {}) as any;
  const finalCash = lastRound ? (lastRoundRes.endingCash ?? (lastRoundRes.cash ?? 0)) : 0;
  if (finalCash > 1200) {
    financialControl = Math.min(100, financialControl + 10);
  }

  // Stability Score (average)
  const avgStability = stabilityTrend.length > 0 
    ? stabilityTrend.reduce((a, b) => a + b, 0) / stabilityTrend.length 
    : 0;

  // Clamp scores
  financialControl = Math.max(0, Math.min(100, financialControl));
  operationalEfficiency = Math.max(0, Math.min(100, operationalEfficiency));
  
  const totalScore = Math.round((financialControl * 0.6) + (operationalEfficiency * 0.2) + ((avgStability / 5) * 100 * 0.2));

  let readinessBand: ReadinessBand = 'High Risk';
  if (totalScore >= 90) readinessBand = 'Strong';
  else if (totalScore >= 75) readinessBand = 'Reliable';
  else if (totalScore >= 60) readinessBand = 'Developing';
  else if (totalScore >= 40) readinessBand = 'At Risk';

  return {
    totalScore,
    financialControl,
    operationalEfficiency,
    stabilityScore: Math.round(avgStability * 10) / 10,
    signals,
    readinessBand
  };
};

/**
 * Module 3: School Event Planner (event_disaster) Dedicated Scoring Function
 * Reflects actual pedagogical objectives of Module 3:
 * 1. Budget Adherence: Total spend vs available R25,000 operating budget
 * 2. Safety Investment Adequacy: Proper safety and backup vs risk exposure
 * 3. Revenue Target Attainment: Progress toward R40,000 fundraising target
 * 4. Stakeholder Satisfaction: Food & DJ adequacy, final reputation level
 * 
 * Deterministic: pure function of rounds input, same output every time.
 */
export const calculateModule3Score = (rounds: RoundRecord[]): ModuleScore => {
  let totalSpend = 0;
  let safetyAdequacy = 20; // Starts low if no safety
  let finalRevenue = 0;
  let finalReputation = 50;
  let hasBackup = false;
  let hasFood = true;
  let hasDJ = true;

  rounds.forEach((r) => {
    const d = r.decisions || {};
    const res = r.results || ({} as any);

    const venueCost = EVENT_PLANNER_COSTS[d.venue] || 0;
    const djCost = EVENT_PLANNER_COSTS[d.entertainment] || 0;
    const foodCost = EVENT_PLANNER_COSTS[d.food] || 0;
    const safetyCost = EVENT_PLANNER_COSTS[d.safety] || 0;
    const backupCost = EVENT_PLANNER_COSTS[d.backup] || 0;

    const roundCost = venueCost + djCost + foodCost + safetyCost + backupCost;
    totalSpend += (res.totalCost !== undefined ? res.totalCost : roundCost);

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

    if (res.revenue !== undefined) finalRevenue = Math.max(finalRevenue, res.revenue);

    // Evaluate safety
    const safety = (d.safety || '').toLowerCase();
    if (safety.includes('proper') || safety.includes('security')) {
      safetyAdequacy = Math.max(safetyAdequacy, 90);
    } else if (safety.includes('basic') || safety.includes('first-aid')) {
      safetyAdequacy = Math.max(safetyAdequacy, 65);
    }

    if (d.backup && d.backup !== 'None' && !d.backup.toLowerCase().includes('none')) {
      hasBackup = true;
    }

    if (!d.food || d.food === 'None' || d.food.toLowerCase().includes('none')) hasFood = false;
    if (!d.entertainment || d.entertainment === 'None' || d.entertainment.toLowerCase().includes('none')) hasDJ = false;
  });

  // Backup bonus
  if (hasBackup) {
    safetyAdequacy = Math.min(100, safetyAdequacy + 10);
  }

  // Dimension 1: Budget Adherence (R25,000 operating budget baseline)
  let budgetAdherence = 100;
  if (totalSpend > EVENT_PLANNER_OPERATING_BUDGET) {
    const overrun = totalSpend - EVENT_PLANNER_OPERATING_BUDGET;
    budgetAdherence = Math.max(0, Math.round(100 - (overrun / 2500) * 35));
  } else {
    const expectedSpendForRounds = (EVENT_PLANNER_OPERATING_BUDGET / 5) * (rounds.length || 1);
    if (totalSpend < expectedSpendForRounds * 0.4) {
      budgetAdherence = Math.max(40, Math.round((totalSpend / (expectedSpendForRounds * 0.4)) * 70));
    }
  }

  // Dimension 2: Safety Investment Adequacy (0-100)
  const finalSafetyScore = Math.max(0, Math.min(100, safetyAdequacy));

  // Dimension 3: Revenue Target Attainment (Target: R40,000 fundraising)
  if (finalRevenue === 0) {
    // Derived from reputation if revenue was not explicitly recorded
    finalRevenue = Math.round((finalReputation / 100) * EVENT_PLANNER_FUNDRAISING_TARGET);
  }
  const revenueAttainment = Math.min(100, Math.round((finalRevenue / EVENT_PLANNER_FUNDRAISING_TARGET) * 100));

  // Dimension 4: Stakeholder Satisfaction
  let stakeholderSatisfaction = finalReputation;
  if (!hasFood) stakeholderSatisfaction -= 25;
  if (!hasDJ) stakeholderSatisfaction -= 20;
  if (hasFood && hasDJ && finalReputation >= 65) stakeholderSatisfaction += 10;
  stakeholderSatisfaction = Math.max(0, Math.min(100, stakeholderSatisfaction));

  // Weighted total: Budget 30%, Safety 30%, Revenue 20%, Stakeholder 20%
  const totalScore = Math.round(
    budgetAdherence * 0.30 +
    finalSafetyScore * 0.30 +
    revenueAttainment * 0.20 +
    stakeholderSatisfaction * 0.20
  );

  let readinessBand: ReadinessBand = 'High Risk';
  if (totalScore >= 90) readinessBand = 'Strong';
  else if (totalScore >= 75) readinessBand = 'Reliable';
  else if (totalScore >= 60) readinessBand = 'Developing';
  else if (totalScore >= 40) readinessBand = 'At Risk';

  const avgStability = Math.max(1, Math.min(5, Math.round(totalScore / 20)));

  return {
    totalScore,
    financialControl: budgetAdherence,
    operationalEfficiency: finalSafetyScore,
    stabilityScore: avgStability,
    signals: {
      cashLockOccurred: false,
      negativeMarginsOccurred: false,
      unstablePricing: false,
      stockoutFrequency: 0,
      recoveryDemonstrated: finalSafetyScore >= 75,
      totalMissedRevenue: Math.max(0, EVENT_PLANNER_FUNDRAISING_TARGET - finalRevenue),
    },
    readinessBand
  };
};

export const generateIndividualReport = (run: ModuleRun): string => {
  const { score, moduleId, attemptType, timestamp } = run;
  
  let riskInsight = "";
  if (score.signals.cashLockOccurred) riskInsight = "- **Liquidity Trap**: You frequently tied up too much cash in stock, leaving the business vulnerable.";
  if (score.signals.negativeMarginsOccurred) riskInsight += "\n- **Margin Erosion**: Selling below cost destroyed value even with high sales.";
  if (score.signals.unstablePricing) riskInsight += "\n- **Price Volatility**: Rapid price changes confused the market and lowered stability.";

  return `
# Decision Intelligence Report: ${moduleId.toUpperCase()}
**SME Readiness Level: ${score.readinessBand.toUpperCase()}**
**Attempt:** ${attemptType.toUpperCase()} | **Date:** ${new Date(timestamp).toLocaleDateString()}

---

## 1. Executive Summary
The user demonstrates **${score.readinessBand}** decision capability. The primary score of **${score.totalScore}/100** reflects their ability to balance cash survival with market demand.

## 2. Decision Benchmarks
- **Financial Control**: ${score.financialControl}/100
- **Operational Efficiency**: ${score.operationalEfficiency}/100
- **Behavioral Stability**: ${(score.stabilityScore / 5 * 100).toFixed(0)}%

## 3. Risk Profile & Patterns
${riskInsight || "No critical risk patterns detected. Decision making is consistent and reliable."}

## 4. Financial Impact of Decisions
- **Missed Sales (Lost Opportunity)**: ${score.signals.stockoutFrequency} rounds with stockouts.
- **Estimated Lost Revenue**: R${score.signals.totalMissedRevenue} (Opportunity Cost)
- **Recovery Ability**: ${score.signals.recoveryDemonstrated ? "Demonstrated (Strong)" : "Not observed / Not needed"}.

## 5. Next Actions for Development
1. ${score.readinessBand === 'Strong' ? "Move to Module 2: Risk & Compliance" : "Repeat Module 1 focusing on Cash Preservation."}
2. Review the relationship between ending cash and inventory value.
`;
};

export const generateCohortReport = (runs: ModuleRun[]): string => {
  const total = runs.length;
  if (total === 0) return "No data available for cohort.";

  const isPreliminary = total < 10;
  const avgScore = Math.round(runs.reduce((acc, run) => acc + run.score.totalScore, 0) / total);
  const bands = {
    'Strong': runs.filter(r => r.score.readinessBand === 'Strong').length,
    'Reliable': runs.filter(r => r.score.readinessBand === 'Reliable').length,
    'Developing': runs.filter(r => r.score.readinessBand === 'Developing').length,
    'At Risk': runs.filter(r => r.score.readinessBand === 'At Risk').length,
    'High Risk': runs.filter(r => r.score.readinessBand === 'High Risk').length,
  };

  return `
# Cohort Performance Summary
${isPreliminary ? "> **[!] Preliminary Benchmark**: This report is based on a small sample size (< 10 participants). Benchmarks will stabilize as more data is collected." : ""}

**Total Participants:** ${total} | **Average Decision Score:** ${avgScore}/100

---

## 1. Readiness Distribution
- **Strong**: ${bands.Strong} (${Math.round(bands.Strong/total*100)}%)
- **Reliable**: ${bands.Reliable} (${Math.round(bands.Reliable/total*100)}%)
- **Developing**: ${bands.Developing} (${Math.round(bands.Developing/total*100)}%)
- **At Risk**: ${bands['At Risk']} (${Math.round(bands['At Risk']/total*100)}%)
- **High Risk**: ${bands['High Risk']} (${Math.round(bands['High Risk']/total*100)}%)

## 2. Common Failure Patterns
- **Cash Lock**: ${runs.filter(r => r.score.signals.cashLockOccurred).length} participants
- **Margin Erosion**: ${runs.filter(r => r.score.signals.negativeMarginsOccurred).length} participants
- **Unstable Pricing**: ${runs.filter(r => r.score.signals.unstablePricing).length} participants

## 3. Improvement Rate (Baseline vs Replay)
- **Baseline Average**: ${Math.round(runs.filter(r => r.attemptType === 'baseline').reduce((acc, r) => acc + r.score.totalScore, 0) / runs.filter(r => r.attemptType === 'baseline').length || 0)}
- **Replay Average**: ${Math.round(runs.filter(r => r.attemptType === 'replay').reduce((acc, r) => acc + r.score.totalScore, 0) / runs.filter(r => r.attemptType === 'replay').length || 0)}
`;
};
