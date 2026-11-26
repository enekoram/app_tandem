import { Pressable, StyleSheet, View } from 'react-native';
import type { TaskDto } from '@tandems/api-client';
import { formatDue } from '@/lib/dates';
import { es } from '@/strings/es';
import { borders, colors, fontFamilies, gradients, radii, sizes, spacing } from '@/theme';
import { Card } from './Card';
import { Icon, type IconName } from './icons';
import { usePersonStyle } from './person';
import { Text } from './Text';

const DONE_EDGE = gradients.edgeNeutral as unknown as readonly [string, string, string];

/** Etiqueta y línea de detalle de una tarea propia según su acompañante. */
function describe(task: TaskDto): { caption: string; prefix?: string; suffix: string } {
  const c = es.tasks.card;
  const due = formatDue(task.dueAt);
  const name = task.person?.name ?? '';
  switch (task.companionStatus) {
    case 'accepted':
      return { caption: c.accompanied, prefix: c.with, suffix: ` · ${due}` };
    case 'pending':
      return { caption: c.pending, suffix: `${c.waitingFor(name)} · ${due}` };
    case 'rejected':
      return { caption: c.noCompanion, suffix: `${c.rejected(name)} · ${due}` };
    case 'left':
      return { caption: c.noCompanion, suffix: `${c.left(name)} · ${due}` };
    default:
      return { caption: c.noCompanion, suffix: due };
  }
}

/** Botón de acción de tarjeta (canvas .ab): 44 de alto, fondo ground. */
export function CardAction({
  label,
  icon,
  onPress,
  accessibilityLabel,
  variant = 'solid',
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  accessibilityLabel?: string;
  variant?: 'solid' | 'ghost' | 'link';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        variant === 'ghost' && styles.actionGhost,
        variant === 'link' && styles.actionLink,
        pressed && styles.pressed,
      ]}
    >
      {icon && (
        <Icon name={icon} size={sizes.icon.button} color={colors.text.primary} strokeWidth={1.8} />
      )}
      <Text variant="label" style={[styles.actionText, variant === 'link' && styles.linkText]}>
        {label}
      </Text>
    </Pressable>
  );
}

export interface TaskCardProps {
  task: TaskDto;
  /** La primera de «Hoy empiezo con…»: título grande y descripción. */
  featured?: boolean;
  onDone?: () => void;
  onEdit?: () => void;
  /** «Pedir apoyo» (PedirApoyo); con `supportAsked`, «Pedido». */
  onAskSupport?: () => void;
  supportAsked?: boolean;
}

/** Tarjeta de una tarea propia (canvas «Mis tareas»). */
export function TaskCard({
  task,
  featured = false,
  onDone,
  onEdit,
  onAskSupport,
  supportAsked = false,
}: TaskCardProps) {
  const active = task.companionStatus === 'pending' || task.companionStatus === 'accepted';
  const person = usePersonStyle(task.person?.color);
  const { caption, prefix, suffix } = describe(task);
  const name = task.person?.name;
  return (
    <Card
      person={active ? task.person?.color : undefined}
      edge={active ? undefined : DONE_EDGE}
      style={styles.card}
      accessibilityLabel={task.title}
    >
      <View style={styles.texts}>
        <Text variant="caption" color={colors.text.caption}>
          {caption}
        </Text>
        <Text variant={featured ? 'taskTitleBig' : 'bodyStrong'} accessibilityRole="header">
          {task.title}
        </Text>
        <Text variant="body" color={colors.text.secondary}>
          {prefix && name ? (
            <>
              {`${prefix} `}
              <Text variant="body" color={person?.text ?? colors.text.primary} style={styles.name}>
                {name}
              </Text>
            </>
          ) : null}
          {suffix}
        </Text>
      </View>
      {featured && task.description ? (
        <Text variant="body" color={colors.text.caption}>
          {task.description}
        </Text>
      ) : null}
      {(onDone || onEdit || onAskSupport) && (
        <View style={styles.actions}>
          {onAskSupport && (
            <CardAction
              label={supportAsked ? es.support.ask.asked : es.support.ask.action}
              icon="heart"
              variant={supportAsked ? 'solid' : 'ghost'}
              onPress={onAskSupport}
            />
          )}
          {onDone && (
            <CardAction
              label={es.tasks.card.done}
              icon="check"
              onPress={onDone}
              accessibilityLabel={es.tasks.card.doneA11y(task.title)}
            />
          )}
          {onEdit && (
            <CardAction
              label={es.tasks.card.edit}
              variant="link"
              onPress={onEdit}
              accessibilityLabel={es.tasks.card.editA11y(task.title)}
            />
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  texts: { gap: spacing.xxs },
  name: { fontFamily: fontFamilies.sansSemiBold },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: {
    flex: 1,
    minHeight: sizes.cardAction.height,
    borderRadius: radii.bubble,
    borderWidth: borders.hairline,
    borderColor: colors.border.subtle,
    backgroundColor: colors.bg.ground,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  actionGhost: {
    backgroundColor: 'transparent',
    borderWidth: borders.pending,
    borderColor: colors.action.primary,
  },
  actionLink: { flex: 0, backgroundColor: 'transparent', borderColor: 'transparent' },
  actionText: { textAlign: 'center', flexShrink: 1 },
  linkText: { textDecorationLine: 'underline' },
  pressed: { opacity: 0.8 },
});
