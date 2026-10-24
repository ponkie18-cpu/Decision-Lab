## 2025-05-18 - Deduplicate Behavioral Tag Computation in Firestore Cohort Aggregation
**Learning:** In institutional reporting pipelines (`getCohortAggregateReport`), calculating deterministic behavioral tags (`detectBehavioralTags`) multiple times for baseline and replay runs during array iteration created redundant processing overhead per participant run.
**Action:** Pre-compute and attach `detectedTags` once per run when initially forming the learner runs map in Firestore aggregation routines.
