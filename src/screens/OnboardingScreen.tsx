import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import DashboardScreen from './DashboardScreen';
import { HebrewInput } from '../components/ui/HebrewInput';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { theme } from '../components/ui/theme';
import { usePlanStore } from '../store/usePlanStore';
import { useUserStore } from '../store/useUserStore';
import type { UserProfile } from '../types/workout.types';
import { upsertProfile } from '../services/api';

const STEPS = ['קצת עליך', 'מה המטרה?', 'הניסיון שלך', 'ימים לאימון', 'הקצב שלך'];
const GOALS = [
  { value: 'כושר ובריאות', label: 'להרגיש בכושר' },
  { value: 'כוח ושריר', label: 'כוח ושריר' },
  { value: 'ירידה במשקל', label: 'ירידה במשקל' },
  { value: 'גמישות ויציבה', label: 'גמישות ויציבה' },
];
const DAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const LEVELS: Array<{ value: UserProfile['fitnessLevel']; label: string }> = [
  { value: 'beginner', label: 'מתחיל/ה' },
  { value: 'intermediate', label: 'מתאמן/ת מדי פעם' },
  { value: 'advanced', label: 'מנוסה' },
];

function toggleSelection<T>(value: T, current: T[], update: (next: T[]) => void) {
  update(current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value]);
}

interface OnboardingScreenProps {
  onComplete?: (profile: UserProfile) => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState(0);
  const [age, setAge] = useState('28');
  const [weight, setWeight] = useState('70');
  const [height, setHeight] = useState('170');
  const [gender, setGender] = useState<UserProfile['gender']>('female');
  const [goals, setGoals] = useState<string[]>(['כושר ובריאות']);
  const [fitnessLevel, setFitnessLevel] = useState<UserProfile['fitnessLevel']>('beginner');
  const [equipment, setEquipment] = useState<string[]>(['ללא ציוד']);
  const [preferredDays, setPreferredDays] = useState<number[]>([0, 2, 4]);
  const [minutesPerSession, setMinutesPerSession] = useState(30);
  const [formError, setFormError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const setProfile = useUserStore((state) => state.setProfile);
  const generate = usePlanStore((state) => state.generate);
  const isGenerating = usePlanStore((state) => state.isGenerating);
  const planError = usePlanStore((state) => state.error);

  const finish = async () => {
    const parsedAge = Number(age);
    const parsedWeight = Number(weight);
    const parsedHeight = Number(height);
    if (
      !Number.isFinite(parsedAge) || parsedAge < 16 || parsedAge > 100 ||
      !Number.isFinite(parsedWeight) || parsedWeight < 35 || parsedWeight > 250 ||
      !Number.isFinite(parsedHeight) || parsedHeight < 120 || parsedHeight > 230
    ) {
      setFormError('כדאי לבדוק את הגיל, המשקל והגובה שהזנת.');
      setStep(0);
      return;
    }

    const profile: UserProfile = {
      age: parsedAge,
      weightKg: parsedWeight,
      heightCm: parsedHeight,
      gender,
      fitnessLevel,
      goals,
      equipment,
      preferredDays,
      minutesPerSession,
    };
    setProfile(profile);
    try {
      await upsertProfile(profile);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'לא הצלחנו לשמור את הפרופיל כרגע.');
      return;
    }
    setFormError(null);
    try {
      await generate(profile);
      setIsComplete(true);
      onComplete?.(profile);
    } catch {
      setFormError('לא הצלחנו ליצור תוכנית כרגע. אפשר לנסות שוב עוד רגע.');
    }
  };

  if (isComplete) return <DashboardScreen />;

  return (
    <ScreenContainer
      title="בונים תוכנית שמתאימה לך"
      subtitle="כמה תשובות קצרות, ואז נרכיב לך שבוע שאפשר באמת להתמיד בו."
    >
      <View style={styles.progressRow} accessibilityLabel={`שלב ${step + 1} מתוך ${STEPS.length}`}>
        {STEPS.map((label, index) => (
          <View key={label} style={[styles.progressSegment, index <= step && styles.progressActive]} />
        ))}
      </View>
      <Text style={styles.stepCount}>שלב {step + 1} מתוך {STEPS.length}</Text>
      <View style={styles.form}>
        {step === 0 ? (
          <>
            <Text style={styles.question}>נתחיל מהבסיס</Text>
            <View style={styles.inputRow}>
              <HebrewInput label="גיל" value={age} onChangeText={setAge} keyboardType="number-pad" />
              <HebrewInput label="משקל (ק״ג)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
            </View>
            <HebrewInput label="גובה (ס״מ)" value={height} onChangeText={setHeight} keyboardType="number-pad" />
            <Text style={styles.fieldLabel}>מין לצורך חישובי התוכנית</Text>
            <View style={styles.choiceRow}>
              {([
                ['female', 'אישה'],
                ['male', 'גבר'],
                ['other', 'אחר / מעדיפ/ה לא לציין'],
              ] as const).map(([value, label]) => (
                <Choice key={value} label={label} selected={gender === value} onPress={() => setGender(value)} />
              ))}
            </View>
          </>
        ) : null}
        {step === 1 ? (
          <>
            <Text style={styles.question}>מה היית רוצה להשיג?</Text>
            <Text style={styles.description}>אפשר לבחור יותר מתשובה אחת.</Text>
            <View style={styles.choiceGrid}>
              {GOALS.map((goal) => (
                <Choice
                  key={goal.value}
                  label={goal.label}
                  selected={goals.includes(goal.value)}
                  onPress={() => toggleSelection(goal.value, goals, setGoals)}
                />
              ))}
            </View>
          </>
        ) : null}
        {step === 2 ? (
          <>
            <Text style={styles.question}>איפה את/ה היום?</Text>
            <View style={styles.choiceGrid}>
              {LEVELS.map((level) => (
                <Choice
                  key={level.value}
                  label={level.label}
                  selected={fitnessLevel === level.value}
                  onPress={() => setFitnessLevel(level.value)}
                />
              ))}
            </View>
            <Text style={styles.fieldLabel}>הציוד שיש לך</Text>
            <View style={styles.choiceGrid}>
              {['ללא ציוד', 'גומיות', 'משקולות', 'חדר כושר'].map((item) => (
                <Choice
                  key={item}
                  label={item}
                  selected={equipment.includes(item)}
                  onPress={() => toggleSelection(item, equipment, setEquipment)}
                />
              ))}
            </View>
          </>
        ) : null}
        {step === 3 ? (
          <>
            <Text style={styles.question}>באילו ימים נוח לך לזוז?</Text>
            <Text style={styles.description}>בחר/י לפחות יום אחד בשבוע.</Text>
            <View style={styles.dayRow}>
              {DAYS.map((day, index) => (
                <Choice
                  key={day}
                  label={day}
                  selected={preferredDays.includes(index)}
                  compact
                  onPress={() => toggleSelection(index, preferredDays, setPreferredDays)}
                />
              ))}
            </View>
          </>
        ) : null}
        {step === 4 ? (
          <>
            <Text style={styles.question}>כמה זמן מתאים לך לכל אימון?</Text>
            <View style={styles.choiceGrid}>
              {[20, 30, 45, 60].map((minutes) => (
                <Choice
                  key={minutes}
                  label={`${minutes} דקות`}
                  selected={minutesPerSession === minutes}
                  onPress={() => setMinutesPerSession(minutes)}
                />
              ))}
            </View>
            <View style={styles.recap}>
              <Text style={styles.recapTitle}>התוכנית שלך תכלול</Text>
              <Text style={styles.recapText}>
                {preferredDays.length} אימונים בשבוע · {minutesPerSession} דקות לאימון
              </Text>
              <Text style={styles.recapText}>{goals.join(' · ') || 'כושר ובריאות'}</Text>
            </View>
          </>
        ) : null}
      </View>

      {formError || planError ? <Text style={styles.error}>{formError ?? planError}</Text> : null}
      <View style={styles.actions}>
        {step > 0 ? (
          <PrimaryButton title="חזרה" variant="secondary" onPress={() => setStep((value) => value - 1)} />
        ) : null}
        {step < STEPS.length - 1 ? (
          <PrimaryButton
            title="ממשיכים"
            onPress={() => {
              if (step === 1 && goals.length === 0) {
                setFormError('בחר/י לפחות מטרה אחת.');
                return;
              }
              if (step === 2 && equipment.length === 0) {
                setFormError('בחר/י את הציוד הזמין, או את האפשרות ללא ציוד.');
                return;
              }
              if (step === 3 && preferredDays.length === 0) {
                setFormError('בחר/י לפחות יום אחד שמתאים לאימון.');
                return;
              }
              setFormError(null);
              setStep((value) => value + 1);
            }}
          />
        ) : (
          <PrimaryButton title="יוצרים לי תוכנית" onPress={finish} loading={isGenerating} />
        )}
      </View>
    </ScreenContainer>
  );
}

function Choice({
  label,
  selected,
  onPress,
  compact = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.choice, compact && styles.choiceCompact, selected && styles.choiceSelected]}
    >
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  progressRow: { flexDirection: 'row-reverse', gap: 6 },
  progressSegment: { flex: 1, height: 4, backgroundColor: theme.colors.track, borderRadius: 2 },
  progressActive: { backgroundColor: theme.colors.accent },
  stepCount: { color: theme.colors.muted, fontSize: 12, textAlign: 'right', marginTop: -12 },
  form: { gap: 18 },
  question: { color: theme.colors.text, fontSize: 22, fontWeight: '800', textAlign: 'right' },
  description: { marginTop: -12, color: theme.colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'right' },
  inputRow: { flexDirection: 'row-reverse', gap: 12 },
  fieldLabel: { color: theme.colors.text, fontSize: 14, fontWeight: '700', textAlign: 'right' },
  choiceRow: { gap: 9 },
  choiceGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  dayRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', gap: 6 },
  choice: {
    minHeight: 48,
    flexGrow: 1,
    flexBasis: '46%',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: theme.radius.control,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  choiceCompact: { flex: 1, flexBasis: 0, minWidth: 40, paddingHorizontal: 8, borderRadius: theme.radius.pill },
  choiceSelected: { backgroundColor: '#29341F', borderColor: theme.colors.accent },
  choiceText: { color: theme.colors.muted, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  choiceTextSelected: { color: theme.colors.accent, fontWeight: '800' },
  recap: { gap: 8, padding: 18, borderRadius: theme.radius.card, backgroundColor: theme.colors.surface },
  recapTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '800', textAlign: 'right' },
  recapText: { color: theme.colors.muted, fontSize: 14, textAlign: 'right' },
  actions: { flexDirection: 'row-reverse', gap: 10, marginTop: 'auto' },
  error: { color: theme.colors.danger, fontSize: 13, lineHeight: 19, textAlign: 'right' },
});
