import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  async function handleCreateJournal() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      Alert.alert('Error', 'We could not find your signed-in account.');
      return;
    }

    const { data: journal, error: journalError } = await supabase
      .from('journals')
      .insert({
        user_id: user.id,
        title: 'My 7-Day Story',
      })
      .select('id')
      .single();

    if (journalError || !journal) {
      Alert.alert(
        'Could not create journal',
        journalError?.message ?? 'Something went wrong.',
      );
      return;
    }

    const days = Array.from({ length: 7 }, (_, index) => ({
      journal_id: journal.id,
      day_number: index + 1,
    }));

    const { error: daysError } = await supabase
      .from('journal_days')
      .insert(days);

    if (daysError) {
      Alert.alert(
        'Could not create journal days',
        daysError.message,
      );
      return;
    }

    Alert.alert(
      'Journal created',
      'Your 7-day journal is ready!',
    );
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert('Sign out failed', error.message);
      return;
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Memory Story</Text>

      <Text style={styles.subtitle}>
        Create your 7-day story.
      </Text>

      <Pressable
        style={styles.button}
        onPress={handleCreateJournal}
      >
        <Text style={styles.buttonText}>
          Create a new journal
        </Text>
      </Pressable>

      <Pressable
        style={styles.signOutButton}
        onPress={handleSignOut}
      >
        <Text style={styles.signOutText}>
          Sign out
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  button: {
    height: 52,
    paddingHorizontal: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    marginTop: 20,
    padding: 12,
  },
  signOutText: {
    fontSize: 16,
  },
});