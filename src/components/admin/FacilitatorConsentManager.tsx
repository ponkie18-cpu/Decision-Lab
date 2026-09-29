import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, CheckCircle, AlertCircle, RefreshCw, LogIn, LogOut, UserCheck } from 'lucide-react';
import { seedLearnerCode, checkStaffRole, resetLearnerDeviceBinding, StaffDoc } from '../../services/learnerPersistenceService';
import { auth } from '../../firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';

export const FacilitatorConsentManager: React.FC = () => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(auth.currentUser);
  const [staffProfile, setStaffProfile] = useState<StaffDoc | null>(null);
  const [learnerCode, setLearnerCode] = useState('');
  const [cohortId, setCohortId] = useState('school-pilot-2026-tuckshop');
  const [facilitatorId, setFacilitatorId] = useState('FACILITATOR-STAFF-01');
  const [consentConfirmed, setConsentConfirmed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const staff = await checkStaffRole(user.uid);
        setStaffProfile(staff);
      } else {
        setStaffProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setStatus(null);
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const staff = await checkStaffRole(res.user.uid);
      setStaffProfile(staff);
      setStatus({
        type: 'success',
        message: `Signed in as ${res.user.email || res.user.displayName}. UID: ${res.user.uid}`,
      });
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: `Sign-in failed: ${err.message || String(err)}`,
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setFirebaseUser(null);
      setStaffProfile(null);
      setStatus({ type: 'success', message: 'Signed out of Firebase Auth.' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    }
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    const cleanCode = learnerCode.trim().toUpperCase();
    if (!cleanCode) {
      setStatus({ type: 'error', message: 'Learner Code cannot be empty.' });
      return;
    }

    setLoading(true);
    try {
      await seedLearnerCode(cleanCode, cohortId, consentConfirmed, facilitatorId);
      setStatus({
        type: 'success',
        message: `Learner Code "${cleanCode}" successfully registered in Firestore. Consent Confirmed: ${consentConfirmed ? 'YES' : 'NO'}.`,
      });
      setLearnerCode('');
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: `Failed to write to Firestore: ${err.message || String(err)}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetDeviceBinding = async () => {
    const cleanCode = learnerCode.trim().toUpperCase();
    if (!cleanCode) {
      setStatus({ type: 'error', message: 'Enter a Learner Code to reset its device/session lock.' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      await resetLearnerDeviceBinding(cleanCode);
      setStatus({
        type: 'success',
        message: `Device lock for code "${cleanCode}" successfully cleared! The learner can now log in on a new device or cleared browser.`,
      });
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: `Failed to reset device binding: ${err.message || String(err)}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const seedBatchSamples = async () => {
    setLoading(true);
    setStatus(null);
    try {
      // Seed 2 active codes and 1 unconfirmed code for testing/verification
      await seedLearnerCode('TUCK-2026-014', 'school-pilot-2026-tuckshop', true, 'FACILITATOR-STAFF-01');
      await seedLearnerCode('EVENT-2026-005', 'school-pilot-2026-event', true, 'FACILITATOR-STAFF-01');
      await seedLearnerCode('TEST-UNCONFIRMED-999', 'school-pilot-2026-tuckshop', false, 'FACILITATOR-STAFF-01');

      setStatus({
        type: 'success',
        message: 'Pre-seeded sample codes (TUCK-2026-014 [Consent: TRUE], EVENT-2026-005 [Consent: TRUE], TEST-UNCONFIRMED-999 [Consent: FALSE]).',
      });
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: `Failed batch seed: ${err.message || String(err)}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      {/* Firebase Auth Staff Status Header */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-400 uppercase">
              FACILITATOR FIREBASE AUTHENTICATION
            </span>
          </div>
          {firebaseUser ? (
            <div className="mt-1 flex items-center gap-2 text-xs font-mono">
              <UserCheck size={16} className="text-emerald-400" />
              <span className="text-white font-bold">{firebaseUser.email || firebaseUser.displayName || firebaseUser.uid}</span>
              <span className="text-slate-400">(UID: {firebaseUser.uid.slice(0, 10)}...)</span>
              {staffProfile && (
                <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded text-[10px]">
                  Role: {staffProfile.role}
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-amber-400 mt-1">
              Not authenticated with Firebase. Facilitator actions require an authenticated staff session.
            </p>
          )}
        </div>

        <div>
          {firebaseUser ? (
            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              disabled={authLoading}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <LogIn size={13} />
              <span>Sign In as Facilitator</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
              CHILD PROTECTION & POPIA GOVERNANCE
            </span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Facilitator Anonymous Learner Code & Offline Consent Registry
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Register anonymous codes matching your physical class ledger. No minor names, emails, schools, or grades are stored in this system.
          </p>
        </div>

        <button
          onClick={seedBatchSamples}
          disabled={loading}
          className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Seed Demo Codes</span>
        </button>
      </div>

      {status && (
        <div
          className={`p-4 rounded-xl text-xs flex items-start gap-2.5 font-mono ${
            status.type === 'success'
              ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/40 border border-rose-500/30 text-rose-300'
          }`}
        >
          {status.type === 'success' ? (
            <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
          )}
          <div>{status.message}</div>
        </div>
      )}

      <form onSubmit={handleCreateCode} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
            Anonymous Learner Code *
          </label>
          <input
            type="text"
            value={learnerCode}
            onChange={(e) => setLearnerCode(e.target.value.toUpperCase())}
            placeholder="e.g. TUCK-2026-014"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
            Cohort ID *
          </label>
          <input
            type="text"
            value={cohortId}
            onChange={(e) => setCohortId(e.target.value)}
            placeholder="e.g. school-pilot-2026-tuckshop"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
            Facilitator Staff ID *
          </label>
          <input
            type="text"
            value={facilitatorId}
            onChange={(e) => setFacilitatorId(e.target.value)}
            placeholder="e.g. FACILITATOR-STAFF-01"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="space-y-1.5 flex flex-col justify-end">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="consentBox"
              checked={consentConfirmed}
              onChange={(e) => setConsentConfirmed(e.target.checked)}
              className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="consentBox" className="text-xs text-slate-300 font-medium cursor-pointer">
              Offline Consent Confirmed
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Plus size={14} />
              <span>Register Code</span>
            </button>
            <button
              type="button"
              onClick={handleResetDeviceBinding}
              disabled={loading}
              title="Clears the bound authUid from the entered learner code so they can log in on a new device or cleared browser."
              className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} />
              <span>Reset Device Lock</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
