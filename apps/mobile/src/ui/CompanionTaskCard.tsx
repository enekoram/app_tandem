import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { TaskDto } from '@tandems/api-client';
import { colors, fontFamilies, spacing } from '@/theme';
import { Card } from './Card';
import { PersonToken, usePersonStyle } from './person';
import { Text } from './Text';

/**
 * Tarea de otra persona que acompaño (canvas «Acompaño»): avatar de la dueña, etiqueta,
 * título, línea con su nombre en su color y acciones.
 */
export function CompanionTaskCard({
  task,
  caption,
  line,
  meta,
  footer,
  actions,
}: {
  task: TaskDto;
  caption: string;
  /** Texto tras el nombre: «quiere que le acompañes». Si no hay, solo `meta`. */
  line?: string;
  meta?: string;
  /** Contenido a todo el ancho antes de las acciones (p. ej. «Enviar apoyo»). */
  footer?: ReactNode;
  actions?: ReactNode;
}) {
  const owner = task.person;
  const style = usePersonStyle(owner?.color);
  return (
    <Card person={owner?.color} style={styles.card} accessibilityLabel={task.title}>
      <View style={styles.row}>
        {owner && (
          <PersonToken
            name={owner.name}
            initials={owner.initials}
            color={owner.color}
            size="md"
            decorative
          />
        )}
        <View style={styles.texts}>
          <Text variant="caption" color={colors.text.caption}>
            {caption}
          </Text>
          <Text variant="bodyStrong" accessibilityRole="header">
            {task.title}
          </Text>
          {line && owner ? (
            <Text variant="body" color={colors.text.secondary}>
              <Text variant="body" color={style?.text ?? colors.text.primary} style={styles.name}>
                {owner.name}
              </Text>
              {` ${line}`}
            </Text>
          ) : null}
          {meta ? (
            <Text variant="body" color={colors.text.secondary}>
              {meta}
            </Text>
          ) : null}
        </View>
      </View>
      {footer}
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  texts: { flex: 1, gap: spacing.xxs },
  name: { fontFamily: fontFamilies.sansSemiBold },
  actions: { flexDirection: 'row', gap: spacing.sm },
});
