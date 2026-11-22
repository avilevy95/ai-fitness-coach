import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RecoveryOption } from '../../core/scheduler/adaptiveRescheduler';
import { produceAdaptiveRecovery } from '../../core/scheduler/adaptiveRescheduler';
import type { WeeklyPlan, WorkoutSessionPlan } from '../../types/workout.types';

export interface WeeklyScheduleViewProps {
  plan: WeeklyPlan;
  onSessionPress?: (session: WorkoutSessionPlan) => void;
  onRecoveryPress?: (session: WorkoutSessionPlan, option: RecoveryOption) => void;
  now?: Date;
}

const statusLabels: Record<NonNullable<WorkoutSessionPlan['status']>, string> = {
  planned: 'מתוכנן',
  completed: 'הושלם',
  missed: 'הוחמצה',
};

const dateForDay = (weekStart: string, dayIndex: number): Date => {
  const [year, month, day] = weekStart.slice(0, 10).split('-').map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1, 12);
  date.setDate(date.getDate() + dayIndex);
  return date;
};

const formatTime = (session: WorkoutSessionPlan): string => {
  if (!session.date) return '';
  const date = new Date(session.date);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
};

export default function WeeklyScheduleView({
  plan,
  onSessionPress,
  onRecoveryPress,
  now = new Date(),
}: WeeklyScheduleViewProps) {
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const recovery = useMemo(() => produceAdaptiveRecovery(plan, now), [plan, now]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>לוח אימונים שבועי</Text>
      <View style={styles.week}>
        {Array.from({ length: 7 }, (_, dayIndex) => {
          const date = dateForDay(plan.weekStart, dayIndex);
          const sessions = plan.sessions.filter((session) => session.dayIndex === dayIndex);
          const recoveryForDay = recovery.filter(({ session }) => session.dayIndex === dayIndex);

          return (
            <View key={dayIndex} style={styles.day}>
              <Text style={styles.dayName}>
                {date.toLocaleDateString('he-IL', { weekday: 'short' })}
              </Text>
              <Text style={styles.dayNumber}>
                {date.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })}
              </Text>

              {sessions.length === 0 ? (
                <Text style={styles.rest}>יום מנוחה</Text>
              ) : (
                sessions.map((session, index) => {
                  const id = session.id ?? `${plan.weekStart}-${dayIndex}-${index}`;
                  const status = session.status ?? 'planned';
                  const selected = selectedId === id;
                  return (
                    <Pressable
                      key={id}
                      accessibilityRole="button"
                      style={[styles.session, selected && styles.selectedSession]}
                      onPress={() => {
                        setSelectedId(id);
                        onSessionPress?.(session);
                      }}
                    >
                      <Text style={styles.sessionTitle}>{session.titleHe}</Text>
                      {!!formatTime(session) && (
                        <Text style={styles.time}>{formatTime(session)}</Text>
                      )}
                      <Text
                        style={[
                          styles.badge,
                          status === 'completed'
                            ? styles.completed
                            : status === 'missed'
                              ? styles.missed
                              : styles.planned,
                        ]}
                      >
                        {statusLabels[status]}
                      </Text>
                    </Pressable>
                  );
                })
              )}

              {recoveryForDay.map(({ session, options }) => (
                <View key={session.id ?? `recovery-${dayIndex}`} style={styles.recovery}>
                  <Text style={styles.recoveryTitle}>אימון שלא בוצע</Text>
                  {options.map((option) => (
                    <Pressable
                      key={option.mode}
                      accessibilityRole="button"
                      style={styles.recoveryButton}
                      onPress={() => onRecoveryPress?.(session, option)}
                    >
                      <Text style={styles.recoveryButtonText}>{option.labelHe}</Text>
                    </Pressable>
                  ))}
                </View>
              ))}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  content: { padding: 16, direction: 'rtl' },
  heading: { fontSize: 22, fontWeight: '700', color: '#162238', textAlign: 'right', marginBottom: 14 },
  week: { flexDirection: 'row-reverse', gap: 8 },
  day: { flex: 1, minWidth: 112, minHeight: 180, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 8, borderWidth: 1, borderColor: '#E7EAF0' },
  dayName: { fontSize: 14, fontWeight: '700', textAlign: 'center', color: '#25324A' },
  dayNumber: { fontSize: 12, textAlign: 'center', color: '#70798A', marginTop: 2, marginBottom: 8 },
  rest: { fontSize: 12, textAlign: 'center', color: '#9AA2AF', marginTop: 24 },
  session: { borderRadius: 8, backgroundColor: '#EEF4FF', padding: 8, marginBottom: 6, borderWidth: 1, borderColor: 'transparent' },
  selectedSession: { borderColor: '#3973E6' },
  sessionTitle: { color: '#1F3C70', fontWeight: '700', textAlign: 'right', fontSize: 13 },
  time: { color: '#526176', textAlign: 'right', fontSize: 12, marginTop: 4 },
  badge: { alignSelf: 'flex-end', borderRadius: 10, overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 2, marginTop: 6, fontSize: 11, color: '#FFFFFF' },
  planned: { backgroundColor: '#3973E6' },
  completed: { backgroundColor: '#25855A' },
  missed: { backgroundColor: '#C44D58' },
  recovery: { marginTop: 6, padding: 7, borderRadius: 8, backgroundColor: '#FFF4E5' },
  recoveryTitle: { color: '#8A5512', fontWeight: '700', fontSize: 12, textAlign: 'right', marginBottom: 5 },
  recoveryButton: { backgroundColor: '#FFFFFF', borderRadius: 6, paddingVertical: 7, paddingHorizontal: 5, marginTop: 4, borderWidth: 1, borderColor: '#E9C79C' },
  recoveryButtonText: { color: '#5D4323', fontSize: 11, textAlign: 'right', fontWeight: '600' },
});
