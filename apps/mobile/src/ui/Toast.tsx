import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { es } from '@/strings/es';
import { borders, colors, durations, MIN_TOUCH_TARGET, radii, sizes, spacing } from '@/theme';
import { Button } from './Button';
import { Icon } from './icons';
import { Text } from './Text';

export type ToastKind = 'info' | 'ok' | 'err';

interface ToastOptions {
  kind?: ToastKind;
  action?: { label: string; onPress: () => void };
}

interface ToastState extends ToastOptions {
  id: number;
  message: string;
}

const ToastContext = createContext<((message: string, options?: ToastOptions) => void) | null>(
  null,
);

/** Muestra un toast. Nunca usa el negro del CTA; se anuncia a VoiceOver/TalkBack. */
export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error('useToast fuera de <ToastProvider>');
  return show;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const insets = useSafeAreaInsets();

  const show = useCallback((message: string, options: ToastOptions = {}) => {
    clearTimeout(timer.current);
    setToast({ id: Date.now(), message, ...options });
    AccessibilityInfo.announceForAccessibility(message);
    // Con «Deshacer», la ventana de deshacer (8 s); si solo informa, 4 s
    timer.current = setTimeout(
      () => setToast(null),
      options.action ? durations.undo : durations.toast,
    );
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const palette = colors.toast[toast?.kind ?? 'info'];
  const bottom =
    Math.max(insets.bottom, sizes.tabBarInset.bottom) + sizes.tabBar.height + spacing.md;

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <Animated.View
          key={toast.id}
          entering={FadeInDown.duration(durations.base).reduceMotion(ReduceMotion.System)}
          exiting={FadeOutDown.duration(durations.fast).reduceMotion(ReduceMotion.System)}
          accessibilityLiveRegion="polite"
          style={[
            styles.toast,
            { bottom, backgroundColor: palette.bg, borderColor: palette.border },
          ]}
        >
          <View style={styles.message}>
            <Text variant="label" color={palette.text}>
              {toast.message}
            </Text>
          </View>
          {toast.action && (
            <Button
              variant="link"
              label={toast.action.label}
              onPress={() => {
                toast.action?.onPress();
                setToast(null);
              }}
            />
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={es.common.close}
            hitSlop={spacing.xs}
            onPress={() => {
              clearTimeout(timer.current);
              setToast(null);
            }}
            style={styles.close}
          >
            <Icon name="close" size={sizes.icon.button} color={palette.text} strokeWidth={1.8} />
          </Pressable>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    minHeight: sizes.button.height,
    borderRadius: radii.bubble,
    borderWidth: borders.hairline,
    paddingLeft: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  message: { flex: 1, paddingVertical: spacing.md },
  close: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
});
