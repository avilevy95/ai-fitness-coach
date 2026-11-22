import { create } from 'zustand';
import type { SessionResult, WorkoutSessionPlan } from '../types/workout.types';

interface WorkoutSessionStore {
  activeWorkout: WorkoutSessionPlan | null;
  activeStartedAt: string | null;
  sessions: SessionResult[];
  startWorkout: (workout: WorkoutSessionPlan, startedAt?: string) => void;
  clearActiveWorkout: () => void;
  saveSession: (session: SessionResult) => void;
}

export const useWorkoutSessionStore = create<WorkoutSessionStore>((set) => ({
  activeWorkout: null,
  activeStartedAt: null,
  sessions: [],
  startWorkout: (workout, startedAt = new Date().toISOString()) =>
    set({ activeWorkout: workout, activeStartedAt: startedAt }),
  clearActiveWorkout: () => set({ activeWorkout: null, activeStartedAt: null }),
  saveSession: (session) =>
    set((state) => ({
      sessions: [...state.sessions, session],
      activeWorkout: null,
      activeStartedAt: null,
    })),
}));
