import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import WeeklyScheduleView from '../components/calendar/WeeklyScheduleView';
import SplitWorkoutScreen from '../components/workout/SplitWorkoutScreen';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { StatCard } from '../components/ui/StatCard';
import { theme } from '../components/ui/theme';
import { rescheduleSession, produceAdaptiveRecovery } from '../core/scheduler/adaptiveRescheduler';
import { getNextWorkout } from '../core/scheduler/defaultBeginnerPlan';
import { usePlanStore } from '../store/usePlanStore';
import { useUserStore } from '../store/useUserStore';
import { useWorkoutSessionStore } from '../store/useWorkoutSessionStore';
import type { ExerciseRepState } from '../types/pose.types';
import type { WorkoutSessionPlan } from '../types/workout.types';

interface DashboardScreenProps {
  onStartWorkout?: (workout: WorkoutSessionPlan) => void;
  onWorkoutFinish?: (workout: WorkoutSessionPlan) => void;
  repState?: ExerciseRepState;
  onOpenNutrition?: () => void;
  onOpenProfile?: () => void;
}

export default function DashboardScreen({
  onStartWorkout,
  onWorkoutFinish,
  repState,
  onOpenNutrition,
  onOpenProfile,
}: DashboardScreenProps) {
  const profile = useUserStore((state) => state.profile);
  const weeklyPlan = usePlanStore((state) => state.weeklyPlan);
  const updateWeeklyPlan = usePlanStore((state) => state.updateWeeklyPlan);
  const sessions = useWorkoutSessionStore((state) => state.sessions);
  const startWorkout = useWorkoutSessionStore((state) => state.startWorkout);
  const activeWorkout = useWorkoutSessionStore((state) => state.activeWorkout);
  const clearActiveWorkout = useWorkoutSessionStore((state) => state.clearActiveWorkout);
  const [showSchedule, setShowSchedule] = useState(false);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const now = new Date();
  const completed = sessions.length;
  const streak = useMemo(() => {
    const dateKey = (date: Date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dates = new Set(
      sessions.flatMap((session) => {
        const date = new Date(session.completedAt);
        return Number.isNaN(date.getTime()) ? [] : [dateKey(date)];
      }),
    );
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    if (!dates.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
    let count = 0;
    while (dates.has(dateKey(cursor))) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [sessions]);
  const recovery = weeklyPlan ? produceAdaptiveRecovery(weeklyPlan, now) : [];
  const nextWorkout = weeklyPlan ? getNextWorkout(weeklyPlan, now) : undefined;

  const start = (workout: WorkoutSessionPlan) => {
    setActiveExerciseIndex(0);
    setPaused(false);
    startWorkout(workout);
    onStartWorkout?.(workout);
  };

  const finishWorkout = () => {
    if (activeWorkout) onWorkoutFinish?.(activeWorkout);
    clearActiveWorkout();
  };

  const skipExercise = () => {
    if (!activeWorkout) return;
    if (activeExerciseIndex < activeWorkout.exercises.length - 1) {
      setActiveExerciseIndex((index) => index + 1);
      return;
    }
    finishWorkout();
  };

  const recover = (session: WorkoutSessionPlan, option: (typeof recovery)[number]['options'][number]) => {
    if (!weeklyPlan) return;
    updateWeeklyPlan({
      ...weeklyPlan,
      sessions: weeklyPlan.sessions.map((item) =>
      item === session ? rescheduleSession(item, option) : item,
      ),
    });
  };

  if (activeWorkout && !onStartWorkout) {
    const exercise = activeWorkout.exercises[activeExerciseIndex];
    if (!exercise) {
      return (
        <ScreenContainer title={activeWorkout.titleHe} subtitle="האימון הזה עדיין לא כולל תרגילים.">
          <PrimaryButton title="חזרה ליום שלי" onPress={finishWorkout} />
        </ScreenContainer>
      );
    }
    return (
      <ScreenContainer
        title={activeWorkout.titleHe}
        subtitle={`תרגיל ${activeExerciseIndex + 1} מתוך ${activeWorkout.exercises.length}`}
        scroll={false}
      >
        <SplitWorkoutScreen
          exercise={exercise}
          repState={repState}
          paused={paused}
          onPause={() => setPaused((value) => !value)}
          onSkip={skipExercise}
        />
        <PrimaryButton
          title={activeExerciseIndex === activeWorkout.exercises.length - 1 ? 'סיום אימון' : 'התרגיל הבא'}
          variant="secondary"
          onPress={skipExercise}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      title={profile ? 'היי, ממשיכים?' : 'היי, מתחילים?'}
      subtitle="ממשיכים בקצב שלך. גם אימון קטן נחשב."
      rightAction={
        onOpenProfile ? (
          <Pressable accessibilityRole="button" onPress={onOpenProfile} style={styles.profileButton}>
            <Text style={styles.profileButtonText}>פרופיל</Text>
          </Pressable>
        ) : null
      }
    >
      <View style={styles.statsRow}>
        <StatCard label="רצף ימים" value={streak} unit="ימים" detail="כל צעד מצטבר" />
        <StatCard label="אימונים שהושלמו" value={completed} unit="אימונים" accent="blue" />
      </View>

      {nextWorkout ? (
        <View style={styles.workoutPanel}>
          <View style={styles.workoutHeading}>
            <Text style={styles.workoutEyebrow}>האימון הבא שלך</Text>
            <Text style={styles.workoutTitle}>{nextWorkout.titleHe}</Text>
            <Text style={styles.workoutMeta}>
              {nextWorkout.durationMinutes} דקות · {nextWorkout.exercises.length} תרגילים
            </Text>
          </View>
          <View style={styles.exerciseList}>
            {nextWorkout.exercises.slice(0, 3).map((exercise) => (
              <View key={exercise.exerciseId} style={styles.exerciseRow}>
                <Text style={styles.exerciseDetail}>
                  {exercise.sets} סטים · {exercise.reps ? `${exercise.reps} חזרות` : `${exercise.holdSeconds ?? 0} שניות`}
                </Text>
                <Text style={styles.exerciseName}>{exercise.hebrewName}</Text>
              </View>
            ))}
          </View>
          <PrimaryButton title="מתחילים אימון" onPress={() => start(nextWorkout)} />
        </View>
      ) : (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>{weeklyPlan ? 'אין אימון נוסף מתוכנן' : 'התוכנית שלך מחכה לך'}</Text>
          <Text style={styles.emptyText}>
            {weeklyPlan ? 'אפשר לנוח, או לבחור ימים חדשים בפרופיל.' : 'ממלאים כמה פרטים קצרים ונתאים לך תוכנית אישית.'}
          </Text>
          {onOpenProfile ? <PrimaryButton title="פותחים פרופיל" variant="secondary" onPress={onOpenProfile} /> : null}
        </View>
      )}

      {recovery.map(({ session, options }) => (
        <View key={session.id ?? session.dayIndex} style={styles.recoveryPanel}>
          <Text style={styles.recoveryTitle}>לא הסתדר? אפשר להתאים מחדש</Text>
          <Text style={styles.recoveryText}>{session.titleHe} עדיין מחכה. בוחרים מה נכון להיום.</Text>
          <View style={styles.recoveryActions}>
            {options.map((option) => (
              <Pressable
                key={option.mode}
                accessibilityRole="button"
                onPress={() => recover(session, option)}
                style={styles.recoveryButton}
              >
                <Text style={styles.recoveryButtonText}>{option.labelHe}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      {onOpenNutrition ? (
        <Pressable accessibilityRole="button" onPress={onOpenNutrition} style={styles.nutritionLink}>
          <View style={styles.nutritionCopy}>
            <Text style={styles.nutritionTitle}>גם לאוכל יש מקום בתוכנית</Text>
            <Text style={styles.nutritionText}>יעדים יומיים ורעיונות לארוחות</Text>
          </View>
          <Text style={styles.arrow}>←</Text>
        </Pressable>
      ) : null}

      {weeklyPlan ? (
        <View style={styles.scheduleSection}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showSchedule }}
            onPress={() => setShowSchedule((value) => !value)}
            style={styles.scheduleToggle}
          >
            <Text style={styles.scheduleToggleText}>{showSchedule ? 'סוגרים לוח שבועי' : 'לוח אימונים שבועי'}</Text>
            <Text style={styles.arrow}>{showSchedule ? '↑' : '↓'}</Text>
          </Pressable>
          {showSchedule ? (
            <WeeklyScheduleView
              plan={weeklyPlan}
              onSessionPress={(session) => start(session)}
            />
          ) : null}
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row-reverse', gap: 12 },
  workoutPanel: {
    padding: 20,
    gap: 18,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  workoutHeading: { gap: 7, alignItems: 'flex-end' },
  workoutEyebrow: { color: theme.colors.accent, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  workoutTitle: { color: theme.colors.text, fontSize: 24, fontWeight: '800', textAlign: 'right' },
  workoutMeta: { color: theme.colors.muted, fontSize: 14, textAlign: 'right' },
  exerciseList: { gap: 12 },
  exerciseRow: {
    minHeight: 48,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 10,
  },
  exerciseName: { flex: 1, color: theme.colors.text, fontSize: 15, fontWeight: '700', textAlign: 'right' },
  exerciseDetail: { color: theme.colors.muted, fontSize: 12, textAlign: 'left' },
  emptyPanel: {
    padding: 20,
    gap: 12,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '800', textAlign: 'right' },
  emptyText: { color: theme.colors.muted, fontSize: 14, lineHeight: 22, textAlign: 'right' },
  recoveryPanel: {
    padding: 17,
    gap: 12,
    borderRadius: theme.radius.card,
    backgroundColor: '#30251B',
    borderWidth: 1,
    borderColor: '#59402B',
  },
  recoveryTitle: { color: theme.colors.orange, fontSize: 16, fontWeight: '800', textAlign: 'right' },
  recoveryText: { color: '#E1C5A5', fontSize: 14, lineHeight: 21, textAlign: 'right' },
  recoveryActions: { gap: 8 },
  recoveryButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#493625' },
  recoveryButtonText: { color: theme.colors.text, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  nutritionLink: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surfaceRaised,
  },
  nutritionCopy: { gap: 6 },
  nutritionTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '800', textAlign: 'right' },
  nutritionText: { color: theme.colors.muted, fontSize: 13, textAlign: 'right' },
  arrow: { color: theme.colors.accent, fontSize: 20, fontWeight: '700' },
  scheduleSection: { gap: 12 },
  scheduleToggle: {
    minHeight: 48,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderRadius: theme.radius.control,
    backgroundColor: theme.colors.surface,
  },
  scheduleToggleText: { color: theme.colors.text, fontSize: 15, fontWeight: '700', textAlign: 'right' },
  profileButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 13, borderRadius: theme.radius.pill, backgroundColor: theme.colors.surfaceRaised },
  profileButtonText: { color: theme.colors.text, fontSize: 13, fontWeight: '700' },
});
