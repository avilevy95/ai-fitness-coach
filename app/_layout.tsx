import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, I18nManager, StyleSheet, View } from 'react-native';
import { useEffect, useState } from 'react';
import { theme } from '../src/components/ui/theme';
import { supabase } from '../src/services/supabaseClient';
import { getActivePlan, getNutritionPlan, getProfile, getWorkoutSessions } from '../src/services/api';
import { usePlanStore } from '../src/store/usePlanStore';
import { useUserStore } from '../src/store/useUserStore';
import { useWorkoutSessionStore } from '../src/store/useWorkoutSessionStore';

export default function RootLayout() {
  const setProfile = useUserStore((state) => state.setProfile);
  const clearProfile = useUserStore((state) => state.clearProfile);
  const setPlans = usePlanStore((state) => state.setPlans);
  const clearPlans = usePlanStore((state) => state.clearPlans);
  const setSessions = useWorkoutSessionStore((state) => state.setSessions);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!I18nManager.isRTL) I18nManager.forceRTL(true);

    let isMounted = true;

    const loadUserData = async (authenticated: boolean) => {
      if (!authenticated) {
        clearProfile();
        clearPlans();
        setSessions([]);
        router.replace('/auth');
        if (isMounted) setIsReady(true);
        return;
      }

      try {
        const [profileRow, workoutPlanRow, nutritionPlanRow, sessionRows] =
          await Promise.all([getProfile(), getActivePlan(), getNutritionPlan(), getWorkoutSessions()]);

        if (!isMounted) return;

        if (profileRow) {
          setProfile(profileRow.profile);
          if (workoutPlanRow && nutritionPlanRow) {
            setPlans(workoutPlanRow.plan, nutritionPlanRow.plan);
          }
          setSessions(sessionRows.map((row) => row.result));
          router.replace('/(tabs)');
        } else {
          clearProfile();
          router.replace('/onboarding');
        }
      } catch {
        if (isMounted) router.replace('/onboarding');
      } finally {
        if (isMounted) setIsReady(true);
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      loadUserData(Boolean(data.session));
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => {
        void loadUserData(Boolean(session));
      }, 0);
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [clearPlans, clearProfile, setPlans, setProfile, setSessions]);

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="auth" options={{ gestureEnabled: false }} />
        <Stack.Screen name="callback" options={{ gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="workout" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="summary" options={{ presentation: 'modal' }} />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
});
