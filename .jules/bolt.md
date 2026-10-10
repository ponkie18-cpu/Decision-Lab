## 2025-05-18 - Prevent UI Sub-Component Re-renders in Main App Loop

**Learning:** Un-memoized sub-components (`ChoiceGroup`, `OpportunityGate`, `DecisionLedger`, `ComplianceTimeline`, `Sidebar`) and inline object/array allocations (`M2_EVENT_COSTS`, curriculum array filtering) in top-level state containers (`App.tsx`) cause complete re-renders of all decision panels whenever ephemeral state updates (e.g. toast notifications, auto-dismiss timers, loading state).

**Action:** Wrap reusable sub-components in `React.memo`, hoist static lookup objects/arrays outside component bodies, and memoize top-level handlers and calculated totals with `useCallback` and `useMemo`.
