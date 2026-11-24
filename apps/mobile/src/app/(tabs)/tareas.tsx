import { es } from '@/strings/es';
import { colors } from '@/theme';
import { Button, EmptyStateCard, IconButton, Screen, Text, useToast } from '@/ui';

export default function TasksScreen() {
  const toast = useToast();
  const soon = () => toast(es.common.comingSoon);
  return (
    <Screen
      caption={es.tasks.caption}
      title={es.tasks.title}
      action={
        <IconButton
          icon="plus"
          variant="primary"
          accessibilityLabel={es.tasks.add}
          onPress={soon}
        />
      }
    >
      <EmptyStateCard
        icon="tasks"
        title={es.tasks.emptyTitle}
        body={es.tasks.emptyBody}
        actions={
          <>
            <Button label={es.tasks.createFirst} icon="plus" onPress={soon} />
            <Button label={es.tasks.addContactFirst} variant="secondary" onPress={soon} />
          </>
        }
      />
      <Text variant="body" color={colors.text.secondary}>
        {es.tasks.hint}
      </Text>
    </Screen>
  );
}
