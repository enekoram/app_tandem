import { router } from 'expo-router';
import { es } from '@/strings/es';
import { EmptyStateCard, IconButton, Screen } from '@/ui';

export default function CompanionScreen() {
  return (
    <Screen
      caption={es.companion.caption}
      title={es.companion.title}
      action={
        <IconButton
          icon="profile"
          accessibilityLabel={es.common.profile}
          onPress={() => router.push('/perfil')}
        />
      }
    >
      <EmptyStateCard
        icon="companion"
        title={es.companion.emptyTitle}
        body={es.companion.emptyBody}
      />
    </Screen>
  );
}
