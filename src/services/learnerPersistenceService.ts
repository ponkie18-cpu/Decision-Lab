import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from '../firebase';
import { Decisions, RoundResults, RoundRecord } from '../types';
import { recordAuditAction } from './auditLogService';

export interface StaffDoc {
  uid: string;
  name: string;
  role: 'facilitator' | 'admin';
  email?: string;
}

export interface LearnerDoc {
  learnerCode: string;
  cohortId: string;
  consentConfirmed: boolean;
  consentConfirmedBy: string;
  consentConfirmedAt: Timestamp | any;
  createdAt: Timestamp | any;
  authUid?: string;
}

export interface FirestoreModuleRun {
  runId: string;
  learnerCode: string;
  userId: string;
  moduleId: string;
  cohortId: string;
  attemptType: 'baseline' | 'replay';
  status: 'in_progress' | 'completed' | 'abandoned';
  startedAt: Timestamp | any;
  lastUpdatedAt: Timestamp | any;
  completedAt: Timestamp | null | any;
  currentRound: number;
}

export interface FirestoreRoundRecord {
  round: number;
  decisions: Decisions | Record<string, any>;
  results: RoundResults | Record<string, any>;
  writtenAt: Timestamp | any;
}

export interface LearnerValidationResult {
  valid: boolean;
  error?: string;
  learner?: LearnerDoc;
  activeRun?: FirestoreModuleRun;
  priorRounds?: RoundRecord[];
}

/**
 * Validates that a learnerCode exists and has consentConfirmed === true.
 * Blocks any session if learner does not exist or consent is unconfirmed.
 */
export async function validateLearnerConsent(learnerCode: string): Promise<LearnerValidationResult> {
  const cleanCode = learnerCode.trim().toUpperCase();
  if (!cleanCode) {
    return { valid: false, error: 'Please enter a valid learner code.' };
  }

  try {
    if (typeof (auth as any).authStateReady === 'function') {
      await (auth as any).authStateReady();
    }
    const learnerRef = doc(db, 'learners', cleanCode);
    const learnerSnap = await getDoc(learnerRef);

    if (!learnerSnap.exists()) {
      return {
        valid: false,
        error: `Learner code "${cleanCode}" was not found. Please verify with your facilitator.`,
      };
    }

    const data = learnerSnap.data() as LearnerDoc;

    if (!data.consentConfirmed) {
      return {
        valid: false,
        error: `This code (${cleanCode}) has not been activated by your facilitator yet. Guardian/school consent must be verified offline before access is granted.`,
      };
    }

    return {
      valid: true,
      learner: data,
    };
  } catch (err: any) {
    console.error('Error validating learner consent:', err);
    return {
      valid: false,
      error: `Connection error: ${err.message || 'Unable to verify code with Firestore.'}`,
    };
  }
}

/**
 * Fetches or resumes an active in_progress moduleRun for the learner, including subcollection rounds.
 */
export async function getActiveRun(
  learnerCode: string,
  targetModuleId: string
): Promise<{ run: FirestoreModuleRun | null; rounds: RoundRecord[] }> {
  try {
    const runsRef = collection(db, 'moduleRuns');
    const q = query(
      runsRef,
      where('learnerCode', '==', learnerCode),
      where('moduleId', '==', targetModuleId),
      where('status', '==', 'in_progress')
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { run: null, rounds: [] };
    }

    // Take the most recent active run
    const docSnap = querySnapshot.docs[0];
    const runData = docSnap.data() as FirestoreModuleRun;
    runData.runId = docSnap.id;

    // Load subcollection rounds
    const roundsRef = collection(db, 'moduleRuns', docSnap.id, 'rounds');
    const roundsSnap = await getDocs(roundsRef);
    const rounds: RoundRecord[] = [];
    roundsSnap.forEach((rDoc) => {
      const rData = rDoc.data();
      rounds.push({
        round: rData.round,
        decisions: rData.decisions,
        results: rData.results,
      });
    });

    rounds.sort((a, b) => a.round - b.round);
    return { run: runData, rounds };
  } catch (err) {
    console.error('Error fetching active run:', err);
    return { run: null, rounds: [] };
  }
}

/**
 * Initializes a new moduleRun document.
 * Strictly gated: will throw if learner consent is not confirmed.
 */
export async function startModuleRun(
  learnerCode: string,
  cohortId: string,
  moduleId: string,
  attemptType: 'baseline' | 'replay' = 'baseline'
): Promise<FirestoreModuleRun> {
  const cleanCode = learnerCode.trim().toUpperCase();
  // Gate check
  const consentCheck = await validateLearnerConsent(cleanCode);
  if (!consentCheck.valid || !consentCheck.learner) {
    throw new Error(consentCheck.error || 'Consent not confirmed.');
  }

  const runId = `run_${cleanCode}_${moduleId}_${Date.now()}`;
  const runRef = doc(db, 'moduleRuns', runId);

  const newRun: Omit<FirestoreModuleRun, 'startedAt' | 'lastUpdatedAt'> & {
    startedAt: any;
    lastUpdatedAt: any;
  } = {
    runId,
    learnerCode: cleanCode,
    userId: cleanCode,
    moduleId,
    cohortId: cohortId || consentCheck.learner.cohortId,
    attemptType,
    status: 'in_progress',
    startedAt: serverTimestamp(),
    lastUpdatedAt: serverTimestamp(),
    completedAt: null,
    currentRound: 1,
  };

  await setDoc(runRef, newRun);

  // Record audit log entry for run start
  recordAuditAction({
    learnerCode: cleanCode,
    cohortId: cohortId || consentCheck.learner.cohortId,
    moduleId,
    roundNumber: 1,
    actionType: 'run_started',
    customSummary: `Started simulation attempt (${attemptType})`
  }).catch(() => {});

  return {
    ...newRun,
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
  };
}

/**
 * Saves a single round record directly to Firestore subcollection:
 * moduleRuns/{runId}/rounds/{roundNumber}
 * and updates parent moduleRuns/{runId}.lastUpdatedAt and currentRound.
 */
export async function saveRoundRecord(
  runId: string,
  roundNumber: number,
  decisions: Decisions | Record<string, any>,
  results: RoundResults | Record<string, any>,
  nextRoundNumber: number
): Promise<void> {
  const roundRef = doc(db, 'moduleRuns', runId, 'rounds', String(roundNumber));
  await setDoc(roundRef, {
    round: roundNumber,
    decisions: JSON.parse(JSON.stringify(decisions)),
    results: JSON.parse(JSON.stringify(results)),
    writtenAt: serverTimestamp(),
  });

  const runRef = doc(db, 'moduleRuns', runId);
  await updateDoc(runRef, {
    currentRound: nextRoundNumber,
    lastUpdatedAt: serverTimestamp(),
  });

  // Record audit log for decision activity
  let learnerCode = 'ANON';
  let moduleId = 'money_rules';
  const parts = runId.split('_');
  if (parts.length >= 3) {
    learnerCode = parts[1];
    moduleId = parts[2];
  }

  recordAuditAction({
    learnerCode,
    cohortId: 'school-pilot-2026-tuckshop',
    moduleId,
    roundNumber,
    actionType: 'decision_submitted',
    decisions,
    results
  }).catch(() => {});
}

/**
 * Marks a moduleRun as completed
 */
export async function completeModuleRun(runId: string): Promise<void> {
  const runRef = doc(db, 'moduleRuns', runId);
  await updateDoc(runRef, {
    status: 'completed',
    completedAt: serverTimestamp(),
    lastUpdatedAt: serverTimestamp(),
  });

  let learnerCode = 'ANON';
  let moduleId = 'money_rules';
  const parts = runId.split('_');
  if (parts.length >= 3) {
    learnerCode = parts[1];
    moduleId = parts[2];
  }

  recordAuditAction({
    learnerCode,
    cohortId: 'school-pilot-2026-tuckshop',
    moduleId,
    roundNumber: 5,
    actionType: 'run_completed',
    customSummary: 'Completed simulation module'
  }).catch(() => {});
}

/**
 * Facilitator helper to seed / register a new anonymous learner code with offline consent.
 * Strictly stores NO minor PII (only learnerCode, cohortId, consentConfirmed, consentConfirmedBy).
 */
export async function seedLearnerCode(
  learnerCode: string,
  cohortId: string,
  consentConfirmed: boolean,
  facilitatorId: string
): Promise<void> {
  const cleanCode = learnerCode.trim().toUpperCase();
  const docRef = doc(db, 'learners', cleanCode);
  await setDoc(docRef, {
    learnerCode: cleanCode,
    cohortId,
    consentConfirmed,
    consentConfirmedBy: facilitatorId,
    consentConfirmedAt: consentConfirmed ? serverTimestamp() : null,
    createdAt: serverTimestamp(),
  });
}

/**
 * Binds a learner session using Firebase Anonymous Auth and writes request.auth.uid to learners/{learnerCode}.authUid.
 * Strictly respects rule-enforced ownership: only the bound session or staff can read/write data.
 */
export async function bindLearnerSession(learnerCode: string): Promise<LearnerValidationResult> {
  const cleanCode = learnerCode.trim().toUpperCase();
  if (!cleanCode) {
    return { valid: false, error: 'Please enter a valid learner code.' };
  }

  try {
    if (typeof (auth as any).authStateReady === 'function') {
      await (auth as any).authStateReady();
    }
    // 1. Ensure user is signed in anonymously with Firebase Auth
    let currentUser = auth.currentUser;
    if (!currentUser) {
      const cred = await signInAnonymously(auth);
      currentUser = cred.user;
    }

    // 2. Bind authUid onto learners/{cleanCode} (allowed by rules only for bound authUid or staff)
    const learnerRef = doc(db, 'learners', cleanCode);
    await updateDoc(learnerRef, {
      authUid: currentUser.uid,
    });

    // 3. Read back verified document
    const learnerSnap = await getDoc(learnerRef);
    if (!learnerSnap.exists()) {
      return {
        valid: false,
        error: `Learner code "${cleanCode}" was not found. Please verify with your facilitator.`,
      };
    }

    const data = learnerSnap.data() as LearnerDoc;
    if (!data.consentConfirmed) {
      return {
        valid: false,
        error: `This code (${cleanCode}) has not been activated by your facilitator yet. Guardian/school consent must be verified offline before access is granted.`,
      };
    }

    return {
      valid: true,
      learner: data,
    };
  } catch (err: any) {
    console.error('Error binding learner session:', err);
    if (err.code === 'auth/admin-restricted-operation' || err.message?.includes('admin-restricted-operation')) {
      return {
        valid: false,
        error: 'Firebase Anonymous Authentication is disabled in your Firebase project. Please enable "Anonymous" provider in Firebase Console under Authentication > Sign-in method.',
      };
    }
    return {
      valid: false,
      error: `Access error: ${err.message || 'Unable to bind session.'}`,
    };
  }
}

/**
 * Checks if a Firebase Auth UID is registered as staff (facilitator or admin)
 */
/**
 * Facilitator override: resets/unbinds the authUid lock from a learner document.
 * Enables a learner who cleared browser data or switched tablets/devices to re-bind and resume.
 */
export async function resetLearnerDeviceBinding(learnerCode: string): Promise<void> {
  const cleanCode = learnerCode.trim().toUpperCase();
  const learnerRef = doc(db, 'learners', cleanCode);
  await updateDoc(learnerRef, {
    authUid: null,
  });
}

export async function checkStaffRole(uid: string): Promise<StaffDoc | null> {
  try {
    const staffRef = doc(db, 'staff', uid);
    const snap = await getDoc(staffRef);
    if (snap.exists()) {
      return { uid: snap.id, ...(snap.data() as Omit<StaffDoc, 'uid'>) };
    }
    return null;
  } catch (err) {
    console.error('Error checking staff role:', err);
    return null;
  }
}

/**
 * Seeds a staff document into staff/{uid}
 */
export async function seedStaffUser(
  uid: string,
  name: string,
  role: 'facilitator' | 'admin',
  email?: string
): Promise<void> {
  const staffRef = doc(db, 'staff', uid);
  await setDoc(staffRef, {
    name,
    role,
    email: email || '',
    createdAt: serverTimestamp(),
  });
}

