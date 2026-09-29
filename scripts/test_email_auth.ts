import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testEmailAuth() {
  try {
    console.log('Testing createUserWithEmailAndPassword...');
    const userCredential = await createUserWithEmailAndPassword(auth, 'facilitator@dinaledi360.co.za', 'Dinaledi2026!Secure');
    console.log('Email user created! UID:', userCredential.user.uid);
  } catch (err: any) {
    console.error('Email create error:', err.code, err.message);
  }

  try {
    console.log('Testing signInWithEmailAndPassword...');
    const userCredential = await signInWithEmailAndPassword(auth, 'facilitator@dinaledi360.co.za', 'Dinaledi2026!Secure');
    console.log('Email user signed in! UID:', userCredential.user.uid);
  } catch (err: any) {
    console.error('Email signin error:', err.code, err.message);
  } finally {
    process.exit(0);
  }
}

testEmailAuth();
