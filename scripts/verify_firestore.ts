import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  query, 
  where,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function main() {
  console.log('--- Connecting to Firestore ---');
  console.log('Project ID:', firebaseConfig.projectId);
  console.log('Database ID:', firebaseConfig.firestoreDatabaseId);

  // Check connection
  try {
    const testDoc = await getDoc(doc(db, 'learners', 'TUCK-2026-014'));
    console.log('TUCK-2026-014 exists?', testDoc.exists());
    if (testDoc.exists()) {
      console.log('TUCK-2026-014 data:', testDoc.data());
    }
  } catch (e: any) {
    console.error('Error fetching TUCK-2026-014:', e);
  }
}

main().catch(console.error);
