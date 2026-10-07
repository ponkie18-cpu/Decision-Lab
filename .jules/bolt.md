# Bolt's Journal - Critical Learnings

## 2026-03-30 - Cost Schedule Lookups & Array Search Short-Circuiting in Deterministic Tag Engines
**Learning:** In aggregate reporting and simulation engines, lookups against static dictionaries (like `EVENT_PLANNER_COSTS`) frequently trigger `Object.entries()` allocations and string lowercasing on every call. Similarly, scanning nested arrays (`patterns`, `microSignals`, `secondaryInsights`) using `.some()` without short-circuiting performs redundant array iterations and string transformations even after a match is found.
**Action:** Pre-compute static lowercased lookup arrays (`EVENT_PLANNER_COSTS_LOWER`) at module load time to eliminate runtime object-to-array allocations. Use indexed `for` loops with early `break` and boolean guards (`!stockoutFound`) to skip unnecessary iterations once a tag condition is satisfied.
