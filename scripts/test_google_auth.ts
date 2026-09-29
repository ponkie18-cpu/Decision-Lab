import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testGoogleToken() {
  try {
    const res = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', {
      headers: { 'Metadata-Flavor': 'Google' }
    });
    const data: any = await res.json();
    console.log('Got GCP token, attempting signInWithCredential...');
    
    const credential = GoogleAuthProvider.credential(null, data.access_token);
    const userCredential = await signInWithCredential(auth, credential);
    console.log('SUCCESS! Signed in as:', userCredential.user.email || userCredential.user.uid);
  } catch (err: any) {
    console.error('Google token auth error:', err.code, err.message);
  } finally {
    process.exit(0);
  }
}

testGoogleToken();
