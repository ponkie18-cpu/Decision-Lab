## 2026-03-31 - Recharts Component Re-renders on Search Input Typing
**Learning:** In React components rendering heavy Recharts charts (`RadarChart`, `AreaChart`, `ResponsiveContainer`), placing search inputs in the same component triggers full SVG chart re-calculations on every keystroke if chart sections or filtered data are unmemoized.
**Action:** Always wrap heavy chart sub-trees in `useMemo` keyed on dataset changes (`[profileData, loading, error]`) to decouple search state updates from chart re-rendering.
