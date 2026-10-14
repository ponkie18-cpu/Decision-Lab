## 2026-10-14 - Parallelizing Subcollection Fetches in Firestore Aggregations
**Learning:** Sequential `for...of` loops containing `await getDocs(subcollection)` create network request waterfalls ($O(N \cdot \text{latency})$) during cohort aggregation and audit log backfilling.
**Action:** Use `Promise.all(snapshot.docs.map(async ...))` to fetch subcollections concurrently in parallel, reducing latency to $O(\text{latency})$.
