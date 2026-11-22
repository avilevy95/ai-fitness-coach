import { router } from 'expo-router';
import WorkoutSummaryScreen from '../src/screens/WorkoutSummaryScreen';
import { useWorkoutSessionStore } from '../src/store/useWorkoutSessionStore';

export default function SummaryRoute() {
  const activeWorkout = useWorkoutSessionStore((state) => state.activeWorkout);
  const now = new Date();
  const result = {
    startedAt: activeWorkout ? now.toISOString() : now.toISOString(),
    completedAt: now.toISOString(),
    durationSeconds: activeWorkout ? activeWorkout.durationMinutes * 60 : 12 * 60,
    totalReps: 0,
    averageAccuracy: 100,
    exercises: activeWorkout?.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      reps: exercise.reps ?? 0,
      accuracyScore: 100,
      durationSeconds: exercise.holdSeconds ?? 60,
    })) ?? [],
  };

  return (
    <WorkoutSummaryScreen
      result={result}
      onDone={() => router.replace('/(tabs)')}
    />
  );
}
