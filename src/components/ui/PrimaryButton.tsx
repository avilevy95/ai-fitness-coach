import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from './theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'quiet';
  icon?: ReactNode;
}

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  icon,
}: PrimaryButtonProps) {
  const unavailable = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: unavailable, busy: loading }}
      disabled={unavailable}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        unavailable && styles.disabled,
        pressed && !unavailable && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? theme.colors.accentText : theme.colors.text} />
      ) : (
        <View style={styles.labelRow}>
          {icon}
          <Text style={[styles.label, variant === 'primary' ? styles.primaryLabel : styles.otherLabel]}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: theme.radius.control,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primary: { backgroundColor: theme.colors.accent },
  secondary: { backgroundColor: theme.colors.surfaceRaised, borderWidth: 1, borderColor: theme.colors.border },
  quiet: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.46 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  labelRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 10 },
  label: { fontSize: 16, fontWeight: '800', textAlign: 'center' },
  primaryLabel: { color: theme.colors.accentText },
  otherLabel: { color: theme.colors.text },
});
