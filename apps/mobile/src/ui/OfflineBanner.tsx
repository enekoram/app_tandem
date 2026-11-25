import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { retryConnection, useOnline } from '@/lib/online';
import { es } from '@/strings/es';
import { borders, colors, radii, shadows, sizes, spacing } from '@/theme';
import { Button } from './Button';
import { Icon } from './icons';
import { Text } from './Text';

/** SinConexion: franja arriba mientras no hay red, con «Reintentar». */
export function OfflineBanner() {
  const online = useOnline();
  const insets = useSafeAreaInsets();
  if (online) return null;
  const c = colors.toast.err;
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.wrap, { top: insets.top + spacing.xs }]}
    >
      <View style={[styles.banner, { backgroundColor: c.bg, borderColor: c.border }]}>
        <Icon name="alert" size={sizes.icon.header} color={c.text} strokeWidth={1.8} />
        <View style={styles.texts}>
          <Text variant="bodyStrong" color={c.text}>
            {es.offline.title}
          </Text>
          <Text variant="label" color={c.text}>
            {es.offline.body}
          </Text>
        </View>
        <Button label={es.offline.retry} variant="link" onPress={() => void retryConnection()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.lg, right: spacing.lg, zIndex: 10 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: borders.hairline,
    ...shadows.floating,
  },
  texts: { flex: 1, gap: spacing.xxs },
});
