import { StyleSheet, Text, View } from 'react-native';
import { theme } from './theme';

interface MacroBarProps {
  label: string;
  value: number;
  target: number;
  color?: string;
  unit?: string;
}

export function MacroBar({ label, value, target, color = theme.colors.accent, unit = 'גרם' }: MacroBarProps) {
  const progress = target > 0 ? Math.min(1, Math.max(0, value / target)) : 0;
  return (
    <View style={styles.container} accessibilityLabel={`${label}: ${value} מתוך ${target} ${unit}`}>
      <View style={styles.labels}>
        <Text style={styles.value}>{value} / {target} {unit}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 9 },
  labels: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
  value: { color: theme.colors.muted, fontSize: 12, fontVariant: ['tabular-nums'] },
  track: { height: 8, overflow: 'hidden', borderRadius: theme.radius.pill, backgroundColor: theme.colors.track },
  fill: { height: '100%', borderRadius: theme.radius.pill },
});
