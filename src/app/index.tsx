import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

type JournalDay = {
  id: string;
  day_number: number;
};

export default function HomeScreen() {
  const [journalId, setJournalId] = useState<string | null>(null);
  const [days, setDays] = useState<JournalDay[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

  useEffect(() => {
    loadJournal();
  }, []);

  async function loadJournal() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return;
    }

    const { data: journal, error: journalError } = await supabase
      .from('journals')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (journalError) {
      Alert.alert('Could not load journal', journalError.message);
      return;
    }

    if (!journal) {
      return;
    }

    setJournalId(journal.id);

    const { data: journalDays, error: daysError } = await supabase
      .from('journal_days')
      .select('id, day_number')
      .eq('journal_id', journal.id)
      .order('day_number', { ascending: true });

    if (daysError) {
      Alert.alert('Could not load journal days', daysError.message);
      return;
    }

    setDays(journalDays ?? []);
  }

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

    const newDays = Array.from({ length: 7 }, (_, index) => ({
      journal_id: journal.id,
      day_number: index + 1,
    }));

    const { error: daysError } = await supabase
      .from('journal_days')
      .insert(newDays);

    if (daysError) {
      Alert.alert(
        'Could not create journal days',
        daysError.message,
      );
      return;
    }

    setJournalId(journal.id);
    await loadJournal();

    Alert.alert(
      'Journal created',
      'Your 7-day journal is ready!',
    );
  }

  async function handlePickPhoto() {
    if (!selectedDayId) {
      Alert.alert('Choose a day', 'Please select a journal day first.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];

    Alert.alert(
      'Photo selected',
      `Selected for Day ${
        days.find((day) => day.id === selectedDayId)?.day_number
      }: ${asset.fileName ?? 'photo'}`,
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

      {!journalId ? (
        <Pressable
          style={styles.button}
          onPress={handleCreateJournal}
        >
          <Text style={styles.buttonText}>
            Create a new journal
          </Text>
        </Pressable>
      ) : (
        <>
          <Text style={styles.sectionTitle}>
            Choose a day
          </Text>

          {days.map((day) => (
            <Pressable
              key={day.id}
              style={[
                styles.dayButton,
                selectedDayId === day.id && styles.selectedDayButton,
              ]}
              onPress={() => setSelectedDayId(day.id)}
            >
              <Text
                style={[
                  styles.dayText,
                  selectedDayId === day.id && styles.selectedDayText,
                ]}
              >
                Day {day.day_number}
              </Text>
            </Pressable>
          ))}

          <Pressable
            style={styles.button}
            onPress={handlePickPhoto}
          >
            <Text style={styles.buttonText}>
              Choose a photo
            </Text>
          </Pressable>
        </>
      )}

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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  button: {
    minHeight: 52,
    paddingHorizontal: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dayButton: {
    width: 180,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  selectedDayButton: {
    backgroundColor: '#111',
  },
  dayText: {
    fontSize: 16,
  },
  selectedDayText: {
    color: '#fff',
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