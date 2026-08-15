import { useEffect, useState } from 'react';
import { File } from 'expo-file-system';

import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';


import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

type JournalDay = {
  id: string;
  day_number: number;
  memoryText: string;
  photoId: string | null;
  storagePath: string | null;
  photoUrl: string | null;
};

export default function HomeScreen() {
  const [journalId, setJournalId] = useState<string | null>(null);
  const [days, setDays] = useState<JournalDay[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoActionLoading, setPhotoActionLoading] = useState(false);
  const [memoryText, setMemoryText] = useState('');
  const [memorySaving, setMemorySaving] = useState(false);

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
      setLoading(false);
      return;
    }

    if (!journal) {
      setLoading(false);
      return;
    }

    setJournalId(journal.id);

    const { data: journalDays, error: daysError } = await supabase
      .from('journal_days')
      .select(`
        id,
        day_number,
        memory_text,
        photos (
          id,
          storage_path
        )
      `)
      .eq('journal_id', journal.id)
      .order('day_number', { ascending: true });

    if (daysError) {
      Alert.alert('Could not load journal days', daysError.message);
      setLoading(false);
      return;
    }

    const daysWithPhotos: JournalDay[] = [];

    for (const day of journalDays ?? []) {
      const photo = day.photos?.[0];

      let photoUrl: string | null = null;

      if (photo) {
        const { data: signedUrlData, error: signedUrlError } =
          await supabase.storage
            .from('photos')
            .createSignedUrl(photo.storage_path, 60 * 60);

        if (!signedUrlError && signedUrlData) {
          photoUrl = signedUrlData.signedUrl;
        }
      }

      daysWithPhotos.push({
        id: day.id,
        day_number: day.day_number,
        memoryText: day.memory_text ?? '',
        photoId: photo?.id ?? null,
        storagePath: photo?.storage_path ?? null,
        photoUrl,
      });
    }

    setDays(daysWithPhotos);
    setLoading(false);
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

    const { data: existingJournal, error: existingJournalError } = await supabase
      .from('journals')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingJournalError) {
      Alert.alert(
        'Could not check journal',
        existingJournalError.message,
      );
      return;
    }

    if (existingJournal) {
      setJournalId(existingJournal.id);
      await loadJournal();

      Alert.alert(
        'Journal already exists',
        'Your existing 7-day journal has been loaded.',
      );
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
    if (photoActionLoading) {
      return;
    }

    setPhotoActionLoading(true);

    if (!selectedDayId || !journalId) {
      setPhotoActionLoading(false);
      Alert.alert('Choose a day', 'Please select a journal day first.');
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setPhotoActionLoading(false);
      Alert.alert('Error', 'We could not find your signed-in account.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled) {
      setPhotoActionLoading(false);
      return;
    }

    const asset = result.assets[0];

    try {
      const photoId = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`;
      
      const storagePath = `${user.id}/${journalId}/${selectedDayId}/${photoId}.jpg`;
      const selectedDay = days.find((day) => day.id === selectedDayId);

      const file = new File(asset.uri);
      const fileBytes = await file.bytes();

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(storagePath, fileBytes, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        Alert.alert('Upload failed', uploadError.message);
        return;
      }

      if (selectedDay?.photoId) {
        const { error: photoError } = await supabase
          .from('photos')
          .update({
            storage_path: storagePath,
          })
          .eq('id', selectedDay.photoId);

        if (photoError) {
          await supabase.storage
            .from('photos')
            .remove([storagePath]);

          Alert.alert('Could not replace photo', photoError.message);
          return;
        }

        if (selectedDay.storagePath) {
          await supabase.storage
            .from('photos')
            .remove([selectedDay.storagePath]);
        }
      } else {
        const { error: photoError } = await supabase
          .from('photos')
          .insert({
            journal_day_id: selectedDayId,
            storage_path: storagePath,
          });

        if (photoError) {
          await supabase.storage
            .from('photos')
            .remove([storagePath]);

          Alert.alert('Could not save photo', photoError.message);
          return;
        }
      }

      Alert.alert(
        'Photo uploaded',
        'Your photo was successfully saved.',
      );

      await loadJournal();

    } catch (error) {
      Alert.alert(
        'Upload failed',
        error instanceof Error ? error.message : 'Something went wrong.',
      );
    } finally {
      setPhotoActionLoading(false);
    }
  }

  async function handleDeletePhoto() {
    if (!selectedDayId || !journalId) {
      Alert.alert('Choose a day', 'Please select a journal day first.');
      return;
    }

    const selectedDay = days.find((day) => day.id === selectedDayId);

    if (!selectedDay?.photoId || !selectedDay.storagePath) {
      Alert.alert('No photo', 'There is no photo to delete for this day.');
      return;
    }

    Alert.alert(
      'Delete photo?',
      'This photo will be permanently removed from your journal.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error: photoError } = await supabase
              .from('photos')
              .delete()
              .eq('id', selectedDay.photoId);

            if (photoError) {
              Alert.alert('Could not delete photo', photoError.message);
              return;
            }

            const storagePath = selectedDay.storagePath;

            if (!storagePath) {
              Alert.alert('No photo', 'The photo storage path is missing.');
              return;
            }

            const { error: storageError } = await supabase.storage
              .from('photos')
              .remove([storagePath]);

            if (storageError) {
              Alert.alert(
                'Photo record deleted',
                `The photo record was removed, but the stored image could not be removed: ${storageError.message}`,
              );
              await loadJournal();
              return;
            }

            await loadJournal();

            Alert.alert(
              'Photo deleted',
              'The photo was removed from your journal.',
            );
          },
        },
      ],
    );
  }

  async function handleSaveMemory() {
    if (!selectedDayId) {
      Alert.alert('Choose a day', 'Please select a journal day first.');
      return;
    }

    setMemorySaving(true);

    const { error } = await supabase
      .from('journal_days')
      .update({
        memory_text: memoryText,
      })
      .eq('id', selectedDayId);

    if (error) {
      setMemorySaving(false);
      Alert.alert('Could not save memory', error.message);
      return;
    }

    setDays((currentDays) =>
      currentDays.map((day) =>
        day.id === selectedDayId
          ? { ...day, memoryText }
          : day,
      ),
    );

    setMemorySaving(false);

    Alert.alert('Memory saved', 'Your memory was saved successfully.');
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert('Sign out failed', error.message);
      return;
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
    >
      <Text style={styles.title}>Memory Story</Text>

      <Text style={styles.subtitle}>
          Create your 7-day story.
        </Text>

        {loading ? (
          <Text style={styles.subtitle}>
            Loading your journal...
          </Text>
        ) : !journalId ? (
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
            <View key={day.id} style={styles.dayContainer}>
              <Pressable
                style={[
                  styles.dayButton,
                  selectedDayId === day.id && styles.selectedDayButton,
                ]}
                onPress={() => {
                  setSelectedDayId(day.id);
                  setMemoryText(day.memoryText);
                }}
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

              {day.photoUrl ? (
                <Image
                  source={{ uri: day.photoUrl }}
                  style={styles.photo}
                />
              ) : (
                <Text style={styles.noPhotoText}>
                  No photo yet
                </Text>
              )}
            </View>
          ))}

          {selectedDayId ? (
            <>
              <TextInput
                style={styles.memoryInput}
                value={memoryText}
                onChangeText={setMemoryText}
                placeholder="Write what you remember about this day..."
                multiline
                textAlignVertical="top"
              />

              <Pressable
                style={styles.button}
                onPress={handleSaveMemory}
                disabled={memorySaving}
              >
                <Text style={styles.buttonText}>
                  {memorySaving ? 'Saving...' : 'Save memory'}
                </Text>
              </Pressable>
            </>
          ) : null}

          <Pressable
            style={styles.button}
            onPress={handlePickPhoto}
          >
            <Text style={styles.buttonText}>
              {days.find((day) => day.id === selectedDayId)?.photoId
                ? 'Replace photo'
                : 'Choose a photo'}
            </Text>
          </Pressable>

          {days.find((day) => day.id === selectedDayId)?.photoId ? (
            <Pressable
              style={styles.button}
              onPress={handleDeletePhoto}
            >
              <Text style={styles.buttonText}>
                Delete photo
              </Text>
            </Pressable>
          ) : null}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 40,
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
    dayContainer: {
    width: 180,
    alignItems: 'center',
    marginBottom: 20,
  },
  photo: {
    width: 180,
    height: 180,
    borderRadius: 12,
    marginTop: 8,
  },
  noPhotoText: {
    width: 180,
    height: 180,
    borderRadius: 12,
    marginTop: 8,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 14,
  },
  memoryInput: {
    width: '100%',
    minHeight: 140,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginTop: 12,
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
    borderRadius: 10,
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
    fontWeight: '500',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: '700',
  },
  signOutButton: {
    marginTop: 20,
    padding: 12,
  },
  signOutText: {
    fontSize: 16,
  },
});