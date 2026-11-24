import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { authClient } from '@/lib/auth';
import {
  describeAuthError,
  DISPLAY_NAME_MAX,
  isEmail,
  PASSWORD_MIN,
  type AuthField,
} from '@/lib/authErrors';
import { es } from '@/strings/es';
import { colors, spacing } from '@/theme';
import {
  AuthLayout,
  BackLink,
  Button,
  Checkbox,
  EmphasisText,
  FormAlert,
  Text,
  TextField,
  type TextInputRef,
} from '@/ui';

type Errors = Partial<Record<AuthField | 'terms', string>>;

function validate(name: string, email: string, password: string, terms: boolean): Errors {
  const e = es.auth.errors;
  const errors: Errors = {};
  const trimmed = name.trim();
  if (!trimmed) errors.name = e.nameRequired;
  else if (trimmed.length > DISPLAY_NAME_MAX) errors.name = e.nameTooLong;
  if (!isEmail(email)) errors.email = e.emailInvalid;
  if (password.length < PASSWORD_MIN) errors.password = e.passwordShort;
  if (!terms) errors.terms = e.termsRequired;
  return errors;
}

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<TextInputRef>(null);
  const passwordRef = useRef<TextInputRef>(null);
  const t = es.auth.register;

  const submit = async () => {
    const found = validate(name, email, password, terms);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    const { error } = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) {
      const { field, message } = describeAuthError(error);
      setErrors({ [field]: message });
    }
    // Sin error: hay sesión y el layout raíz lleva a Hoy
  };

  const count = Object.keys(errors).filter((k) => k !== 'form').length;

  return (
    <AuthLayout top={<BackLink label={t.back} onPress={() => router.replace('/login')} />}>
      <View style={styles.header}>
        <Text variant="caption" color={colors.text.caption}>
          {t.caption}
        </Text>
        <EmphasisText text={t.title} variant="title" accessibilityRole="header" />
      </View>
      {count > 0 && <FormAlert title={t.summary(count)} body={t.allRequired} />}
      {errors.form && <FormAlert title={errors.form} />}
      {count === 0 && !errors.form && (
        <Text variant="body" color={colors.text.secondary} style={styles.help}>
          {t.allRequired}
        </Text>
      )}
      <TextField
        label={t.name}
        value={name}
        onChangeText={setName}
        autoComplete="name"
        textContentType="nickname"
        maxLength={DISPLAY_NAME_MAX + 10}
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
        error={errors.name}
      />
      <View style={styles.group}>
        <TextField
          ref={emailRef}
          label={es.auth.email}
          placeholder={es.auth.emailPlaceholder}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          error={errors.email}
        />
        {errors.email === es.auth.errors.emailTaken && (
          <Button
            variant="link"
            label={t.signInWithEmail}
            onPress={() => router.replace({ pathname: '/login', params: { email } })}
          />
        )}
      </View>
      <TextField
        ref={passwordRef}
        label={es.auth.password}
        value={password}
        onChangeText={setPassword}
        password
        autoComplete="new-password"
        textContentType="newPassword"
        hint={es.auth.passwordHint}
        error={errors.password}
      />
      <Checkbox label={t.terms} checked={terms} onChange={setTerms} error={errors.terms} />
      <Button label={t.submit} onPress={submit} disabled={busy} accessibilityState={{ busy }} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm, paddingHorizontal: spacing.sm },
  help: { paddingHorizontal: spacing.sm },
  group: { gap: spacing.xxs },
});
