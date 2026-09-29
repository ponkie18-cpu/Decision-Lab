/**
 * Audit Log Service
 * Fetches and subscribes to real-time learner decision activity across all modules in Firestore.
 */

import { db, auth } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  Unsubscribe
} from 'firebase/firestore';
import { AuditLogEntry } from '../types/admin';
import { detectBehavioralTags } from './behavioralPatterns';
import { ModuleType, RoundRecord } from '../types';

export const MODULE_NAMES: Record<string, string> = {
  money_rules: 'Tuckshop Math (Module 1)',
  nomsa_spaza: 'Spaza Compliance (Module 2)',
  event_disaster: 'School Event Planner (Module 3)',
  game_rounds: 'Strategy Arena (Module 4)'
};

/**
 * Generates a human-readable summary of decisions based on module type
 */
export function formatDecisionSummary(moduleId: string, decisions: Record<string, any>): string {
  if (!decisions || Object.keys(decisions).length === 0) return 'No decisions recorded';

  if (moduleId === 'money_rules') {
    const parts: string[] = [];
    if (decisions.chipsPrice || decisions.chipsRestock) {
      parts.push(`Chips: R${decisions.chipsPrice || '0'} (Stock: +${decisions.chipsRestock || '0'})`);
    }
    if (decisions.drinksPrice || decisions.drinksRestock) {
      parts.push(`Drinks: R${decisions.drinksPrice || '0'} (Stock: +${decisions.drinksRestock || '0'})`);
    }
    if (decisions.sweetsPrice || decisions.sweetsRestock) {
      parts.push(`Sweets: R${decisions.sweetsPrice || '0'} (Stock: +${decisions.sweetsRestock || '0'})`);
    }
    return parts.join(' | ') || 'Price and inventory decisions submitted';
  }

  if (moduleId === 'event_disaster') {
    const parts: string[] = [];
    if (decisions.venue) parts.push(`Venue: ${decisions.venue}`);
    if (decisions.entertainment) parts.push(`Music: ${decisions.entertainment}`);
    if (decisions.food) parts.push(`Food: ${decisions.food}`);
    if (decisions.safety) parts.push(`Safety: ${decisions.safety}`);
    if (decisions.backup && decisions.backup !== 'None') parts.push(`Backup: ${decisions.backup}`);
    return parts.join(' | ') || 'Event operational setup submitted';
  }

  if (moduleId === 'nomsa_spaza') {
    const parts: string[] = [];
    if (decisions.supplier) parts.push(`Supplier: ${decisions.supplier}`);
    if (decisions.complianceAction) parts.push(`Action: ${decisions.complianceAction}`);
    return parts.join(' | ') || 'Compliance decisions submitted';
  }

  return Object.entries(decisions)
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${v}`)
    .join(' | ');
}

/**
 * Generates a human-readable summary of round results
 */
export function formatResultSummary(moduleId: string, results: Record<string, any>): string {
  if (!results || Object.keys(results).length === 0) return 'Pending evaluation';

  const parts: string[] = [];
  if (results.revenue !== undefined) parts.push(`Rev: R${results.revenue}`);
  if (results.profit !== undefined) parts.push(`Profit: ${results.profit >= 0 ? '+' : ''}R${results.profit}`);
  if (results.cash !== undefined) parts.push(`Cash: R${results.cash}`);
  if (results.endingCash !== undefined) parts.push(`Ending Cash: R${results.endingCash}`);
  if (results.reputation !== undefined) parts.push(`Rep: ${results.reputation}%`);

  if (results.stockout) parts.push(`⚠️ Stockout`);
  if (results.spoilage) parts.push(`⚠️ Spoilage`);
  if (results.cashStatus === 'Critical') parts.push(`🚨 Cash Critical`);

  return parts.join(' | ') || results.feedback || 'Round evaluated';
}

/**
 * Determine severity indicator for visual audit badge
 */
export function determineSeverity(results: Record<string, any>): 'normal' | 'warning' | 'critical' | 'success' {
  if (!results) return 'normal';
  if (results.cashStatus === 'Critical' || results.constraintViolation) return 'critical';
  if (results.stockout || results.spoilage || (results.profit !== undefined && results.profit < 0)) return 'warning';
  if (results.profit !== undefined && results.profit > 100) return 'success';
  if (results.reputation !== undefined && results.reputation >= 80) return 'success';
  return 'normal';
}

/**
 * Writes an action entry to Firestore auditLogs collection
 */
export async function recordAuditAction(params: {
  learnerCode: string;
  cohortId: string;
  moduleId: string;
  roundNumber: number;
  actionType: 'decision_submitted' | 'run_started' | 'run_completed';
  decisions?: Record<string, any>;
  results?: Record<string, any>;
  customSummary?: string;
}): Promise<void> {
  try {
    const timestampMs = Date.now();
    const logId = `audit_${params.learnerCode}_${params.moduleId}_${params.roundNumber}_${timestampMs}`;
    const logRef = doc(db, 'auditLogs', logId);

    const decisions = params.decisions || {};
    const results = params.results || {};

    // Detect tags if round results and decisions exist
    let behavioralTags: string[] = [];
    if (params.roundNumber > 0) {
      const mockRoundRecord: RoundRecord = {
        round: params.roundNumber,
        decisions: decisions as any,
        results: results as any
      };
      behavioralTags = detectBehavioralTags(params.moduleId as ModuleType, [mockRoundRecord]);
    }

    const entry: AuditLogEntry = {
      id: logId,
      timestamp: new Date(timestampMs).toISOString(),
      createdAtMs: timestampMs,
      learnerCode: params.learnerCode.toUpperCase(),
      cohortId: params.cohortId || 'school-pilot-2026-tuckshop',
      moduleId: params.moduleId,
      moduleName: MODULE_NAMES[params.moduleId] || params.moduleId,
      roundNumber: params.roundNumber,
      actionType: params.actionType,
      decisionSummary: params.customSummary || formatDecisionSummary(params.moduleId, decisions),
      resultSummary: formatResultSummary(params.moduleId, results),
      decisions,
      results,
      behavioralTags,
      severity: determineSeverity(results)
    };

    await setDoc(logRef, {
      ...entry,
      writtenAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('Could not write audit log entry:', err);
  }
}

/**
 * Subscribes to real-time updates for the last 20 actions from Firestore auditLogs
 */
export function subscribeToRecentAuditLogs(
  onUpdate: (logs: AuditLogEntry[]) => void,
  onError?: (error: any) => void,
  limitCount: number = 20
): Unsubscribe {
  const auditLogsRef = collection(db, 'auditLogs');
  const q = query(auditLogsRef, orderBy('createdAtMs', 'desc'), limit(limitCount));

  return onSnapshot(
    q,
    (snapshot) => {
      const logs: AuditLogEntry[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        logs.push({
          id: docSnap.id,
          timestamp: d.timestamp || new Date().toISOString(),
          createdAtMs: d.createdAtMs || Date.now(),
          learnerCode: d.learnerCode || 'ANON',
          cohortId: d.cohortId || '',
          moduleId: d.moduleId || 'money_rules',
          moduleName: d.moduleName || MODULE_NAMES[d.moduleId] || d.moduleId,
          roundNumber: d.roundNumber || 1,
          actionType: d.actionType || 'decision_submitted',
          decisionSummary: d.decisionSummary || '',
          resultSummary: d.resultSummary || '',
          decisions: d.decisions || {},
          results: d.results || {},
          behavioralTags: Array.isArray(d.behavioralTags) ? d.behavioralTags : [],
          severity: d.severity || 'normal'
        });
      });
      onUpdate(logs);
    },
    (err) => {
      console.error('Audit log real-time subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Fetches recent audit logs from Firestore.
 * If auditLogs collection has fewer than 20 entries, it backfills from existing moduleRuns/rounds.
 */
export async function fetchRecentAuditLogs(limitCount: number = 20): Promise<AuditLogEntry[]> {
  const auditLogsRef = collection(db, 'auditLogs');
  const q = query(auditLogsRef, orderBy('createdAtMs', 'desc'), limit(limitCount));

  try {
    const snap = await getDocs(q);
    const existingLogs: AuditLogEntry[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      existingLogs.push({
        id: docSnap.id,
        timestamp: d.timestamp || new Date().toISOString(),
        createdAtMs: d.createdAtMs || Date.now(),
        learnerCode: d.learnerCode || 'ANON',
        cohortId: d.cohortId || '',
        moduleId: d.moduleId || 'money_rules',
        moduleName: d.moduleName || MODULE_NAMES[d.moduleId] || d.moduleId,
        roundNumber: d.roundNumber || 1,
        actionType: d.actionType || 'decision_submitted',
        decisionSummary: d.decisionSummary || '',
        resultSummary: d.resultSummary || '',
        decisions: d.decisions || {},
        results: d.results || {},
        behavioralTags: Array.isArray(d.behavioralTags) ? d.behavioralTags : [],
        severity: d.severity || 'normal'
      });
    });

    if (existingLogs.length >= limitCount) {
      return existingLogs;
    }

    // Backfill from moduleRuns & rounds subcollections
    const backfilled = await backfillAuditLogsFromRuns(limitCount - existingLogs.length);
    const combined = [...existingLogs, ...backfilled];
    combined.sort((a, b) => b.createdAtMs - a.createdAtMs);
    return combined.slice(0, limitCount);
  } catch (err) {
    console.error('Error in fetchRecentAuditLogs:', err);
    // Fallback directly to scanning moduleRuns
    return await backfillAuditLogsFromRuns(limitCount);
  }
}

/**
 * Scans real persisted moduleRuns and their rounds subcollections to generate audit log records
 */
export async function backfillAuditLogsFromRuns(maxNeeded: number = 20): Promise<AuditLogEntry[]> {
  const runsRef = collection(db, 'moduleRuns');
  const runsSnap = await getDocs(runsRef);

  const entries: AuditLogEntry[] = [];

  for (const runDoc of runsSnap.docs) {
    const runData = runDoc.data();
    const learnerCode = runData.learnerCode || runData.userId || 'ANON';
    const cohortId = runData.cohortId || 'school-pilot-2026-tuckshop';
    const moduleId = runData.moduleId || 'money_rules';
    const runTimestamp = runData.startedAt?.seconds
      ? runData.startedAt.seconds * 1000
      : (runData.startedAt ? new Date(runData.startedAt).getTime() : Date.now() - 3600000);

    // Fetch rounds
    const roundsRef = collection(db, 'moduleRuns', runDoc.id, 'rounds');
    const roundsSnap = await getDocs(roundsRef);

    roundsSnap.forEach((roundDoc) => {
      const rData = roundDoc.data();
      const roundNumber = rData.round || parseInt(roundDoc.id, 10) || 1;
      const roundTimestamp = rData.writtenAt?.seconds
        ? rData.writtenAt.seconds * 1000
        : runTimestamp + (roundNumber * 60000);

      const decisions = rData.decisions || {};
      const results = rData.results || {};

      const behavioralTags = detectBehavioralTags(moduleId as ModuleType, [{
        round: roundNumber,
        decisions: decisions as any,
        results: results as any
      }]);

      const entry: AuditLogEntry = {
        id: `audit_${runDoc.id}_r${roundNumber}`,
        timestamp: new Date(roundTimestamp).toISOString(),
        createdAtMs: roundTimestamp,
        learnerCode: learnerCode.toUpperCase(),
        cohortId,
        moduleId,
        moduleName: MODULE_NAMES[moduleId] || moduleId,
        roundNumber,
        actionType: 'decision_submitted',
        decisionSummary: formatDecisionSummary(moduleId, decisions),
        resultSummary: formatResultSummary(moduleId, results),
        decisions,
        results,
        behavioralTags,
        severity: determineSeverity(results)
      };

      entries.push(entry);

      // Opportunistically persist to auditLogs collection for future real-time indexing
      setDoc(doc(db, 'auditLogs', entry.id), {
        ...entry,
        writtenAt: serverTimestamp()
      }).catch(() => {});
    });
  }

  entries.sort((a, b) => b.createdAtMs - a.createdAtMs);
  return entries.slice(0, maxNeeded);
}
