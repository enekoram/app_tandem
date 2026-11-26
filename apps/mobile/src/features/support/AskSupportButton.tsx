import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';
import { useSupportControllerRequest, type TaskDto } from '@tandems/api-client';
import type { MotionProfile } from '@tandems/shared';
import { invalidateSessions } from '@/lib/queries';
import { es } from '@/strings/es';
import { askSupport, borders, colors, durations, radii, sizes, spacing } from '@/theme';
import { Icon, Text, usePersonStyle, useToast } from '@/ui';

/**
 * «Pedir apoyo» directo (decisión del 2026-11-26, sustituye a la hoja PedirApoyo del canvas):
 * al tocarlo se envía la petición, el botón se llena con el color de quien acompaña de
 * izquierda a derecha y se queda en «Pedido» con un halo que respira. El texto cambia (el
 * significado no depende solo del color). Perfil mínimo: sin barrido ni halo, solo fundido.
 */
export function AskSupportButton({
  task,
  asked,
  motion,
}: {
  task: TaskDto;
  /** Ya hay una petición abierta para esta tarea (según /me/home). */
  asked: boolean;
  motion: MotionProfile;
}) {
  const t = es.support.ask;
  const toast = useToast();
  const queryClient = useQueryClient();
  const request = useSupportControllerRequest();
  const person = usePersonStyle(task.person?.color);
  const name = task.person?.name ?? '';
  const [justAsked, setJustAsked] = useState(false);
  const on = asked || justAsked;
  const [width, setWidth] = useState(0);

  const fill = useSharedValue(on ? 1 : 0);
  const halo = useSharedValue(0);

  useEffect(() => {
    if (!on) {
      cancelAnimation(halo);
      halo.value = 0;
      fill.value = withTiming(0, { duration: durations.base });
      return;
    }
    if (motion === 'minimal') {
      fill.value = withTiming(1, { duration: durations.fade });
      return;
    }
    fill.value = withTiming(1, {
      duration: askSupport.fill,
      easing: Easing.out(Easing.cubic),
    });
    halo.value = withRepeat(
      withTiming(1, { duration: askSupport.halo / 2, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [on, motion, fill, halo]);

  const gentle = motion === 'gentle' ? 0.5 : 1;
  const fillStyle = useAnimatedStyle(() =>
    motion === 'minimal'
      ? { width: '100%', opacity: fill.value }
      : { width: width * fill.value, opacity: 1 },
  );
  const haloStyle = useAnimatedStyle(() => ({
    opacity: halo.value * askSupport.haloOpacity * gentle,
    transform: [
      { scaleX: 1 + (askSupport.haloScale - 1) * halo.value * gentle },
      { scaleY: 1 + (askSupport.haloScale - 1) * 2 * halo.value * gentle },
    ],
  }));

  const ask = () => {
    if (on || request.isPending) return;
    setJustAsked(true);
    if (motion === 'full') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    request.mutate(
      { data: { taskId: task.id } },
      {
        onSuccess: (res) => {
          if (res.status !== 201) {
            setJustAsked(false);
            toast(es.auth.errors.network, { kind: 'err' });
            return;
          }
          // /me/home trae las peticiones (ApoyoPedido en la Home)
          void invalidateSessions(queryClient);
          toast(t.sent(name), { kind: 'ok' });
        },
        onError: () => {
          setJustAsked(false);
          toast(es.auth.errors.network, { kind: 'err' });
        },
      },
    );
  };

  const tint = person?.fill ?? colors.action.primary;
  return (
    <View style={styles.wrap}>
      <Animated.View
        pointerEvents="none"
        style={[styles.halo, { backgroundColor: person?.soft ?? tint }, haloStyle]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={on ? t.askedA11y(name) : t.actionA11y(name)}
        accessibilityState={{ disabled: on, selected: on }}
        onPress={ask}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={({ pressed }) => [
          styles.button,
          { borderColor: on ? tint : colors.action.primary },
          pressed && !on && styles.pressed,
        ]}
      >
        <Animated.View style={[styles.fill, { backgroundColor: tint }, fillStyle]} />
        <Icon name="heart" size={sizes.icon.button} strokeWidth={1.8} color={colors.text.primary} />
        <Text variant="label" style={styles.text}>
          {on ? t.askedLine(name) : t.action}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center' },
  halo: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: radii.bubble,
  },
  button: {
    minHeight: sizes.cardAction.height,
    borderRadius: radii.bubble,
    borderWidth: borders.pending,
    backgroundColor: colors.bg.surface,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  text: { textAlign: 'center', flexShrink: 1 },
  pressed: { opacity: 0.85 },
});
