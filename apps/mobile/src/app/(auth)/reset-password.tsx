import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { authClient } from '@/lib/auth';
import { describeAuthError, PASSWORD_MIN } from '@/lib/authErrors';
import { prefs } from '@/lib/prefs';
import { es } from '@/strings/es';
import { colors, spacing } from '@/theme';
import {
  AuthLayout,
  Button,
  EmphasisText,
  FormAlert,
  Text,
  TextField,
  type TextInputRef,
  useToast,
} from '@/ui';
import { Logo } from '@/ui/art/Logo';

/** Destino del enlace del email: tandems://reset-password?token=… */
export default function ResetPasswordScreen() {
  const { token, error: linkError } = useLocalSearchParams<{ token?: string; error?: string }>();
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [errors, setErrors] = useState<{ password?: string; repeat?: string; form?: string }>(() =>
    linkError || !token ? { form: es.auth.errors.tokenInvalid } : {},
  );
  const [busy, setBusy] = useState(false);
  const repeatRef = useRef<TextInputRef>(null);
  const t = es.auth.reset;

  const submit = async () => {
    if (!token) return;
    const next: typeof errors = {};
    if (password.length < PASSWORD_MIN) next.password = es.auth.errors.passwordShort;
    else if (password !== repeat) next.repeat = es.auth.errors.passwordMismatch;
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    if (error) {
      setBusy(false);
      const { field, message } = describeAuthError(error);
      setErrors(field === 'password' ? { password: message } : { form: message });
      return;
    }
    // «Guardar y entrar»: si este móvil pidió el enlace, conocemos el email
    const email = prefs.resetEmail();
    await prefs.clearResetEmail();
    if (email) {
      const { error: signInError } = await authClient.signIn.email({ email, password });
      setBusy(false);
      if (!signInError) return; // El layout raíz lleva a Hoy
    }
    setBusy(false);
    toast(t.saved, { kind: 'ok' });
    router.replace({ pathname: '/login', params: email ? { email } : {} });
  };

  return (
    <AuthLayout>
      <View style={styles.logo}>
        <Logo />
      </View>
      <View style={styles.header}>
        <Text variant="caption" color={colors.text.caption}>
          {t.caption}
        </Text>
        <EmphasisText text={t.title} variant="title" accessibilityRole="header" />
      </View>
      {errors.form && <FormAlert title={errors.form} />}
      {errors.form === es.auth.errors.tokenInvalid ? (
        <Button
          label={es.auth.forgot.submit}
          variant="secondary"
          onPress={() => router.replace('/recuperar')}
        />
      ) : (
        <>
          <TextField
            label={t.newPassword}
            value={password}
            onChangeText={setPassword}
            password
            autoComplete="new-password"
            textContentType="newPassword"
            hint={es.auth.passwordHint}
            returnKeyType="next"
            onSubmitEditing={() => repeatRef.current?.focus()}
            error={errors.password}
          />
          <TextField
            ref={repeatRef}
            label={t.repeat}
            value={repeat}
            onChangeText={setRepeat}
            password
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={submit}
            error={errors.repeat}
          />
          <Button label={t.submit} onPress={submit} disabled={busy} accessibilityState={{ busy }} />
        </>
      )}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  logo: { paddingTop: spacing.xxl * 2 },
  header: { gap: spacing.sm, paddingHorizontal: spacing.sm },
});
