export type ExerciseId =
  | 'squat'
  | 'pushup'
  | 'plank'
  | 'lunge'
  | 'crunch'
  | 'jumping_jack';

export interface UserProfile {
  id?: string;
  age: number;
  weightKg: number;
  heightCm: number;
  gender: 'female' | 'male' | 'other';
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  goals: string[];
  equipment: string[];
  preferredDays: number[];
  minutesPerSession: number;
  coachStyle?: 'motivational' | 'calm' | 'technical';
}

export interface ExercisePrescription {
  exerciseId: ExerciseId;
  sets: number;
  reps?: number;
  holdSeconds?: number;
  restSeconds: number;
  hebrewName: string;
  instructionsHe: string;
}

export interface WorkoutSessionPlan {
  id?: string;
  dayIndex: number;
  date?: string;
  titleHe: string;
  durationMinutes: number;
  exercises: ExercisePrescription[];
  status?: 'planned' | 'completed' | 'missed';
}

export interface WeeklyPlan {
  weekStart: string;
  sessions: WorkoutSessionPlan[];
}

export interface MealItem {
  nameHe: string;
  portionHe: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface NutritionPlan {
  dailyCalories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  meals: {
    breakfast: MealItem[];
    lunch: MealItem[];
    dinner: MealItem[];
    snacks: MealItem[];
  };
}

export interface ExerciseResult {
  exerciseId: ExerciseId;
  reps: number;
  accuracyScore: number;
  durationSeconds: number;
}

export interface SessionResult {
  id?: string;
  userId?: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  totalReps: number;
  averageAccuracy: number;
  exercises: ExerciseResult[];
}
