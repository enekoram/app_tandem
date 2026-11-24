import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useContactsControllerList, useMeControllerMe } from '@tandems/api-client';
import { authClient } from '@/lib/auth';
import { es } from '@/strings/es';
import { colors, radii, selfColor, sizes, spacing } from '@/theme';
import { EmphasisText, ListCard, ListRow, Screen, Text, useToast } from '@/ui';

export default function ProfileScreen() {
  const toast = useToast();
  const me = useMeControllerMe();
  const contacts = useContactsControllerList();
  const profile = me.data?.status === 200 ? me.data.data : undefined;
  const count = contacts.data?.status === 200 ? contacts.data.data.length : 0;

  const signOut = async () => {
    await authClient.signOut();
    toast(es.profile.signedOut);
  };

  return (
    <Screen
      kind="inner"
      title={es.profile.title}
      caption={es.profile.caption}
      back={{ label: es.profile.back, onPress: () => router.back() }}
    >
      {profile && (
        <View style={styles.me}>
          <View
            style={styles.selfAvatar}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Text variant="avatarLarge">
              {profile.displayName.charAt(0).toLocaleUpperCase('es')}
            </Text>
          </View>
          <View style={styles.flex}>
            <Text variant="title">{profile.displayName}</Text>
            <Text variant="body" color={colors.text.secondary}>
              {profile.email}
            </Text>
          </View>
        </View>
      )}
      <EmphasisText text={es.profile.myPeople} variant="section" accessibilityRole="header" />
      <ListCard>
        <ListRow
          icon="users"
          title={es.profile.contacts}
          subtitle={es.profile.contactsCount(count)}
          onPress={() => router.push('/contactos')}
        />
      </ListCard>
      <ListCard>
        <ListRow icon="userMinus" title={es.profile.signOut} destructive onPress={signOut} />
      </ListCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  me: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  selfAvatar: {
    width: sizes.avatar.lg,
    height: sizes.avatar.lg,
    borderRadius: radii.round,
    backgroundColor: selfColor.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
});
