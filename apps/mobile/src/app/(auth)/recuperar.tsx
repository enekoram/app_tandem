import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { requestReset } from '@/lib/auth';
import { describeAuthError, isEmail } from '@/lib/authErrors';
import { es } from '@/strings/es';
import { colors, spacing } from '@/theme';
import { AuthLayout, BackLink, Button, EmphasisText, FormAlert, Text, TextField } from '@/ui';

export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const t = es.auth.forgot;

  const submit = async () => {
    const value = email.trim();
    if (!isEmail(value)) {
      setError(es.auth.errors.emailInvalid);
      return;
    }
    setError(null);
    setFormError(null);
    setBusy(true);
    const { error: err } = await requestReset(value);
    setBusy(false);
    if (err) {
      setFormError(describeAuthError(err).message);
      return;
    }
    router.replace({ pathname: '/recuperar-enviado', params: { email: value } });
  };

  return (
    <AuthLayout top={<BackLink label={t.back} onPress={() => router.back()} />}>
      <View style={styles.header}>
        <Text variant="caption" color={colors.text.caption}>
          {t.caption}
        </Text>
        <EmphasisText text={t.title} variant="title" accessibilityRole="header" />
        <Text variant="lead" color={colors.text.secondary}>
          {t.body}
        </Text>
      </View>
      {formError && <FormAlert title={formError} />}
      <TextField
        label={es.auth.email}
        placeholder={es.auth.emailPlaceholder}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="send"
        onSubmitEditing={submit}
        error={error}
      />
      <Button
        label={t.submit}
        icon="mail"
        onPress={submit}
        disabled={busy}
        accessibilityState={{ busy }}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm, paddingHorizontal: spacing.sm },
});
