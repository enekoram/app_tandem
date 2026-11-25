import { useRef, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { authClient } from '@/lib/auth';
import { describeAuthError, PASSWORD_MIN } from '@/lib/authErrors';
import { es } from '@/strings/es';
import { colors, spacing } from '@/theme';
import {
  FormAlert,
  ModalHeader,
  ModalScreen,
  Text,
  TextField,
  useToast,
  type TextInputRef,
} from '@/ui';

type Errors = { current?: string; next?: string; form?: string };

/**
 * Cambiar contraseña (hoja modal; no está en el canvas, decisión del 2026-11-25):
 * contraseña actual + nueva. Cierra la sesión en los demás dispositivos.
 */
export default function ChangePasswordScreen() {
  const t = es.profile.password;
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const nextRef = useRef<TextInputRef>(null);

  const submit = async () => {
    const found: Errors = {};
    if (!current) found.current = t.currentRequired;
    if (next.length < PASSWORD_MIN) found.next = es.auth.errors.passwordShort;
    setErrors(found);
    if (found.current || found.next) return;

    setBusy(true);
    const { error } = await authClient.changePassword({
      currentPassword: current,
      newPassword: next,
      revokeOtherSessions: true,
    });
    setBusy(false);
    if (!error) {
      router.back();
      toast(t.saved, { kind: 'ok' });
      return;
    }
    if (error.code === 'INVALID_PASSWORD') return setErrors({ current: t.currentWrong });
    const { field, message } = describeAuthError(error);
    setErrors(field === 'password' ? { next: message } : { form: message });
  };

  return (
    <ModalScreen
      header={
        <ModalHeader
          title={t.title}
          cancelLabel={t.cancel}
          onCancel={() => router.back()}
          actionLabel={t.save}
          actionIcon="check"
          onAction={() => void submit()}
          actionDisabled={busy}
        />
      }
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
        {errors.form && <FormAlert title={errors.form} />}
        <TextField
          label={t.current}
          value={current}
          onChangeText={setCurrent}
          password
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="next"
          onSubmitEditing={() => nextRef.current?.focus()}
          error={errors.current}
        />
        <TextField
          ref={nextRef}
          label={t.next}
          value={next}
          onChangeText={setNext}
          password
          autoComplete="new-password"
          textContentType="newPassword"
          hint={t.hint}
          returnKeyType="done"
          onSubmitEditing={() => void submit()}
          error={errors.next}
        />
        <Text variant="body" color={colors.text.secondary} style={styles.pad}>
          {t.note}
        </Text>
      </ScrollView>
    </ModalScreen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.lg },
  pad: { paddingHorizontal: spacing.xxs },
});
