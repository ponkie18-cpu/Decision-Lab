## 2025-05-18 - Parallelizing Firestore Subcollection Aggregation
**Learning:** Sequential `for...of` loops that `await getDocs()` on subcollections (like `moduleRuns/{id}/rounds`) create an N+1 serial network waterfall during cohort aggregation.
**Action:** Always map document snapshots to async functions and await with `Promise.all()` to fetch subcollections concurrently in a single batch.
