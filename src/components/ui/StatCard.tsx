import { StyleSheet, Text, View } from 'react-native';
import { theme } from './theme';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  detail?: string;
  accent?: keyof typeof theme.colors;
}

export function StatCard({ label, value, unit, detail, accent = 'accent' }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: theme.colors[accent] }]}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 120,
    paddingVertical: 16,
    paddingHorizontal: 15,
    gap: 8,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  label: { color: theme.colors.muted, fontSize: 13, textAlign: 'right', fontWeight: '600' },
  valueRow: { flexDirection: 'row-reverse', alignItems: 'baseline', gap: 5 },
  value: { fontSize: 28, fontWeight: '800', fontVariant: ['tabular-nums'] },
  unit: { color: theme.colors.muted, fontSize: 13 },
  detail: { color: theme.colors.muted, fontSize: 12, textAlign: 'right' },
});
