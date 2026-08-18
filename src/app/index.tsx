import {
  completeJournalAndCreateNext,
  generateStory,
} from '../services/storyService';

import {
  loadActiveJournal,
  loadCompletedStories,
} from '../services/journalService';

import {
  deleteJournalPhoto,
  saveJournalPhoto,
} from '../services/photoService';

import GenerateStoryButton from '../components/GenerateStoryButton';
import JournalDayCard from '../components/JournalDayCard';

import { useEffect, useState } from 'react';
import { File } from 'expo-file-system';

import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { styles } from '../styles/indexStyles';


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
  const [storySaving, setStorySaving] = useState(false);
  const [story, setStory] = useState('');
  const [previousStories, setPreviousStories] = useState<
    { id: string; content: string; created_at: string }[]
  >([]);



  useEffect(() => {
    loadJournal();
    loadPreviousStories();
  }, []);

  async function loadJournal() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return;
    }

    let journal;

    try {
      journal = await loadActiveJournal(user.id);
    } catch (error) {
      Alert.alert(
        'Could not load journal',
        error instanceof Error
          ? error.message
          : 'Something went wrong.',
      );
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

    const { data: savedStory, error: storyError } = await supabase
      .from('stories')
      .select('content')
      .eq('journal_id', journal.id)
      .maybeSingle();

    if (storyError) {
      Alert.alert('Could not load story', storyError.message);
      setLoading(false);
      return;
    }

    setStory(savedStory?.content ?? '');

    setLoading(false);
  }

  async function loadPreviousStories() {
    try {
      const stories = await loadCompletedStories();
      setPreviousStories(stories);
    } catch (error) {
      Alert.alert(
        'Could not load previous stories',
        error instanceof Error
          ? error.message
          : 'Something went wrong.',
      );
    }
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

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const { data: journal, error: journalError } = await supabase
      .from('journals')
      .insert({
        user_id: user.id,
        title: 'My 7-Day Story',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: 'active',
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

      await saveJournalPhoto({
        userId: user.id,
        journalId,
        selectedDayId,
        storagePath,
        fileBytes,
        existingPhotoId: selectedDay?.photoId,
        existingStoragePath: selectedDay?.storagePath,
      });

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
            const storagePath = selectedDay.storagePath;

            if (!storagePath) {
              Alert.alert('No photo', 'The photo storage path is missing.');
              return;
            }

            try {
              await deleteJournalPhoto(
                selectedDay.photoId!,
                storagePath,
              );
            } catch (error) {
              Alert.alert(
                'Could not delete photo',
                error instanceof Error
                  ? error.message
                  : 'Something went wrong.',
              );
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

  async function handleGenerateStory() {
    if (storySaving) {
      return;
    }

    if (days.length !== 7) {
      Alert.alert(
        'Journal incomplete',
        'Please make sure all 7 journal days exist before generating your story.',
      );
      return;
    }

    setStorySaving(true);

    const memories = days.map((day) => day.memoryText);

    let story: string;

    try {
      story = await generateStory(memories);
    } catch (error) {
      setStorySaving(false);

      Alert.alert(
        'Could not generate story',
        error instanceof Error
          ? error.message
          : 'Something went wrong.',
      );

      return;
    }


    if (!journalId) {
      setStorySaving(false);
      Alert.alert('Could not save story', 'No journal was selected.');
      return;
    }

    const { error: storyError } = await supabase
      .from('stories')
      .upsert(
        {
          journal_id: journalId,
          content: story,
        },
        {
          onConflict: 'journal_id',
        },
      );

    if (storyError) {
      setStorySaving(false);
      Alert.alert('Could not save story', storyError.message);
      return;
    }

    setStory(story);

    let newJournalId: string;

    try {
      newJournalId = await completeJournalAndCreateNext(
        journalId,
        story,
      );
    } catch (error) {
      setStorySaving(false);

      Alert.alert(
        'Could not start the next journal',
        error instanceof Error
          ? error.message
          : 'Something went wrong.',
      );

      return;
    }

    setJournalId(newJournalId);
    setStorySaving(false);

    await loadJournal();

    Alert.alert(
      'Story saved',
      'Your previous week is complete and a fresh 7-day journal is ready.',
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
            <JournalDayCard
              key={day.id}
              dayNumber={day.day_number}
              selected={selectedDayId === day.id}
              photoUrl={day.photoUrl}
              onSelect={() => {
                setSelectedDayId(day.id);
                setMemoryText(day.memoryText);
              }}
            />
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

      <GenerateStoryButton
        storySaving={storySaving}
        onPress={handleGenerateStory}
      />

      {story ? (
        <View style={styles.storyContainer}>
          <Text style={styles.storyTitle}>Your Story</Text>
          <Text style={styles.storyText}>{story}</Text>
        </View>
      ) : null}

      {previousStories.length > 0 ? (
        <View style={styles.previousStoriesContainer}>
          <Text style={styles.storyTitle}>Previous Stories</Text>

          {previousStories.map((previousStory) => (
            <View
              key={previousStory.id}
              style={styles.previousStoryCard}
            >
              <Text style={styles.storyText}>
                {previousStory.content}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      
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
