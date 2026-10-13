# Bolt's Journal - Critical Learnings

## 2026-03-30 - Prevent Unnecessary Component Re-renders in Main Dashboard Loop
**Learning:** In React 19 / Vite applications with active timer-based UI state (such as 4-second toast dismissals) or frequent state updates (like decision selections), non-memoized heavy sidebar and form controls re-render on every state change, causing unnecessary DOM tree reconciliations and signal recalculations.
**Action:** Wrap top-level layout components (`Sidebar`) and repeating form controls (`ChoiceGroup`, `OpportunityGate`, `DecisionLedger`, `ComplianceTimeline`) with `React.memo`, and memoize callback props using `useCallback` to maintain reference stability across parent re-renders.
