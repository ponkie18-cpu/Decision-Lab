## 2026-03-30 - Prevent Redundant Navigation Panel Re-renders in App State Trees

**Learning:** Un-memoized complex sidebar navigation components in top-level state containers re-render on every state change—including 1-second toast timers, input changes, and modal toggles. This triggers unnecessary array filtering (`assets.filter(...)`) and Framer Motion animation layout recalculations.

**Action:** Wrap navigation/sidebar components in `React.memo` and memoize nested array operations with `useMemo` when top-level state updates frequently.
