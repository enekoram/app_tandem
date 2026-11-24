import { router } from 'expo-router';
import { formatLongDay } from '@/lib/dates';
import { es } from '@/strings/es';
import { colors } from '@/theme';
import { Button, EmphasisText, EmptyStateCard, IconButton, Screen, Text } from '@/ui';

export default function TodayScreen() {
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
            onPress={() => router.push('/tarea/nueva')}
          />
        }
      />
    </Screen>
  );
}
