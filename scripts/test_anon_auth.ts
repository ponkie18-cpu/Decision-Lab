import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testAnon() {
  try {
    console.log('Testing signInAnonymously...');
    const userCredential = await signInAnonymously(auth);
    console.log('Successfully signed in anonymously! UID:', userCredential.user.uid);
  } catch (err: any) {
    console.error('Anonymous auth error:', err.message || err);
  } finally {
    process.exit(0);
  }
}

testAnon();
