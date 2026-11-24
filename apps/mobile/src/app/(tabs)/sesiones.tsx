import { es } from '@/strings/es';
import { Button, EmptyStateCard, IconButton, Screen, useToast } from '@/ui';

export default function SessionsScreen() {
  const toast = useToast();
  const soon = () => toast(es.common.comingSoon);
  return (
    <Screen
      caption={es.sessions.caption}
      title={es.sessions.title}
      action={
        <IconButton
          icon="plus"
          variant="primary"
          accessibilityLabel={es.sessions.add}
          onPress={soon}
        />
      }
    >
      <EmptyStateCard
        icon="sessions"
        title={es.sessions.emptyTitle}
        body={es.sessions.emptyBody}
        actions={<Button label={es.sessions.schedule} icon="plus" onPress={soon} />}
      />
    </Screen>
  );
}
