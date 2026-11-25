import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { es } from '@/strings/es';
import { colors, spacing } from '@/theme';
import { AuthLayout, Button, Card, EmphasisText, Text } from '@/ui';
import { OnboardingArt } from '@/ui/art/OnboardingArt';

/** HurraRecibido: alguien que te acompaña celebra una tarea que terminaste. */
export default function HurraReceivedScreen() {
  const { title = '', name = '' } = useLocalSearchParams<{ title?: string; name?: string }>();
  const t = es.hurra;
  return (
    <AuthLayout>
      <OnboardingArt step={0} />
      <View style={styles.texts}>
        <Text variant="caption" color={colors.text.caption}>
          {t.caption}
        </Text>
        <EmphasisText text={t.title(name)} variant="hero" accessibilityRole="header" />
        <Text variant="lead" color={colors.text.secondary}>
          {t.body(title, name)}
        </Text>
      </View>
      <Card>
        <Text variant="caption" color={colors.text.caption}>
          {es.tasks.finished.caption}
        </Text>
        <Text variant="bodyStrong">{title}</Text>
      </Card>
      <View style={styles.spacer} />
      <View style={styles.cta}>
        <Button label={es.tasks.finished.next} onPress={() => router.back()} />
        <Button
          label={es.tasks.finished.seeDone}
          variant="secondary"
          onPress={() => router.replace('/tarea/terminadas')}
        />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  texts: { gap: spacing.sm, paddingHorizontal: spacing.sm },
  spacer: { flex: 1 },
  cta: { gap: spacing.sm },
});
