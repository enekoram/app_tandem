import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useContactsControllerList, type ContactDto, type TaskDto } from '@tandems/api-client';
import { TASK_DESCRIPTION_MAX, TASK_TITLE_MAX } from '@tandems/shared';
import { es } from '@/strings/es';
import { colors, spacing } from '@/theme';
import { DateTimePill, FormAlert, ListCard, ListRow, PersonPicker, Text, TextField } from '@/ui';

/** Hora por defecto cuando se elige fecha sin hora. */
const DEFAULT_HOUR = 9;

export interface TaskFormValues {
  title: string;
  description: string;
  dueAt: string | null;
  companionContactId: string;
}

/** Junta fecha y hora elegidas en un ISO (o null si no hay ninguna). */
function combine(date: Date | null, time: Date | null): string | null {
  if (!date && !time) return null;
  const d = new Date(date ?? new Date());
  if (time) d.setHours(time.getHours(), time.getMinutes(), 0, 0);
  else d.setHours(DEFAULT_HOUR, 0, 0, 0);
  return d.toISOString();
}

export interface TaskFormProps {
  task?: TaskDto;
  /** Error del servidor para mostrar arriba (p. ej. TASK_LIMIT o sin conexión). */
  serverError?: string | null;
  /** El padre envía; el formulario solo valida y devuelve los valores. */
  onValid: (values: TaskFormValues) => void;
  /** Para que la cabecera (fuera del formulario) pueda disparar el envío. */
  submitRef: React.MutableRefObject<(() => void) | null>;
  footer?: React.ReactNode;
}

export function TaskForm({ task, serverError, onValid, submitRef, footer }: TaskFormProps) {
  const t = es.tasks.form;
  const contactsQuery = useContactsControllerList();
  const contacts: ContactDto[] = contactsQuery.data?.status === 200 ? contactsQuery.data.data : [];
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [date, setDate] = useState<Date | null>(task?.dueAt ? new Date(task.dueAt) : null);
  const [time, setTime] = useState<Date | null>(task?.dueAt ? new Date(task.dueAt) : null);
  const [companion, setCompanion] = useState<string | null>(task?.person?.contactId ?? null);
  const [errors, setErrors] = useState<{ title?: boolean; companion?: boolean }>({});

  // Al volver de «Añadir contacto», se elige a la persona recién añadida
  const known = useRef<number | null>(null);
  useEffect(() => {
    if (!contactsQuery.isSuccess) return;
    if (known.current !== null && contacts.length > known.current && !companion) {
      setCompanion(contacts.at(-1)?.id ?? null);
    }
    known.current = contacts.length;
  }, [contactsQuery.isSuccess, contacts, companion]);

  submitRef.current = () => {
    const next = { title: !title.trim(), companion: !companion };
    setErrors(next);
    if (next.title || next.companion) return;
    onValid({
      title: title.trim(),
      description: description.trim(),
      dueAt: combine(date, time),
      companionContactId: companion!,
    });
  };

  const missing = Number(!!errors.title) + Number(!!errors.companion);
  const addContact = () => router.push('/contactos/nuevo');

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
      {missing > 0 && <FormAlert title={t.missing(missing)} body={t.missingBody} />}
      {serverError && <FormAlert title={serverError} />}
      <TextField
        label={t.name}
        placeholder={t.namePlaceholder}
        value={title}
        onChangeText={setTitle}
        maxLength={TASK_TITLE_MAX}
        returnKeyType="next"
        error={errors.title ? t.nameRequired : null}
      />
      <TextField
        label={t.description}
        value={description}
        onChangeText={setDescription}
        maxLength={TASK_DESCRIPTION_MAX}
        multiline
        textAlignVertical="top"
      />
      <View style={styles.group}>
        <Text variant="label" style={styles.pad}>
          {t.when}
        </Text>
        <ListCard>
          <DateTimePill label={t.date} mode="date" value={date} onChange={setDate} />
          <DateTimePill label={t.time} mode="time" value={time} onChange={setTime} />
        </ListCard>
      </View>
      <View style={styles.group} accessibilityLabel={t.companion}>
        <Text variant="label" style={styles.pad}>
          {t.companion}
        </Text>
        {errors.companion ? (
          <Text variant="label" color={colors.field.errorText} style={styles.pad}>
            {t.companionRequired}
          </Text>
        ) : (
          <Text variant="label" color={colors.text.secondary} style={styles.pad}>
            {task ? t.changeHelp : t.companionHelp}
          </Text>
        )}
        {contactsQuery.isSuccess && contacts.length === 0 ? (
          <ListCard>
            <ListRow title={t.noContacts} />
            <ListRow icon="plus" title={t.addContact} onPress={addContact} />
          </ListCard>
        ) : (
          <PersonPicker
            contacts={contacts}
            value={companion}
            onChange={setCompanion}
            onAddContact={addContact}
            error={errors.companion}
          />
        )}
      </View>
      {footer}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.xl },
  group: { gap: spacing.sm },
  pad: { paddingHorizontal: spacing.xxs },
});
