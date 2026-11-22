import { router } from 'expo-router';
import { useState } from 'react';
import SplitWorkoutScreen from '../src/components/workout/SplitWorkoutScreen';
import type { ExercisePrescription } from '../src/types/workout.types';
import { usePlanStore } from '../src/store/usePlanStore';

export default function WorkoutRoute() {
  const weeklyPlan = usePlanStore((state) => state.weeklyPlan);
  const workout = weeklyPlan?.sessions.find((session) => session.status !== 'completed');
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const exercise: ExercisePrescription | undefined = workout?.exercises[exerciseIndex];

  if (!workout || !exercise) {
    return null;
  }

  const skip = () => {
    if (exerciseIndex < workout.exercises.length - 1) {
      setExerciseIndex((value) => value + 1);
    } else {
      router.replace('/summary');
    }
  };

  return (
    <SplitWorkoutScreen
      exercise={exercise}
      paused={paused}
      onPause={() => setPaused((value) => !value)}
      onSkip={skip}
    />
  );
}
