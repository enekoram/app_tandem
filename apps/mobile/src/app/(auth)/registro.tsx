import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useInvitationsControllerPreview } from '@tandems/api-client';
import { authClient } from '@/lib/auth';
import {
  describeAuthError,
  DISPLAY_NAME_MAX,
  isEmail,
  PASSWORD_MIN,
  type AuthField,
} from '@/lib/authErrors';
import { prefs } from '@/lib/prefs';
import { es } from '@/strings/es';
import { colors, gradients, selfColor, sizes, radii, spacing } from '@/theme';
import {
  AuthLayout,
  BackLink,
  Button,
  Card,
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

/**
 * Crear cuenta. Con `token` es RegistroInvitado: el email es el de la invitación (solo
 * lectura), el nombre viene rellenado y al entrar la invitación se acepta sola.
 */
export default function RegisterScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const preview = useInvitationsControllerPreview(token ?? '', {
    query: { enabled: !!token, retry: false },
  });
  const invite = preview.data?.status === 200 ? preview.data.data : undefined;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<TextInputRef>(null);
  const passwordRef = useRef<TextInputRef>(null);
  const t = es.auth.register;
  const ti = t.invited;

  // Datos de la invitación: el nombre se puede cambiar; el email, no
  useEffect(() => {
    if (!invite) return;
    setName((current) => current || invite.invitedName);
    setEmail(invite.email);
  }, [invite]);

  const submit = async () => {
    const found = validate(name, email, password, terms);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    // Antes de crear la cuenta: al cambiar de pila, Hoy la acepta (BienvenidaInvitado)
    if (invite && token) await prefs.setPendingInviteAuto(token);
    const { error } = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) {
      if (invite) await prefs.clearPendingInvite();
      const { field, message } = describeAuthError(error);
      setErrors({ [field]: message });
    }
    // Sin error: hay sesión y el layout raíz lleva a Hoy
  };

  const count = Object.keys(errors).filter((k) => k !== 'form').length;

  return (
    <AuthLayout
      top={
        token ? (
          <BackLink
            label={ti.back}
            onPress={() => router.replace({ pathname: '/invitacion', params: { token } })}
          />
        ) : (
          <BackLink label={t.back} onPress={() => router.replace('/login')} />
        )
      }
    >
      <View style={styles.header}>
        <Text variant="caption" color={colors.text.caption}>
          {invite ? ti.caption(invite.inviterName) : t.caption}
        </Text>
        <EmphasisText text={t.title} variant="title" accessibilityRole="header" />
      </View>
      {invite && (
        <Card edge={gradients.edgeInvite} style={styles.inviteCard} accessible>
          <View
            style={styles.inviteAvatar}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Text variant="avatarSmall">
              {invite.inviterName.charAt(0).toLocaleUpperCase('es')}
            </Text>
          </View>
          <View style={styles.flex}>
            <Text variant="caption" color={colors.text.caption}>
              {ti.cardCaption}
            </Text>
            <Text variant="body" color={colors.text.secondary}>
              {ti.cardBody(invite.inviterName)}
            </Text>
          </View>
        </Card>
      )}
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
          editable={!invite}
          hint={invite ? ti.emailHint : undefined}
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
      <View style={styles.group}>
        <Checkbox label={t.terms} checked={terms} onChange={setTerms} error={errors.terms} />
        <View style={styles.links}>
          <Button
            variant="link"
            label={es.legal.links.terms}
            onPress={() =>
              router.push({ pathname: '/legal/[doc]', params: { doc: 'condiciones' } })
            }
          />
          <Button
            variant="link"
            label={es.legal.links.privacy}
            onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'privacidad' } })}
          />
        </View>
      </View>
      <Button
        label={invite ? ti.submit : t.submit}
        onPress={submit}
        disabled={busy || (!!token && !invite)}
        accessibilityState={{ busy }}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm, paddingHorizontal: spacing.sm },
  help: { paddingHorizontal: spacing.sm },
  group: { gap: spacing.xxs },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, paddingHorizontal: spacing.sm },
  flex: { flex: 1 },
  inviteCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  inviteAvatar: {
    width: sizes.avatar.sm,
    height: sizes.avatar.sm,
    borderRadius: radii.round,
    backgroundColor: selfColor.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
