## 2026-03-30 - Memoization of String Computations in Hot Loop Functions & Search Filters
**Learning:** Functions like `getEventPlannerCost` are invoked frequently during behavioral pattern evaluation across round histories. Repeated `toLowerCase()`, regex evaluations, and `Object.entries` iterations in unmemoized helper functions introduce measurable overhead when evaluating multi-round simulation telemetry.
**Action:** Use a fast-path `Map` cache for deterministic string parsing helpers and wrap search filter operations with `useMemo` in React components.
