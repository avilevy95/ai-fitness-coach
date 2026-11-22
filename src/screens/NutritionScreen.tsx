import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MacroBar } from '../components/ui/MacroBar';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { StatCard } from '../components/ui/StatCard';
import { theme } from '../components/ui/theme';
import { usePlanStore } from '../store/usePlanStore';
import type { MealItem, NutritionPlan } from '../types/workout.types';

const MEALS: Array<{ key: keyof NutritionPlan['meals']; label: string }> = [
  { key: 'breakfast', label: 'בוקר' },
  { key: 'lunch', label: 'צהריים' },
  { key: 'dinner', label: 'ערב' },
  { key: 'snacks', label: 'ביניים' },
];

export default function NutritionScreen() {
  const plan = usePlanStore((state) => state.nutritionPlan);
  const [selectedMeal, setSelectedMeal] = useState<keyof NutritionPlan['meals']>('breakfast');

  if (!plan) {
    return (
      <ScreenContainer title="תזונה בקצב שלך" subtitle="כשתהיה לך תוכנית אימונים, נמצא גם רעיונות לארוחות שמתאימות ליעדים שלך.">
        <View style={styles.empty}>
          <Text style={styles.emptyText}>עוד אין תוכנית תזונה</Text>
        </View>
      </ScreenContainer>
    );
  }

  const meals = plan.meals[selectedMeal];
  return (
    <ScreenContainer title="תזונה בקצב שלך" subtitle="כיוונים פשוטים לארוחות ויעדים יומיים, בלי להסתבך.">
      <View style={styles.caloriePanel}>
        <Text style={styles.calorieLabel}>היעד היומי שלך</Text>
        <View style={styles.calorieValueRow}>
          <Text style={styles.calorieValue}>{plan.dailyCalories.toLocaleString('he-IL')}</Text>
          <Text style={styles.calorieUnit}>קלוריות</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="חלבון" value={plan.proteinGrams} unit="גרם" accent="accent" />
        <StatCard label="פחמימות" value={plan.carbGrams} unit="גרם" accent="blue" />
        <StatCard label="שומן" value={plan.fatGrams} unit="גרם" accent="orange" />
      </View>

      <View style={styles.macroPanel}>
        <Text style={styles.sectionTitle}>היעדים היומיים</Text>
        <Text style={styles.muted}>התקדמות הצריכה תופיע כאן כשתתחיל/י לתעד ארוחות.</Text>
        <MacroBar label="חלבון" value={0} target={plan.proteinGrams} color={theme.colors.accent} />
        <MacroBar label="פחמימות" value={0} target={plan.carbGrams} color={theme.colors.blue} />
        <MacroBar label="שומן" value={0} target={plan.fatGrams} color={theme.colors.orange} />
      </View>

      <View style={styles.mealSection}>
        <Text style={styles.sectionTitle}>רעיונות לארוחות</Text>
        <View style={styles.tabs}>
          {MEALS.map((meal) => (
            <Pressable
              key={meal.key}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedMeal === meal.key }}
              onPress={() => setSelectedMeal(meal.key)}
              style={[styles.tab, selectedMeal === meal.key && styles.selectedTab]}
            >
              <Text style={[styles.tabText, selectedMeal === meal.key && styles.selectedTabText]}>{meal.label}</Text>
            </Pressable>
          ))}
        </View>
        {meals.length > 0 ? meals.map((meal, index) => (
          <MealCard key={`${meal.nameHe}-${index}`} meal={meal} />
        )) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>עוד לא הוספנו רעיונות לארוחה הזאת.</Text>
          </View>
        )}
      </View>
      <Text style={styles.disclaimer}>
        ההמלצות כלליות ואינן תחליף לייעוץ תזונתי אישי. אם יש מצב רפואי או דרישות תזונתיות מיוחדות, מומלץ להתייעץ עם איש מקצוע.
      </Text>
    </ScreenContainer>
  );
}

function MealCard({ meal }: { meal: MealItem }) {
  return (
    <View style={styles.mealCard}>
      <View style={styles.mealHeading}>
        <Text style={styles.mealCalories}>{meal.calories} קל׳</Text>
        <Text style={styles.mealName}>{meal.nameHe}</Text>
      </View>
      <Text style={styles.muted}>{meal.portionHe}</Text>
      <Text style={styles.mealMacros}>
        חלבון {meal.protein} ג׳ · פחמימות {meal.carbs} ג׳ · שומן {meal.fat} ג׳
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  caloriePanel: { padding: 20, gap: 8, borderRadius: theme.radius.card, backgroundColor: '#252E21', borderWidth: 1, borderColor: '#394A30' },
  calorieLabel: { color: theme.colors.muted, fontSize: 14, fontWeight: '600', textAlign: 'right' },
  calorieValueRow: { flexDirection: 'row-reverse', alignItems: 'baseline', gap: 8 },
  calorieValue: { color: theme.colors.accent, fontSize: 36, fontWeight: '900', fontVariant: ['tabular-nums'] },
  calorieUnit: { color: theme.colors.text, fontSize: 15 },
  statsRow: { flexDirection: 'row-reverse', gap: 9 },
  macroPanel: { padding: 18, gap: 18, borderRadius: theme.radius.card, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  sectionTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '800', textAlign: 'right' },
  muted: { color: theme.colors.muted, fontSize: 13, lineHeight: 20, textAlign: 'right' },
  mealSection: { gap: 13 },
  tabs: { flexDirection: 'row-reverse', gap: 7 },
  tab: { flex: 1, minHeight: 44, justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: theme.radius.pill, backgroundColor: theme.colors.surface },
  selectedTab: { backgroundColor: theme.colors.accent },
  tabText: { color: theme.colors.muted, textAlign: 'center', fontSize: 13, fontWeight: '700' },
  selectedTabText: { color: theme.colors.accentText },
  mealCard: { padding: 17, gap: 10, borderRadius: theme.radius.card, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  mealHeading: { flexDirection: 'row-reverse', justifyContent: 'space-between', gap: 12, alignItems: 'center' },
  mealName: { flex: 1, color: theme.colors.text, fontSize: 16, fontWeight: '800', textAlign: 'right' },
  mealCalories: { color: theme.colors.accent, fontSize: 12, fontWeight: '700' },
  mealMacros: { color: theme.colors.muted, fontSize: 12, textAlign: 'right' },
  empty: { padding: 20, borderRadius: theme.radius.card, backgroundColor: theme.colors.surface },
  emptyText: { color: theme.colors.muted, fontSize: 14, textAlign: 'right' },
  disclaimer: { color: theme.colors.muted, fontSize: 11, lineHeight: 17, textAlign: 'right' },
});
