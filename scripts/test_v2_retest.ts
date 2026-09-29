import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const auth = getAuth(app);

async function checkRuns() {
  console.log('=== V2-RETEST: MODULE RUNS USERID & PERSISTENCE CHECK ===');
  try {
    // Authenticate as staff to perform audit query across all collections
    const cred = await signInWithEmailAndPassword(auth, 'facilitator@tsadinaledi.co.za', 'facilitator123');
    console.log('Staff authenticated for audit. UID:', cred.user.uid);

    const snap = await getDocs(collection(db, 'moduleRuns'));
    console.log(`Total runs checked in collection: ${snap.size}`);

    let invalidCount = 0;
    const allRuns: any[] = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const isInvalid = !data.userId || data.userId === 'anonymous' || data.userId === '';
      if (isInvalid) {
        invalidCount++;
      }
      allRuns.push({
        runId: docSnap.id,
        learnerCode: data.learnerCode,
        userId: data.userId,
        currentRound: data.currentRound,
        status: data.status,
      });
      console.log(` - runId: ${docSnap.id} | learnerCode: ${data.learnerCode} | userId: "${data.userId}" | currentRound: ${data.currentRound} | status: ${data.status}`);
    });

    console.log(`\nAudit Summary:`);
    console.log(`Total runs checked: ${snap.size}`);
    console.log(`Runs with invalid/missing/anonymous userId: ${invalidCount}`);
  } catch (err: any) {
    console.log('Access result:', err.message || err);
  } finally {
    process.exit(0);
  }
}

checkRuns();
