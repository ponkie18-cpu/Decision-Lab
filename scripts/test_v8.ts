import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const auth = getAuth(app);

async function runV8() {
  console.log('=== V8: STAFF ACCESS TEST ===');
  try {
    console.log('Step 1: Authenticating as facilitator (staff role)...');
    const cred = await signInWithEmailAndPassword(auth, 'facilitator@tsadinaledi.co.za', 'facilitator123');
    console.log('Signed in as staff UID:', cred.user.uid);

    console.log('Step 2: Listing moduleRuns across multiple learnerCodes...');
    const runsSnap = await getDocs(collection(db, 'moduleRuns'));
    console.log(`Found ${runsSnap.size} moduleRuns documents:`);
    runsSnap.forEach((d) => {
      console.log(` - Run ID: ${d.id}, learnerCode: ${d.data().learnerCode}, status: ${d.data().status}`);
    });

    console.log('Step 3: Reading learners collection / individual codes...');
    const learnersSnap = await getDocs(collection(db, 'learners'));
    console.log(`Found ${learnersSnap.size} learner documents in registry:`);
    learnersSnap.forEach((d) => {
      console.log(` - Code: ${d.id}, cohortId: ${d.data().cohortId}, consentConfirmed: ${d.data().consentConfirmed}`);
    });
  } catch (err: any) {
    console.log('Auth / Execution Failure in V8 test:', err.code, err.message);
  } finally {
    process.exit(0);
  }
}

runV8();
