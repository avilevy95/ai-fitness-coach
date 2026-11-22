import type {
  NutritionPlan,
  SessionResult,
  UserProfile,
  WeeklyPlan,
} from './workout.types';

export interface ProfileRow {
  id: string;
  user_id: string;
  profile: UserProfile;
  updated_at: string;
}

export interface WorkoutPlanRow {
  id: string;
  user_id: string;
  plan: WeeklyPlan;
  is_active: boolean;
  created_at: string;
}

export interface WorkoutSessionRow {
  id: string;
  user_id: string;
  result: SessionResult;
  completed_at: string;
}

export interface NutritionPlanRow {
  id: string;
  user_id: string;
  plan: NutritionPlan;
  created_at: string;
}

export interface CoachMediaAssetRow {
  id: string;
  exercise_id: string | null;
  media_type: 'video' | 'audio';
  storage_path: string;
  public_url: string | null;
}
