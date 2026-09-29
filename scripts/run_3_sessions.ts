import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signInAnonymously, signOut } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

async function main() {
  console.log('=== STARTING 3 FULL SESSIONS END-TO-END ===');

  // Step 1: Staff seeds the 3 learner codes
  const staffApp = initializeApp(firebaseConfig, 'staff-app');
  const staffAuth = getAuth(staffApp);
  const staffDb = getFirestore(staffApp, firebaseConfig.firestoreDatabaseId);

  const staffCred = await signInWithEmailAndPassword(staffAuth, 'facilitator@tsadinaledi.co.za', 'facilitator123');
  console.log('Staff signed in:', staffCred.user.uid);

  const codes = [
    { code: 'EVENT-2026-005', cohort: 'school-pilot-2026-tuckshop' },
    { code: 'NOMSA-2026-008', cohort: 'school-pilot-2026-tuckshop' },
    { code: 'GAME-2026-012', cohort: 'school-pilot-2026-tuckshop' },
  ];

  for (const item of codes) {
    await setDoc(doc(staffDb, 'learners', item.code), {
      learnerCode: item.code,
      cohortId: item.cohort,
      consentConfirmed: true,
      consentConfirmedBy: 'FACILITATOR-STAFF-01',
      consentConfirmedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    console.log(`Staff registered learner code: ${item.code}`);
  }
  await signOut(staffAuth);
  await deleteApp(staffApp);

  // Helper to run a learner session using a dedicated isolated app/auth instance
  async function runLearnerSession(learnerCode: string, sessionIndex: number) {
    console.log(`\n--- Launching Session ${sessionIndex}: Learner ${learnerCode} ---`);
    const learnerApp = initializeApp(firebaseConfig, `learner-app-${sessionIndex}`);
    const learnerAuth = getAuth(learnerApp);
    const learnerDb = getFirestore(learnerApp, firebaseConfig.firestoreDatabaseId);

    // 1. Fresh anonymous auth
    const anonCred = await signInAnonymously(learnerAuth);
    const authUid = anonCred.user.uid;
    console.log(`[${learnerCode}] Anonymous Auth UID: ${authUid}`);

    // 2. Bind authUid onto learner record
    await updateDoc(doc(learnerDb, 'learners', learnerCode), {
      authUid: authUid,
    });
    console.log(`[${learnerCode}] Successfully bound authUid to learner record`);

    // 3. Initialize module run
    const runId = `run_${learnerCode}_money_rules_${Date.now()}`;
    await setDoc(doc(learnerDb, 'moduleRuns', runId), {
      runId: runId,
      learnerCode: learnerCode,
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
    console.log(`[${learnerCode}] Created moduleRun: ${runId}`);

    // 4. Play 3 rounds
    for (let r = 1; r <= 3; r++) {
      const roundDocRef = doc(learnerDb, 'moduleRuns', runId, 'rounds', String(r));
      await setDoc(roundDocRef, {
        round: r,
        decisions: {
          chipsPrice: String(7 + r),
          chipsRestock: '15',
          drinksPrice: String(9 + r),
          drinksRestock: '12',
          sweetsPrice: '4',
          sweetsRestock: '20',
        },
        results: {
          revenue: 350 + r * 50,
          profit: 140 + r * 20,
          cash: 1200 + r * 150,
          stockout: false,
          spoilage: false,
          feedback: `Round ${r} completed successfully with healthy profit.`,
        },
        writtenAt: serverTimestamp(),
      });

      await updateDoc(doc(learnerDb, 'moduleRuns', runId), {
        currentRound: r + 1,
        lastUpdatedAt: serverTimestamp(),
      });
      console.log(`[${learnerCode}] Completed & saved Round ${r}`);
    }

    await signOut(learnerAuth);
    await deleteApp(learnerApp);
    return runId;
  }

  const run1 = await runLearnerSession('EVENT-2026-005', 1);
  const run2 = await runLearnerSession('NOMSA-2026-008', 2);
  const run3 = await runLearnerSession('GAME-2026-012', 3);

  console.log('\n=== ALL 3 SESSIONS FINISHED SUCCESSFULLY ===');
  console.log('Run 1 ID:', run1);
  console.log('Run 2 ID:', run2);
  console.log('Run 3 ID:', run3);

  process.exit(0);
}

main().catch((err) => {
  console.error('Session execution error:', err);
  process.exit(1);
});
