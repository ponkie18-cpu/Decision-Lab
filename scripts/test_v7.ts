import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function testV7() {
  console.log('=== V7: UNAUTHENTICATED ACCESS TEST ===');
  
  // 1. Attempt to list moduleRuns
  console.log('Attempt 1: Listing moduleRuns collection unauthenticated...');
  try {
    const listSnap = await getDocs(collection(db, 'moduleRuns'));
    console.log('UNEXPECTED SUCCESS: Retrieved docs count:', listSnap.size);
  } catch (err: any) {
    console.log('Attempt 1 Result (List moduleRuns):', err.message || err);
  }

  // 2. Attempt to get a specific known document by ID
  const knownDocId = 'run_TUCK-2026-014_money_rules_1788717325659';
  console.log(`\nAttempt 2: Getting document moduleRuns/${knownDocId} unauthenticated...`);
  try {
    const docSnap = await getDoc(doc(db, 'moduleRuns', knownDocId));
    console.log('UNEXPECTED SUCCESS: Doc exists?', docSnap.exists());
  } catch (err: any) {
    console.log(`Attempt 2 Result (Get doc ${knownDocId}):`, err.message || err);
  }

  process.exit(0);
}

testV7();
