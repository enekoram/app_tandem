import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMotionProfile } from '@/lib/motion';
import { es } from '@/strings/es';
import { colors, spacing } from '@/theme';
import { AuthLayout, Button, Card, EmphasisText, Text } from '@/ui';
import { CelebrationArt } from '@/ui/art/CelebrationArt';

/**
 * HurraRecibido: alguien que te acompaña celebra una tarea que terminaste. Las formas se
 * juntan con un estallido (según el perfil de movimiento) y una vibración de éxito solo con
 * estímulo completo. Una sola salida: «Ver siguiente tarea» (pedido del 2026-11-26).
 */
export default function HurraReceivedScreen() {
  const { title = '', name = '' } = useLocalSearchParams<{ title?: string; name?: string }>();
  const t = es.hurra;
  const motion = useMotionProfile();

  useEffect(() => {
    if (motion === 'full') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, [motion]);

  return (
    <AuthLayout>
      <CelebrationArt motion={motion} />
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
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  texts: { gap: spacing.sm, paddingHorizontal: spacing.sm },
  spacer: { flex: 1 },
  cta: { gap: spacing.sm },
});
