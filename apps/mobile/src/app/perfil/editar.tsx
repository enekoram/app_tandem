import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  getMeControllerMeQueryKey,
  useAccountControllerDelete,
  useMeControllerMe,
  useMeControllerUpdate,
} from '@tandems/api-client';
import { updateProfileSchema } from '@tandems/shared';
import { authClient } from '@/lib/auth';
import { DISPLAY_NAME_MAX } from '@/lib/authErrors';
import { prefs } from '@/lib/prefs';
import { es } from '@/strings/es';
import { colors, radii, selfColor, sizes, spacing } from '@/theme';
import {
  ConfirmSheet,
  FormAlert,
  ListCard,
  ListRow,
  ModalHeader,
  ModalScreen,
  Text,
  TextField,
  useToast,
} from '@/ui';

/**
 * Editar perfil (hoja modal). De momento solo el nombre: la foto se aplaza hasta tener
 * almacenamiento y el email es de solo lectura hasta que haya verificación de email.
 */
export default function EditProfileScreen() {
  const t = es.profile.form;
  const toast = useToast();
  const queryClient = useQueryClient();
  const me = useMeControllerMe();
  const profile = me.data?.status === 200 ? me.data.data : undefined;
  const update = useMeControllerUpdate();
  const remove = useAccountControllerDelete();
  const [name, setName] = useState<string | null>(null);
  const [error, setError] = useState<{ name?: string; form?: string }>({});
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const value = name ?? profile?.displayName ?? '';

  const save = () => {
    const trimmed = value.trim();
    if (!trimmed) return setError({ name: es.auth.errors.nameRequired });
    if (trimmed.length > DISPLAY_NAME_MAX) return setError({ name: es.auth.errors.nameTooLong });
    const parsed = updateProfileSchema.parse({ displayName: trimmed });
    setError({});
    update.mutate(
      { data: parsed },
      {
        onSuccess: (res) => {
          if (res.status !== 200) return setError({ form: es.auth.errors.unknown });
          queryClient.setQueryData(getMeControllerMeQueryKey(), res);
          router.back();
          toast(t.saved, { kind: 'ok' });
        },
        onError: () => setError({ form: es.auth.errors.network }),
      },
    );
  };

  const deleteAccount = () => {
    remove.mutate(undefined, {
      onSuccess: async () => {
        // Sin sesión, la app vuelve al acceso y enseña «Cuenta eliminada»
        await prefs.setAccountDeleted();
        setConfirmingDelete(false);
        await authClient.signOut();
      },
      onError: () => {
        setConfirmingDelete(false);
        toast(es.profile.deleteSheet.failed, { kind: 'err' });
      },
    });
  };

  const sheet = es.profile.deleteSheet;
  return (
    <ModalScreen
      header={
        <ModalHeader
          title={t.title}
          cancelLabel={t.cancel}
          onCancel={() => router.back()}
          actionLabel={t.save}
          actionIcon="check"
          onAction={save}
          actionDisabled={update.isPending || !profile}
        />
      }
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
        <View
          style={styles.avatar}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Text variant="avatarLarge">
            {(value.trim() || profile?.displayName || '').charAt(0).toLocaleUpperCase('es')}
          </Text>
        </View>
        <Text variant="label" color={colors.text.secondary} style={styles.pad}>
          {t.allRequired}
        </Text>
        {error.form && <FormAlert title={error.form} />}
        <TextField
          label={t.name}
          value={value}
          onChangeText={setName}
          autoCapitalize="words"
          autoComplete="name"
          returnKeyType="done"
          onSubmitEditing={save}
          maxLength={DISPLAY_NAME_MAX + 10}
          error={error.name}
        />
        <TextField
          label={t.email}
          value={profile?.email ?? ''}
          editable={false}
          hint={t.emailHint}
          accessibilityState={{ disabled: true }}
        />
        <ListCard>
          <ListRow
            icon="lock"
            title={t.changePassword}
            onPress={() => router.push('/perfil/contrasena')}
          />
          <ListRow
            icon="trash"
            title={t.deleteAccount}
            destructive
            onPress={() => setConfirmingDelete(true)}
          />
        </ListCard>
      </ScrollView>

      <ConfirmSheet
        visible={confirmingDelete}
        title={sheet.title}
        body={sheet.body}
        confirmLabel={sheet.confirm}
        confirmIcon="trash"
        cancelLabel={sheet.cancel}
        destructive
        busy={remove.isPending}
        onConfirm={deleteAccount}
        onCancel={() => setConfirmingDelete(false)}
      />
    </ModalScreen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.lg },
  pad: { paddingHorizontal: spacing.xxs },
  avatar: {
    width: sizes.avatar.lg,
    height: sizes.avatar.lg,
    borderRadius: radii.round,
    backgroundColor: selfColor.base,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.xxs,
  },
});
