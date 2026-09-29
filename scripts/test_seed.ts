import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  try {
    console.log('Attempting to write TUCK-2026-014...');
    await setDoc(doc(db, 'learners', 'TUCK-2026-014'), {
      learnerCode: 'TUCK-2026-014',
      cohortId: 'school-pilot-2026-tuckshop',
      consentConfirmed: true,
      registeredAt: new Date().toISOString(),
      facilitatorId: 'FACILITATOR-STAFF-01'
    });
    console.log('Successfully wrote TUCK-2026-014!');
  } catch (err: any) {
    console.error('Write error:', err.message || err);
  } finally {
    process.exit(0);
  }
}

run();
