import type { WeeklyPlan, WorkoutSessionPlan } from '../../types/workout.types';

export type RecoveryMode = 'shift' | 'express';

export interface RecoveryOption {
  mode: RecoveryMode;
  date: string;
  durationMinutes: number;
  labelHe: string;
}

export interface AdaptiveRecovery {
  session: WorkoutSessionPlan;
  options: RecoveryOption[];
}

const parseSessionDate = (session: WorkoutSessionPlan): Date | null => {
  if (!session.date) return null;
  const date = new Date(session.date);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function detectMissedSessions(
  plan: WeeklyPlan,
  now: Date = new Date(),
): WorkoutSessionPlan[] {
  return plan.sessions.filter((session) => {
    if (session.status === 'missed') return true;
    if (session.status === 'completed') return false;
    const date = parseSessionDate(session);
    return date ? date.getTime() < now.getTime() : false;
  });
}

export const detectPastDueSessions = detectMissedSessions;

export function createRecoveryOptions(
  session: WorkoutSessionPlan,
  now: Date = new Date(),
): RecoveryOption[] {
  const original = parseSessionDate(session) ?? new Date(now);
  const shiftDate = new Date(original);

  // Prefer the next available day at the original session time.
  if (shiftDate.getTime() <= now.getTime()) {
    shiftDate.setTime(now.getTime());
    shiftDate.setSeconds(0, 0);
  }
  shiftDate.setDate(shiftDate.getDate() + 1);

  const shifted = new Date(shiftDate);
  const pad = (value: number) => String(value).padStart(2, '0');
  const toIso = (date: Date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;

  return [
    {
      mode: 'shift',
      date: toIso(shifted),
      durationMinutes: session.durationMinutes,
      labelHe: `הזז לאימון מלא (${session.durationMinutes} דק׳)`,
    },
    {
      mode: 'express',
      date: toIso(shifted),
      durationMinutes: 12,
      labelHe: 'אימון Express של 12 דק׳',
    },
  ];
}

export function produceAdaptiveRecovery(
  plan: WeeklyPlan,
  now: Date = new Date(),
): AdaptiveRecovery[] {
  return detectMissedSessions(plan, now).map((session) => ({
    session,
    options: createRecoveryOptions(session, now),
  }));
}

export function rescheduleSession(
  session: WorkoutSessionPlan,
  option: RecoveryOption,
): WorkoutSessionPlan {
  return {
    ...session,
    date: option.date,
    durationMinutes: option.durationMinutes,
    status: 'planned',
  };
}
