import { GameState, Decisions, RoundResults } from "../types";
import { runDeterministicSimulation } from "../lib/simulationEngine";

export { runDeterministicSimulation };

// Task 2-e SECURITY FIX: the client-side Gemini path has been removed.
// An API key must never be baked into or shipped with the browser bundle.
// AI narrative generation will return exclusively through a server-side
// proxy (Firebase Callable) that holds the key. Until that task lands,
// the snapshot-verified deterministic engine is the sole round engine.
export async function simulateRound(
  currentState: GameState,
  decisions: Decisions
): Promise<RoundResults & { newState: Partial<GameState> }> {
  return runDeterministicSimulation(currentState, decisions);
}
