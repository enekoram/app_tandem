import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useContactsControllerList, type ContactDto } from '@tandems/api-client';
import { es } from '@/strings/es';
import { borders, colors, radii, sizes, spacing } from '@/theme';
import { Button, EmptyStateCard, Icon, ListCard, ListRow, PersonToken, Screen, Text } from '@/ui';

function contactSubtitle(c: ContactDto): string {
  return c.status === 'accepted' ? es.contacts.accepted : es.contacts.pending;
}

export default function ContactsScreen() {
  const query = useContactsControllerList();
  const contacts = query.data?.status === 200 ? query.data.data : [];
  const t = es.contacts;
  const add = () => router.push('/contactos/nuevo');

  return (
    <Screen
      kind="inner"
      caption={query.isSuccess ? t.count(contacts.length) : undefined}
      title={t.title}
      back={{ label: t.back, onPress: () => router.back() }}
    >
      {query.isSuccess && contacts.length === 0 ? (
        <EmptyStateCard
          icon="users"
          title={t.emptyTitle}
          body={t.emptyBody}
          actions={<Button label={t.add} icon="plus" onPress={add} />}
        />
      ) : (
        <>
          <Text variant="lead" color={colors.text.secondary} style={styles.intro}>
            {t.intro}
          </Text>
          {contacts.length > 0 && (
            <ListCard>
              {contacts.map((c) => (
                <ListRow
                  key={c.id}
                  leading={
                    <PersonToken
                      name={c.name}
                      initials={c.initials}
                      color={c.color}
                      pending={c.status !== 'accepted'}
                      size="sm"
                      decorative
                    />
                  }
                  title={c.name}
                  subtitle={contactSubtitle(c)}
                  subtitleIcon={c.status === 'accepted' ? 'checkCircle' : undefined}
                  onPress={() => router.push({ pathname: '/contactos/[id]', params: { id: c.id } })}
                />
              ))}
            </ListCard>
          )}
          <ListCard>
            <ListRow
              leading={
                <View style={styles.addAvatar}>
                  <Icon
                    name="plus"
                    size={sizes.icon.button}
                    color={colors.text.primary}
                    strokeWidth={1.8}
                  />
                </View>
              }
              title={t.add}
              onPress={add}
            />
          </ListCard>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { paddingHorizontal: spacing.sm },
  addAvatar: {
    width: sizes.avatar.sm,
    height: sizes.avatar.sm,
    borderRadius: radii.round,
    borderWidth: borders.pending,
    borderStyle: 'dashed',
    borderColor: colors.text.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
