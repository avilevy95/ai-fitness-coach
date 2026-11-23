import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXERCISE_IDS = [
  'squat',
  'pushup',
  'plank',
  'lunge',
  'crunch',
  'jumping_jack',
] as const;

type ExerciseId = (typeof EXERCISE_IDS)[number];
type UserProfile = {
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
};

type ExercisePrescription = {
  exerciseId: ExerciseId;
  sets: number;
  reps: number | null;
  holdSeconds: number | null;
  restSeconds: number;
  hebrewName: string;
  instructionsHe: string;
};

type WeeklyPlan = {
  weekStart: string;
  sessions: {
    dayIndex: number;
    date: string;
    titleHe: string;
    durationMinutes: number;
    exercises: ExercisePrescription[];
    status: 'planned';
  }[];
};

type MealItem = {
  nameHe: string;
  portionHe: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type NutritionPlan = {
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
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isProfile(value: unknown): value is UserProfile {
  if (!value || typeof value !== 'object') return false;
  const profile = value as Partial<UserProfile>;
  return (
    Number.isFinite(profile.age) && Number(profile.age) >= 13 && Number(profile.age) <= 100 &&
    Number.isFinite(profile.weightKg) && Number(profile.weightKg) >= 30 && Number(profile.weightKg) <= 300 &&
    Number.isFinite(profile.heightCm) && Number(profile.heightCm) >= 120 && Number(profile.heightCm) <= 230 &&
    ['female', 'male', 'other'].includes(String(profile.gender)) &&
    ['beginner', 'intermediate', 'advanced'].includes(String(profile.fitnessLevel)) &&
    Array.isArray(profile.goals) && profile.goals.every((goal) => typeof goal === 'string') &&
    Array.isArray(profile.equipment) && profile.equipment.every((item) => typeof item === 'string') &&
    Array.isArray(profile.preferredDays) &&
    profile.preferredDays.every((day) => Number.isInteger(day) && day >= 0 && day <= 6) &&
    Number.isFinite(profile.minutesPerSession) &&
    Number(profile.minutesPerSession) >= 10 && Number(profile.minutesPerSession) <= 180
  );
}

function getNutritionTargets(profile: UserProfile) {
  const genderAdjustment = profile.gender === 'male' ? 5 : profile.gender === 'female' ? -161 : -78;
  const bmr = Math.round(
    10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + genderAdjustment,
  );
  const activityFactor = {
    beginner: 1.2,
    intermediate: 1.375,
    advanced: 1.55,
  }[profile.fitnessLevel];
  const tdee = Math.round(bmr * activityFactor);
  const goalText = profile.goals.join(' ').toLowerCase();
  const calorieAdjustment = profile.age < 18
    ? 0
    : /lose|loss|weight.?loss|חיטוב|ירידה|להרזות|הרזיה/.test(goalText) ? -300
      : /gain|muscle|עלייה|מסה|שריר/.test(goalText) ? 200
        : 0;
  const dailyCalories = Math.max(Math.round(bmr * 1.1), tdee + calorieAdjustment);
  const proteinGrams = Math.round(profile.weightKg * 1.8);
  const fatGrams = Math.round(profile.weightKg * 0.8);
  const carbGrams = Math.max(
    0,
    Math.round((dailyCalories - proteinGrams * 4 - fatGrams * 9) / 4),
  );
  return { bmr, tdee, dailyCalories, proteinGrams, carbGrams, fatGrams };
}

function mondayOfCurrentWeek(): Date {
  const today = new Date();
  const monday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  return monday;
}

function planSchema() {
  const exerciseSchema = {
    type: 'object',
    additionalProperties: false,
    required: [
      'exerciseId', 'sets', 'reps', 'holdSeconds', 'restSeconds', 'hebrewName', 'instructionsHe',
    ],
    properties: {
      exerciseId: { type: 'string', enum: EXERCISE_IDS },
      sets: { type: 'integer', minimum: 1, maximum: 6 },
      reps: { type: ['integer', 'null'], minimum: 1, maximum: 100 },
      holdSeconds: { type: ['integer', 'null'], minimum: 1, maximum: 300 },
      restSeconds: { type: 'integer', minimum: 0, maximum: 300 },
      hebrewName: { type: 'string' },
      instructionsHe: { type: 'string' },
    },
  };
  const mealSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['nameHe', 'portionHe', 'calories', 'protein', 'carbs', 'fat'],
    properties: {
      nameHe: { type: 'string' },
      portionHe: { type: 'string' },
      calories: { type: 'number', minimum: 0 },
      protein: { type: 'number', minimum: 0 },
      carbs: { type: 'number', minimum: 0 },
      fat: { type: 'number', minimum: 0 },
    },
  };
  return {
    type: 'object',
    additionalProperties: false,
    required: ['weeklyPlan', 'nutritionPlan'],
    properties: {
      weeklyPlan: {
        type: 'object',
        additionalProperties: false,
        required: ['weekStart', 'sessions'],
        properties: {
          weekStart: { type: 'string' },
          sessions: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['dayIndex', 'date', 'titleHe', 'durationMinutes', 'exercises', 'status'],
              properties: {
                dayIndex: { type: 'integer', minimum: 0, maximum: 6 },
                date: { type: 'string' },
                titleHe: { type: 'string' },
                durationMinutes: { type: 'integer', minimum: 10, maximum: 180 },
                exercises: { type: 'array', minItems: 1, items: exerciseSchema },
                status: { type: 'string', enum: ['planned'] },
              },
            },
          },
        },
      },
      nutritionPlan: {
        type: 'object',
        additionalProperties: false,
        required: ['dailyCalories', 'proteinGrams', 'carbGrams', 'fatGrams', 'meals'],
        properties: {
          dailyCalories: { type: 'integer', minimum: 1000, maximum: 6000 },
          proteinGrams: { type: 'integer', minimum: 0, maximum: 500 },
          carbGrams: { type: 'integer', minimum: 0, maximum: 1000 },
          fatGrams: { type: 'integer', minimum: 0, maximum: 300 },
          meals: {
            type: 'object',
            additionalProperties: false,
            required: ['breakfast', 'lunch', 'dinner', 'snacks'],
            properties: {
              breakfast: { type: 'array', items: mealSchema },
              lunch: { type: 'array', items: mealSchema },
              dinner: { type: 'array', items: mealSchema },
              snacks: { type: 'array', items: mealSchema },
            },
          },
        },
      },
    },
  };
}

function parseGeneratedPlan(value: unknown): { weeklyPlan: WeeklyPlan; nutritionPlan: NutritionPlan } {
  if (!value || typeof value !== 'object') throw new Error('Invalid plan response');
  const result = value as { weeklyPlan?: WeeklyPlan; nutritionPlan?: NutritionPlan };
  if (!result.weeklyPlan || !Array.isArray(result.weeklyPlan.sessions) || !result.nutritionPlan) {
    throw new Error('Incomplete plan response');
  }
  for (const session of result.weeklyPlan.sessions) {
    if (!Number.isInteger(session.dayIndex) || session.dayIndex < 0 || session.dayIndex > 6) {
      throw new Error('Plan contains an invalid day index');
    }
    if (!Array.isArray(session.exercises) || session.exercises.length === 0) {
      throw new Error('A workout session has no exercises');
    }
    if (session.exercises.some((exercise) => !EXERCISE_IDS.includes(exercise.exerciseId))) {
      throw new Error('Plan contains an unsupported exercise');
    }
  }
  return { weeklyPlan: result.weeklyPlan, nutritionPlan: result.nutritionPlan };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!supabaseUrl || !supabaseAnonKey || !openRouterApiKey) {
    return jsonResponse({ error: 'Server configuration is incomplete' }, 500);
  }
  const authorization = request.headers.get('Authorization');
  if (!authorization) return jsonResponse({ error: 'Authentication required' }, 401);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData.user) return jsonResponse({ error: 'Invalid authentication' }, 401);

  let body: { profile?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Request body must be valid JSON' }, 400);
  }
  if (!isProfile(body.profile)) return jsonResponse({ error: 'Invalid user profile' }, 400);
  const profile = body.profile;
  const targets = getNutritionTargets(profile);
  const weekStartDate = mondayOfCurrentWeek();
  const weekStart = weekStartDate.toISOString().slice(0, 10);
  const preferredDays = [...new Set(profile.preferredDays)];

  let generated: { weeklyPlan: WeeklyPlan; nutritionPlan: NutritionPlan };
  try {
    const completion = await fetch('https://api.openrouter.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        temperature: 0.4,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'fitness_and_nutrition_plan',
            strict: true,
            schema: planSchema(),
          },
        },
        messages: [
          {
            role: 'system',
            content: [
              'Create safe, practical bodyweight fitness and nutrition plans in Hebrew for an Israeli user.',
              'Use only these exerciseId values: squat, pushup, plank, lunge, crunch, jumping_jack.',
              'Use familiar Israeli foods and Hebrew names/portions. Never suggest supplements or extreme diets.',
              'Schedule exactly one session on every supplied preferred day and no other days; dayIndex is 0 for Monday through 6 for Sunday.',
              'Return a plan for the supplied Monday-to-Sunday week. For static holds use holdSeconds and set reps to null; otherwise set holdSeconds to null.',
              'Avoid prescribing exercise on all days; include rest days by omitting those days from sessions.',
              'The nutrition macro totals are computed by the application and must be repeated exactly.',
            ].join(' '),
          },
          {
            role: 'user',
            content: JSON.stringify({
              profile: {
                age: profile.age,
                weightKg: profile.weightKg,
                heightCm: profile.heightCm,
                gender: profile.gender,
                fitnessLevel: profile.fitnessLevel,
                goals: profile.goals,
                equipment: profile.equipment,
                minutesPerSession: profile.minutesPerSession,
                coachStyle: profile.coachStyle,
              },
              weekStart,
              preferredDays,
              nutritionTargets: {
                dailyCalories: targets.dailyCalories,
                proteinGrams: targets.proteinGrams,
                carbGrams: targets.carbGrams,
                fatGrams: targets.fatGrams,
              },
              requirements: 'Provide useful exercise instructions in Hebrew and four daily meal groups.',
            }),
          },
        ],
      }),
    });
    if (!completion.ok) {
      throw new Error(`OpenRouter request failed (${completion.status})`);
    }
    const completionBody = await completion.json();
    const content = completionBody.choices?.[0]?.message?.content;
    if (typeof content !== 'string') throw new Error('OpenRouter returned an empty plan');
    generated = parseGeneratedPlan(JSON.parse(content));
    const scheduledDays = generated.weeklyPlan.sessions.map((session) => session.dayIndex);
    if (
      new Set(scheduledDays).size !== scheduledDays.length ||
      scheduledDays.some((day) => !preferredDays.includes(day)) ||
      preferredDays.some((day) => !scheduledDays.includes(day))
    ) {
      throw new Error('Generated sessions do not match the preferred training days');
    }
  } catch (error) {
    console.error('Fitness plan generation failed:', error);
    return jsonResponse({ error: 'Could not generate a fitness plan' }, 502);
  }

  generated.weeklyPlan.weekStart = weekStart;
  generated.weeklyPlan.sessions = generated.weeklyPlan.sessions
    .filter((session) => preferredDays.includes(session.dayIndex))
    .map((session) => {
      const sessionDate = new Date(weekStartDate);
      sessionDate.setUTCDate(sessionDate.getUTCDate() + session.dayIndex);
      return { ...session, date: sessionDate.toISOString().slice(0, 10), status: 'planned' };
    });
  generated.nutritionPlan = {
    ...generated.nutritionPlan,
    dailyCalories: targets.dailyCalories,
    proteinGrams: targets.proteinGrams,
    carbGrams: targets.carbGrams,
    fatGrams: targets.fatGrams,
  };

  const { error: deactivateError } = await supabase
    .from('workout_plans')
    .update({ is_active: false })
    .eq('user_id', userData.user.id)
    .eq('is_active', true);
  if (deactivateError) {
    console.error('Could not deactivate previous workout plan:', deactivateError);
    return jsonResponse({ error: 'Could not save workout plan' }, 500);
  }
  const { data: workoutPlan, error: workoutError } = await supabase
    .from('workout_plans')
    .insert({ user_id: userData.user.id, plan: generated.weeklyPlan, is_active: true })
    .select('*')
    .single();
  if (workoutError) {
    console.error('Could not save workout plan:', workoutError);
    return jsonResponse({ error: 'Could not save workout plan' }, 500);
  }
  const { data: nutritionPlan, error: nutritionError } = await supabase
    .from('nutrition_plans')
    .insert({ user_id: userData.user.id, plan: generated.nutritionPlan })
    .select('*')
    .single();
  if (nutritionError) {
    console.error('Could not save nutrition plan:', nutritionError);
    return jsonResponse({ error: 'Could not save nutrition plan' }, 500);
  }

  return jsonResponse({
    weeklyPlan: workoutPlan.plan,
    nutritionPlan: nutritionPlan.plan,
    bmr: targets.bmr,
    tdee: targets.tdee,
  });
});
