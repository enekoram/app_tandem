import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  supportControllerBeat,
  supportControllerEnd,
  supportControllerStart,
} from '@tandems/api-client';
import { SUPPORT_BEAT_MS, SUPPORT_SEND_MAX_MS, type MotionProfile } from '@tandems/shared';
import { es } from '@/strings/es';
import { borders, colors, radii, sizes, spacing } from '@/theme';
import { Icon, Text, useToast } from '@/ui';

/**
 * «Enviar apoyo» (doc 04 · decisión 7): mientras se mantiene pulsado, la otra persona ve un
 * corazón latiendo en tu forma. Se para al soltar o a los 5 min. Con VoiceOver/TalkBack
 * (no se puede mantener pulsado) un toque empieza y otro termina.
 * Vibración suave en cada latido solo con estímulo completo.
 */
export function SendSupportButton({
  taskId,
  name,
  motion,
  onSent,
}: {
  taskId: string;
  name: string;
  motion: MotionProfile;
  onSent?: () => void;
}) {
  const t = es.support.send;
  const toast = useToast();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const eventId = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const deadline = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [screenReader, setScreenReader] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isScreenReaderEnabled().then(setScreenReader);
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setScreenReader);
    return () => sub.remove();
  }, []);

  const stop = () => {
    clearInterval(timer.current);
    clearTimeout(deadline.current);
    const id = eventId.current;
    eventId.current = null;
    if (!sending && !id) return;
    setSending(false);
    if (id) {
      void supportControllerEnd(id).catch(() => undefined);
      setSent(true);
      onSent?.();
    }
  };

  const start = async () => {
    if (sending) return;
    setSending(true);
    try {
      const res = await supportControllerStart({ taskId });
      if (res.status !== 201) throw new Error();
      eventId.current = res.data.id;
      if (motion === 'full') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      timer.current = setInterval(() => {
        const id = eventId.current;
        if (!id) return;
        if (motion === 'full') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        supportControllerBeat(id).catch(stop);
      }, SUPPORT_BEAT_MS);
      deadline.current = setTimeout(stop, SUPPORT_SEND_MAX_MS);
    } catch {
      setSending(false);
      toast(es.auth.errors.network, { kind: 'err' });
    }
  };

  // Al salir de la pantalla, se suelta (la referencia siempre apunta al `stop` actual)
  const stopRef = useRef(stop);
  stopRef.current = stop;
  useEffect(() => () => stopRef.current(), []);

  const label = sending ? t.sending : sent ? t.sent : t.label;
  return (
    <View style={styles.wrap}>
      {sent && !sending ? (
        <Text variant="body" color={colors.status.liveText} accessibilityLiveRegion="polite">
          {t.knows(name)}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={screenReader ? t.hintScreenReader : t.hint}
        accessibilityState={{ selected: sending }}
        onPressIn={screenReader ? undefined : () => void start()}
        onPressOut={screenReader ? undefined : stop}
        onPress={screenReader ? () => (sending ? stop() : void start()) : undefined}
        style={({ pressed }) => [styles.button, (sending || pressed) && styles.active]}
      >
        <Icon
          name="heart"
          size={sizes.icon.button}
          strokeWidth={1.8}
          color={sending ? colors.action.onPrimary : colors.text.primary}
        />
        <Text variant="label" color={sending ? colors.action.onPrimary : colors.text.primary}>
          {label}
        </Text>
      </Pressable>
      {!sending && !sent ? (
        <Text variant="label" color={colors.text.caption}>
          {screenReader ? t.hintScreenReader : t.hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  button: {
    minHeight: sizes.cardAction.height,
    borderRadius: radii.bubble,
    borderWidth: borders.pending,
    borderColor: colors.action.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  active: { backgroundColor: colors.action.primary },
});
