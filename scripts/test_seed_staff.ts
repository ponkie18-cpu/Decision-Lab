import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const auth = getAuth(app);

async function seed() {
  const cred = await signInWithEmailAndPassword(auth, 'facilitator@dinaledi360.co.za', 'Dinaledi2026!Secure');
  console.log('Signed in as:', cred.user.uid);
  try {
    await setDoc(doc(db, 'staff', cred.user.uid), {
      name: 'Lorrine Botha (Lead Facilitator)',
      role: 'facilitator',
      email: 'facilitator@dinaledi360.co.za'
    });
    console.log('Successfully seeded staff doc!');
  } catch (err: any) {
    console.error('Seed staff error:', err.message);
  }
  process.exit(0);
}

seed();
