import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { prefs } from '@/lib/prefs';
import { es } from '@/strings/es';
import { colors, spacing } from '@/theme';
import { AuthLayout, Button, EmphasisText, Text } from '@/ui';

/** CuentaEliminada: despedida tras borrar la cuenta. */
export default function AccountDeletedScreen() {
  const t = es.profile.deleted;

  // Se enseña una sola vez
  useEffect(() => {
    void prefs.clearAccountDeleted();
  }, []);

  return (
    <AuthLayout>
      <View style={styles.texts}>
        <Text variant="caption" color={colors.text.caption}>
          {t.caption}
        </Text>
        <EmphasisText text={t.title} variant="hero" accessibilityRole="header" />
        <Text variant="lead" color={colors.text.secondary}>
          {t.body}
        </Text>
      </View>
      <View style={styles.spacer} />
      <View style={styles.cta}>
        <Button label={t.signUp} onPress={() => router.replace('/registro')} />
        <Button label={t.signIn} variant="secondary" onPress={() => router.replace('/login')} />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  texts: { gap: spacing.sm, paddingHorizontal: spacing.sm },
  spacer: { flex: 1 },
  cta: { gap: spacing.sm },
});
