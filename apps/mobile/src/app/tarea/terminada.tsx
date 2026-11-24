import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { es } from '@/strings/es';
import { colors, spacing } from '@/theme';
import { AuthLayout, Button, Card, EmphasisText, Text } from '@/ui';
import { OnboardingArt } from '@/ui/art/OnboardingArt';

/** TareaTerminada: refuerzo positivo al terminar (doc 04: sin confeti con movimiento reducido). */
export default function TaskFinishedScreen() {
  const { title = '', name = '' } = useLocalSearchParams<{ title?: string; name?: string }>();
  const t = es.tasks.finished;
  return (
    <AuthLayout>
      <OnboardingArt step={0} />
      <View style={styles.texts}>
        <Text variant="caption" color={colors.text.caption}>
          {t.caption}
        </Text>
        <EmphasisText text={t.title} variant="hero" accessibilityRole="header" />
      </View>
      <Card>
        <Text variant="bodyStrong">{title}</Text>
        {name ? (
          <Text variant="body" color={colors.text.secondary}>
            {t.told(name)}
          </Text>
        ) : null}
      </Card>
      <View style={styles.spacer} />
      <View style={styles.cta}>
        <Button label={t.next} onPress={() => router.back()} />
        <Button
          label={t.seeDone}
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
