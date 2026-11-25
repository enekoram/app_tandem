import { useRef, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  FlatList,
  Pressable,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import type { Emphasis } from '@/strings/es';
import { es } from '@/strings/es';
import { colors, radii, sizes, spacing } from '@/theme';
import { Icon } from './icons';
import { EmphasisText } from './Text';

export interface CarouselItem {
  key: string;
  /** Lo que lee VoiceOver de la tarjeta («1 de 3: tu siguiente tarea, Hacer la renta»). */
  label: string;
  node: ReactNode;
}

const { card } = sizes.carousel;
const STEP = card.width + card.gap;

/**
 * Carrusel «Para hoy» (doc 03 · canvas Hoy): tarjetas con paginación que dejan asomar la
 * siguiente, puntos y flechas. Con VoiceOver/TalkBack las tarjetas se recorren una a una
 * (sus botones siguen siendo alcanzables, por eso el carrusel no es un único control
 * ajustable) y las flechas anuncian «Tarjeta 2 de 3: …».
 */
export function Carousel({ title, items }: { title: Emphasis; items: CarouselItem[] }) {
  const list = useRef<FlatList<CarouselItem>>(null);
  const [index, setIndex] = useState(0);
  const count = items.length;
  const current = Math.min(index, Math.max(count - 1, 0));

  const goTo = (i: number) => {
    const next = Math.max(0, Math.min(count - 1, i));
    setIndex(next);
    list.current?.scrollToOffset({ offset: next * STEP, animated: true });
    const item = items[next];
    if (item) {
      AccessibilityInfo.announceForAccessibility(
        `${es.carousel.position(next + 1, count)}: ${item.label}`,
      );
    }
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setIndex(Math.round(e.nativeEvent.contentOffset.x / STEP));

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <EmphasisText text={title} variant="section" accessibilityRole="header" />
        {count > 1 && (
          <View style={styles.controls}>
            <Arrow
              icon="back"
              label={es.carousel.previous}
              disabled={current === 0}
              onPress={() => goTo(current - 1)}
            />
            <View
              style={styles.dots}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              {items.map((item, i) => (
                <Pressable key={item.key} onPress={() => goTo(i)} style={styles.dotHit}>
                  <View style={[styles.dot, i === current && styles.dotOn]} />
                </Pressable>
              ))}
            </View>
            <Arrow
              icon="chevron"
              label={es.carousel.next}
              disabled={current === count - 1}
              onPress={() => goTo(current + 1)}
            />
          </View>
        )}
      </View>
      <FlatList
        ref={list}
        horizontal
        data={items}
        keyExtractor={(item) => item.key}
        renderItem={({ item, index: i }) => (
          <View
            style={styles.card}
            accessibilityLabel={`${es.carousel.position(i + 1, count)}: ${item.label}`}
          >
            {item.node}
          </View>
        )}
        showsHorizontalScrollIndicator={false}
        snapToInterval={STEP}
        decelerationRate="fast"
        contentContainerStyle={styles.track}
        onMomentumScrollEnd={onScrollEnd}
      />
    </View>
  );
}

function Arrow({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: 'back' | 'chevron';
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.arrow}
    >
      <Icon
        name={icon}
        size={sizes.icon.button}
        strokeWidth={1.8}
        color={disabled ? colors.icon.disabled : colors.text.primary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: spacing.sm,
  },
  controls: { flexDirection: 'row', alignItems: 'center' },
  arrow: {
    width: sizes.carousel.arrow.width,
    height: sizes.carousel.arrow.height,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: { flexDirection: 'row', alignItems: 'center' },
  dotHit: {
    width: sizes.carousel.dot.width,
    height: sizes.carousel.dot.height,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: sizes.carousel.dotMark.size,
    height: sizes.carousel.dotMark.size,
    borderRadius: radii.round,
    backgroundColor: colors.carousel.dotInactive,
  },
  dotOn: { width: sizes.carousel.dotMark.activeWidth, backgroundColor: colors.carousel.dotActive },
  track: { gap: card.gap, paddingRight: spacing.lg },
  card: { width: card.width, minHeight: card.minHeight },
});
