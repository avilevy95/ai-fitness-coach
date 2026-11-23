import type { WeeklyPlan, WorkoutSessionPlan } from '../../types/workout.types';

const workoutTemplates: Pick<WorkoutSessionPlan, 'titleHe' | 'durationMinutes' | 'exercises'>[] = [
  {
    titleHe: 'אימון מתחילים A',
    durationMinutes: 20,
    exercises: [
      {
        exerciseId: 'squat',
        sets: 2,
        reps: 8,
        restSeconds: 60,
        hebrewName: 'סקוואט',
        instructionsHe: 'עמדו בפיסוק נוח, כופפו ברכיים ודחפו את האגן לאחור. רדו רק עד שנוח.',
      },
      {
        exerciseId: 'pushup',
        sets: 2,
        reps: 6,
        restSeconds: 60,
        hebrewName: 'שכיבת סמיכה',
        instructionsHe: 'שמרו על גוף ישר. אפשר לבצע את התרגיל כשהברכיים על הרצפה.',
      },
      {
        exerciseId: 'plank',
        sets: 2,
        holdSeconds: 15,
        restSeconds: 45,
        hebrewName: 'פלאנק',
        instructionsHe: 'שמרו על גוף ישר וכיווצו בעדינות את שרירי הבטן.',
      },
    ],
  },
  {
    titleHe: 'אימון מתחילים B',
    durationMinutes: 20,
    exercises: [
      {
        exerciseId: 'squat',
        sets: 2,
        reps: 10,
        restSeconds: 60,
        hebrewName: 'סקוואט בשליטה',
        instructionsHe: 'רדו בקצב נוח, שמרו את העקבים על הרצפה ועלו בעדינות.',
      },
      {
        exerciseId: 'plank',
        sets: 2,
        holdSeconds: 20,
        restSeconds: 45,
        hebrewName: 'פלאנק',
        instructionsHe: 'שמרו על גוף ישר וכיווצו בעדינות את שרירי הבטן.',
      },
      {
        exerciseId: 'pushup',
        sets: 2,
        reps: 6,
        restSeconds: 60,
        hebrewName: 'שכיבת סמיכה',
        instructionsHe: 'שמרו על גוף ישר. אפשר לבצע את התרגיל כשהברכיים על הרצפה.',
      },
    ],
  },
  {
    titleHe: 'אימון מתחילים C',
    durationMinutes: 20,
    exercises: [
      {
        exerciseId: 'squat',
        sets: 2,
        reps: 8,
        restSeconds: 60,
        hebrewName: 'סקוואט',
        instructionsHe: 'עמדו בפיסוק נוח, כופפו ברכיים ודחפו את האגן לאחור. רדו רק עד שנוח.',
      },
      {
        exerciseId: 'pushup',
        sets: 2,
        reps: 8,
        restSeconds: 60,
        hebrewName: 'שכיבת סמיכה',
        instructionsHe: 'שמרו על גוף ישר. אפשר לבצע את התרגיל כשהברכיים על הרצפה.',
      },
      {
        exerciseId: 'plank',
        sets: 2,
        holdSeconds: 20,
        restSeconds: 45,
        hebrewName: 'פלאנק',
        instructionsHe: 'שמרו על גוף ישר וכיווצו בעדינות את שרירי הבטן.',
      },
    ],
  },
];

const formatDate = (date: Date): string => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const dateForSession = (weekStart: Date, dayIndex: number): Date => {
  const date = new Date(weekStart);
  date.setDate(date.getDate() + dayIndex);
  date.setHours(18, 0, 0, 0);
  return date;
};

export function createDefaultBeginnerPlan(now = new Date()): WeeklyPlan {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const firstDayIndex = (today.getDay() + 6) % 7;
  const dayIndexes = [firstDayIndex, firstDayIndex + 2, firstDayIndex + 4]
    .filter((dayIndex) => dayIndex <= 6);

  const sessions: WorkoutSessionPlan[] = dayIndexes.map((dayIndex, index) => {
    const template = workoutTemplates[index];
    if (!template) throw new Error('Missing default beginner workout template');
    const sessionDate = dateForSession(monday, dayIndex);
    return {
      ...template,
      id: `default-${formatDate(sessionDate)}`,
      dayIndex,
      date: `${formatDate(sessionDate)}T18:00:00`,
      exercises: template.exercises.map((exercise) => ({ ...exercise })),
      status: 'planned',
    };
  });

  return { weekStart: formatDate(monday), sessions };
}

const sessionDateKey = (plan: WeeklyPlan, session: WorkoutSessionPlan): string => {
  if (session.date) return session.date.slice(0, 10);
  const [year, month, day] = plan.weekStart.split('-').map(Number);
  const date = new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
  date.setDate(date.getDate() + session.dayIndex);
  return formatDate(date);
};

export function getNextWorkout(plan: WeeklyPlan, now = new Date()): WorkoutSessionPlan | undefined {
  const todayKey = formatDate(now);
  const upcoming = plan.sessions
    .filter((session) => session.status !== 'completed')
    .sort((a, b) => sessionDateKey(plan, a).localeCompare(sessionDateKey(plan, b)));
  return upcoming.find((session) => sessionDateKey(plan, session) >= todayKey) ?? upcoming[0];
}
