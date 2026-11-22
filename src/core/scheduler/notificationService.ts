import * as Notifications from 'expo-notifications';
import type { WorkoutSessionPlan } from '../../types/workout.types';

export const notificationIdentifier = (sessionId: string): string =>
  `workout-reminder-${sessionId}`;

export async function requestNotificationPermissions(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

export async function scheduleReminder(
  session: WorkoutSessionPlan,
): Promise<string | null> {
  if (!session.date || !session.id) return null;
  const reminderDate = new Date(session.date);
  reminderDate.setHours(reminderDate.getHours() - 1);
  if (Number.isNaN(reminderDate.getTime()) || reminderDate.getTime() <= Date.now()) {
    return null;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return null;

  return Notifications.scheduleNotificationAsync({
    identifier: notificationIdentifier(session.id),
    content: {
      title: 'תזכורת לאימון',
      body: `${session.titleHe} מתחיל בעוד שעה`,
      data: { sessionId: session.id },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
    },
  });
}

export const scheduleHebrewOneHourReminder = scheduleReminder;

export async function cancelReminder(sessionId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationIdentifier(sessionId));
}

export const cancelSessionReminder = cancelReminder;

export async function rescheduleReminder(
  session: WorkoutSessionPlan,
): Promise<string | null> {
  if (session.id) await cancelReminder(session.id);
  return scheduleReminder(session);
}
