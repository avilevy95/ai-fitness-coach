import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import SplitWorkoutScreen from '../src/components/workout/SplitWorkoutScreen';
import { PrimaryButton } from '../src/components/ui/PrimaryButton';
import { ScreenContainer } from '../src/components/ui/ScreenContainer';
import { getNextWorkout } from '../src/core/scheduler/defaultBeginnerPlan';
import type { ExercisePrescription } from '../src/types/workout.types';
import { usePlanStore } from '../src/store/usePlanStore';

export default function WorkoutRoute() {
  const weeklyPlan = usePlanStore((state) => state.weeklyPlan);
  const updateWeeklyPlan = usePlanStore((state) => state.updateWeeklyPlan);
  const { workoutId } = useLocalSearchParams<{ workoutId?: string | string[] }>();
  const requestedWorkoutId = Array.isArray(workoutId) ? workoutId[0] : workoutId;
  const workout = weeklyPlan
    ? requestedWorkoutId
      ? weeklyPlan.sessions.find(
          (session) => session.id === requestedWorkoutId || String(session.dayIndex) === requestedWorkoutId,
        )
      : getNextWorkout(weeklyPlan)
    : undefined;
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const exercise: ExercisePrescription | undefined = workout?.exercises[exerciseIndex];

  const skip = () => {
    if (!workout || !weeklyPlan) return;
    if (exerciseIndex < workout.exercises.length - 1) {
      setExerciseIndex((value) => value + 1);
    } else {
      updateWeeklyPlan({
        ...weeklyPlan,
        sessions: weeklyPlan.sessions.map((session) =>
          session === workout || (workout.id && session.id === workout.id)
            ? { ...session, status: 'completed' }
            : session,
        ),
      });
      router.replace('/summary');
    }
  };

  if (!workout || !exercise) {
    return (
      <ScreenContainer title="לא מצאנו את האימון" subtitle="אפשר לחזור ללוח ולבחור אימון אחר.">
        <PrimaryButton title="חזרה ליום שלי" onPress={() => router.replace('/(tabs)')} />
      </ScreenContainer>
    );
  }

  return (
    <SplitWorkoutScreen
      exercise={exercise}
      paused={paused}
      onPause={() => setPaused((value) => !value)}
      onSkip={skip}
    />
  );
}
