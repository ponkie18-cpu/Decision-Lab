import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const auth = getAuth(app);

async function seedSecondFacilitator() {
  try {
    let cred;
    try {
      cred = await createUserWithEmailAndPassword(auth, 'facilitator@tsadinaledi.co.za', 'facilitator123');
      console.log('Created user facilitator@tsadinaledi.co.za! UID:', cred.user.uid);
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        cred = await signInWithEmailAndPassword(auth, 'facilitator@tsadinaledi.co.za', 'facilitator123');
        console.log('Signed in existing user! UID:', cred.user.uid);
      } else {
        throw e;
      }
    }

    await setDoc(doc(db, 'staff', cred.user.uid), {
      name: 'Ponkie (Lead Facilitator)',
      role: 'facilitator',
      email: 'facilitator@tsadinaledi.co.za'
    });
    console.log('Successfully seeded staff doc for facilitator@tsadinaledi.co.za!');
  } catch (err: any) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

seedSecondFacilitator();
