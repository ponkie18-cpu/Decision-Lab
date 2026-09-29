import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const auth = getAuth(app);

async function runV6() {
  console.log('=== V6: LEARNER ISOLATION TEST ===');
  try {
    // Facilitator reset of TUCK-2026-014 device binding to allow test run
    const staffCred = await signInWithEmailAndPassword(auth, 'facilitator@tsadinaledi.co.za', 'facilitator123');
    await updateDoc(doc(db, 'learners', 'TUCK-2026-014'), {
      authUid: null,
    });
    await signOut(auth);

    console.log('Step 1: Authenticating anonymously as Learner TUCK-2026-014...');
    const cred = await signInAnonymously(auth);
    console.log('Signed in with UID:', cred.user.uid);

    // Bind authUid to TUCK-2026-014
    await updateDoc(doc(db, 'learners', 'TUCK-2026-014'), {
      authUid: cred.user.uid,
    });
    console.log('Successfully bound authUid to TUCK-2026-014 record');

    console.log('Step 2: Attempting to read another learner\'s document directly (e.g. EVENT-2026-005)...');
    try {
      const snap = await getDoc(doc(db, 'learners', 'EVENT-2026-005'));
      console.log('Unexpectedly read data:', snap.data());
    } catch (err: any) {
      console.log('Step 2 Result (Direct read of other learner doc):', err.message || err);
    }

    console.log('Step 3: Attempting to read another learner\'s moduleRuns document directly by ID (run_EVENT-2026-005_money_rules_1788758897371)...');
    try {
      const runSnap = await getDoc(doc(db, 'moduleRuns', 'run_EVENT-2026-005_money_rules_1788758897371'));
      console.log('Unexpectedly read run data:', runSnap.data());
    } catch (err: any) {
      console.log('Step 3 Result (Direct read of other learner moduleRun):', err.message || err);
    }
  } catch (err: any) {
    console.log('Auth Failure in V6 test:', err.code, err.message);
  } finally {
    process.exit(0);
  }
}

runV6();
