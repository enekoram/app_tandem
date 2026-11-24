import { StyleSheet, View } from 'react-native';
import {
  Blur,
  Canvas,
  Circle,
  ColorMatrix,
  Group,
  LinearGradient,
  Mask,
  Paint,
  Rect,
  vec,
} from '@shopify/react-native-skia';
import { es, plain } from '@/strings/es';
import { colors, gradients, sizes, spacing } from '@/theme';
import { EmphasisText } from '../Text';

/** Goo del logo (más suave que el de la forma grande: viene del SVG del canvas). */
const LOGO_GOO = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 22, -9];

/** Logo A1 · Rotunda: dos formas fundidas con el degradado de marca + «Tandems» y lema. */
export function Logo() {
  const { width, height } = sizes.logo;
  const k = width / 98; // viewBox 12 18 98 70
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${plain(es.brand.name)}. ${plain(es.brand.tagline)}`}
      style={styles.row}
    >
      <Canvas style={{ width, height }}>
        <Group transform={[{ scale: k }, { translateX: -12 }, { translateY: -18 }]}>
          <Mask
            mask={
              <Group
                layer={
                  <Paint>
                    <Blur blur={7} />
                    <ColorMatrix matrix={LOGO_GOO} />
                  </Paint>
                }
              >
                <Circle cx={44} cy={54} r={30} color="white" />
                <Circle cx={84} cy={44} r={23} color="white" />
              </Group>
            }
          >
            <Rect x={0} y={0} width={120} height={100}>
              <LinearGradient
                start={vec(16, 30)}
                end={vec(106, 70)}
                colors={[...gradients.brand]}
                positions={[0, 0.3, 0.52, 0.74, 1]}
              />
            </Rect>
          </Mask>
        </Group>
      </Canvas>
      <View>
        <EmphasisText text={es.brand.name} variant="logo" maxFontSizeMultiplier={1.2} />
        <EmphasisText
          text={es.brand.tagline}
          variant="tagline"
          color={colors.text.caption}
          maxFontSizeMultiplier={1.3}
          style={styles.tagline}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, alignSelf: 'center' },
  tagline: { paddingLeft: spacing.md },
});
