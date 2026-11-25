import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Blur,
  Canvas,
  Circle,
  ColorMatrix,
  DashPathEffect,
  Group,
  LinearGradient,
  Mask,
  Paint,
  Path,
  Rect,
  Text as SkText,
  useFont,
  vec,
  type SkFont,
} from '@shopify/react-native-skia';
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import {
  sceneGeometry,
  SCENE_H,
  SCENE_W,
  type MotionProfile,
  type Scene,
  type ShapeTarget,
} from '@tandems/shared';
import { colors, drift, durations, goo, gradients, motionProfiles, orbit, sizes } from '@/theme';
import { usePersonStyle } from '@/ui';
import { useDrift, useHeartbeat } from '@/ui/art/motion';
import { es } from '@/strings/es';
import { describeSceneA11y } from './a11y';

const serif = require('@expo-google-fonts/eb-garamond/500Medium/EBGaramond_500Medium.ttf');
const serifItalic = require('@expo-google-fonts/eb-garamond/500Medium_Italic/EBGaramond_500Medium_Italic.ttf');
const sansBold = require('@expo-google-fonts/plus-jakarta-sans/700Bold/PlusJakartaSans_700Bold.ttf');

const HEART = 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z';
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
/** Amplitud de la respiración relativa al perfil completo. */
const BREATH = (m: MotionProfile) =>
  motionProfiles[m].breathAmplitude / motionProfiles.full.breathAmplitude;

interface SlotValues {
  cx: SharedValue<number>;
  cy: SharedValue<number>;
  r: SharedValue<number>;
  opacity: SharedValue<number>;
}

/**
 * Valores animados de un hueco. Al cambiar el destino se anima DESDE el valor actual
 * (interrumpible, doc 03): muelle en completo/suave; en mínimo, posición directa y fundido.
 */
function useSlot(target: ShapeTarget | undefined, motion: MotionProfile): SlotValues {
  const cx = useSharedValue(target?.cx ?? SCENE_W / 2);
  const cy = useSharedValue(target?.cy ?? SCENE_H / 2);
  const r = useSharedValue(target?.r ?? 0);
  const opacity = useSharedValue(target ? target.opacity : 0);
  const tcx = target?.cx ?? cx.value;
  const tcy = target?.cy ?? cy.value;
  const tr = target?.r ?? 0;
  const to = target ? target.opacity : 0;
  useEffect(() => {
    const spring = motionProfiles[motion].spring;
    if (spring) {
      cx.value = withSpring(tcx, spring);
      cy.value = withSpring(tcy, spring);
      r.value = withSpring(tr, spring);
      opacity.value = withTiming(to, { duration: durations.base });
    } else {
      cx.value = tcx;
      cy.value = tcy;
      r.value = tr;
      opacity.value = withTiming(to, { duration: durations.fade });
    }
  }, [tcx, tcy, tr, to, motion, cx, cy, r, opacity]);
  return { cx, cy, r, opacity };
}

/** Ángulo de la órbita (radianes): vaivén suave en bucle; 0 en el perfil mínimo. */
function useOrbit(motion: MotionProfile, factor: number): SharedValue<number> {
  const q = useSharedValue(0);
  useEffect(() => {
    if (motion === 'minimal') {
      q.value = 0;
      return;
    }
    q.value = 0;
    q.value = withRepeat(withTiming(1, { duration: orbit.duration, easing: Easing.linear }), -1);
  }, [motion, q]);
  const max = motion === 'minimal' ? 0 : orbit.maxAngle * (motion === 'gentle' ? 0.5 : 1) * factor;
  return useDerivedValue(() => max * Math.sin(q.value * 2 * Math.PI));
}

/**
 * Posición con respiración: el destino + la deriva (se suma, no es un estado). Las formas
 * que no son «tú» además orbitan a tu alrededor (`center`), sin cambiar la distancia.
 */
function useBreathing(
  v: SlotValues,
  p: SharedValue<number>,
  amp: number,
  me: boolean,
  center?: SlotValues,
  angle?: SharedValue<number>,
) {
  const m = me ? drift.self : drift.other;
  const x = useDerivedValue(() => {
    const bx = v.cx.value + m.dx * p.value * amp;
    if (!center || !angle) return bx;
    const by = v.cy.value + m.dy * p.value * amp;
    const a = angle.value;
    return (
      center.cx.value + (bx - center.cx.value) * Math.cos(a) - (by - center.cy.value) * Math.sin(a)
    );
  });
  const y = useDerivedValue(() => {
    const by = v.cy.value + m.dy * p.value * amp;
    if (!center || !angle) return by;
    const bx = v.cx.value + m.dx * p.value * amp;
    const a = angle.value;
    return (
      center.cy.value + (bx - center.cx.value) * Math.sin(a) + (by - center.cy.value) * Math.cos(a)
    );
  });
  const r = useDerivedValue(() => v.r.value * (1 + (m.scale - 1) * p.value * amp));
  return { x, y, r };
}

/** Progreso 0 → 1 en bucle para las ondas («te piden»). Quieto en el perfil mínimo. */
function useRipple(motion: MotionProfile): SharedValue<number> {
  const q = useSharedValue(0);
  useEffect(() => {
    if (motion === 'minimal') {
      q.value = 0.5;
      return;
    }
    q.value = withRepeat(
      withTiming(1, { duration: durations.breath / 3, easing: Easing.out(Easing.ease) }),
      -1,
    );
  }, [motion, q]);
  return q;
}

function Letter({
  text,
  font,
  x,
  y,
  opacity,
}: {
  text: string;
  font: SkFont | null;
  x: SharedValue<number>;
  y: SharedValue<number>;
  opacity: SharedValue<number>;
}) {
  const width = font ? font.measureText(text).width : 0;
  const height = font ? font.getSize() * 0.34 : 0;
  const tx = useDerivedValue(() => x.value - width / 2);
  const ty = useDerivedValue(() => y.value + height);
  if (!font || !text) return null;
  return (
    <SkText x={tx} y={ty} text={text} font={font} color={colors.text.primary} opacity={opacity} />
  );
}

/**
 * Escena de la Home: tú y tu gente como formas que se funden (misma técnica que el
 * onboarding: desenfoque + umbral de alfa sobre una máscara con el degradado).
 */
export function HomeScene({ scene, motion }: { scene: Scene; motion: MotionProfile }) {
  const [width, setWidth] = useState(0);
  const geometry = sceneGeometry(scene);
  const shapes = geometry.shapes;
  const p = useDrift();
  const amp = BREATH(motion);
  const ripple = useRipple(motion);
  const beat = useHeartbeat();

  // Cuatro huecos fijos: la forma unida admite hasta 4 formas (doc 03)
  const s0 = useSlot(shapes[0], motion);
  const s1 = useSlot(shapes[1], motion);
  const s2 = useSlot(shapes[2], motion);
  const s3 = useSlot(shapes[3], motion);
  const slots = [s0, s1, s2, s3];
  // El «amigo» orbita a tu alrededor; con las formas separadas, menos (no se sale del lienzo)
  const together = scene.layout === 'joined' || scene.layout === 'fused';
  const angle = useOrbit(motion, together ? 1 : orbit.apartFactor);
  const b0 = useBreathing(s0, p, amp, true);
  const b1 = useBreathing(s1, p, amp, false, s0, angle);
  const b2 = useBreathing(s2, p, amp, false, s0, angle);
  const b3 = useBreathing(s3, p, amp, false, s0, angle);
  const breathing = [b0, b1, b2, b3];

  // Radio dentro de la máscara: solo las formas unidas
  const u0 = !!shapes[0]?.united;
  const u1 = !!shapes[1]?.united;
  const u2 = !!shapes[2]?.united;
  const u3 = !!shapes[3]?.united;
  const m0 = useDerivedValue(() => (u0 ? b0.r.value : 0));
  const m1 = useDerivedValue(() => (u1 ? b1.r.value : 0));
  const m2 = useDerivedValue(() => (u2 ? b2.r.value : 0));
  const m3 = useDerivedValue(() => (u3 ? b3.r.value : 0));
  const maskR = [m0, m1, m2, m3];

  const fonts = {
    me: useFont(serif, 52),
    big: useFont(serifItalic, 40),
    small: useFont(serifItalic, 22),
    live: useFont(sansBold, 12),
  };

  const people = new Map(scene.people.map((x) => [x.id, x]));
  const companion = shapes.slice(1).find((s) => s.united);
  const companionColor = companion ? people.get(companion.id)?.color : undefined;
  const companionStyle = usePersonStyle(
    companionColor && companionColor !== 'self' ? companionColor : undefined,
  );
  const g = gradients.energy;
  const united = [g[0], g[1], g[2], companionStyle?.fill ?? g[2]];

  const heartIndex = shapes.findIndex((s) => s.id === scene.heart);
  const heartSlot = heartIndex >= 0 ? breathing[heartIndex] : undefined;
  const hx = heartSlot?.x ?? b0.x;
  const hy = heartSlot?.y ?? b0.y;
  const hr = heartSlot?.r ?? b0.r;
  const still = motion === 'minimal';
  const heartTransform = useDerivedValue(() => {
    const scale = still ? 1.4 : 1.4 * beat.value;
    return [
      { translateX: hx.value + hr.value * 0.35 },
      { translateY: hy.value - hr.value * 0.55 },
      { scale },
      { translateX: -12 },
      { translateY: -12 },
    ];
  });

  const k = Math.min(width / SCENE_W, 1.2);
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={describeSceneA11y(scene.a11y)}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={styles.wrap}
    >
      {width > 0 && (
        <Canvas style={{ width: SCENE_W * k, height: SCENE_H * k }}>
          <Group transform={[{ scale: k }]}>
            {geometry.placeholders.map((c, i) => (
              <Circle
                key={i}
                cx={c.cx}
                cy={c.cy}
                r={c.r}
                style="stroke"
                strokeWidth={1.6}
                color={colors.illustration.slotEmpty}
              >
                <DashPathEffect intervals={[4, 5]} />
              </Circle>
            ))}

            {/* Forma unida: máscara goo con el degradado de energía hacia el color de la otra persona */}
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
                  {slots.map((v, i) => (
                    <Circle
                      key={i}
                      cx={breathing[i]!.x}
                      cy={breathing[i]!.y}
                      r={maskR[i]!}
                      color="white"
                    />
                  ))}
                </Group>
              }
            >
              <Rect x={0} y={0} width={SCENE_W} height={SCENE_H}>
                <LinearGradient
                  start={vec(60, 0)}
                  end={vec(310, 0)}
                  colors={united}
                  positions={[0, 0.38, 0.62, 1]}
                />
              </Rect>
            </Mask>

            {/* Formas sueltas: quien no está (atenuada) o quien se acerca */}
            {shapes.map((s, i) =>
              s.united ? null : (
                <LooseShape
                  key={s.id}
                  color={people.get(s.id)?.color}
                  x={breathing[i]!.x}
                  y={breathing[i]!.y}
                  r={breathing[i]!.r}
                  opacity={slots[i]!.opacity}
                />
              ),
            )}

            {/* Ondas: está pidiendo algo */}
            {shapes.map((s, i) =>
              s.ripple ? (
                <Ripples
                  key={`rip-${s.id}`}
                  color={people.get(s.id)?.color}
                  x={breathing[i]!.x}
                  y={breathing[i]!.y}
                  r={breathing[i]!.r}
                  q={ripple}
                />
              ) : null,
            )}

            {shapes.map((s, i) => {
              const person = people.get(s.id);
              const isMe = i === 0;
              const font = isMe ? fonts.me : s.r >= 40 ? fonts.big : fonts.small;
              return (
                <Letter
                  key={`t-${s.id}`}
                  text={person?.initials ?? ''}
                  font={font}
                  x={breathing[i]!.x}
                  y={breathing[i]!.y}
                  opacity={slots[i]!.opacity}
                />
              );
            })}

            {heartSlot && (
              <Group transform={heartTransform}>
                <Path path={HEART} color={colors.bg.surface} />
              </Group>
            )}

            {geometry.liveDot && fonts.live && (
              <>
                <Circle
                  cx={geometry.liveDot.x}
                  cy={geometry.liveDot.y}
                  r={sizes.notice.liveDot / 2 + 1}
                  color={colors.status.live}
                />
                <SkText
                  x={geometry.liveDot.x + 10}
                  y={geometry.liveDot.y + 4}
                  text={es.onboarding.live}
                  font={fonts.live}
                  color={colors.status.liveText}
                />
              </>
            )}

            {scene.celebrate &&
              colors.illustration.sparkle.map((c, i) => (
                <Circle key={`sp-${i}`} cx={60 + i * 60} cy={i % 2 ? 24 : 178} r={5} color={c} />
              ))}
          </Group>
        </Canvas>
      )}
    </View>
  );
}

function LooseShape({
  color,
  x,
  y,
  r,
  opacity,
}: {
  color: Scene['people'][number]['color'] | undefined;
  x: SharedValue<number>;
  y: SharedValue<number>;
  r: SharedValue<number>;
  opacity: SharedValue<number>;
}) {
  const style = usePersonStyle(color && color !== 'self' ? color : undefined);
  return (
    <Circle
      cx={x}
      cy={y}
      r={r}
      color={style?.fill ?? colors.illustration.selfLight}
      opacity={opacity}
    />
  );
}

function Ripples({
  color,
  x,
  y,
  r,
  q,
}: {
  color: Scene['people'][number]['color'] | undefined;
  x: SharedValue<number>;
  y: SharedValue<number>;
  r: SharedValue<number>;
  q: SharedValue<number>;
}) {
  const style = usePersonStyle(color && color !== 'self' ? color : undefined);
  const r1 = useDerivedValue(() => r.value + 4 + 14 * q.value);
  const r2 = useDerivedValue(() => r.value + 4 + 14 * ((q.value + 0.5) % 1));
  const o1 = useDerivedValue(() => 1 - q.value);
  const o2 = useDerivedValue(() => 1 - ((q.value + 0.5) % 1));
  const c = style?.fill ?? colors.illustration.other;
  return (
    <>
      <Circle cx={x} cy={y} r={r1} style="stroke" strokeWidth={2} color={c} opacity={o1} />
      <Circle cx={x} cy={y} r={r2} style="stroke" strokeWidth={1.5} color={c} opacity={o2} />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { minHeight: sizes.onboardingArt.height, alignItems: 'center', justifyContent: 'center' },
});
