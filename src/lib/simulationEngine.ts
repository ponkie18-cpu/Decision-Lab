import { GameState, Decisions, RoundResults, RoundRecord } from "../types";
import { detectBehavioralTags } from "../services/behavioralPatterns";
import { 
  EVENT_PLANNER_COSTS,
  M3_ENGINE_OBSOLETE_FINES,
  M4_PAYOFF_MATRIX,
  M1_COLD_STORAGE_COST
} from "./simulationConfig";

/**
 * Pure Deterministic Simulation Engine
 * Computes state transitions and round outcomes with 100% reproducibility.
 * Zero random numbers or non-deterministic calls.
 */
export function runDeterministicSimulation(
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
    let userBase = M4_PAYOFF_MATRIX.cooperateCooperate.user;
    let rivalBase = M4_PAYOFF_MATRIX.cooperateCooperate.rival;

    const isUserCoop = signalChoice.includes('cooperate');
    const isUserCompete = signalChoice.includes('compete');
    const isUserDom = signalChoice.includes('dominate');

    const isRivalCoop = rivalSignal === 'cooperate';
    const isRivalCompete = rivalSignal === 'compete';
    const isRivalDom = rivalSignal === 'dominate';

    if (isUserDom || isRivalDom) {
      userBase = M4_PAYOFF_MATRIX.dominateAny.user;
      rivalBase = M4_PAYOFF_MATRIX.dominateAny.rival;
    } else if (isUserCoop && isRivalCoop) {
      userBase = M4_PAYOFF_MATRIX.cooperateCooperate.user;
      rivalBase = M4_PAYOFF_MATRIX.cooperateCooperate.rival;
    } else if (isUserCoop && isRivalCompete) {
      userBase = M4_PAYOFF_MATRIX.cooperateCompete.user;
      rivalBase = M4_PAYOFF_MATRIX.cooperateCompete.rival;
    } else if (isUserCompete && isRivalCoop) {
      userBase = M4_PAYOFF_MATRIX.competeCooperate.user;
      rivalBase = M4_PAYOFF_MATRIX.competeCooperate.rival;
    } else if (isUserCompete && isRivalCompete) {
      userBase = M4_PAYOFF_MATRIX.competeCompete.user;
      rivalBase = M4_PAYOFF_MATRIX.competeCompete.rival;
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
    const coldStorageCost = spoilageChoice.includes("cold") || spoilageChoice.includes("storage") ? M1_COLD_STORAGE_COST : 0;
    
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
      fines += M3_ENGINE_OBSOLETE_FINES.municipalByLawFineMonth2;
      microSignals.push("[MUNICIPAL BY-LAW FINE]: R1,200 penalty issued for compliance non-alignment.");
    }
    if (round === 4 && !primaryAction.includes("health") && !primaryAction.includes("equipment")) {
      fines += M3_ENGINE_OBSOLETE_FINES.dohAuditFailureMonth4;
      microSignals.push("[DOH AUDIT FAILURE]: R3,500 penalty issued following unannounced health audit.");
    }
    if (round === 5 && !secondaryAction.includes("uif")) {
      fines += M3_ENGINE_OBSOLETE_FINES.sarsUifReviewMonth5;
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
