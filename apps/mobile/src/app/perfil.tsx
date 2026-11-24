import { router } from 'expo-router';
import { useMeControllerMe } from '@tandems/api-client';
import { authClient } from '@/lib/auth';
import { es } from '@/strings/es';
import { colors } from '@/theme';
import { Button, Card, EmptyStateCard, IconButton, Screen, Text, useToast } from '@/ui';

export default function ProfileScreen() {
  const toast = useToast();
  const me = useMeControllerMe();
  const profile = me.data?.status === 200 ? me.data.data : undefined;

  const signOut = async () => {
    await authClient.signOut();
    toast(es.profile.signedOut);
  };

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
      {profile && (
        <Card>
          <Text variant="bodyStrong">{profile.displayName}</Text>
          <Text variant="body" color={colors.text.secondary}>
            {profile.email}
          </Text>
        </Card>
      )}
      <EmptyStateCard icon="profile" title={es.profile.title} body={es.profile.emptyBody} />
      <Button label={es.profile.signOut} variant="secondary" onPress={signOut} />
    </Screen>
  );
}
