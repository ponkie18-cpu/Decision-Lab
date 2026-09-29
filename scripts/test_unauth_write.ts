import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function testWrite() {
  try {
    const testId = `run_TEST_SESSION_${Date.now()}`;
    await setDoc(doc(db, 'moduleRuns', testId), {
      runId: testId,
      learnerCode: 'TUCK-2026-014',
      userId: 'TUCK-2026-014',
      moduleId: 'money_rules',
      cohortId: 'school-pilot-2026-tuckshop',
      attemptType: 'baseline',
      status: 'in_progress',
      startedAt: serverTimestamp(),
      lastUpdatedAt: serverTimestamp(),
      completedAt: null,
      currentRound: 1
    });
    console.log('Write unexpectedly succeeded!');
  } catch (err: any) {
    console.log('Expected write denial under new rules:', err.message || err);
  } finally {
    process.exit(0);
  }
}

testWrite();
