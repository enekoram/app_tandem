import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { es } from '@/strings/es';
import { colors, spacing } from '@/theme';
import { Card, Screen, Text } from '@/ui';

/** Condiciones de uso y política de privacidad (borrador; con o sin sesión). */
export default function LegalScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const t = es.legal;
  const content = doc === 'privacidad' ? t.privacy : t.terms;
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <Screen
      kind="inner"
      title={content.title}
      caption={t.updated}
      back={{ label: t.back, onPress: back }}
    >
      <Card style={styles.draft}>
        <Text variant="label" color={colors.text.secondary}>
          {t.draft}
        </Text>
      </Card>
      {content.sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text variant="bodyStrong" accessibilityRole="header">
            {section.title}
          </Text>
          <Text variant="body" color={colors.text.secondary}>
            {section.body}
          </Text>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  draft: { gap: spacing.xs },
  section: { gap: spacing.xs, paddingHorizontal: spacing.sm },
});
