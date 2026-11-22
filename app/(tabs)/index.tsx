import { router } from 'expo-router';
import DashboardScreen from '../../src/screens/DashboardScreen';

export default function HomeRoute() {
  return (
    <DashboardScreen
      onStartWorkout={(workout) => router.push({ pathname: '/workout', params: { workoutId: workout.id ?? String(workout.dayIndex) } })}
      onWorkoutFinish={() => router.push('/summary')}
      onOpenNutrition={() => router.push('/(tabs)/nutrition')}
      onOpenProfile={() => router.push('/(tabs)/profile')}
    />
  );
}
