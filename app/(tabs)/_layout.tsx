import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#22C55E',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          direction: 'rtl',
          backgroundColor: '#111827',
          borderTopColor: '#334155',
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'בית' }} />
      <Tabs.Screen name="schedule" options={{ title: 'תוכנית ולו"ז' }} />
      <Tabs.Screen name="nutrition" options={{ title: 'תזונה' }} />
      <Tabs.Screen name="profile" options={{ title: 'פרופיל' }} />
    </Tabs>
  );
}
