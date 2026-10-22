## 2025-05-18 - Memoizing search input filters in admin dashboard components

**Learning:** Component state updates (such as live updates or dropdown selections) trigger re-renders that re-evaluate unmemoized `.filter()` loops across user lists, invoking repeated string operations (e.g. `searchTerm.toLowerCase()`) on every render pass.
**Action:** Always wrap array search filtering in `useMemo` and extract lowercasing/formatting operations outside the filter loop.
