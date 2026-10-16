## 2026-03-31 - Toast Notifications & Component Re-render Bottlenecks
**Learning:** Frequent UI state updates like toast creation/expiration timers in `App.tsx` cause the entire component tree to re-render. Memoizing sub-components (`ChoiceGroup`, `Sidebar`, `DecisionLedger`) and using `useCallback` on handlers prevents unnecessary re-rendering across module decision interactions.
**Action:** Always wrap stateless or isolated decision inputs and sidebars in `React.memo` and memoize event handlers with `useCallback` when parent state includes high-frequency UI elements like toasts or modals.

## 2026-03-31 - Firestore Error Invalidation in Asynchronous Lookup Caches
**Learning:** Caching async lookup results inside `try...catch` blocks where transient network or auth errors occur can permanently store false negatives in memory.
**Action:** Only populate lookup caches (`Map`) on successful Firestore reads or deterministic fallback matches, bypassing the cache during error catches.
