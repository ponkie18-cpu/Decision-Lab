## 2026-10-09 - Pre-computing Object Entries and Hoisting Module Costs
**Learning:** Functions called inside loops or during simulation round checks (like `getEventPlannerCost`) were allocating temporary arrays on every invocation via `Object.entries(EVENT_PLANNER_COSTS)`. Similarly, component-scoped object literals allocated fresh objects on every React render.
**Action:** Pre-compute case-insensitive entry arrays at module scope for lookup functions, and hoist static component data structures outside React component bodies to avoid unnecessary heap allocations during state updates.
