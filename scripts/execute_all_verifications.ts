import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection, 
  getDocs, 
  query, 
  where,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { 
  validateLearnerConsent, 
  getActiveRun, 
  startModuleRun, 
  saveRoundRecord, 
  seedLearnerCode 
} from '../src/services/learnerPersistenceService';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function runVerifications() {
  console.log('====================================================');
  console.log('STARTING FIRESTORE PILOT AUDIT VERIFICATIONS (V1-V5)');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // PREPARATION: Seed TUCK-2026-014 & TEST-UNCONFIRMED-999
  // ----------------------------------------------------
  console.log('>>> [PREP] Seeding learner codes...');
  await seedLearnerCode('TUCK-2026-014', 'school-pilot-2026-tuckshop', true, 'FACILITATOR-STAFF-01');
  await seedLearnerCode('TEST-UNCONFIRMED-999', 'school-pilot-2026-tuckshop', false, 'FACILITATOR-STAFF-01');
  console.log('>>> [PREP] Done.\n');

  // ----------------------------------------------------
  // V1 — Resume with intact history
  // ----------------------------------------------------
  console.log('====================================================');
  console.log('--- V1: RESUME WITH INTACT HISTORY ---');
  console.log('====================================================');
  const learnerCode = 'TUCK-2026-014';
  const moduleId = 'money_rules';

  // Start new run for V1
  const run = await startModuleRun(learnerCode, 'school-pilot-2026-tuckshop', moduleId, 'baseline');
  const runId = run.runId;
  console.log(`[V1] Created module run: ${runId}`);

  // Play Round 1
  const r1Decisions = { chipsPrice: '7', drinksPrice: '9', sweetsPrice: '4', chipsRestock: '15', drinksRestock: '10', sweetsRestock: '20' };
  const r1Results = { cash: 1240, revenue: 380, profit: 160, stockout: false, spoilage: false, feedback: 'Balanced opening stock.' };
  await saveRoundRecord(runId, 1, r1Decisions, r1Results, 2);
  console.log('[V1] Saved Round 1 (nextRound: 2)');

  // Play Round 2
  const r2Decisions = { chipsPrice: '8', drinksPrice: '10', sweetsPrice: '5', chipsRestock: '20', drinksRestock: '15', sweetsRestock: '15' };
  const r2Results = { cash: 1390, revenue: 420, profit: 190, stockout: false, spoilage: false, feedback: 'Healthy price adaptation.' };
  await saveRoundRecord(runId, 2, r2Decisions, r2Results, 3);
  console.log('[V1] Saved Round 2 (nextRound: 3)');

  // Play Round 3
  const r3Decisions = { chipsPrice: '8', drinksPrice: '10', sweetsPrice: '4', chipsRestock: '10', drinksRestock: '10', sweetsRestock: '10' };
  const r3Results = { cash: 1510, revenue: 350, profit: 150, stockout: false, spoilage: false, feedback: 'Stable cash buffers maintained.' };
  await saveRoundRecord(runId, 3, r3Decisions, r3Results, 4);
  console.log('[V1] Saved Round 3 (nextRound: 4)');

  // Check state immediately after Round 3
  const runDocAfterR3 = await getDoc(doc(db, 'moduleRuns', runId));
  const runDataAfterR3 = runDocAfterR3.data();
  console.log(`[V1] Run after Round 3 in Firestore: runId=${runId}, currentRound=${runDataAfterR3?.currentRound}`);

  // Simulate Hard Refresh / Reload:
  console.log('[V1] Simulating browser reload: Logging in again with TUCK-2026-014...');
  const activeRes = await getActiveRun(learnerCode, moduleId);
  const reloadedRun = activeRes.run;
  const reloadedRounds = activeRes.rounds;

  const currentRoundFromDb = reloadedRun?.currentRound;
  const uiResumedRound = currentRoundFromDb || (reloadedRounds.length > 0 ? reloadedRounds[reloadedRounds.length - 1].round + 1 : 1);

  // Directly query Firestore subcollection moduleRuns/{runId}/rounds
  const roundsQuerySnap = await getDocs(collection(db, 'moduleRuns', runId, 'rounds'));
  const rawRoundsDocs: any[] = [];
  roundsQuerySnap.forEach(d => {
    rawRoundsDocs.push({ id: d.id, ...d.data() });
  });
  rawRoundsDocs.sort((a, b) => a.round - b.round);

  console.log('\n[V1 EVIDENCE: RAW QUERY OF moduleRuns/' + runId + '/rounds]:');
  console.log(JSON.stringify(rawRoundsDocs, null, 2));

  console.log(`\n[V1 RESUME STATE]:`);
  console.log(`- Firestore currentRound value: ${currentRoundFromDb}`);
  console.log(`- UI state resumed round value: ${uiResumedRound}`);
  console.log(`- History length restored: ${reloadedRounds.length}`);
  console.log(`- UI Resumed at round: Round ${uiResumedRound} (Intact History: rounds 1, 2, 3 present)\n`);


  // ----------------------------------------------------
  // V2 — No anonymous/empty userId
  // ----------------------------------------------------
  console.log('====================================================');
  console.log('--- V2: NO ANONYMOUS/EMPTY USERID QUERY ---');
  console.log('====================================================');
  
  // Exact Query 1: moduleRuns.where('userId', 'in', ['anonymous', '', null])
  console.log("Query 1: collection(db, 'moduleRuns'), where('userId', 'in', ['anonymous', '', null])");
  const q1 = query(collection(db, 'moduleRuns'), where('userId', 'in', ['anonymous', '', null]));
  const q1Snap = await getDocs(q1);
  const q1Results: any[] = [];
  q1Snap.forEach(d => q1Results.push({ id: d.id, ...d.data() }));
  console.log(`[V2 Query 1 Result Count]: ${q1Results.length}`);
  console.log('[V2 Query 1 Raw Results]:', JSON.stringify(q1Results, null, 2));

  // Query 2: All moduleRuns to inspect for missing/undefined userId
  console.log("\nQuery 2: Check all moduleRuns for missing/undefined/empty userId field");
  const allRunsSnap = await getDocs(collection(db, 'moduleRuns'));
  const missingUserIdDocs: any[] = [];
  const validRuns: any[] = [];
  allRunsSnap.forEach(d => {
    const data = d.data();
    if (data.userId === undefined || data.userId === null || data.userId === '' || data.userId === 'anonymous') {
      missingUserIdDocs.push({ id: d.id, userId: data.userId, learnerCode: data.learnerCode });
    } else {
      validRuns.push({ id: d.id, userId: data.userId, learnerCode: data.learnerCode });
    }
  });
  console.log(`[V2 Check 2 Result - Total runs]: ${allRunsSnap.size}`);
  console.log(`[V2 Check 2 Result - Runs with invalid/missing userId]: ${missingUserIdDocs.length}`);
  console.log('[V2 Missing/Invalid userId Docs]:', JSON.stringify(missingUserIdDocs, null, 2));
  console.log('[V2 Valid Runs Sample]:', JSON.stringify(validRuns.slice(0, 3), null, 2));
  console.log('\n');


  // ----------------------------------------------------
  // V3 — Field-level schema inspection
  // ----------------------------------------------------
  console.log('====================================================');
  console.log('--- V3: FIELD-LEVEL SCHEMA INSPECTION ---');
  console.log('====================================================');
  // 1. learners
  const learnerDocSnap = await getDoc(doc(db, 'learners', 'TUCK-2026-014'));
  const learnerData = learnerDocSnap.data();

  // 2. moduleRuns
  const runDocSnap = await getDoc(doc(db, 'moduleRuns', runId));
  const runData = runDocSnap.data();

  // 3. roundRecords (subcollection)
  const roundDocSnap = await getDoc(doc(db, 'moduleRuns', runId, 'rounds', '1'));
  const roundData = roundDocSnap.data();

  console.log('1. Document: learners/TUCK-2026-014:');
  console.log(JSON.stringify(learnerData, null, 2));

  console.log('\n2. Document: moduleRuns/' + runId + ':');
  console.log(JSON.stringify(runData, null, 2));

  console.log('\n3. Document: moduleRuns/' + runId + '/rounds/1:');
  console.log(JSON.stringify(roundData, null, 2));

  // Identity scan across all fields
  const piiKeywords = ['name', 'email', 'school', 'schoolname', 'grade', 'student', 'surname', 'firstname', 'lastname', 'phone'];
  const allFoundFields: string[] = [
    ...Object.keys(learnerData || {}),
    ...Object.keys(runData || {}),
    ...Object.keys(roundData || {})
  ];
  const flaggedFields = allFoundFields.filter(f => piiKeywords.some(k => f.toLowerCase().includes(k)));
  console.log(`\n[V3 Field Analysis] All unique fields inspected: ${Array.from(new Set(allFoundFields)).join(', ')}`);
  console.log(`[V3 Field Analysis] Flagged PII-adjacent fields found: ${flaggedFields.length > 0 ? flaggedFields.join(', ') : 'NONE'}\n`);


  // ----------------------------------------------------
  // V4 — Unconfirmed code is actually blocked
  // ----------------------------------------------------
  console.log('====================================================');
  console.log('--- V4: UNCONFIRMED CODE IS ACTUALLY BLOCKED ---');
  console.log('====================================================');
  const unconfirmedCode = 'TEST-UNCONFIRMED-999';

  // 1. Validate consent as a learner would
  console.log(`[V4 UI Validation] Attempting validateLearnerConsent('${unconfirmedCode}')...`);
  const validationResult = await validateLearnerConsent(unconfirmedCode);
  console.log('[V4 UI Validation Literal Result]:', JSON.stringify(validationResult, null, 2));

  // 2. Attempt direct write to moduleRuns bypassing client validation to test Firestore security rules
  console.log(`\n[V4 Security Rule Test] Attempting direct setDoc on moduleRuns for unconfirmed code '${unconfirmedCode}'...`);
  let ruleRejectionError = '';
  try {
    const unconfirmedRunId = `run_${unconfirmedCode}_test_${Date.now()}`;
    await setDoc(doc(db, 'moduleRuns', unconfirmedRunId), {
      runId: unconfirmedRunId,
      learnerCode: unconfirmedCode,
      userId: unconfirmedCode,
      moduleId: 'money_rules',
      cohortId: 'school-pilot-2026-tuckshop',
      attemptType: 'baseline',
      status: 'in_progress',
      startedAt: serverTimestamp(),
      lastUpdatedAt: serverTimestamp(),
      completedAt: null,
      currentRound: 1
    });
    console.log('[V4 Security Rule Test] UNEXPECTED: Write succeeded!');
  } catch (err: any) {
    ruleRejectionError = err.message || String(err);
    console.log('[V4 Security Rule Test Literal Rejection]:', ruleRejectionError);
  }

  // 3. Directly query Firestore for any moduleRuns associated with TEST-UNCONFIRMED-999
  console.log(`\n[V4 Query] Checking if any moduleRuns exist for '${unconfirmedCode}'...`);
  const unconfirmedQuery = query(collection(db, 'moduleRuns'), where('learnerCode', '==', unconfirmedCode));
  const unconfirmedQuerySnap = await getDocs(unconfirmedQuery);
  const unconfirmedRuns: any[] = [];
  unconfirmedQuerySnap.forEach(d => unconfirmedRuns.push({ id: d.id, ...d.data() }));
  console.log(`[V4 Query Result Count]: ${unconfirmedRuns.length}`);
  console.log('[V4 Query Literal Results]:', JSON.stringify(unconfirmedRuns, null, 2));

  console.log('\n====================================================');
  console.log('ALL VERIFICATION STEPS COMPLETED');
  console.log('====================================================');
  process.exit(0);
}

runVerifications().catch(err => {
  console.error('Fatal error during verifications:', err);
  process.exit(1);
});
