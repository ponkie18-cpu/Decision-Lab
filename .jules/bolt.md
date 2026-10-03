## 2026-03-31 - Memoize Filtered User Lists in Admin Views
**Learning:** Admin view components rendering user selection dropdowns (such as `BehavioralRadarView`) re-evaluated `.filter()` across `MOCK_ADMIN_USERS` on every component state update (e.g. user selection changes or async profile fetches). Computing `trim().toLowerCase()` once per query change inside `useMemo` avoids redundant string transformations per item per render.
**Action:** Always wrap search filtering in `useMemo` with `[searchTerm]` as dependencies and extract lowercasing outside the array filter loop.
