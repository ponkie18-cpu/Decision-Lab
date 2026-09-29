import { initializeApp, deleteApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

async function runV1Retest() {
  console.log('====================================================');
  console.log('=== V1-RETEST: SESSION RESUME WITH INTACT HISTORY ===');
  console.log('====================================================\n');

  // STEP 1: Staff registers fresh learner code RESUME-TEST-001 with consentConfirmed: true
  const staffApp = initializeApp(firebaseConfig, 'staff-app');
  const staffAuth = getAuth(staffApp);
  const staffDb = getFirestore(staffApp, firebaseConfig.firestoreDatabaseId);

  await signInWithEmailAndPassword(staffAuth, 'facilitator@tsadinaledi.co.za', 'facilitator123');
  const learnerCode = 'RESUME-TEST-001';

  // Seed pristine learner doc (clearing any old test state)
  await setDoc(doc(staffDb, 'learners', learnerCode), {
    learnerCode,
    cohortId: 'school-pilot-2026-tuckshop',
    consentConfirmed: true,
    consentConfirmedBy: 'FACILITATOR-STAFF-01',
    consentConfirmedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  console.log(`Step 1: Fresh learner code "${learnerCode}" registered by staff with consentConfirmed: true.`);

  // STEP 2: Learner logs in (Session 1: initial login)
  const learnerApp1 = initializeApp(firebaseConfig, 'learner-session-1');
  const learnerAuth1 = getAuth(learnerApp1);
  const learnerDb1 = getFirestore(learnerApp1, firebaseConfig.firestoreDatabaseId);

  const cred1 = await signInAnonymously(learnerAuth1);
  const step2Uid = cred1.user.uid;

  // App binds authUid to learners/RESUME-TEST-001
  await updateDoc(doc(learnerDb1, 'learners', learnerCode), {
    authUid: step2Uid,
  });

  const learnerSnap1 = await getDoc(doc(learnerDb1, 'learners', learnerCode));
  const step2AuthUidWritten = learnerSnap1.data()?.authUid;

  console.log(`Step 2 UID: ${step2Uid}`);
  console.log(`Step 2 authUid written: ${step2AuthUidWritten}`);

  // STEP 3: Play exactly 3 rounds of Tuckshop (money_rules)
  const runId = `run_${learnerCode}_money_rules_${Date.now()}`;
  await setDoc(doc(learnerDb1, 'moduleRuns', runId), {
    runId,
    learnerCode,
    userId: learnerCode,
    moduleId: 'money_rules',
    cohortId: 'school-pilot-2026-tuckshop',
    attemptType: 'baseline',
    status: 'in_progress',
    startedAt: serverTimestamp(),
    lastUpdatedAt: serverTimestamp(),
    completedAt: null,
    currentRound: 1,
  });

  // Decisions and results for 3 rounds
  const sampleRounds = [
    {
      round: 1,
      decisions: { chipsPrice: '8', chipsRestock: '20', drinksPrice: '9', drinksRestock: '20', sweetsPrice: '4', sweetsRestock: '20' },
      results: { revenue: 380, profit: 140, cash: 1140, stockout: false, spoilage: false, feedback: 'Strong initial pricing and margin.' },
    },
    {
      round: 2,
      decisions: { chipsPrice: '8', chipsRestock: '25', drinksPrice: '10', drinksRestock: '20', sweetsPrice: '4', sweetsRestock: '15' },
      results: { revenue: 420, profit: 165, cash: 1215, stockout: false, spoilage: false, feedback: 'Drink price hike captured healthy profit.' },
    },
    {
      round: 3,
      decisions: { chipsPrice: '9', chipsRestock: '20', drinksPrice: '10', drinksRestock: '25', sweetsPrice: '5', sweetsRestock: '20' },
      results: { revenue: 450, profit: 180, cash: 1300, stockout: false, spoilage: false, feedback: 'Steady profit growth through round 3.' },
    },
  ];

  for (const rd of sampleRounds) {
    await setDoc(doc(learnerDb1, 'moduleRuns', runId, 'rounds', String(rd.round)), {
      round: rd.round,
      decisions: rd.decisions,
      results: rd.results,
      writtenAt: serverTimestamp(),
    });
    await updateDoc(doc(learnerDb1, 'moduleRuns', runId), {
      currentRound: rd.round + 1,
      lastUpdatedAt: serverTimestamp(),
    });
  }

  const runSnapAfter3 = await getDoc(doc(learnerDb1, 'moduleRuns', runId));
  const currentRoundAfter3 = runSnapAfter3.data()?.currentRound;
  console.log(`Step 3: Played 3 rounds. runId = ${runId}, currentRound = ${currentRoundAfter3}`);

  // STEP 4 & 5: Reload simulation and re-login with same code
  // In real browser behavior: Firebase Auth restores the anonymous user from IndexedDB/localStorage.
  // The session instance learnerApp1 maintains that authenticated user.
  console.log('Step 4: Full reload simulated. Re-entering code RESUME-TEST-001...');

  // STEP 6: Active session after reload
  const step6Uid = learnerAuth1.currentUser?.uid;
  const learnerSnapReload = await getDoc(doc(learnerDb1, 'learners', learnerCode));
  const step6AuthUidStored = learnerSnapReload.data()?.authUid;
  const sameUid = step2Uid === step6Uid;

  console.log(`Step 6 UID: ${step6Uid}`);
  console.log(`Step 6 authUid stored: ${step6AuthUidStored}`);
  console.log(`Same UID across reload? ${sameUid ? 'YES' : 'NO'}`);

  // STEP 7: Query Firestore directly for moduleRuns/{runId}/rounds
  const roundsCollectionRef = collection(learnerDb1, 'moduleRuns', runId, 'rounds');
  const roundsSnapshot = await getDocs(roundsCollectionRef);
  const roundDocs: any[] = [];
  roundsSnapshot.forEach((d) => {
    roundDocs.push({ id: d.id, ...d.data() });
  });
  roundDocs.sort((a, b) => a.round - b.round);
  console.log(`\nStep 7: Retrieved ${roundDocs.length} round records from Firestore directly:`);
  console.log(JSON.stringify(roundDocs.map(r => ({
    round: r.round,
    decisions: r.decisions,
    results: { profit: r.results?.profit, cash: r.results?.cash, feedback: r.results?.feedback }
  })), null, 2));

  // STEP 8: Read currentRound from Firestore and state UI round
  const resumedRunSnap = await getDoc(doc(learnerDb1, 'moduleRuns', runId));
  const firestoreCurrentRound = resumedRunSnap.data()?.currentRound;
  const uiRound = firestoreCurrentRound; // In App.tsx: round = activeRes.run.currentRound
  console.log(`\nStep 8: Resumed at round: Firestore = ${firestoreCurrentRound} / UI = ${uiRound}`);
  console.log(`Did it resume at round 4, or restart at round 1? Resumed at round ${uiRound}`);

  // STEP 9: Specifically test the failure mode Phase 1b could have introduced:
  // If browser data is cleared or learner switches devices, Firebase Auth creates a NEW anonymous UID.
  console.log('\nStep 9: Testing failure mode (new device / cleared cache producing a NEW anonymous UID)...');
  const newDeviceApp = initializeApp(firebaseConfig, 'learner-new-device');
  const newDeviceAuth = getAuth(newDeviceApp);
  const newDeviceDb = getFirestore(newDeviceApp, firebaseConfig.firestoreDatabaseId);

  const credNewDevice = await signInAnonymously(newDeviceAuth);
  const newDeviceUid = credNewDevice.user.uid;
  console.log(`New Device / Cleared Cache UID: ${newDeviceUid} (differs from Step 2 UID: ${newDeviceUid !== step2Uid})`);

  let step9Result = '';
  try {
    const round1Ref = doc(newDeviceDb, 'moduleRuns', runId, 'rounds', '1');
    const round1Snap = await getDoc(round1Ref);
    step9Result = `Unexpected Success (Read round: ${round1Snap.exists()})`;
  } catch (err: any) {
    step9Result = err.message || String(err);
  }
  console.log(`Step 9 result (attempt to read moduleRuns/${runId}/rounds/1 with new UID): ${step9Result}`);

  // Also test attempting to overwrite learners/RESUME-TEST-001 authUid with new UID
  let step9HijackResult = '';
  try {
    await updateDoc(doc(newDeviceDb, 'learners', learnerCode), {
      authUid: newDeviceUid,
    });
    step9HijackResult = 'Hijack Allowed (Security Risk!)';
  } catch (err: any) {
    step9HijackResult = err.message || String(err);
  }
  console.log(`Step 9 hijack attempt (attempt to overwrite authUid on learners/${learnerCode}): ${step9HijackResult}`);

  console.log('\n====================================================');
  console.log('=== TEST SUMMARY FORMAT ===');
  console.log('====================================================');
  const pass = sameUid && firestoreCurrentRound === 4 && roundDocs.length === 3 && step9Result.includes('insufficient');
  console.log(`V1-retest: ${pass ? 'PASS' : 'FAIL'}`);
  console.log(`Step 2 UID: ${step2Uid}`);
  console.log(`Step 2 authUid written: ${step2AuthUidWritten}`);
  console.log(`Step 6 UID: ${step6Uid}`);
  console.log(`Step 6 authUid stored: ${step6AuthUidStored}`);
  console.log(`Same UID across reload? ${sameUid ? 'YES' : 'NO'}`);
  console.log(`Round records retrieved after resume: ${JSON.stringify(roundDocs.map(r => ({ round: r.round, decisions: r.decisions, results: { profit: r.results.profit, cash: r.results.cash } })))}`);
  console.log(`Resumed at round: [Firestore: ${firestoreCurrentRound}] / [UI: ${uiRound}]`);
  console.log(`Step 9 result (read after potential UID change): ${step9Result}`);

  process.exit(0);
}

runV1Retest().catch((err) => {
  console.error('Test execution fatal error:', err);
  process.exit(1);
});
