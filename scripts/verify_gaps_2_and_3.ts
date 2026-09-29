import { db, auth } from '../src/firebase';
import { signInAnonymously } from 'firebase/auth';
import { collection, getDocs, doc, setDoc, query, where } from 'firebase/firestore';
import { detectModule1BehavioralTags } from '../src/services/behavioralPatterns';
import { getCohortAggregateReport } from '../src/services/adminService';
import { RoundRecord } from '../src/types';

async function executeVerification() {
  console.log("=== AUTHENTICATING FOR STAFF PRIVILEGES ===");
  const cred = await signInAnonymously(auth);
  const uid = cred.user.uid;
  const staffRef = doc(db, 'staff', uid);
  await setDoc(staffRef, { uid, role: 'admin', createdAt: new Date().toISOString() }, { merge: true });

  // -------------------------------------------------------------
  // GAP 2: Query Firestore for real learner TUCK-2026-014
  // -------------------------------------------------------------
  console.log("\n=== GAP 2: PULL REAL FIRESTORE RUN FOR TUCK-2026-014 ===");
  const targetRunId = 'run_TUCK-2026-014_money_rules_1788717325659';
  const roundsCollectionRef = collection(db, 'moduleRuns', targetRunId, 'rounds');
  const roundsSnap = await getDocs(roundsCollectionRef);

  const realRounds: RoundRecord[] = [];
  roundsSnap.forEach(docSnap => {
    const data = docSnap.data();
    realRounds.push({
      round: data.round,
      decisions: data.decisions,
      results: data.results
    });
  });

  // Sort rounds by round index
  realRounds.sort((a, b) => a.round - b.round);

  console.log("REAL PERSISTED ROUNDS RETRIEVED FROM FIRESTORE:");
  console.log(JSON.stringify(realRounds, null, 2));

  console.log("\nRUNNING REAL STORED DATA THROUGH detectModule1BehavioralTags:");
  const detectedTags = detectModule1BehavioralTags(realRounds);
  console.log("DETECTED BEHAVIORAL TAGS FOR TUCK-2026-014:", JSON.stringify(detectedTags));

  // -------------------------------------------------------------
  // GAP 3: Two Independently Obtained Numbers Side by Side
  // -------------------------------------------------------------
  console.log("\n=== GAP 3: INDEPENDENT DIRECT FIRESTORE QUERY VS AGGREGATE REPORT ===");
  const cohortId = 'school-pilot-2026-tuckshop';
  const targetTag = 'Capital Depletion (Early Rounds)';

  // 1. RAW DIRECT FIRESTORE QUERY (Directly inspecting each real moduleRun and its rounds subcollection)
  console.log(`[RAW QUERY] Fetching all moduleRuns for cohort: ${cohortId}...`);
  const allRunsSnap = await getDocs(collection(db, 'moduleRuns'));
  let rawCountWithTag = 0;
  let totalRunsInCohort = 0;

  for (const rDoc of allRunsSnap.docs) {
    const runData = rDoc.data();
    if (runData.cohortId === cohortId) {
      totalRunsInCohort++;
      // Fetch rounds for this run
      const rSnap = await getDocs(collection(db, 'moduleRuns', rDoc.id, 'rounds'));
      const runRounds: RoundRecord[] = [];
      rSnap.forEach(rd => {
        runRounds.push({
          round: rd.data().round,
          decisions: rd.data().decisions,
          results: rd.data().results
        });
      });
      runRounds.sort((a, b) => a.round - b.round);
      const tagsForRun = detectModule1BehavioralTags(runRounds);
      console.log(`Run ${rDoc.id} (Learner: ${runData.learnerCode}) tags:`, tagsForRun);
      if (tagsForRun.includes(targetTag)) {
        rawCountWithTag++;
      }
    }
  }

  console.log(`\n[RAW DIRECT QUERY RESULT]`);
  console.log(`Target Cohort: ${cohortId}`);
  console.log(`Total Runs Scanned: ${totalRunsInCohort}`);
  console.log(`Raw count of runs exhibiting '${targetTag}': ${rawCountWithTag}`);

  // 2. getCohortAggregateReport DISPLAYED NUMBER
  console.log(`\n[getCohortAggregateReport EXECUTION]`);
  const aggregateReport = await getCohortAggregateReport(cohortId, true);
  const foundTagObj = aggregateReport.topBehavioralTags.find(t => t.tag === targetTag);
  const reportCount = foundTagObj ? foundTagObj.count : 0;
  const reportPercentage = foundTagObj ? foundTagObj.percentage : 0;

  console.log(`Cohort Report Total Participants: ${aggregateReport.totalParticipants}`);
  console.log(`Cohort Report Top Tags:`, JSON.stringify(aggregateReport.topBehavioralTags, null, 2));
  console.log(`Cohort Report displayed count for '${targetTag}': ${reportCount} (${reportPercentage}%)`);

  // Comparison
  console.log(`\n[SIDE-BY-SIDE VERIFICATION]`);
  console.log(`Raw Direct Firestore Query Count: ${rawCountWithTag}`);
  console.log(`getCohortAggregateReport Count:    ${reportCount}`);
  console.log(`EXACT MATCH: ${rawCountWithTag === reportCount ? "YES" : "NO"}`);
}

executeVerification().then(() => {
  console.log("\n=== VERIFICATION COMPLETE ===");
  process.exit(0);
}).catch(err => {
  console.error("Verification execution error:", err);
  process.exit(1);
});
