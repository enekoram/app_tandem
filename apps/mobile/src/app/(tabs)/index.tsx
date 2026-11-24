import { router } from 'expo-router';
import { formatLongDay } from '@/lib/dates';
import { es } from '@/strings/es';
import { colors } from '@/theme';
import { Button, EmphasisText, EmptyStateCard, IconButton, Screen, Text, useToast } from '@/ui';

export default function TodayScreen() {
  const toast = useToast();
  return (
    <Screen
      caption={formatLongDay(new Date())}
      title={es.today.title}
      action={
        <IconButton
          icon="profile"
          accessibilityLabel={es.common.profile}
          onPress={() => router.push('/perfil')}
        />
      }
    >
      <Text variant="body" color={colors.text.secondary}>
        {es.today.intro}
      </Text>
      <EmphasisText text={es.today.nextTask} variant="section" accessibilityRole="header" />
      <EmptyStateCard
        icon="tasks"
        title={es.today.emptyTitle}
        body={es.today.emptyBody}
        actions={
          <Button
            label={es.today.createFirst}
            icon="plus"
            onPress={() => toast(es.common.comingSoon)}
          />
        }
      />
    </Screen>
  );
}
