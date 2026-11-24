import { router } from 'expo-router';
import { es } from '@/strings/es';
import { EmptyStateCard, IconButton, Screen } from '@/ui';

export default function ProfileScreen() {
  return (
    <Screen
      kind="inner"
      caption={es.profile.caption}
      title={es.profile.title}
      action={
        <IconButton
          icon="close"
          accessibilityLabel={es.common.close}
          onPress={() => router.back()}
        />
      }
    >
      <EmptyStateCard icon="profile" title={es.profile.title} body={es.profile.emptyBody} />
    </Screen>
  );
}
