import { create } from 'zustand';
import { generateFitnessPlan } from '../services/aiService';
import type { NutritionPlan, UserProfile, WeeklyPlan } from '../types/workout.types';

interface PlanStore {
  weeklyPlan: WeeklyPlan | null;
  nutritionPlan: NutritionPlan | null;
  isGenerating: boolean;
  isOffline: boolean;
  error: string | null;
  generate: (profile: UserProfile) => Promise<void>;
  setPlans: (weeklyPlan: WeeklyPlan, nutritionPlan: NutritionPlan) => void;
  updateWeeklyPlan: (weeklyPlan: WeeklyPlan) => void;
  clearPlans: () => void;
}

export const usePlanStore = create<PlanStore>((set) => ({
  weeklyPlan: null,
  nutritionPlan: null,
  isGenerating: false,
  isOffline: false,
  error: null,
  generate: async (profile) => {
    set({ isGenerating: true, error: null });
    try {
      const result = await generateFitnessPlan(profile);
      set({
        weeklyPlan: result.weeklyPlan,
        nutritionPlan: result.nutritionPlan,
        isOffline: result.offline,
        isGenerating: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'לא הצלחנו ליצור תוכנית כרגע.',
        isGenerating: false,
      });
      throw error;
    }
  },
  setPlans: (weeklyPlan, nutritionPlan) => set({ weeklyPlan, nutritionPlan, error: null }),
  updateWeeklyPlan: (weeklyPlan) => set({ weeklyPlan }),
  clearPlans: () => set({ weeklyPlan: null, nutritionPlan: null, isOffline: false, error: null }),
}));
