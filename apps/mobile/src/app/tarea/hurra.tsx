import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { tasksControllerThanks } from '@tandems/api-client';
import { es } from '@/strings/es';
import { colors, spacing } from '@/theme';
import { AuthLayout, Button, Card, EmphasisText, Text, useToast } from '@/ui';
import { OnboardingArt } from '@/ui/art/OnboardingArt';

/** HurraRecibido: alguien que te acompaña celebra una tarea que terminaste. */
export default function HurraReceivedScreen() {
  const {
    id = '',
    title = '',
    name = '',
  } = useLocalSearchParams<{ id?: string; title?: string; name?: string }>();
  const t = es.hurra;
  const toast = useToast();
  const [thanked, setThanked] = useState(false);

  const thank = async () => {
    setThanked(true);
    const ok = await tasksControllerThanks(id)
      .then((res) => res.status === 200)
      .catch(() => false);
    if (ok) toast(t.thankedToast(name), { kind: 'ok' });
    else {
      setThanked(false);
      toast(es.auth.errors.network, { kind: 'err' });
    }
  };
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
        {id ? (
          <Button
            label={t.thank}
            icon="heart"
            variant="secondary"
            onPress={() => void thank()}
            disabled={thanked}
          />
        ) : null}
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
