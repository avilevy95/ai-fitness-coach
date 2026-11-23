import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { theme } from '../src/components/ui/theme';

export default function AuthCallbackRoute() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.accent} />
      <Text style={styles.message}>מאמתים את כתובת האימייל שלך…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: theme.colors.background,
  },
  message: {
    color: theme.colors.text,
    fontSize: 16,
    textAlign: 'center',
  },
});
