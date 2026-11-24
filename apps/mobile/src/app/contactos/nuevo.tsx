import { useRef, useState } from 'react';
import { ScrollView, Share, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  getContactsControllerListQueryKey,
  useContactsControllerInvite,
} from '@tandems/api-client';
import { createContactSchema } from '@tandems/shared';
import { apiErrorCode, apiErrorField } from '@/lib/apiErrors';
import { es } from '@/strings/es';
import { colors, spacing } from '@/theme';
import {
  Button,
  FormAlert,
  ModalHeader,
  ModalScreen,
  Text,
  TextField,
  useToast,
  type TextInputRef,
} from '@/ui';

type Errors = { name?: string; email?: string; form?: string; existsName?: string };

/** Añadir contacto (hoja modal): invita por email y ofrece compartir el enlace. */
export default function AddContactScreen() {
  const t = es.contacts.form;
  const toast = useToast();
  const queryClient = useQueryClient();
  const invite = useContactsControllerInvite();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const emailRef = useRef<TextInputRef>(null);

  const submit = () => {
    const parsed = createContactSchema.safeParse({ name, email });
    if (!parsed.success) {
      const fields = new Set(parsed.error.issues.map((i) => i.path[0]));
      setErrors({
        name: fields.has('name') ? t.nameRequired : undefined,
        email: fields.has('email') ? t.emailInvalid : undefined,
      });
      return;
    }
    setErrors({});
    invite.mutate(
      { data: parsed.data },
      {
        onSuccess: (res) => {
          if (res.status !== 201) return;
          const { contact, inviteUrl } = res.data;
          void queryClient.invalidateQueries({ queryKey: getContactsControllerListQueryKey() });
          router.back();
          toast(es.contacts.sent(contact.name), {
            kind: 'ok',
            action: {
              label: es.contacts.share,
              onPress: () => void Share.share({ message: es.contacts.shareMessage(inviteUrl) }),
            },
          });
        },
        onError: (error) => {
          const code = apiErrorCode(error);
          if (code === 'CONTACT_EXISTS') {
            const existing = apiErrorField(error, 'name') ?? parsed.data.name;
            setErrors({ email: t.exists(existing), existsName: existing });
          } else if (code === 'SELF_INVITE') {
            setErrors({ email: t.self });
          } else if (code === 'VALIDATION') {
            setErrors({ email: t.emailInvalid });
          } else {
            setErrors({ form: es.auth.errors.network });
          }
        },
      },
    );
  };

  return (
    <ModalScreen
      header={
        <ModalHeader
          title={t.title}
          cancelLabel={t.cancel}
          onCancel={() => router.back()}
          actionLabel={t.send}
          actionIcon="send"
          onAction={submit}
          actionDisabled={invite.isPending}
        />
      }
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
        <Text variant="lead" color={colors.text.secondary} style={styles.pad}>
          {t.intro}
        </Text>
        <Text variant="label" color={colors.text.secondary} style={styles.pad}>
          {t.allRequired}
        </Text>
        {errors.form && <FormAlert title={errors.form} />}
        <TextField
          label={t.name}
          placeholder={t.namePlaceholder}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoComplete="name"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          error={errors.name}
        />
        <View style={styles.group}>
          <TextField
            ref={emailRef}
            label={t.email}
            placeholder={t.emailPlaceholder}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={submit}
            error={errors.email}
          />
          {errors.existsName && (
            <Button variant="link" label={t.seeContacts} onPress={() => router.back()} />
          )}
        </View>
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
  group: { gap: spacing.xxs },
});
