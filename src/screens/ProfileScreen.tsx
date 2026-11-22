import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { HebrewInput } from '../components/ui/HebrewInput';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { theme } from '../components/ui/theme';
import { usePlanStore } from '../store/usePlanStore';
import { useUserStore } from '../store/useUserStore';
import type { UserProfile } from '../types/workout.types';

interface ProfileScreenProps {
  onOnboarding?: () => void;
  onSaved?: () => void;
}

export default function ProfileScreen({ onOnboarding, onSaved }: ProfileScreenProps) {
  const profile = useUserStore((state) => state.profile);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const generate = usePlanStore((state) => state.generate);
  const isGenerating = usePlanStore((state) => state.isGenerating);
  const planError = usePlanStore((state) => state.error);
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [fitnessLevel, setFitnessLevel] = useState<UserProfile['fitnessLevel']>('beginner');
  const [preferredDays, setPreferredDays] = useState<number[]>([]);
  const [minutesPerSession, setMinutesPerSession] = useState(30);
  const [goals, setGoals] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setAge(String(profile.age));
    setWeight(String(profile.weightKg));
    setHeight(String(profile.heightCm));
    setFitnessLevel(profile.fitnessLevel);
    setPreferredDays(profile.preferredDays);
    setMinutesPerSession(profile.minutesPerSession);
    setGoals(profile.goals);
    setEquipment(profile.equipment);
  }, [profile]);

  if (!profile) {
    return (
      <ScreenContainer title="הפרופיל שלך" subtitle="נכיר אותך קצת כדי להתאים את התוכנית.">
        <Text style={styles.message}>עוד לא הגדרת פרופיל.</Text>
        {onOnboarding ? <PrimaryButton title="מתחילים היכרות קצרה" onPress={onOnboarding} /> : null}
      </ScreenContainer>
    );
  }

  const save = async () => {
    const next: UserProfile = {
      ...profile,
      age: Number(age),
      weightKg: Number(weight),
      heightCm: Number(height),
      fitnessLevel,
      preferredDays,
      minutesPerSession,
      goals,
      equipment,
    };
    if (
      !Number.isFinite(next.age) || next.age < 16 || next.age > 100 ||
      !Number.isFinite(next.weightKg) || next.weightKg < 35 || next.weightKg > 250 ||
      !Number.isFinite(next.heightCm) || next.heightCm < 120 || next.heightCm > 230 ||
      preferredDays.length === 0 || goals.length === 0 || equipment.length === 0
    ) {
      setMessage('כדאי לבדוק את הנתונים ולבחור מטרה, ציוד ולפחות יום אחד לאימון.');
      return;
    }
    updateProfile(next);
    setMessage(null);
    try {
      await generate(next);
      setMessage('הפרטים נשמרו והתוכנית עודכנה.');
      onSaved?.();
    } catch {
      setMessage('הפרטים נשמרו, אבל לא הצלחנו לעדכן את התוכנית. אפשר לנסות שוב.');
    }
  };

  return (
    <ScreenContainer title="הפרופיל שלך" subtitle="אפשר לשנות פרטים בכל זמן. עדכון הנתונים ירענן גם את התוכנית.">
      <View style={styles.form}>
        <HebrewInput label="גיל" value={age} onChangeText={setAge} keyboardType="number-pad" />
        <View style={styles.inputRow}>
          <HebrewInput label="משקל (ק״ג)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
          <HebrewInput label="גובה (ס״מ)" value={height} onChangeText={setHeight} keyboardType="number-pad" />
        </View>
        <Text style={styles.label}>רמת ניסיון</Text>
        <View style={styles.choices}>
          {([
            ['beginner', 'מתחיל/ה'],
            ['intermediate', 'בינוני/ת'],
            ['advanced', 'מנוסה'],
          ] as const).map(([value, label]) => (
            <Choice
              key={value}
              label={label}
              selected={fitnessLevel === value}
              onPress={() => setFitnessLevel(value)}
            />
          ))}
        </View>
        <Text style={styles.label}>מטרות</Text>
        <View style={styles.choices}>
          {[
            ['כושר ובריאות', 'כושר ובריאות'],
            ['כוח ושריר', 'כוח ושריר'],
            ['ירידה במשקל', 'ירידה במשקל'],
            ['גמישות ויציבה', 'גמישות ויציבה'],
          ].map(([value, label]) => (
            <Choice
              key={value}
              label={label}
              selected={goals.includes(value)}
              onPress={() => setGoals((current) =>
                current.includes(value) ? current.filter((goal) => goal !== value) : [...current, value],
              )}
            />
          ))}
        </View>
        <Text style={styles.label}>ציוד זמין</Text>
        <View style={styles.choices}>
          {['ללא ציוד', 'גומיות', 'משקולות', 'חדר כושר'].map((item) => (
            <Choice
              key={item}
              label={item}
              selected={equipment.includes(item)}
              onPress={() => setEquipment((current) =>
                current.includes(item) ? current.filter((entry) => entry !== item) : [...current, item],
              )}
            />
          ))}
        </View>
        <Text style={styles.label}>ימים מועדפים לאימון</Text>
        <View style={styles.dayRow}>
          {['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'].map((label, index) => {
            const selected = preferredDays.includes(index);
            return (
              <Choice
                key={label}
                label={label}
                selected={selected}
                onPress={() => setPreferredDays((days) =>
                  selected ? days.filter((day) => day !== index) : [...days, index].sort(),
                )}
              />
            );
          })}
        </View>
        <Text style={styles.label}>משך האימון</Text>
        <View style={styles.choices}>
          {[20, 30, 45, 60].map((minutes) => (
            <Choice
              key={minutes}
              label={`${minutes} דקות`}
              selected={minutesPerSession === minutes}
              onPress={() => setMinutesPerSession(minutes)}
            />
          ))}
        </View>
      </View>
      {message || planError ? <Text style={styles.message}>{message ?? planError}</Text> : null}
      <PrimaryButton title="שומרים ומעדכנים תוכנית" onPress={save} loading={isGenerating} />
    </ScreenContainer>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.choice, selected && styles.selectedChoice]}
    >
      <Text style={[styles.choiceText, selected && styles.selectedChoiceText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  form: { gap: 15 },
  inputRow: { flexDirection: 'row-reverse', gap: 12 },
  label: { color: theme.colors.text, fontSize: 14, fontWeight: '700', textAlign: 'right' },
  choices: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 9 },
  dayRow: { flexDirection: 'row-reverse', gap: 6 },
  choice: { minHeight: 46, flexGrow: 1, flexBasis: '45%', justifyContent: 'center', paddingHorizontal: 12, borderRadius: theme.radius.control, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  selectedChoice: { backgroundColor: '#29341F', borderColor: theme.colors.accent },
  choiceText: { color: theme.colors.muted, fontSize: 13, textAlign: 'center', fontWeight: '600' },
  selectedChoiceText: { color: theme.colors.accent, fontWeight: '800' },
  message: { color: theme.colors.muted, fontSize: 13, lineHeight: 20, textAlign: 'right' },
});
