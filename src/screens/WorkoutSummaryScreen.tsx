import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { StatCard } from '../components/ui/StatCard';
import { theme } from '../components/ui/theme';
import { useUserStore } from '../store/useUserStore';
import { useWorkoutSessionStore } from '../store/useWorkoutSessionStore';
import type { SessionResult } from '../types/workout.types';
import { saveWorkoutResult } from '../services/api';

interface WorkoutSummaryScreenProps {
  result: SessionResult;
  onDone?: () => void;
}

export default function WorkoutSummaryScreen({ result, onDone }: WorkoutSummaryScreenProps) {
  const userId = useUserStore((state) => state.profile?.id);
  const saveSession = useWorkoutSessionStore((state) => state.saveSession);
  const clearActiveWorkout = useWorkoutSessionStore((state) => state.clearActiveWorkout);
  const [saved, setSaved] = useState(false);
  const durationMinutes = Math.round(result.durationSeconds / 60);
  const accuracy = Math.round(result.averageAccuracy);

  const save = async () => {
    if (!saved) {
      const session = { ...result, ...(userId ? { userId } : {}) };
      try {
        await saveWorkoutResult(session);
        saveSession(session);
        setSaved(true);
      } catch {
        return;
      }
    }
    clearActiveWorkout();
    onDone?.();
  };

  return (
    <ScreenContainer title="כל הכבוד, עשית את זה" subtitle="עוד אימון אחד שמקרב אותך למטרה שלך.">
      <View style={styles.hero}>
        <Text style={styles.heroMark}>✓</Text>
        <Text style={styles.heroTitle}>האימון הושלם</Text>
        <Text style={styles.heroText}>העבודה שלך היום חשובה יותר משלמות.</Text>
      </View>
      <View style={styles.statsRow}>
        <StatCard label="משך האימון" value={durationMinutes} unit="דקות" />
        <StatCard label="חזרות" value={result.totalReps} accent="blue" />
      </View>
      <View style={styles.accuracyPanel}>
        <View style={styles.accuracyCopy}>
          <Text style={styles.accuracyTitle}>דיוק התנועה</Text>
          <Text style={styles.accuracyText}>מדד כללי של הביצוע לאורך האימון</Text>
        </View>
        <Text style={styles.accuracyValue}>{accuracy}%</Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.min(100, Math.max(0, accuracy))}%` }]} />
        </View>
      </View>
      <View style={styles.exerciseSection}>
        <Text style={styles.sectionTitle}>מה עשית היום</Text>
        {result.exercises.map((exercise, index) => (
          <View key={`${exercise.exerciseId}-${index}`} style={styles.exerciseRow}>
            <View style={styles.exerciseNumbers}>
              <Text style={styles.exerciseAccuracy}>{Math.round(exercise.accuracyScore)}% דיוק</Text>
              <Text style={styles.exerciseReps}>{exercise.reps} חזרות · {Math.round(exercise.durationSeconds)} שנ׳</Text>
            </View>
            <Text style={styles.exerciseName}>{exerciseName(exercise.exerciseId)}</Text>
          </View>
        ))}
      </View>
      <PrimaryButton title={saved ? 'נשמר — ממשיכים' : 'שומרים וממשיכים'} onPress={save} />
    </ScreenContainer>
  );
}

function exerciseName(id: SessionResult['exercises'][number]['exerciseId']) {
  const names: Record<typeof id, string> = {
    squat: 'סקוואט',
    pushup: 'שכיבת סמיכה',
    plank: 'פלאנק',
    lunge: 'מכרעים',
    crunch: 'כפיפות בטן',
    jumping_jack: 'קפיצות',
  };
  return names[id];
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 9, paddingVertical: 20 },
  heroMark: { width: 64, height: 64, overflow: 'hidden', borderRadius: 32, backgroundColor: theme.colors.accent, color: theme.colors.accentText, fontSize: 34, fontWeight: '900', textAlign: 'center', textAlignVertical: 'center' },
  heroTitle: { color: theme.colors.text, fontSize: 25, fontWeight: '900', textAlign: 'center' },
  heroText: { color: theme.colors.muted, fontSize: 14, textAlign: 'center' },
  statsRow: { flexDirection: 'row-reverse', gap: 12 },
  accuracyPanel: { padding: 18, gap: 14, borderRadius: theme.radius.card, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  accuracyCopy: { gap: 5, alignItems: 'flex-end' },
  accuracyTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '800' },
  accuracyText: { color: theme.colors.muted, fontSize: 12, textAlign: 'right' },
  accuracyValue: { color: theme.colors.accent, fontSize: 30, fontWeight: '900', textAlign: 'right', fontVariant: ['tabular-nums'] },
  track: { height: 9, overflow: 'hidden', borderRadius: theme.radius.pill, backgroundColor: theme.colors.track },
  fill: { height: '100%', borderRadius: theme.radius.pill, backgroundColor: theme.colors.accent },
  exerciseSection: { gap: 14 },
  sectionTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '800', textAlign: 'right' },
  exerciseRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  exerciseNumbers: { gap: 5, alignItems: 'flex-start' },
  exerciseName: { flex: 1, color: theme.colors.text, fontSize: 15, fontWeight: '700', textAlign: 'right' },
  exerciseAccuracy: { color: theme.colors.accent, fontSize: 12, fontWeight: '700' },
  exerciseReps: { color: theme.colors.muted, fontSize: 11 },
});
