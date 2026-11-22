import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native';
import { theme } from './theme';

interface ScreenContainerProps extends PropsWithChildren {
  title?: string;
  subtitle?: string;
  scroll?: boolean;
  rightAction?: ReactNode;
}

export function ScreenContainer({
  children,
  title,
  subtitle,
  scroll = true,
  rightAction,
}: ScreenContainerProps) {
  const content = (
    <View style={styles.content}>
      {(title || rightAction) && (
        <View style={styles.headingRow}>
          <View style={styles.headingCopy}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {rightAction}
        </View>
      )}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 36,
    gap: 20,
  },
  headingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 2,
  },
  headingCopy: { flex: 1, gap: 5, alignItems: 'flex-end' },
  title: { color: theme.colors.text, fontSize: 28, fontWeight: '800', textAlign: 'right' },
  subtitle: { color: theme.colors.muted, fontSize: 15, lineHeight: 22, textAlign: 'right' },
});
