import { StyleSheet, View } from 'react-native';
import type { SupportRequestDto } from '@tandems/api-client';
import type { MotionProfile } from '@tandems/shared';
import { es } from '@/strings/es';
import { colors, fontFamilies, spacing } from '@/theme';
import { Card, CardAction, PersonToken, Text, usePersonStyle } from '@/ui';
import { SendSupportButton } from './SendSupportButton';

/** «Juan te pide apoyo» (Te piden, en la Home): enviar apoyo manteniendo pulsado o «Ahora no». */
export function SupportRequestCard({
  request,
  motion,
  onDecline,
}: {
  request: SupportRequestDto;
  motion: MotionProfile;
  onDecline: () => void;
}) {
  const t = es.support.request;
  const person = request.person;
  const style = usePersonStyle(person?.color);
  const name = person?.name ?? '';
  return (
    <Card person={person?.color} style={styles.card}>
      <View style={styles.row}>
        {person && (
          <PersonToken
            name={name}
            initials={person.initials}
            color={person.color}
            size="md"
            decorative
          />
        )}
        <View style={styles.texts}>
          <Text variant="caption" color={colors.text.caption}>
            {t.caption}
          </Text>
          <Text variant="body" color={colors.text.secondary}>
            <Text variant="body" color={style?.text ?? colors.text.primary} style={styles.name}>
              {name}
            </Text>
            {t.asks}
          </Text>
        </View>
      </View>
      <Text variant="bodyStrong" accessibilityRole="header">
        {request.taskTitle}
      </Text>
      {request.message ? (
        <Text variant="body" color={colors.text.primary}>
          «{request.message}»
        </Text>
      ) : null}
      <Text variant="body" color={colors.text.secondary}>
        {t.body}
      </Text>
      <SendSupportButton taskId={request.taskId} name={name} motion={motion} />
      <View style={styles.actions}>
        <CardAction label={t.notNow} variant="link" onPress={onDecline} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  texts: { flex: 1, gap: spacing.xxs },
  name: { fontFamily: fontFamilies.sansSemiBold },
  actions: { flexDirection: 'row' },
});
