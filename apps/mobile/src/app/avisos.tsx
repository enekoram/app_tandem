import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { enablePush } from '@/lib/push';
import { prefs } from '@/lib/prefs';
import { es } from '@/strings/es';
import { colors, radii, shadows, sizes, spacing, borders } from '@/theme';
import { AuthLayout, Button, EmphasisText, Icon, Text, useToast } from '@/ui';

/** PermisoNotificaciones: se enseña una vez, después de entrar por primera vez. */
export default function NotificationPermissionScreen() {
  const t = es.notifications.permission;
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const close = () => {
    void prefs.setPushAsked();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const enable = async () => {
    setBusy(true);
    const result = await enablePush();
    setBusy(false);
    if (result === 'unavailable') toast(t.unavailable);
    else if (result === 'denied') toast(t.denied);
    close();
  };

  return (
    <AuthLayout>
      {/* Ejemplo de aviso (decorativo) */}
      <View
        style={styles.example}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View style={styles.exampleIcon}>
          <Icon name="heart" size={sizes.icon.button} color={colors.text.primary} />
        </View>
        <View style={styles.flex}>
          <Text variant="caption" color={colors.text.caption}>
            {t.exampleCaption}
          </Text>
          <EmphasisText text={t.exampleTitle} variant="section" />
        </View>
      </View>
      <View style={styles.texts}>
        <Text variant="caption" color={colors.text.caption}>
          {t.caption}
        </Text>
        <EmphasisText text={t.title} variant="hero" accessibilityRole="header" />
        <Text variant="lead" color={colors.text.secondary}>
          {t.body}
        </Text>
        <Text variant="body" color={colors.text.secondary}>
          {t.later}
        </Text>
      </View>
      <View style={styles.spacer} />
      <View style={styles.cta}>
        <Button
          label={t.enable}
          icon="bell"
          onPress={() => void enable()}
          disabled={busy}
          accessibilityState={{ busy }}
        />
        <Button label={t.notNow} variant="secondary" onPress={close} />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  example: {
    marginTop: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.bg.surface,
    borderWidth: borders.hairline,
    borderColor: colors.border.subtle,
    borderRadius: radii.sheet,
    ...shadows.floating,
  },
  exampleIcon: {
    width: sizes.notice.icon,
    height: sizes.notice.icon,
    borderRadius: radii.round,
    backgroundColor: colors.illustration.otherLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  texts: { gap: spacing.sm, paddingHorizontal: spacing.sm },
  spacer: { flex: 1 },
  cta: { gap: spacing.sm },
});
