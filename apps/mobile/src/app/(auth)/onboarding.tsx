import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { prefs } from '@/lib/prefs';
import { es } from '@/strings/es';
import { colors, MIN_TOUCH_TARGET, spacing } from '@/theme';
import { AuthLayout, BackLink, Button, EmphasisText, StepDots, Text } from '@/ui';
import { OnboardingArt } from '@/ui/art/OnboardingArt';

const TOTAL = es.onboarding.slides.length;

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const slide = es.onboarding.slides[step]!;
  const last = step === TOTAL - 1;

  const finish = (to: '/registro' | '/login') => {
    void prefs.setOnboardingSeen();
    router.replace(to);
  };

  return (
    <AuthLayout
      top={
        <>
          {step > 0 ? (
            <BackLink label={es.onboarding.back} onPress={() => setStep(step - 1)} />
          ) : (
            <View />
          )}
          {!last && (
            <Pressable
              accessibilityRole="button"
              onPress={() => setStep(TOTAL - 1)}
              style={styles.skip}
            >
              <Text variant="bodyStrong">{es.onboarding.skip}</Text>
            </Pressable>
          )}
        </>
      }
    >
      <OnboardingArt step={step} />
      <View style={styles.texts}>
        <Text variant="caption" color={colors.text.caption}>
          {slide.caption}
        </Text>
        <EmphasisText text={slide.title} variant="hero" accessibilityRole="header" />
        <Text variant="lead" color={colors.text.caption}>
          {slide.body}
        </Text>
      </View>
      <View style={styles.spacer} />
      <View style={styles.progress}>
        <StepDots step={step} total={TOTAL} label={es.onboarding.stepA11y(step + 1, TOTAL)} />
        <Text
          variant="caption"
          color={colors.text.secondary}
          importantForAccessibility="no"
          accessibilityElementsHidden
        >
          {es.onboarding.step(step + 1, TOTAL)}
        </Text>
      </View>
      {last ? (
        <View style={styles.cta}>
          <Button label={es.onboarding.createAccount} onPress={() => finish('/registro')} />
          <Button
            label={es.onboarding.haveAccount}
            variant="secondary"
            onPress={() => finish('/login')}
          />
        </View>
      ) : (
        <Button label={es.onboarding.next} onPress={() => setStep(step + 1)} />
      )}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  skip: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  texts: { gap: spacing.sm, paddingHorizontal: spacing.sm },
  spacer: { flex: 1 },
  progress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  cta: { gap: spacing.sm },
});
