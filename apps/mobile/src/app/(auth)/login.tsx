import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { authClient } from '@/lib/auth';
import { describeAuthError } from '@/lib/authErrors';
import { es } from '@/strings/es';
import { borders, colors, radii, shadows, spacing } from '@/theme';
import {
  AuthLayout,
  Button,
  EmphasisText,
  FormAlert,
  Text,
  TextField,
  type TextInputRef,
} from '@/ui';
import { Logo } from '@/ui/art/Logo';

export default function LoginScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<{ title: string; body?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<TextInputRef>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const { error: err } = await authClient.signIn.email({ email: email.trim(), password });
    setBusy(false);
    if (!err) return; // La sesión cambia y el layout raíz lleva a Hoy
    if (err.code === 'INVALID_EMAIL_OR_PASSWORD' || err.status === 401) {
      setError({ title: es.auth.login.errorTitle, body: es.auth.login.errorBody });
    } else {
      setError({ title: es.auth.login.errorTitle, body: describeAuthError(err).message });
    }
  };

  return (
    <AuthLayout>
      <View style={styles.logo}>
        <Logo />
      </View>
      <View style={styles.card}>
        <EmphasisText
          text={es.auth.login.title}
          variant="title"
          accessibilityRole="header"
          style={styles.title}
        />
        {error && <FormAlert title={error.title} body={error.body} />}
        <TextField
          label={es.auth.email}
          placeholder={es.auth.emailPlaceholder}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="username"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          invalid={!!error}
        />
        <TextField
          ref={passwordRef}
          label={es.auth.password}
          value={password}
          onChangeText={setPassword}
          password
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
          invalid={!!error}
        />
        <Button
          variant="link"
          label={es.auth.login.forgot}
          onPress={() => router.push({ pathname: '/recuperar', params: { email } })}
        />
        <Button
          label={es.auth.login.submit}
          onPress={submit}
          disabled={busy || !email || !password}
          accessibilityState={{ busy }}
        />
      </View>
      <View style={styles.footer}>
        <Text variant="body" color={colors.text.secondary}>
          {es.auth.login.noAccount}
        </Text>
        <Button
          variant="link"
          label={es.auth.login.createAccount}
          onPress={() => router.replace('/registro')}
        />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  logo: { paddingTop: spacing.xxl * 2 },
  card: {
    backgroundColor: colors.bg.surface,
    borderWidth: borders.hairline,
    borderColor: colors.border.subtle,
    borderRadius: radii.sheet,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
    ...shadows.card,
  },
  title: { paddingHorizontal: spacing.xxs },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
});
