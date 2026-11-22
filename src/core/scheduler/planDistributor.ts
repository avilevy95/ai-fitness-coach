import type { UserProfile, WeeklyPlan, WorkoutSessionPlan } from '../../types/workout.types';

export interface PreferredTimeSlot {
  hour: number;
  minute: number;
}

const toLocalDateTime = (date: Date, hour: number, minute: number): string => {
  const result = new Date(date);
  result.setHours(hour, minute, 0, 0);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${result.getFullYear()}-${pad(result.getMonth() + 1)}-${pad(result.getDate())}T${pad(hour)}:${pad(minute)}:00`;
};

const startOfWeek = (weekStart: string): Date => {
  const [year, month, day] = weekStart.slice(0, 10).split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1, 12, 0, 0, 0);
};

export function distributePlan(
  profile: Pick<UserProfile, 'preferredDays' | 'minutesPerSession' | 'goals'>,
  weekStart: string,
  preferredTimes: PreferredTimeSlot[] = [{ hour: 18, minute: 0 }],
  templateSessions: WorkoutSessionPlan[] = [],
): WeeklyPlan {
  const week = startOfWeek(weekStart);
  const preferredDays = [...new Set(profile.preferredDays)]
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    .sort((a, b) => a - b);

  const sessions: WorkoutSessionPlan[] = preferredDays.map((dayIndex, index) => {
    const date = new Date(week);
    date.setDate(week.getDate() + dayIndex);
    const slot = preferredTimes[index % preferredTimes.length] ?? { hour: 18, minute: 0 };
    const template = templateSessions[index];

    return {
      ...(template ?? {}),
      id: template?.id,
      dayIndex,
      date: toLocalDateTime(date, slot.hour, slot.minute),
      titleHe: template?.titleHe ?? `אימון ${index + 1}`,
      durationMinutes: template?.durationMinutes ?? profile.minutesPerSession,
      exercises: template?.exercises ?? [],
      status: template?.status ?? 'planned',
    };
  });

  return { weekStart: weekStart.slice(0, 10), sessions };
}

export const generateConcreteSessions = distributePlan;
export const distributePreferredSessions = distributePlan;
