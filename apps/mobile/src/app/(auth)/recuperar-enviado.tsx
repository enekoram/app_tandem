import { useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { requestReset } from '@/lib/auth';
import { describeAuthError } from '@/lib/authErrors';
import { es } from '@/strings/es';
import { colors, spacing } from '@/theme';
import { AuthLayout, BackLink, Button, EmphasisText, Text, useToast } from '@/ui';

export default function ResetSentScreen() {
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const t = es.auth.sent;

  const resend = async () => {
    setBusy(true);
    const { error } = await requestReset(email);
    setBusy(false);
    if (error) toast(describeAuthError(error).message, { kind: 'err' });
    else toast(t.resent, { kind: 'ok' });
  };

  // iOS abre Mail; en Android no hay un esquema estándar para la bandeja de entrada
  const openMail = Platform.OS === 'ios' ? () => void Linking.openURL('message://') : null;

  return (
    <AuthLayout top={<BackLink label={t.back} onPress={() => router.replace('/login')} />}>
      <View style={styles.header}>
        <Text variant="caption" color={colors.text.caption}>
          {t.caption}
        </Text>
        <EmphasisText text={t.title} variant="title" accessibilityRole="header" />
        <Text variant="lead" color={colors.text.secondary}>
          {t.body(email)}
        </Text>
      </View>
      <View style={styles.cta}>
        {openMail && <Button label={t.openMail} icon="mail" onPress={openMail} />}
        <Button
          label={t.resend}
          variant="secondary"
          onPress={resend}
          disabled={busy}
          accessibilityState={{ busy }}
        />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm, paddingHorizontal: spacing.sm },
  cta: { gap: spacing.sm },
});
