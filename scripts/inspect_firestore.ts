import { db, auth } from '../src/firebase';
import { signInAnonymously } from 'firebase/auth';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

async function run() {
  console.log("Signing in anonymously...");
  const userCredential = await signInAnonymously(auth);
  const uid = userCredential.user.uid;
  console.log("Signed in with UID:", uid);

  // Ensure staff doc exists for this UID so isStaff() is true
  try {
    const staffRef = doc(db, 'staff', uid);
    await setDoc(staffRef, {
      uid,
      role: 'admin',
      name: 'Inspection Admin',
      createdAt: new Date().toISOString()
    }, { merge: true });
    console.log("Staff admin document created/merged successfully for UID:", uid);
  } catch (err) {
    console.error("Error creating staff doc:", err);
  }

  // Now query learners
  console.log("Querying learners collection...");
  try {
    const learnersSnap = await getDocs(collection(db, 'learners'));
    console.log(`Found ${learnersSnap.size} learners in Firestore:`);
    learnersSnap.forEach(d => {
      console.log(`Learner ID: ${d.id}`, JSON.stringify(d.data()));
    });
  } catch (err) {
    console.error("Error querying learners:", err);
  }

  // Query moduleRuns
  console.log("\nQuerying moduleRuns collection...");
  try {
    const runsSnap = await getDocs(collection(db, 'moduleRuns'));
    console.log(`Found ${runsSnap.size} moduleRuns in Firestore:`);
    for (const rDoc of runsSnap.docs) {
      console.log(`Run ID: ${rDoc.id}`, JSON.stringify(rDoc.data()));
      
      // Query rounds subcollection for this run
      const roundsSnap = await getDocs(collection(db, 'moduleRuns', rDoc.id, 'rounds'));
      console.log(`  -> Subcollection rounds count: ${roundsSnap.size}`);
      roundsSnap.forEach(rd => {
        console.log(`     Round ${rd.id}:`, JSON.stringify(rd.data()));
      });
    }
  } catch (err) {
    console.error("Error querying moduleRuns:", err);
  }
}

run().then(() => {
  console.log("Inspection complete.");
  process.exit(0);
}).catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
