import { useState } from 'react';
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
  RoundedRect,
  Text as SkText,
  useFont,
  vec,
  type SkFont,
} from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { LinearGradient as RNLinearGradient } from 'expo-linear-gradient';
import Svg, { Path as SvgPath } from 'react-native-svg';
import { es } from '@/strings/es';
import { borders, colors, drift, goo, gradients, radii, shadows, sizes, spacing } from '@/theme';
import { EmphasisText, Text } from '../Text';
import { useDrift, useHeartbeat } from './motion';

/** Las ilustraciones del canvas miden 358 × 170. */
const W = 358;
const H = 170;
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

const serif = require('@expo-google-fonts/eb-garamond/500Medium/EBGaramond_500Medium.ttf');
const serifItalic = require('@expo-google-fonts/eb-garamond/500Medium_Italic/EBGaramond_500Medium_Italic.ttf');
const sansBold = require('@expo-google-fonts/plus-jakarta-sans/700Bold/PlusJakartaSans_700Bold.ttf');

type Shape = {
  cx: number;
  cy: number;
  r: number;
  motion: keyof Pick<typeof drift, 'self' | 'other'>;
};

/** Círculo que deriva con el progreso `p` (posición y radio animados). */
function useShape(p: SharedValue<number>, s: Shape) {
  const m = drift[s.motion];
  const cx = useDerivedValue(() => s.cx + m.dx * p.value);
  const cy = useDerivedValue(() => s.cy + m.dy * p.value);
  const r = useDerivedValue(() => s.r * (1 + (m.scale - 1) * p.value));
  return { cx, cy, r };
}

/** Texto centrado en (x, y) que deriva igual que su forma. */
function DriftText({
  p,
  text,
  x,
  y,
  font,
  motion,
  color = colors.text.primary,
}: {
  p: SharedValue<number>;
  text: string;
  x: number;
  y: number;
  font: SkFont | null;
  motion: Shape['motion'];
  color?: string;
}) {
  const m = drift[motion];
  const width = font ? font.measureText(text).width : 0;
  const tx = useDerivedValue(() => x - width / 2 + m.dx * p.value);
  const ty = useDerivedValue(() => y + m.dy * p.value);
  if (!font) return null;
  return <SkText x={tx} y={ty} text={text} font={font} color={color} />;
}

/** Capa «goo»: desenfoca y corta el alfa para que los círculos se fundan. */
function GooLayer({ children }: { children: React.ReactNode }) {
  return (
    <Group
      layer={
        <Paint>
          <Blur blur={goo.blur} />
          <ColorMatrix matrix={GOO_MATRIX} />
        </Paint>
      }
    >
      {children}
    </Group>
  );
}

/** Forma unida «tú + amig@» con el degradado del onboarding (pantallas 1 y 4). */
function UnitedShape({
  p,
  selfY,
  otherY,
}: {
  p: SharedValue<number>;
  selfY: number;
  otherY: number;
}) {
  const self = useShape(p, { cx: 138, cy: selfY, r: 58, motion: 'self' });
  const other = useShape(p, { cx: 230, cy: otherY, r: 46, motion: 'other' });
  const g = gradients.onboarding;
  return (
    <Mask
      mask={
        <GooLayer>
          <Circle cx={self.cx} cy={self.cy} r={self.r} color="white" />
          <Circle cx={other.cx} cy={other.cy} r={other.r} color="white" />
        </GooLayer>
      }
    >
      <Rect x={0} y={0} width={W} height={H}>
        <LinearGradient
          start={vec(70, 0)}
          end={vec(300, 0)}
          colors={[...g]}
          positions={[0, 0.42, 0.62, 1]}
        />
      </Rect>
    </Mask>
  );
}

function Diagonal({ from, to, size }: { from: string; to: string; size: number }) {
  return <LinearGradient start={vec(0, 0)} end={vec(size, size)} colors={[from, to]} />;
}

function ArtWelcome({ p, fonts }: ArtProps) {
  const sparkle = colors.illustration.sparkle;
  return (
    <>
      <UnitedShape p={p} selfY={88} otherY={78} />
      <DriftText p={p} text={es.onboarding.you} x={134} y={102} font={fonts.you40} motion="self" />
      <DriftText
        p={p}
        text={es.onboarding.friend}
        x={234}
        y={86}
        font={fonts.friend22}
        motion="other"
      />
      <Circle cx={52} cy={44} r={5} color={sparkle[0]} />
      <Circle cx={76} cy={138} r={4} color={sparkle[1]} />
      <Circle cx={304} cy={34} r={6} color={sparkle[2]} />
      <Circle cx={318} cy={128} r={4} color={sparkle[3]} />
      <Circle cx={284} cy={150} r={3} color={sparkle[4]} />
    </>
  );
}

function ArtFocus({ p, fonts }: ArtProps) {
  const self = useShape(p, { cx: 179, cy: 120, r: 50, motion: 'self' });
  const i = colors.illustration;
  const slot = 21;
  return (
    <>
      <Circle cx={87} cy={100} r={slot} color={i.sparkle[0]} />
      <Circle cx={126} cy={42} r={slot} color={i.sparkle[4]} />
      <Circle cx={179} cy={26} r={slot} color={i.other} />
      <Path
        path="M171 26l6 6 10-12"
        style="stroke"
        strokeWidth={2.2}
        strokeCap="round"
        strokeJoin="round"
        color={colors.text.primary}
      />
      <Circle cx={232} cy={42} r={slot} color={i.otherLight} />
      <Circle cx={271} cy={100} r={slot} style="stroke" strokeWidth={1.6} color={i.slotEmpty}>
        <DashPathEffect intervals={[4, 4.5]} />
      </Circle>
      <Path
        path="M265 100h12M271 94v12"
        style="stroke"
        strokeWidth={1.8}
        strokeCap="round"
        color={colors.text.secondary}
      />
      <Circle cx={self.cx} cy={self.cy} r={self.r}>
        <LinearGradient start={vec(129, 70)} end={vec(229, 170)} colors={[i.self, i.selfLight]} />
      </Circle>
      <DriftText p={p} text={es.onboarding.you} x={179} y={133} font={fonts.you38} motion="self" />
    </>
  );
}

function ArtSessions({ p, fonts }: ArtProps) {
  const self = useShape(p, { cx: 98, cy: 74, r: 38, motion: 'self' });
  const other = useShape(p, { cx: 260, cy: 74, r: 38, motion: 'other' });
  const i = colors.illustration;
  const liveWidth = fonts.live ? fonts.live.measureText(es.onboarding.live).width : 0;
  return (
    <>
      {[24, 186].map((x) => (
        <Group key={x}>
          <RoundedRect
            x={x}
            y={16}
            width={148}
            height={116}
            r={radii.sheet}
            color={colors.bg.surface}
          />
          <RoundedRect
            x={x}
            y={16}
            width={148}
            height={116}
            r={radii.sheet}
            style="stroke"
            strokeWidth={1}
            color={colors.border.subtle}
          />
        </Group>
      ))}
      <Circle cx={self.cx} cy={self.cy} r={self.r}>
        <Diagonal from={i.self} to={i.selfLight} size={H} />
      </Circle>
      <DriftText p={p} text={es.onboarding.you} x={98} y={86} font={fonts.you32} motion="self" />
      <Circle cx={other.cx} cy={other.cy} r={other.r}>
        <LinearGradient start={vec(222, 36)} end={vec(298, 112)} colors={[i.otherLight, i.other]} />
      </Circle>
      <DriftText
        p={p}
        text={es.onboarding.friend}
        x={260}
        y={80}
        font={fonts.friend19}
        motion="other"
      />
      <RoundedRect x={129} y={118} width={100} height={32} r={16} color={colors.action.primary} />
      <Circle cx={149} cy={134} r={4.5} color={i.liveDot} />
      {fonts.live && (
        <SkText
          x={190 - liveWidth / 2}
          y={138.5}
          text={es.onboarding.live}
          font={fonts.live}
          color={colors.action.onPrimary}
        />
      )}
    </>
  );
}

function ArtSupport({ p, fonts }: ArtProps) {
  const beat = useHeartbeat();
  // Centro del corazón (24×24 trasladado a 207,46 y escalado 1.9)
  const transform = useDerivedValue(() => [
    { translateX: 229.8 },
    { translateY: 70.7 },
    { scale: beat.value },
    { translateX: -229.8 },
    { translateY: -70.7 },
    { translateX: 207 },
    { translateY: 46 },
    { scale: 1.9 },
  ]);
  return (
    <>
      <UnitedShape p={p} selfY={84} otherY={74} />
      <DriftText p={p} text={es.onboarding.you} x={134} y={98} font={fonts.you40} motion="self" />
      <Group transform={transform}>
        <Path path={HEART} color={colors.bg.surface} />
      </Group>
    </>
  );
}

/** Tarjeta flotante «Amig@ · ahora / Te está enviando apoyo» de la pantalla 4. */
function SupportNotice() {
  const slide = es.onboarding.slides[3]!;
  const i = colors.illustration;
  return (
    <View style={styles.notice}>
      <RNLinearGradient
        colors={[i.otherLight, i.other]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.noticeIcon}
      >
        <Svg width={sizes.notice.heart} height={sizes.notice.heart} viewBox="0 0 24 24">
          <SvgPath d={HEART} fill={colors.bg.surface} />
        </Svg>
      </RNLinearGradient>
      <View style={styles.noticeText}>
        <View style={styles.noticeCaption}>
          <View style={styles.liveDot} />
          <Text variant="caption" color={colors.text.caption}>
            {slide.noticeCaption}
          </Text>
        </View>
        {slide.noticeTitle && (
          <EmphasisText text={slide.noticeTitle} variant="section" maxFontSizeMultiplier={1.2} />
        )}
      </View>
    </View>
  );
}

interface ArtProps {
  p: SharedValue<number>;
  fonts: Record<'you40' | 'you38' | 'you32' | 'friend22' | 'friend19' | 'live', SkFont | null>;
}

const ARTS = [ArtWelcome, ArtFocus, ArtSessions, ArtSupport];

/** Ilustración animada de cada paso del onboarding (escala al ancho disponible). */
export function OnboardingArt({ step }: { step: number }) {
  const [width, setWidth] = useState(0);
  const p = useDrift();
  const fonts = {
    you40: useFont(serif, 40),
    you38: useFont(serif, 38),
    you32: useFont(serif, 32),
    friend22: useFont(serifItalic, 22),
    friend19: useFont(serifItalic, 19),
    live: useFont(sansBold, 12),
  };
  const k = Math.min(width / W, 1.2);
  const Art = ARTS[step] ?? ArtWelcome;
  const slide = es.onboarding.slides[step]!;
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={slide.art}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={styles.wrap}
    >
      {width > 0 && (
        <View style={{ width: W * k, height: (step === 3 ? H + 42 : H) * k }}>
          <Canvas style={{ width: W * k, height: H * k }}>
            <Group transform={[{ scale: k }]}>
              <Art p={p} fonts={fonts} />
            </Group>
          </Canvas>
          {step === 3 && <SupportNotice />}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { minHeight: sizes.onboardingArt.height, alignItems: 'center', justifyContent: 'center' },
  notice: {
    position: 'absolute',
    right: spacing.md,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.xl,
    backgroundColor: colors.bg.surface,
    borderWidth: borders.hairline,
    borderColor: colors.border.subtle,
    borderRadius: radii.sheet,
    ...shadows.floating,
  },
  noticeIcon: {
    width: sizes.notice.icon,
    height: sizes.notice.icon,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeText: { gap: spacing.xxs },
  noticeCaption: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  liveDot: {
    width: sizes.notice.liveDot,
    height: sizes.notice.liveDot,
    borderRadius: radii.round,
    backgroundColor: colors.status.liveText,
  },
});
