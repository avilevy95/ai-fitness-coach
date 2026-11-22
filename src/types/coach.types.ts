import type { NutritionPlan, WeeklyPlan } from './workout.types';

export type CoachVideoState = 'warmup' | 'demo' | 'active_loop' | 'rest';

export interface AudioCue {
  id: string;
  textHe: string;
  localUri: string;
  priority: number;
}

export interface MediaManifest {
  warmupUrl: string;
  exerciseVideos: Record<string, string>;
  cueFiles: Record<string, string>;
  audioCues: AudioCue[];
  weeklyPlan?: WeeklyPlan;
  nutritionPlan?: NutritionPlan;
}
