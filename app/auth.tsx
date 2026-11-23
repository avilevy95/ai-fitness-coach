import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { HebrewInput } from '../src/components/ui/HebrewInput';
import { PrimaryButton } from '../src/components/ui/PrimaryButton';
import { theme } from '../src/components/ui/theme';
import { supabase } from '../src/services/supabaseClient';

export default function AuthRoute() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async () => {
    setMessage(null);
    if (!email.trim() || password.length < 6) {
      setMessage('יש להזין אימייל וסיסמה באורך 6 תווים לפחות.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (!data.session) {
          setMessage('נשלח אליך אימייל לאישור החשבון. לאחר האישור אפשר להתחבר.');
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
      router.replace('/(tabs)');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'ההתחברות נכשלה.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <View style={styles.heading}>
          <Text style={styles.title}>מאמן הכושר שלי</Text>
          <Text style={styles.subtitle}>
            {mode === 'signin' ? 'התחברו כדי להמשיך בתוכנית שלכם' : 'צרו חשבון אישי והתוכנית מתחילה'}
          </Text>
        </View>

        <View style={styles.form}>
          <HebrewInput
            label="אימייל"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <HebrewInput
            label="סיסמה"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <PrimaryButton
          title={mode === 'signin' ? 'התחברות' : 'יצירת חשבון'}
          onPress={submit}
          loading={loading}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setMode((current) => (current === 'signin' ? 'signup' : 'signin'));
            setMessage(null);
          }}
          style={styles.switch}
        >
          <Text style={styles.switchText}>
            {mode === 'signin' ? 'אין לי חשבון — הרשמה' : 'כבר יש לי חשבון — התחברות'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  card: { gap: 18 },
  heading: { gap: 8 },
  title: {
    color: theme.colors.text,
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'right',
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'right',
  },
  form: { gap: 12 },
  message: {
    color: theme.colors.danger,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
  },
  switch: {
    minHeight: 44,
    justifyContent: 'center',
  },
  switchText: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});
