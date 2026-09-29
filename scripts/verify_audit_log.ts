import { db, auth } from '../src/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { fetchRecentAuditLogs, recordAuditAction } from '../src/services/auditLogService';

async function testAuditLog() {
  console.log("=== STEP 1: AUTHENTICATE AS STAFF ===");
  const cred = await signInAnonymously(auth);
  const uid = cred.user.uid;
  await setDoc(doc(db, 'staff', uid), {
    uid,
    role: 'admin',
    name: 'Audit Verifier',
    createdAt: new Date().toISOString()
  }, { merge: true });
  console.log("Authenticated with UID:", uid);

  console.log("\n=== STEP 2: FETCH LAST 20 ACTIONS ACROSS ALL MODULES ===");
  const logs = await fetchRecentAuditLogs(20);
  console.log(`Fetched ${logs.length} audit log entries from Firestore:`);

  logs.forEach((log, index) => {
    console.log(`[#${index + 1}] [${log.timestamp.slice(11, 19)}] [${log.moduleName}] Learner: ${log.learnerCode} (R${log.roundNumber})`);
    console.log(`     Decision: ${log.decisionSummary}`);
    console.log(`     Consequence: ${log.resultSummary}`);
    console.log(`     Severity: ${log.severity} | Tags: ${JSON.stringify(log.behavioralTags)}`);
  });

  console.log("\n=== STEP 3: SIMULATE A NEW LEARNER DECISION ACTION IN REAL-TIME ===");
  const testLearner = 'TEST-AUDIT-999';
  await recordAuditAction({
    learnerCode: testLearner,
    cohortId: 'school-pilot-2026-tuckshop',
    moduleId: 'money_rules',
    roundNumber: 2,
    actionType: 'decision_submitted',
    decisions: {
      chipsPrice: '8',
      chipsRestock: '20',
      drinksPrice: '10',
      drinksRestock: '15',
      sweetsPrice: '4',
      sweetsRestock: '10'
    },
    results: {
      cash: 1350,
      profit: 175,
      revenue: 410,
      stockout: false,
      spoilage: false,
      feedback: 'Excellent margin control and healthy cash buffer.'
    }
  });
  console.log(`Recorded new decision action for ${testLearner}`);

  console.log("\n=== STEP 4: RE-FETCH TO VERIFY INSTANT PERSISTENCE ===");
  const updatedLogs = await fetchRecentAuditLogs(20);
  console.log(`Updated logs count: ${updatedLogs.length}`);
  const foundTestLog = updatedLogs.find(l => l.learnerCode === testLearner);
  if (foundTestLog) {
    console.log("SUCCESS: Found newly recorded audit entry at top of feed!");
    console.log("Audit Entry Details:", JSON.stringify(foundTestLog, null, 2));
  } else {
    console.error("FAILURE: Newly recorded audit entry not found.");
  }
}

testAuditLog().then(() => {
  console.log("\n=== AUDIT LOG VERIFICATION COMPLETE ===");
  process.exit(0);
}).catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
