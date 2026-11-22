import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import type {
  CoachMediaAssetRow,
  NutritionPlanRow,
  ProfileRow,
  WorkoutPlanRow,
  WorkoutSessionRow,
} from '../types/database.types';

type CoachMediaAssetDbRow = CoachMediaAssetRow & {
  asset_key: string;
  title_he: string;
  text_he: string | null;
  priority: number;
};

type DatabaseRecord<T> = { [Key in keyof T]: T[Key] };

type Database = {
  public: {
    Tables: {
      profiles: {
        Row: DatabaseRecord<ProfileRow>;
        Insert: DatabaseRecord<Omit<ProfileRow, 'id' | 'updated_at'> & {
          id?: string;
          updated_at?: string;
        }>;
        Update: DatabaseRecord<Partial<ProfileRow>>;
        Relationships: [];
      };
      workout_plans: {
        Row: DatabaseRecord<WorkoutPlanRow>;
        Insert: DatabaseRecord<Omit<WorkoutPlanRow, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        }>;
        Update: DatabaseRecord<Partial<WorkoutPlanRow>>;
        Relationships: [];
      };
      workout_sessions: {
        Row: DatabaseRecord<WorkoutSessionRow>;
        Insert: DatabaseRecord<Omit<WorkoutSessionRow, 'id'> & { id?: string }>;
        Update: DatabaseRecord<Partial<WorkoutSessionRow>>;
        Relationships: [];
      };
      nutrition_plans: {
        Row: DatabaseRecord<NutritionPlanRow>;
        Insert: DatabaseRecord<Omit<NutritionPlanRow, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        }>;
        Update: DatabaseRecord<Partial<NutritionPlanRow>>;
        Relationships: [];
      };
      coach_media_assets: {
        Row: DatabaseRecord<CoachMediaAssetDbRow>;
        Insert: DatabaseRecord<Omit<CoachMediaAssetDbRow, 'id'> & { id?: string }>;
        Update: DatabaseRecord<Partial<CoachMediaAssetDbRow>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY before starting the app.',
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: false,
    persistSession: true,
    storage: secureStoreAdapter,
  },
});
