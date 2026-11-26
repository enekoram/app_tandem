import { useEffect } from 'react';
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
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import type { MotionProfile } from '@tandems/shared';
import { celebration, goo, gradients, motionProfiles } from '@/theme';

const W = 358;
const H = 220;
const CX = W / 2;
const CY = H / 2;
const GOO_MATRIX = [
  1,
  0,
  0,
  0,
  0,
  0,
  1,
  0,
  0,
  0,
  0,
  0,
  1,
  0,
  0,
  0,
  0,
  0,
  goo.alphaSlope,
  goo.alphaOffset,
];
/** Separación inicial de las formas (cada una a este lado del centro) y al fundirse. */
const APART = 70;
const TOGETHER = 22;

/** Un punto del estallido: sale del centro en su ángulo y se desvanece al llegar. */
function Particle({
  burst,
  index,
  count,
  distance,
}: {
  burst: SharedValue<number>;
  index: number;
  count: number;
  distance: number;
}) {
  const angle = (index / count) * Math.PI * 2 + (index % 2 ? 0.2 : 0);
  const far = distance * (index % 3 === 0 ? 1 : 0.78);
  const color = gradients.brand[index % gradients.brand.length]!;
  const cx = useDerivedValue(() => CX + Math.cos(angle) * far * burst.value);
  const cy = useDerivedValue(() => CY + Math.sin(angle) * far * burst.value);
  const opacity = useDerivedValue(() => (burst.value <= 0 ? 0 : 1 - burst.value));
  const r = useDerivedValue(() => 3 + 5 * (1 - burst.value));
  return <Circle cx={cx} cy={cy} r={r} color={color} opacity={opacity} />;
}

/**
 * HurraRecibido: tu forma y la de quien te acompaña se juntan y celebran con un estallido.
 * Perfil completo: muelle + estallidos que se repiten. Suave: menos puntos, más cortos, uno
 * solo. Mínimo (o Reducir movimiento): formas ya unidas y solo un fundido.
 */
export function CelebrationArt({ motion }: { motion: MotionProfile }) {
  const minimal = motion === 'minimal';
  const offset = useSharedValue(minimal ? TOGETHER : APART);
  const burst = useSharedValue(0);
  const fade = useSharedValue(minimal ? 0 : 1);

  useEffect(() => {
    if (minimal) {
      fade.value = withTiming(1, { duration: celebration.join / 3 });
      return;
    }
    const spring = motionProfiles[motion].spring;
    offset.value = withDelay(200, withSpring(TOGETHER, spring ?? undefined));
    const once = withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(1, { duration: celebration.burst, easing: Easing.out(Easing.cubic) }),
    );
    burst.value = withDelay(
      celebration.join / 2,
      motion === 'full'
        ? withRepeat(
            withSequence(once, withDelay(celebration.rest, withTiming(0, { duration: 0 }))),
            -1,
          )
        : once,
    );
  }, [minimal, motion, offset, burst, fade]);

  const count = minimal ? 0 : celebration.particles[motion === 'full' ? 'full' : 'gentle'];
  const distance = celebration.distance[motion === 'full' ? 'full' : 'gentle'];
  const leftX = useDerivedValue(() => CX - offset.value);
  const rightX = useDerivedValue(() => CX + offset.value);

  return (
    <View
      style={styles.wrap}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Canvas style={styles.canvas}>
        <Group opacity={fade}>
          {Array.from({ length: count }, (_, i) => (
            <Particle key={i} burst={burst} index={i} count={count} distance={distance} />
          ))}
          <Mask
            mask={
              <Group
                layer={
                  <Paint>
                    <Blur blur={goo.blur} />
                    <ColorMatrix matrix={GOO_MATRIX} />
                  </Paint>
                }
              >
                <Circle cx={leftX} cy={CY} r={46} color="white" />
                <Circle cx={rightX} cy={CY - 8} r={36} color="white" />
              </Group>
            }
          >
            <Rect x={0} y={0} width={W} height={H}>
              <LinearGradient
                start={vec(CX - 110, CY - 50)}
                end={vec(CX + 110, CY + 50)}
                colors={[...gradients.brand]}
              />
            </Rect>
          </Mask>
        </Group>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  canvas: { width: W, height: H },
});
