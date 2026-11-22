import type { NutritionPlan, UserProfile, WeeklyPlan } from '../types/workout.types';
import { supabase } from './supabaseClient';

export type FitnessPlanResult = {
  weeklyPlan: WeeklyPlan;
  nutritionPlan: NutritionPlan;
  bmr: number;
  tdee: number;
  offline: boolean;
};

export type CoachAudioResult = {
  audioBase64: string;
  mimeType: string;
  offline: boolean;
};

export class AiServiceError extends Error {
  readonly code: string;
  readonly cause?: unknown;

  constructor(message: string, code: string, cause?: unknown) {
    super(message);
    this.name = 'AiServiceError';
    this.code = code;
    this.cause = cause;
  }
}

function estimateTargets(profile: UserProfile) {
  const adjustment = profile.gender === 'male' ? 5 : profile.gender === 'female' ? -161 : -78;
  const bmr = Math.round(
    10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + adjustment,
  );
  const factor = { beginner: 1.2, intermediate: 1.375, advanced: 1.55 }[profile.fitnessLevel];
  const tdee = Math.round(bmr * factor);
  const text = profile.goals.join(' ').toLowerCase();
  const delta = profile.age < 18
    ? 0
    : /lose|loss|weight.?loss|חיטוב|ירידה|להרזות|הרזיה/.test(text)
      ? -300
      : /gain|muscle|עלייה|מסה|שריר/.test(text) ? 200 : 0;
  const dailyCalories = Math.max(Math.round(bmr * 1.1), tdee + delta);
  const proteinGrams = Math.round(profile.weightKg * 1.8);
  const fatGrams = Math.round(profile.weightKg * 0.8);
  const carbGrams = Math.max(0, Math.round((dailyCalories - proteinGrams * 4 - fatGrams * 9) / 4));
  return { bmr, tdee, dailyCalories, proteinGrams, carbGrams, fatGrams };
}

function getWeekStart(): string {
  const date = new Date();
  const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

function createOfflinePlan(profile: UserProfile): FitnessPlanResult {
  const weekStart = getWeekStart();
  const weekDate = new Date(`${weekStart}T00:00:00.000Z`);
  const sessions = [...new Set(profile.preferredDays)]
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    .slice(0, 3)
    .map((dayIndex, index) => {
      const date = new Date(weekDate);
      date.setUTCDate(date.getUTCDate() + dayIndex);
      return {
        dayIndex,
        date: date.toISOString().slice(0, 10),
        titleHe: ['אימון גוף מלא', 'חיזוק ויציבה', 'כוח וסיבולת'][index],
        durationMinutes: profile.minutesPerSession,
        status: 'planned' as const,
        exercises: [
          {
            exerciseId: 'squat' as const,
            sets: 3,
            reps: 12,
            restSeconds: 60,
            hebrewName: 'סקוואט',
            instructionsHe: 'עמדו בפיסוק נוח, כופפו ברכיים ודחפו את האגן לאחור.',
          },
          {
            exerciseId: 'pushup' as const,
            sets: 3,
            reps: 8,
            restSeconds: 60,
            hebrewName: 'שכיבת סמיכה',
            instructionsHe: 'שמרו על גוף ישר והורידו את החזה בשליטה.',
          },
          {
            exerciseId: 'plank' as const,
            sets: 3,
            holdSeconds: 20,
            restSeconds: 45,
            hebrewName: 'פלאנק',
            instructionsHe: 'שמרו על גוף ישר וכווצו את שרירי הבטן.',
          },
        ],
      };
    });
  const targets = estimateTargets(profile);
  return {
    weeklyPlan: { weekStart, sessions },
    nutritionPlan: {
      dailyCalories: targets.dailyCalories,
      proteinGrams: targets.proteinGrams,
      carbGrams: targets.carbGrams,
      fatGrams: targets.fatGrams,
      meals: {
        breakfast: [{
          nameHe: 'גבינה לבנה, לחם מלא וירקות',
          portionHe: '150 גרם גבינה, 2 פרוסות לחם וירקות',
          calories: 350,
          protein: 24,
          carbs: 42,
          fat: 9,
        }],
        lunch: [{
          nameHe: 'חזה עוף, אורז וסלט ישראלי',
          portionHe: '150 גרם עוף, כוס אורז מבושל וסלט',
          calories: 550,
          protein: 42,
          carbs: 62,
          fat: 12,
        }],
        dinner: [{
          nameHe: 'שקשוקה, טחינה וסלט',
          portionHe: '2 ביצים, חצי פיתה וכף טחינה',
          calories: 450,
          protein: 24,
          carbs: 35,
          fat: 22,
        }],
        snacks: [{
          nameHe: 'יוגורט טבעי ותפוח',
          portionHe: 'גביע יוגורט ותפוח בינוני',
          calories: 200,
          protein: 12,
          carbs: 30,
          fat: 4,
        }],
      },
    },
    bmr: targets.bmr,
    tdee: targets.tdee,
    offline: true,
  };
}

function createOfflineAudio(): CoachAudioResult {
  return { audioBase64: '', mimeType: 'audio/mpeg', offline: true };
}

function shouldUseOfflineFallback(error: unknown): boolean {
  const context = (error as { context?: { status?: number } } | null)?.context;
  return !context?.status || context.status >= 500;
}

export async function generateFitnessPlan(profile: UserProfile): Promise<FitnessPlanResult> {
  let data: unknown;
  let error: unknown;
  try {
    ({ data, error } = await supabase.functions.invoke('generate-fitness-plan', {
      body: { profile },
    }));
  } catch (cause) {
    if (shouldUseOfflineFallback(cause)) return createOfflinePlan(profile);
    throw new AiServiceError('לא ניתן ליצור תוכנית אימונים כרגע.', 'FITNESS_PLAN_FAILED', cause);
  }
  if (error) {
    if (shouldUseOfflineFallback(error)) {
      return createOfflinePlan(profile);
    }
    throw new AiServiceError('לא ניתן ליצור תוכנית אימונים כרגע.', 'FITNESS_PLAN_FAILED', error);
  }
  const result = data as Partial<FitnessPlanResult> | null;
  if (
    !result ||
    !result.weeklyPlan ||
    !Array.isArray(result.weeklyPlan.sessions) ||
    !result.nutritionPlan ||
    !Number.isFinite(result.bmr) ||
    !Number.isFinite(result.tdee)
  ) {
    throw new AiServiceError('התקבלה תשובה לא תקינה משירות התוכניות.', 'INVALID_RESPONSE');
  }
  return {
    weeklyPlan: result.weeklyPlan as WeeklyPlan,
    nutritionPlan: result.nutritionPlan as NutritionPlan,
    bmr: result.bmr as number,
    tdee: result.tdee as number,
    offline: false,
  };
}

export async function generateCoachAudio(textHe: string, voiceId?: string): Promise<CoachAudioResult> {
  let data: unknown;
  let error: unknown;
  try {
    ({ data, error } = await supabase.functions.invoke('coach-tts', {
      body: { textHe, ...(voiceId ? { voiceId } : {}) },
    }));
  } catch (cause) {
    if (shouldUseOfflineFallback(cause)) return createOfflineAudio();
    throw new AiServiceError('לא ניתן ליצור קריינות כרגע.', 'COACH_TTS_FAILED', cause);
  }
  if (error) {
    if (shouldUseOfflineFallback(error)) {
      return createOfflineAudio();
    }
    throw new AiServiceError('לא ניתן ליצור קריינות כרגע.', 'COACH_TTS_FAILED', error);
  }
  const result = data as Partial<CoachAudioResult> | null;
  if (typeof result?.audioBase64 !== 'string' || typeof result.mimeType !== 'string') {
    throw new AiServiceError('התקבלה תשובת שמע לא תקינה.', 'INVALID_RESPONSE');
  }
  return { audioBase64: result.audioBase64, mimeType: result.mimeType, offline: false };
}
