import { GoogleGenAI } from "@google/genai";
import { GameState, Decisions, RoundResults, RoundRecord } from "../types";
import { detectBehavioralTags, EVENT_PLANNER_COSTS } from "./behavioralPatterns";

function getAIClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY") {
    return null;
  }
  try {
    return new GoogleGenAI({ apiKey: key });
  } catch (e) {
    console.warn("Failed to initialize GoogleGenAI:", e);
    return null;
  }
}

function runDeterministicSimulation(
  currentState: GameState,
  decisions: Decisions
): RoundResults & { newState: Partial<GameState> } {
  const isModule4 = currentState.module === 'decision_game';
  const isModule2 = currentState.module === 'nomsa_fine';
  const isModule1 = currentState.module === 'money_rules';

  if (isModule4) {
    const round = currentState.round;
    const priceChoice = (decisions.price || decisions.action || "Medium Price").toLowerCase();
    const signalChoice = (decisions.action || decisions.offer || "Cooperate").toLowerCase();
    const investCredibility = (decisions.investCredibility || decisions.credibilityInvestment || "No").toLowerCase().includes("yes");

    // Determine RivalCo action
    let rivalSignal: 'cooperate' | 'compete' | 'dominate' = 'cooperate';
    if (round <= 3) {
      rivalSignal = signalChoice.includes('compete') ? 'compete' : (signalChoice.includes('dominate') ? 'dominate' : 'cooperate');
    } else if (round <= 8) {
      rivalSignal = round === 5 ? 'compete' : (signalChoice.includes('compete') ? 'compete' : 'cooperate');
    } else if (round <= 12) {
      rivalSignal = signalChoice.includes('compete') ? 'compete' : 'cooperate';
    } else {
      const currentCred = currentState.learningState?.behaviorIdentity?.credibilityScore ?? 70;
      rivalSignal = currentCred < 50 ? 'compete' : 'cooperate';
    }

    // Base payoff calculations
    let userBase = 1800;
    let rivalBase = 1800;

    const isUserCoop = signalChoice.includes('cooperate');
    const isUserCompete = signalChoice.includes('compete');
    const isUserDom = signalChoice.includes('dominate');

    const isRivalCoop = rivalSignal === 'cooperate';
    const isRivalCompete = rivalSignal === 'compete';
    const isRivalDom = rivalSignal === 'dominate';

    if (isUserDom || isRivalDom) {
      userBase = 1200;
      rivalBase = 1200;
    } else if (isUserCoop && isRivalCoop) {
      userBase = 1800;
      rivalBase = 1800;
    } else if (isUserCoop && isRivalCompete) {
      userBase = 400;
      rivalBase = 2600;
    } else if (isUserCompete && isRivalCoop) {
      userBase = 2600;
      rivalBase = 400;
    } else if (isUserCompete && isRivalCompete) {
      userBase = 900;
      rivalBase = 900;
    }

    // Credibility calculation
    const prevCred = currentState.learningState?.behaviorIdentity?.credibilityScore ?? 70;
    let credDeduction = 0;
    if (isUserCompete) {
      if (priceChoice.includes('low')) credDeduction = -5;
      else if (priceChoice.includes('medium')) credDeduction = -2;
      else if (priceChoice.includes('high')) credDeduction = -1;
      else credDeduction = -3;
    } else if (isUserDom) {
      credDeduction = -4;
    }

    const credAddition = investCredibility ? 3 : 0;
    const credCost = investCredibility ? 500 : 0;
    const newCred = Math.max(0, Math.min(100, prevCred + credDeduction + credAddition));

    // Payoff modifiers
    let userPayoff = userBase;
    if (newCred >= 80 && isUserCoop) {
      userPayoff = Math.round(userBase * 1.15);
    } else if (newCred < 50) {
      userPayoff = Math.round(userBase * 0.80);
    }

    // Market share shift calculation
    let prevUserShare = 50;
    if (currentState.history && currentState.history.length > 0) {
      const last = currentState.history[currentState.history.length - 1].results;
      if (last.marketShare) {
        const m = last.marketShare.match(/(\d+)%/);
        if (m) prevUserShare = parseInt(m[1], 10);
      }
    }
    let shareShift = 0;
    if (isUserCompete && isRivalCoop) shareShift = 4;
    else if (isUserCoop && isRivalCompete) shareShift = -4;
    else if (isUserDom) shareShift = 2;
    else if (isRivalDom) shareShift = -2;

    const newUserShare = Math.max(10, Math.min(90, prevUserShare + shareShift));
    const newRivalShare = 100 - newUserShare;

    // Micro-signals
    const microSignals: string[] = [];
    if (newCred <= 52 && round <= 10) {
      microSignals.push("[CREDIBILITY THRESHOLD APPROACHING]: Your credibility rating is approaching the level at which market confidence weakens. This affects all future interactions in this simulation.");
    }
    if (newCred < 50) {
      microSignals.push("[CREDIBILITY FLOOR ACTIVE]: Market confidence in your positioning has weakened. This is now affecting your returns (-20% penalty applied).");
    }
    if (isUserCompete && isRivalCoop) {
      microSignals.push("[DEFECTION ADVANTAGE]: Short-term gain realized via competitive pricing. Credibility adjusted by " + credDeduction + " points.");
    }

    const tutorFeedback = `Round ${round} Summary: You chose ${priceChoice} with ${signalChoice} signal. RivalCo signaled ${rivalSignal.toUpperCase()}. Your Payoff: R${userPayoff} (Credibility: ${newCred}/100). Market Share: ${newUserShare}% User / ${newRivalShare}% RivalCo.`;
    const simHash = `M4-R${round}-H${Math.abs(userPayoff * 31 + newCred)}`;

    const behaviorIdentity = {
      ...(currentState.learningState?.behaviorIdentity || {}),
      credibilityScore: newCred,
      normalizedScore: Math.round((userPayoff / 1800) * 85),
      difficultyIndex: 0.45,
      reliabilityIndex: newCred >= 70 ? ("High" as const) : newCred >= 50 ? ("Medium" as const) : ("Low" as const),
      volatilityIndex: isUserCompete ? 0.6 : 0.2,
      decisionTraceScore: newCred < 50 ? 75 : 90,
      correctiveRounds: 0,
      penaltyMultiplier: newCred < 50 ? 1.2 : 1.0,
      penalties: { trust: newCred < 50 ? 20 : 0, flexibility: 0 },
      stability: newCred >= 60 ? ("high" as const) : ("low" as const),
      aggressiveness: isUserCompete ? ("high" as const) : ("low" as const),
      cooperation: isUserCoop ? ("high" as const) : ("low" as const),
      confidence: ("medium" as const)
    };

    return {
      totalCost: credCost,
      profit: userPayoff,
      marketFeedback: `RivalCo chose ${rivalSignal.toUpperCase()}. Payoff generated: R${userPayoff}.`,
      tutorFeedback,
      decisionQuality: newCred < 50 ? 'Risky' : 'Strong',
      trajectory: newCred < 50 ? 'Declining' : 'Stable',
      stabilityScore: Math.round(newCred / 20),
      secondaryInsights: [`Market position: ${newUserShare}% share`, `Credibility score: ${newCred}/100`],
      microSignals,
      marketShare: `${newUserShare}% User / ${newRivalShare}% RivalCo`,
      outcomeEfficiency: newCred >= 70 ? 'High' : 'Medium',
      strategyStability: isUserCoop ? 'Stable' : 'Unstable',
      credibilityScore: newCred,
      normalizedCredibilityScore: behaviorIdentity.normalizedScore,
      difficultyIndex: 0.45,
      percentileRank: Math.min(99, Math.round(newCred * 0.95)),
      decisionIntegrityTier: newCred >= 80 ? 'Tier A' : newCred >= 65 ? 'Tier B' : newCred >= 50 ? 'Tier C' : 'Tier D',
      reliabilityIndex: behaviorIdentity.reliabilityIndex,
      behaviorConfidence: 'High',
      impactLevel: newCred < 50 ? 'High' : 'Moderate',
      carryoverImpactScore: newCred < 50 ? 15 : 5,
      decisionTraceScore: behaviorIdentity.decisionTraceScore,
      simulationHash: simHash,
      engineVersion: 'v4.4',
      moduleVersion: 'M4.2',
      institutionalRiskAssessment: newCred < 50 ? 'High credibility risk due to defection' : 'Stable cooperative position',
      outsideOptionTriggered: false,
      bestAchievableDeal: 'R1,800',
      newState: {
        round: currentState.round + 1,
        cash: currentState.cash + userPayoff - credCost,
        reputation: newCred,
        learningState: {
          ...currentState.learningState!,
          behaviorIdentity,
          interactionHistory: [
            ...(currentState.learningState?.interactionHistory || []),
            {
              round,
              playerMove: signalChoice,
              opponentMove: rivalSignal,
              outcome: `User: R${userPayoff}, RivalCo: R${rivalBase}`
            }
          ]
        }
      }
    };
  }

  if (isModule1) {
    const round = currentState.round;
    const restockChoice = parseInt(decisions.restock || decisions.chipsRestock || "1000", 10) || 1000;
    const pricingChoice = (decisions.pricing || decisions.chipsPrice || "Standard").toLowerCase();
    const spoilageChoice = (decisions.spoilage || decisions.sweetsPrice || "None").toLowerCase();

    let margin = 0.10;
    if (pricingChoice.includes("competitive") || pricingChoice.includes("cost")) margin = 0.0;
    if (pricingChoice.includes("premium")) margin = 0.25;

    const revenue = Math.round(restockChoice * (1 + margin));
    const coldStorageCost = spoilageChoice.includes("cold") || spoilageChoice.includes("storage") ? 200 : 0;
    
    let spoilageLoss = 0;
    const isSpoilageRound = round === 2 || round === 5 || round === 8 || round === 10;
    if (isSpoilageRound) {
      spoilageLoss = coldStorageCost > 0 ? Math.round(restockChoice * 0.08) : Math.round(restockChoice * 0.30);
    }

    const totalCost = restockChoice + coldStorageCost + spoilageLoss;
    const netProfit = revenue - totalCost;
    const endingCash = currentState.cash + netProfit;

    const microSignals: string[] = [];
    if (endingCash < 1500) {
      microSignals.push(`[CASH FLOOR APPROACHING]: Cash balance at R${endingCash}. At current burn rate cash exhaustion risk is high.`);
    }
    if (coldStorageCost === 0 && isSpoilageRound) {
      microSignals.push(`[SPOILAGE LOSS INCURRED]: Lost R${spoilageLoss} due to unhedged perishable inventory.`);
    }

    const currentRec: RoundRecord = {
      round,
      decisions,
      results: {
        endingCash,
        revenue,
        profit: netProfit,
        totalCost,
      } as any
    };
    const allRounds = [...(currentState.history || []), currentRec];
    const patterns = detectBehavioralTags('money_rules', allRounds);

    return {
      revenue,
      totalCost,
      profit: netProfit,
      endingCash,
      marketFeedback: `Weekly revenue: R${revenue}. Restock cost: R${restockChoice}.${coldStorageCost ? ' Cold storage: R200.' : ''}${spoilageLoss ? ` Spoilage loss: R${spoilageLoss}.` : ''}`,
      tutorFeedback: `Round ${round} Overview: Net cash change: R${netProfit > 0 ? '+' : ''}${netProfit}. Cash balance: R${endingCash}.`,
      decisionQuality: endingCash < 1000 ? 'Risky' : 'Strong',
      trajectory: endingCash < currentState.cash ? 'Declining' : 'Stable',
      stabilityScore: endingCash > 3000 ? 5 : 3,
      secondaryInsights: [`Weekly Margin: ${(margin * 100).toFixed(0)}%`, `Net Cash: R${endingCash}`],
      microSignals,
      patterns,
      cashTrend: netProfit >= 0 ? 'Increasing' : 'Declining',
      newState: {
        round: currentState.round + 1,
        cash: endingCash
      }
    };
  }

  if (isModule2) {
    const round = currentState.round;
    const primaryAction = (decisions.primary || decisions.action || "Do Nothing").toLowerCase();
    const secondaryAction = (decisions.secondary || decisions.subAction || "Defer").toLowerCase();

    let cost = 0;
    if (primaryAction.includes("health")) cost += 1500;
    else if (primaryAction.includes("training")) cost += 800;
    else if (primaryAction.includes("equipment")) cost += 2200;
    else if (primaryAction.includes("legal")) cost += 1000;
    else if (primaryAction.includes("expansion")) cost += 3500;

    if (secondaryAction.includes("food")) cost += 600;

    let fines = 0;
    const microSignals: string[] = [];
    if (round === 2 && !primaryAction.includes("municipal") && !secondaryAction.includes("muni")) {
      fines += 1200;
      microSignals.push("[MUNICIPAL BY-LAW FINE]: R1,200 penalty issued for compliance non-alignment.");
    }
    if (round === 4 && !primaryAction.includes("health") && !primaryAction.includes("equipment")) {
      fines += 3500;
      microSignals.push("[DOH AUDIT FAILURE]: R3,500 penalty issued following unannounced health audit.");
    }
    if (round === 5 && !secondaryAction.includes("uif")) {
      fines += 8400;
      microSignals.push("[SARS UIF REVIEW]: R8,400 penalty issued across 4 unregistered employees.");
    }

    const totalSpent = cost + fines;
    const endingCash = currentState.cash - totalSpent;
    const prevScore = 70;
    const newScore = Math.max(0, Math.min(100, prevScore + (cost > 0 ? 4 : -5) - (fines > 0 ? 15 : 0)));

    return {
      totalCost: totalSpent,
      profit: -totalSpent,
      endingCash,
      marketFeedback: `Month ${round} completed. Operational spend: R${cost}. Fines: R${fines}.`,
      tutorFeedback: `Month ${round} Overview: Cash position updated to R${endingCash}. Compliance score: ${newScore}/100.`,
      decisionQuality: fines > 0 ? 'Risky' : 'Strong',
      trajectory: fines > 0 ? 'Declining' : 'Stable',
      stabilityScore: Math.round(newScore / 20),
      secondaryInsights: [`Fines incurred: R${fines}`, `Compliance Score: ${newScore}`],
      microSignals,
      newState: {
        round: currentState.round + 1,
        cash: endingCash
      }
    };
  }

  if (currentState.module === 'event_disaster') {
    const round = currentState.round;
    const venue = decisions.venue || 'None';
    const entertainment = decisions.entertainment || 'None';
    const food = decisions.food || 'None';
    const safety = decisions.safety || 'None';
    const backup = decisions.backup || 'None';

    const cost =
      (EVENT_PLANNER_COSTS[venue] || 0) +
      (EVENT_PLANNER_COSTS[entertainment] || 0) +
      (EVENT_PLANNER_COSTS[food] || 0) +
      (EVENT_PLANNER_COSTS[safety] || 0) +
      (EVENT_PLANNER_COSTS[backup] || 0);

    const prevBudget = currentState.budget ?? 5000;
    const remainingBudget = prevBudget - cost;
    const endingCash = (currentState.cash ?? 5000) - cost;

    let repChange = 0;
    if (safety === 'Proper safety plan') repChange += 10;
    else if (safety === 'None' || safety === 'No safety plan') repChange -= 15;

    if (venue === 'Proper setup' || venue === 'Premium setup') repChange += 5;
    if (entertainment === 'Reliable DJ') repChange += 5;
    if (food === 'Balanced food order' || food === 'Large food order') repChange += 5;

    const newReputation = Math.max(0, Math.min(100, (currentState.reputation ?? 50) + repChange));
    const attendance = currentState.expectedAttendance ?? 120;
    const ticketPrice = currentState.ticketPrice ?? 50;
    const revenue = round === 5 ? attendance * ticketPrice : 0;

    const currentRec: RoundRecord = {
      round,
      decisions,
      results: {
        totalCost: cost,
        profit: revenue - cost,
        endingCash,
        reputation: newReputation,
        revenue
      } as any
    };
    const allRounds = [...(currentState.history || []), currentRec];
    const patterns = detectBehavioralTags('event_disaster', allRounds);

    return {
      totalCost: cost,
      profit: revenue - cost,
      endingCash,
      revenue,
      reputation: newReputation,
      marketFeedback: `Day ${round}: Venue (${venue}), DJ (${entertainment}), Food (${food}), Safety (${safety}), Backup (${backup}). Spend: R${cost}.`,
      tutorFeedback: `Day ${round} Review: Total spend R${cost}. Remaining budget R${remainingBudget}. Reputation at ${newReputation}/100.`,
      decisionQuality: safety === 'None' || remainingBudget < 0 ? 'Risky' : 'Strong',
      trajectory: remainingBudget < 0 ? 'Declining' : 'Stable',
      stabilityScore: Math.max(1, Math.min(5, Math.round(newReputation / 20))),
      secondaryInsights: [`Spend: R${cost}`, `Budget Remaining: R${remainingBudget}`, `Reputation: ${newReputation}`],
      microSignals: (safety === 'None' || safety === 'No safety plan') ? ['[SAFETY HAZARD DETECTED]: No safety plan in place for public gathering.'] : [],
      patterns,
      newState: {
        round: round + 1,
        cash: endingCash,
        budget: remainingBudget,
        reputation: newReputation
      }
    };
  }

  const cost = 1000;
  const endingCash = currentState.cash - cost;
  return {
    totalCost: cost,
    profit: -cost,
    endingCash,
    marketFeedback: `Round ${currentState.round} completed.`,
    tutorFeedback: `Decision recorded for Round ${currentState.round}.`,
    decisionQuality: 'Strong',
    trajectory: 'Stable',
    stabilityScore: 4,
    secondaryInsights: ['Simulation progressing'],
    microSignals: [],
    patterns: [],
    newState: {
      round: currentState.round + 1,
      cash: endingCash
    }
  };
}

export async function simulateRound(
  currentState: GameState,
  decisions: Decisions
): Promise<RoundResults & { newState: Partial<GameState> }> {
  const isModule4 = currentState.module === 'decision_game';
  const isModule3 = currentState.module === 'nomsa_fine';
  const isModule1 = currentState.module === 'money_rules';
  
  const prompt = isModule4 ? `
    You are the Dinaledi360 Simulation Engine for Module 4: "The Decision Game".
    
    CORE UPGRADES & MECHANICS:
    1. DETERMINISTIC NORMALIZATION:
       - DifficultyIndex (0-1) = 0.35 * VolatilityIndex + 0.25 * OpponentAggressionExposure + 0.20 * ConstraintPressure + 0.20 * CarryoverImpact.
       - Banding: 0.0-0.3 Easy (0.9x), 0.31-0.7 Neutral (1.0x), 0.71-1.0 Hard (1.1x).
       - NormalizedScore = Raw / DifficultyAdj.
       
    2. AUDITABLE REPRODUCIBILITY (Simulation Hash):
       - Hash = DETERMINISTIC calculation (Engine v4.4, Module M4.2, DecisionSeq, StateTransitions). 
       - No randomness. Show in result as "simulationHash".
       
    3. DECISION TRACE SCORE (DTS) & PENALTIES:
       - DTS (0-100): Penalize (-10 each) for: >3 concurrent drivers, non-time-bound attribution, low pattern confidence.
       - Capping: DTS <= 80 when Behavior Confidence = Low.

    4. PAYOFF MATRIX & CREDIBILITY MODIFIERS:
       - User Cooperates + RivalCo Cooperates: User +R1,800 / RivalCo +R1,800
       - User Cooperates + RivalCo Competes: User +R400 / RivalCo +R2,600
       - User Competes + RivalCo Cooperates: User +R2,600 / RivalCo +R400
       - User Competes + RivalCo Competes: User +R900 / RivalCo +R900
       - Either Dominates: Both +R1,200 (market disruption, share fight)
       - High credibility (80+): +15% payoff on Cooperate signal
       - Low credibility (<50): -20% payoff on all actions
       - Price instability (change 4+ rounds): -12 credibility total

    5. CREDIBILITY DEDUCTION TABLE (Use exact values every round):
       - Low Price + Compete signal: -5 credibility
       - Medium Price + Compete signal: -2 credibility
       - High Price + Compete signal: -1 credibility
       - Any Price + Cooperate: +0 credibility (no deduction)
       - Any Price + Dominate: -4 credibility
       - Credibility Investment (Yes): +3 credibility (applied after deductions)
       - Credibility Investment (No): +0

    6. MARKET SHARE SHIFT TABLE (Use exact values every round):
       - User Competes / RivalCo Cooperates: User +4% / RivalCo -4%
       - User Cooperates / RivalCo Competes: User -4% / RivalCo +4%
       - Both Compete: No shift (both receive R900)
       - Both Cooperate: No shift (both receive R1,800)
       - Either Dominates: Aggressor +2% / Opponent -2%

    7. PROACTIVE CREDIBILITY MICRO-SIGNALS:
       - IF credibility <= 52 AND round <= 10:
         Include signal: "[CREDIBILITY THRESHOLD APPROACHING]: Your credibility rating is approaching the level at which market confidence weakens. This affects all future interactions in this simulation."
       - IF credibility < 50:
         Include signal: "[CREDIBILITY FLOOR ACTIVE]: Market confidence in your positioning has weakened. This is now affecting your returns (-20% penalty applied)."
       
    8. ARTIFACT - INSTITUTION-GRADE AUDIT:
       - RESPONSIVENESS RATING SCALE (use exactly):
         * HIGH: Acted on 3 or 4 signals (75–100%)
         * MODERATE: Acted on 2 of 4 signals (50%)
         * LOW: Acted on 1 of 4 signals (25%)
         * CRITICAL: Acted on 0 signals (0%)
       - ## 1. Summary (Final Payoffs, Percentile rank, Tier A-D classification)
       - ## 2. Decision Integrity Profile
         - Credibility: [Raw] (Band) | Normalized: [Score] (Path Difficulty)
         - DRI: [Index] (Stability/Consistency/ExploitRisk breakdown)
         - DTS: [Score] | Tier: [A-D]
       - ## 3. Cross-Scenario Impact (Quantified Score 0-20 + Plain Language Meaning)
       - ## 4. Deal Quality Analysis (Achievable vs Outcome vs Outside Option)
       - ## 5. Micro-Signal Responsiveness Rating (HIGH/MODERATE/LOW/CRITICAL using exact scale above)
       - ## 6. Reproducibility (Simulation ID, Hash, v4.4/M4.2)
       - ## 7. Plain Meaning Summary (3 lines, no jargon)

    CURRENT STATE:
    - Round: ${currentState.round}
    - Behavior Identity: ${JSON.stringify(currentState.learningState?.behaviorIdentity || {})}
    - Interaction History: ${JSON.stringify(currentState.learningState?.interactionHistory || [])}
    - User Decision: ${decisions.price || decisions.action || decisions.offer}
    
    RETURN JSON:
    {
      "totalCost": 0,
      "marketFeedback": "Outcome narrative",
      "tutorFeedback": "Forensic framing (Decision Delta, time-weighted causality, plain meanings)",
      "profit": number,
      "marketShare": "string (e.g. 54% User / 46% RivalCo)",
      "microSignals": ["..."],
      "cashTrend": "...", "outcomeEfficiency": "...", "strategyStability": "...",
      "credibilityScore": number,
      "normalizedCredibilityScore": number,
      "difficultyIndex": number,
      "percentileRank": number,
      "decisionIntegrityTier": "Tier A" | "Tier B" | "Tier C" | "Tier D",
      "reliabilityIndex": "Low" | "Medium" | "High",
      "behaviorConfidence": "Low" | "Medium" | "High",
      "impactLevel": "High" | "Moderate" | "Low",
      "carryoverImpactScore": number (0-20),
      "decisionTraceScore": number,
      "simulationHash": "string (Deterministic)",
      "engineVersion": "v4.4",
      "moduleVersion": "M4.2",
      "institutionalRiskAssessment": "string (Diagnostic takeaway)",
      "outsideOptionTriggered": boolean,
      "bestAchievableDeal": "range",
      "recoveryProgress": "X/2" | null,
      "trustChange": number,
      "decisionQuality": "...", "trajectory": "...", "patterns": ["..."],
      "artifact": "string (R15 only)",
      "ledgerEntry": { ... },
      "newState": {
        "cash": number,
        "reputation": number,
        "learningState": {
          "behaviorIdentity": { 
             "stability": "...", "aggressiveness": "...", "cooperation": "...",
             "confidence": "...", "credibilityScore": number, "normalizedScore": number,
             "difficultyIndex": number, "reliabilityIndex": "...",
             "volatilityIndex": number, "decisionTraceScore": number,
             "correctiveRounds": number, "penaltyMultiplier": number,
             "penalties": { "trust": number, "flexibility": number }
          },
          "interactionHistory": [...]
        }
      }
    }
  ` : (isModule1 ? `
    You are the Dinaledi360 Simulation Engine for Module 1: "Money Has Rules" (Sipho's Tuck Shop).
    12-Round deterministic simulator.

    ---
    # 🔒 CORE PRINCIPLES
    - No randomness.
    - Every outcome must follow Decision → Effect.
    - Tutor must focus on ONE primary issue only (Survival > Margin > Operations > Strategy).
    - Use plain business language.
    - Prioritize survival over strategy (Cash > Margin > Stock > Strategy).

    ---
    # 🎯 DECISION HIERARCHY (STRICT)
    1. Constraint Violations (Cash)
    2. Liquidity Failures (Cash Lock)
    3. Negative Margins
    4. Operational Failures (Stockouts / Missed Sales)
    5. Pattern Behavior (Instability / Overcorrection)
    6. Strategy (Pricing Accuracy)

    ---
    # 🧠 PATTERN DETECTION (MANDATORY)
    Use the provided ROLLING HISTORY (last 3 rounds):
    - Overcorrection (Price Instability): IF price change >30% in 2 of last 3 rounds. Override single-round feedback with: "You are changing your prices too often. This is creating unstable results."
    - Cash Lock (Liquidity Failure): IF Inventory Value >80% of assets AND Cash <100. Signal: "Most of your money is locked in stock. You cannot operate."
    - Negative Margin: IF price < cost. Signal: "You are selling below cost and losing money on every sale."
    - Stockout: IF demand > stock. You MUST calculate "missedSales" (units) AND "missedRevenue" (R value). Signal: "You had customers but could not serve them. This is lost income."

    ---
    # 🧠 MARKET LOGIC
    - Customers respond to price, not cost.
    - Typical prices: Chips: R7–R10, Drinks: R8–R12, Sweets: R4–R6.
    - Lower price → higher demand.
    - Higher price → lower demand.
    - Customers don’t care what you paid. They react to your price.

    ---
    # 🧠 SIGNAL RULES
    - Cash Status: Healthy / Tight / Critical.
    - Decision Quality: Strong / Risky / Unstable.
    - Stability Score: 1–5.
    - IF severe issue: Override signals immediately (no lag).

    ---
    # 🧠 TUTOR STRUCTURE (STRICT)
    🟢 Quick Insight: [One high-impact sentence focus on ONE issue]
    ▶️ What caused this: [Direct Cause -> Effect explanation]
    🔧 What to do differently: [Single actionable advice]
    📌 Principle: [Plain language business principle]

    ---
    # 🧠 PASSIVE LEARNING (Micro-Signals)
    Provide an array of active micro-signals: "Cash low", "Too expensive", "Selling at a loss", "Stock finished", "Missed Sales".

    CURRENT STATE:
    - Round: ${currentState.round}
    - Cash: R${currentState.cash}
    - Inventory: ${JSON.stringify(currentState.inventory)}
    - Cost: Chips=5, Drinks=6, Sweets=3
    - Rolling History: ${JSON.stringify(currentState.rollingHistory || {})}
    - Decisions: ${JSON.stringify(decisions)}

    RETURN JSON:
    {
      "marketFeedback": "Short narrative of sales vs stock situation",
      "tutorFeedback": "Structured feedback (Insight, Cause, Change, Principle)",
      "profit": number,
      "revenue": number,
      "totalCost": number,
      "endingCash": number,
      "missedSales": number,
      "missedRevenue": number,
      "inventory": { "chips": number, "drinks": number, "sweets": number },
      "decisionQuality": "Strong" | "Risky" | "Unstable",
      "cashStatus": "Healthy" | "Tight" | "Critical",
      "stabilityScore": number,
      "patterns": ["Stockout", "Cash Lock", "Negative Margin", "Overpricing", "Underpricing", "Overcorrection"],
      "microSignals": ["..."],
      "newState": {
        "cash": number,
        "inventory": { "chips": number, "drinks": number, "sweets": number }
      }
    }
  ` : (isModule3 ? `
    You are the Dinaledi360 Simulation Engine for Module 3: "Nomsa Gets a Fine".
    
    You simulate a 6-month compliance journey for a small African business (Nomsa's Catering).
    
    CRITICAL:
    - You are NOT a teacher unless in Tutor Mode.
    - Every outcome must follow: Obligation → Decision → Consequence.
    - Delayed compliance creates delayed consequences.
    
    LANGUAGE:
    - Simple business language. Simple, direct, cause-effect.
    - NO jargon unless explained plainly.
    - NO words: "random", "unexpected", "unforeseen".
    
    SCENARIO:
    A small catering business in Thabong, Welkom (South Africa).
    Business is growing. Round: Month ${currentState.round} of 6.
    
    CURRENT STATE:
    - Cash: R${currentState.cash}
    - Monthly Sales: R${currentState.sales}
    - Compliance Status:
      - Registration: ${currentState.complianceState?.registration.level}
      - Tax: ${currentState.complianceState?.tax.level}
      - Employees: ${currentState.complianceState?.employees.level}
      - Permit: ${currentState.complianceState?.permit.level}
      - Recordkeeping: ${currentState.complianceState?.records.level}
    - Reputation: ${currentState.reputation}
    - Opportunity Readiness: ${currentState.opportunityReadiness}
    
    BEHAVIOR CONTEXT:
    - Stability: ${currentState.learningState?.behaviorProfile.stability}
    - Compliance Discipline: ${currentState.learningState?.behaviorProfile.complianceDiscipline}
    
    DECISIONS THIS MONTH:
    - Registration: ${decisions.registration}
    - Tax: ${decisions.tax}
    - Employees: ${decisions.employees}
    - Permit: ${decisions.permit}
    - Recordkeeping: ${decisions.records}
    
    COMPLIANCE RULES:
    1. Business Registration: Required for bank accounts and formal tenders.
    2. Tax (SARS): Missing tax clearance blocks formal contracts and creates penalties over time.
    3. Employees: Poor records risk labour disputes and backdated liabilities.
    4. Permits: Operating without sectoral permits risks fines and closure.
    5. Recordkeeping: Weak records block funding and ability to prove income.
    
    ESCALATION LOGIC:
    - Month 1-2 missed: Warnings, minor reputation drop.
    - Month 3+ missed: Penalties, blocked opportunities (contracts), severe reputation drop.
    
    DECISION HIERARCHY:
    1. Illegal / blocked operation risk
    2. Penalties or formal enforcement (e.g. Fines, SARS letters)
    3. Opportunity blockage (e.g. Funding or Tenders rejected)
    4. Poor records / weak evidence
    5. Growth advice
    
    ESCALATION & DEADLINE RULES (DETERMINISTIC):
    Compare Month vs item.deadlineRound:
    - Month < deadlineRound: "Required" (Warning if nearing deadline: "Due Soon")
    - Month == deadlineRound: IF not completed -> "Due Soon"
    - Month == deadlineRound + 1: IF not completed -> "Overdue" (Blocked from small opportunities)
    - Month == deadlineRound + 2: IF not completed -> "Penalized" (Fine incurred, Blocked from medium opportunities)
    - Month >= deadlineRound + 3: IF not completed -> "Critical" (Severe fines, Total Opportunity Block)
    
    IMPORTANT: Escalation must NEVER skip steps. Progress from Warning -> Overdue -> Penalized -> Critical.
    
    GATE LOGIC (NON-NEGOTIABLE):
    If any of [registration, tax, permit] is "Overdue", "Penalized", or "Critical":
    → opportunityReadiness = "Low"
    
    LATE COMPLIANCE TRAP:
    If a user fixes an item that was already "Overdue" at the start of the month, the status becomes "Completed", but ANY opportunity requiring that item in that same month remains BLOCKED. Timing matters.
    
    PATTERNS TO DETECT:
    - Selective Compliance Risk: User fixes easy tasks (records) but ignores critical ones (Tax/Reg).
    - Compliance Illusion: High sales growth with weak foundations.
    - Late Compliance Pattern: Fixing things after the penalty hit.
    
    TUTOR MODE (FORENSIC DISCIPLINE):
    - Forensic, causal, and neutral. NO "You should have".
    - Rule: If a constraint (deadline, budget) exists and was violated, lead ONLY with that constraint. No strategy advice until constraints are met.
    - TEMPLATE: "This requirement was due in Month [X]. It was [ignored/delayed] until Month [Y]. This timing prevented [Consequence]."
    
    STEP 1: Process Monthly Results
    - Calculate sales growth.
    - Update complianceState.level based on decisions and deadlines.
    - Record status changes in complianceState.history.
    - Identify blocked opportunities. MUST explain the specific missing requirement AND the consequence (e.g. "Payment cannot be processed").
    
    STEP 2: Drivers (Exactly 3)
    - Link outcome to decisions.
    
    STEP 3: Tutor Mode (Obligation → Decision → Consequence)
    - ONLY ONE primary insight allowed in tutorFeedback.
    - MAXIMUM 2 secondary observations in secondaryInsights.
    - STRUCTURE:
      🟢 Quick Insight: [One high-priority sentence].
      ▶️ What caused this?: Obligation: [cat]. Decision: [action]. Consequence: [result].
      ▶️ What should I do differently?: 2-3 steps.
      ▶️ Deeper insight: Label one pattern: [Compliance Delay | Shortcut Pattern | Recordkeeping Gap | Funding Block | Recovery Pattern].
      💡 Principle: [One rule].
      🔄 Watch next: [Next month's focus].
    
    STEP 4: Final Artifact (Month 6 only)
    - "Compliance Status Report" / "Compliance Recovery Plan"
    - SECTIONS:
      1. Business Summary
      2. Compliance Dashboard (Visual status of all items)
      3. Blocked Opportunities (Itemize lost contracts and the SPECIFIC requirement that failed)
      4. Compliance Economic Impact: Compare "Cost of Early Compliance" (R2,000) vs "Cost of Delay & Lost Opportunities" (R13,000+). Show the net difference.
      5. Required Next Steps & Compliance Recovery Plan
      6. Micro-Signal Responsiveness Rating (MUST strictly follow exact scale below):
         - HIGH: Acted on 3 or 4 signals (75–100%)
         - MODERATE: Acted on 2 of 4 signals (50%)
         - LOW: Acted on 1 of 4 signals (25%)
         - CRITICAL: Acted on 0 signals (0%)
      7. Risk Register Table (Columns: Obligation | Decision History | Consequence | Current Status | Next Step)
      8. Final Principle
    - Markdown format.
    
    STEP 5: Evidence Normalization (Month 6 only)
    - Provide a "normalizedArtifact" JSON object following this schema:
      {
        "reportType": "ComplianceReport",
        "module": "M3",
        "version": number,
        "summary": { "finalStatus": string, "trajectory": string },
        "obligations": [ { "name": string, "timeline": [ { "month": number, "status": string, "decision": string } ], "consequence": string } ],
        "financialImpact": { "complianceCost": number, "lostOpportunity": number },
        "behaviorProfile": { "stability": string, "riskTolerance": string, "complianceDiscipline": string },
        "drivers": [ { "name": string, "weight": number } ]
      }
    
    DETECTORS (Tutor Insight priority):
    - Late Compliance Trap: User fixed a requirement in the same month/after the gate. Highlight that timing matters.
    - Selective Compliance Risk: User completes easy tasks (records) but ignores critical ones (Tax/Reg).
    - Compliance Illusion: Growth without foundation.
    
    RETURN JSON:
    {
      "totalCost": number (Penalties + Admin Fees ONLY. Normal decision costs are handled by the engine),
      "marketFeedback": "Outcome text for the month",
      "tutorFeedback": "Structured tutor feedback",
      "decisionQuality": "Strong" | "Risky" | "Unstable",
      "trajectory": "Improving" | "Stable" | "Declining" | "Critical",
      "stabilityScore": number,
      "secondaryInsights": ["Observation 1", "Observation 2"],
      "opportunityReadiness": "Low" | "Medium" | "High",
      "ledgerEntry": {
        "obligation": "string",
        "decision": "string",
        "result": "string",
        "statusChange": "string (e.g. Due -> Overdue)",
        "type": "Risk" | "Obligation" | "Interaction",
        "impact": "Immediate" | "Delayed" | "CrossModule"
      },
      "nextRequirement": "string (The next upcoming deadline item)",
      "artifact": "Markdown string (Month 6 only)",
      "normalizedArtifact": "JSON object (Month 6 only)",
      "newState": {
        "complianceState": {
          "registration": { "level": "string", "history": ["string"], "deadlineRound": number },
          "tax": { "level": "string", "history": ["string"], "deadlineRound": number },
          "employees": { "level": "string", "history": ["string"], "deadlineRound": number },
          "permit": { "level": "string", "history": ["string"], "deadlineRound": number },
          "records": { "level": "string", "history": ["string"], "deadlineRound": number }
        },
        "cash": number,
        "sales": number,
        "reputation": number,
        "opportunityReadiness": "Low" | "Medium" | "High"
      }
    }
  ` : `
    You are the Dinaledi360 Simulation Engine for Module 2: "School Event Disaster".

    CRITICAL:
    - You are NOT a teacher unless in Tutor Mode.
    - Every outcome must follow: Risk → Decision → Outcome.

    SCENARIO:
    A school fundraising event in 5 days. Day ${currentState.round} of 5.

    CURRENT STATE:
    - Budget: R${currentState.budget}
    - Readiness Levels:
      - Venue: ${currentState.eventReadiness?.venue.level}
      - Entertainment: ${currentState.eventReadiness?.entertainment.level}
      - Food: ${currentState.eventReadiness?.food.level}
      - Safety: ${currentState.eventReadiness?.safety.level}
      - Backup: ${currentState.eventReadiness?.backup.level}
    
    BEHAVIOR CONTEXT:
    - Stability: ${currentState.learningState?.behaviorProfile.stability}
    - Risk Tolerance: ${currentState.learningState?.behaviorProfile.riskTolerance}
    
    USER_DECISION:
    - Venue: ${decisions.venue}
    - Entertainment: ${decisions.entertainment}
    - Food: ${decisions.food}
    - Safety: ${decisions.safety}
    - Backup: ${decisions.backup}

    STEP 1: Validate Budget (No Double-Spend)
    - If user re-selects the SAME level from previous round, cost is R0.
    
    STEP 2: Update State (Persistence + Decay)
    
    STEP 3: Day 5 Final Event Resolution
    
    TUTOR MODE (FORENSIC DISCIPLINE):
    - Forensic, causal, and neutral. NO "You should have".
    - Rule: If a safety/budget constraint was violated, lead ONLY with that.
    - TEMPLATE: "This risk was [Decision] on Day [X]. This caused [Outcome]."

    RETURN JSON:
    {
      "totalCost": number,
      "marketFeedback": "Outcome text",
      "tutorFeedback": "Structured feedback",
      "decisionQuality": "Strong" | "Risky" | "Unstable",
      "trajectory": "Improving" | "Declining" | "Unstable" | "Stable",
      "stabilityScore": number,
      "secondaryInsights": ["Insight 1"],
      "drivers": [ { "category": "...", "impact": number } ],
      "patterns": ["..."],
      "counterfactuals": ["..."],
      "nextMove": "...",
      "ledgerEntry": {
        "obligation": "string",
        "decision": "string",
        "result": "string",
        "statusChange": "string",
        "type": "Risk" | "Obligation" | "Interaction",
        "impact": "Immediate" | "Delayed" | "CrossModule"
      },
      "artifact": "Markdown string (Day 5 only)",
      "normalizedArtifact": "JSON object (Day 5 only)",
      "newState": {
        "eventReadiness": { ... },
        "budget": number,
        "reputation": number,
        "expectedAttendance": number,
        "totalProtectionSpend": number
      }
    }
  `));

  const ai = getAIClient();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      const raw = JSON.parse(response.text || "{}");
      if (raw && typeof raw === "object" && (raw.marketFeedback || raw.totalCost !== undefined || raw.profit !== undefined)) {
        let nextRollingHistory = currentState.rollingHistory;
        if (isModule1) {
          const rh = currentState.rollingHistory || { prices: {}, restocks: {}, cash: [] };
          const updateRolling = (current: string[], val: string) => {
            const next = [...(current || []), val];
            return next.slice(-3);
          };

          const nextPrices = { ...rh.prices };
          const nextRestocks = { ...rh.restocks };
          
          ['chipsPrice', 'drinksPrice', 'sweetsPrice'].forEach(key => {
            nextPrices[key] = updateRolling(nextPrices[key], decisions[key] || "0");
          });
          ['chipsRestock', 'drinksRestock', 'sweetsRestock'].forEach(key => {
            nextRestocks[key] = updateRolling(nextRestocks[key], decisions[key] || "0");
          });

          const nextCash = [...rh.cash, currentState.cash].slice(-3);
          nextRollingHistory = { prices: nextPrices, restocks: nextRestocks, cash: nextCash };
        }

        // NON-NEGOTIABLE CONSTRAINT: Behavioral tags must NEVER be decided by an LLM.
        // Always compute patterns deterministically from stored round history.
        const allRoundsForTags: RoundRecord[] = [
          ...(currentState.history || []),
          { round: currentState.round, decisions, results: raw as any }
        ];
        raw.patterns = detectBehavioralTags(currentState.module, allRoundsForTags);

        return {
          ...raw,
          newState: {
            ...raw.newState,
            round: currentState.round + 1,
            rollingHistory: nextRollingHistory
          }
        };
      }
    } catch (err) {
      console.warn("Gemini API call failed, using deterministic simulation engine:", err);
    }
  }

  return runDeterministicSimulation(currentState, decisions);
}
