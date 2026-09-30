import { useState, useEffect } from 'react';
import { GameState, ModuleType, validateLearnerConsent, getActiveRun, startModuleRun, LearnerDoc } from '../services/learnerPersistenceService';

export function useLearnerSession(
  stateModule: ModuleType,
  setAuthRoute: (route: 'dashboard' | 'admin' | 'login' | 'register' | 'learner_login') => void,
  setState: React.Dispatch<React.SetStateAction<GameState>>,
  setLastRound: (round: any) => void
) {
  const [activeLearner, setActiveLearner] = useState<LearnerDoc | null>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  useEffect(() => {
    const initLearnerSession = async () => {
      const cachedCode = localStorage.getItem('dinaledi360_active_learner_code');
      if (!cachedCode) {
        setAuthRoute('learner_login');
        return;
      }

      try {
        const validation = await validateLearnerConsent(cachedCode);
        if (!validation.valid || !validation.learner) {
          localStorage.removeItem('dinaledi360_active_learner_code');
          setActiveLearner(null);
          setAuthRoute('learner_login');
          return;
        }

        setActiveLearner(validation.learner);

        // Fetch or create run for active module
        const activeRes = await getActiveRun(validation.learner.learnerCode, stateModule);
        if (activeRes.run) {
          setActiveRunId(activeRes.run.runId);
          // If rounds exist in Firestore, restore history
          if (activeRes.rounds && activeRes.rounds.length > 0) {
            const lastRd = activeRes.rounds[activeRes.rounds.length - 1];
            setLastRound(lastRd);
            setState(prev => ({
              ...prev,
              round: activeRes.run!.currentRound || (lastRd.round + 1),
              history: activeRes.rounds
            }));
          }
        } else {
          // Initialize new run strictly gated by consent
          const newRun = await startModuleRun(
            validation.learner.learnerCode,
            validation.learner.cohortId,
            stateModule,
            'baseline'
          );
          setActiveRunId(newRun.runId);
        }
      } catch (e) {
        console.error('Failed to init Firestore learner session:', e);
      }
    };

    initLearnerSession();
  }, [stateModule]);

  return {
    activeLearner,
    setActiveLearner,
    activeRunId,
    setActiveRunId
  };
}
