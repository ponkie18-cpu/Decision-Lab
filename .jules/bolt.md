## 2026-03-30 - Prevent Sidebar & Choice Grid Re-renders via React.memo & useCallback

**Learning:** In interactive simulation dashboards where user actions (selecting options, typing inputs, toast notification timers) trigger frequent state changes in the root component (`App.tsx`), layout sub-trees like `Sidebar` (which render complex curriculum lists, progress bars, and business assets) will re-render on every state tick unless wrapped in `React.memo` alongside stable `useCallback` prop handlers.

**Action:** Wrap `Sidebar`, `ChoiceGroup`, and other purely prop-driven sub-components in `React.memo`, move static data maps outside render scopes, and pass memoized `useCallback` functions to preserve memoization across state updates.
