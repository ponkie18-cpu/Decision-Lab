# Bolt's Performance Journal

## 2026-10-26 - Behavioral Tag Detection & Cost Lookup Memoization
**Learning:** Simulation runs repeatedly trigger `detectBehavioralTags` during round execution, audit logging, and cohort reporting. Dynamic cost string resolution in `getEventPlannerCost` performed regex matches and `Object.entries` iterations on every round item.
**Action:** Use a module-scoped `Map` cache for string-to-cost parsing and add early-exit boolean guards (e.g. `if (!stockoutFound)`) to bypass nested array iterations once a condition is met.
