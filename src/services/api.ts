import type { MediaManifest } from '../types/coach.types';
import type {
  CoachMediaAssetRow,
  NutritionPlanRow,
  ProfileRow,
  WorkoutPlanRow,
  WorkoutSessionRow,
} from '../types/database.types';
import type { SessionResult, UserProfile } from '../types/workout.types';
import { supabase } from './supabaseClient';

type CoachMediaAsset = CoachMediaAssetRow & {
  asset_key: string;
  title_he: string;
  text_he: string | null;
  priority: number;
};

function getProfileSaveError(code: string | undefined): Error {
  switch (code) {
    case '42501':
      return new Error(
        'חסרות הרשאות לטבלת הפרופילים ב-Supabase. צריך להחיל את המיגרציה 002_authenticated_table_grants.sql.',
      );
    case '42P01':
    case 'PGRST205':
      return new Error(
        'טבלת הפרופילים לא הוגדרה ב-Supabase. צריך להחיל את המיגרציה 001_initial_schema.sql.',
      );
    case '42P10':
      return new Error(
        'חסר מפתח ייחודי לשמירת הפרופיל ב-Supabase. צריך להחיל את המיגרציה 001_initial_schema.sql.',
      );
    default:
      return new Error(
        `לא הצלחנו לשמור את הפרופיל כרגע${code ? ` (קוד ${code})` : ''}.`,
      );
  }
}

async function getCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }
  if (!data.user) {
    throw new Error('You must be signed in to access your data.');
  }

  return data.user.id;
}

export async function getProfile(): Promise<ProfileRow | null> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data;
}

export async function upsertProfile(profile: UserProfile): Promise<ProfileRow> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      { user_id: userId, profile, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    )
    .select('*')
    .single();

  if (error) {
    throw getProfileSaveError(error.code);
  }
  return data;
}

export async function getActivePlan(): Promise<WorkoutPlanRow | null> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('workout_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data;
}

export async function saveWorkoutResult(
  result: SessionResult,
): Promise<WorkoutSessionRow> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({
      user_id: userId,
      result,
      completed_at: result.completedAt,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }
  return data;
}

export async function getWorkoutSessions(): Promise<WorkoutSessionRow[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });

  if (error) {
    throw error;
  }
  return data ?? [];
}

export async function getNutritionPlan(): Promise<NutritionPlanRow | null> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('nutrition_plans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data;
}

export async function fetchCoachMediaManifest(): Promise<MediaManifest> {
  const { data, error } = await supabase
    .from('coach_media_assets')
    .select('*')
    .order('priority', { ascending: true });

  if (error) {
    throw error;
  }

  const assets = data as CoachMediaAsset[];
  const manifest: MediaManifest = {
    warmupUrl: '',
    exerciseVideos: {},
    cueFiles: {},
    audioCues: [],
  };

  for (const asset of assets) {
    const publicUrl = supabase.storage
      .from('coach-media')
      .getPublicUrl(asset.storage_path).data.publicUrl;

    if (asset.media_type === 'video') {
      if (asset.asset_key === 'warmup') {
        manifest.warmupUrl = publicUrl;
      } else if (asset.exercise_id) {
        manifest.exerciseVideos[asset.exercise_id] = publicUrl;
      }
      continue;
    }

    const cueId = asset.asset_key.startsWith('cue_')
      ? asset.asset_key.slice('cue_'.length)
      : asset.asset_key;
    manifest.cueFiles[cueId] = publicUrl;
    if (asset.text_he) {
      manifest.audioCues.push({
        id: cueId,
        textHe: asset.text_he,
        localUri: publicUrl,
        priority: asset.priority,
      });
    }
  }

  return manifest;
}
