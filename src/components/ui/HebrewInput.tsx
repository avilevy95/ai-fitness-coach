import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { KeyboardTypeOptions, TextInputProps } from 'react-native';
import { theme } from './theme';

interface HebrewInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  hint?: string;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
}

export function HebrewInput({
  label,
  value,
  onChangeText,
  hint,
  error,
  keyboardType = 'default',
  ...inputProps
}: HebrewInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor={theme.colors.muted}
        selectionColor={theme.colors.accent}
        style={[styles.input, error ? styles.inputError : null]}
        textAlign="right"
        {...inputProps}
      />
      {error || hint ? <Text style={[styles.hint, error ? styles.error : null]}>{error ?? hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: { color: theme.colors.text, fontSize: 14, fontWeight: '700', textAlign: 'right' },
  input: {
    minHeight: 52,
    paddingHorizontal: 15,
    borderRadius: theme.radius.control,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    fontSize: 16,
  },
  inputError: { borderColor: theme.colors.danger },
  hint: { color: theme.colors.muted, fontSize: 12, textAlign: 'right' },
  error: { color: theme.colors.danger },
});
