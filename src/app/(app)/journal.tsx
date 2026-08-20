import {
  completeJournalAndCreateNext,
  generateStory,
} from '../../services/storyService';

import {
  createJournal,
  loadActiveJournalData,
  loadCompletedStories,
  saveJournalMemory,
} from '../../services/journalService';

import {
  deleteJournalPhoto,
  saveJournalPhoto,
} from '../../services/photoService';

import CurrentStory from '../../components/CurrentStory';
import GenerateStoryButton from '../../components/GenerateStoryButton';
import MemoryEditor from '../../components/MemoryEditor';
import PhotoActions from '../../components/PhotoActions';

import { useEffect, useState } from 'react';
import { File } from 'expo-file-system';

import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { styles } from '../../styles/indexStyles';


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
  const [memorySaved, setMemorySaved] = useState(false);
  const [storySaving, setStorySaving] = useState(false);
  const [story, setStory] = useState('');



  useEffect(() => {
    loadJournal();
  }, []);

  async function loadJournal() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setLoading(false);
      return;
    }

    try {
      const journalData = await loadActiveJournalData(user.id);

      if (!journalData) {
        setJournalId(null);
        setDays([]);
        setStory('');
        setLoading(false);
        return;
      }

      setJournalId(journalData.journalId);
      setDays(journalData.days);
      setStory(journalData.story);

      const firstIncompleteDay = journalData.days.find(
        (day) => !day.memoryText.trim(),
      );

      const dayToSelect = firstIncompleteDay ?? journalData.days[0];

      if (dayToSelect) {
        setSelectedDayId(dayToSelect.id);
        setMemoryText(dayToSelect.memoryText);
      }

      setLoading(false); 

    } catch (error) {
      Alert.alert(
        'Could not load journal',
        error instanceof Error
          ? error.message
          : 'Something went wrong.',
      );

      setLoading(false);
    }
  }


  async function handleCreateJournal() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      Alert.alert(
        'Error',
        'We could not find your signed-in account.',
      );
      return;
    }

    try {
      const result = await createJournal(user.id);

      setJournalId(result.journalId);

      await loadJournal();

      if (result.alreadyExists) {
        Alert.alert(
          'Journal already exists',
          'Your existing 7-day journal has been loaded.',
        );
        return;
      }

      Alert.alert(
        'Journal created',
        'Your 7-day journal is ready!',
      );
    } catch (error) {
      Alert.alert(
        'Could not create journal',
        error instanceof Error
          ? error.message
          : 'Something went wrong.',
      );
    }
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

    setMemorySaved(false);
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
    setMemorySaved(true);

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

  const allDaysComplete =
  days.length === 7 &&
  days.every((day) => day.memoryText.trim().length > 0);

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
            <Text style={styles.journeyTitle}>
              Your 7-day journey
            </Text>

            <Text style={styles.journeySubtitle}>
              Capture one memory each day.
              At the end, we'll turn them into a story.
            </Text>

            {selectedDayId ? (
              <>
                <Text style={styles.currentDayText}>
                  Day {days.find((day) => day.id === selectedDayId)?.day_number}
                </Text>

                {days.find((day) => day.id === selectedDayId)?.photoUrl ? (
                  <Image
                    source={{
                      uri: days.find((day) => day.id === selectedDayId)?.photoUrl ?? '',
                    }}
                    style={styles.journalPhoto}
                  />
                ) : null}

                <PhotoActions
                  hasPhoto={
                    !!days.find((day) => day.id === selectedDayId)?.photoId
                  }
                  onPickPhoto={handlePickPhoto}
                  onDeletePhoto={handleDeletePhoto}
                />

                <MemoryEditor
                  visible
                  memoryText={memoryText}
                  saving={memorySaving}
                  onChangeText={setMemoryText}
                  onSave={handleSaveMemory}
                />

                {memorySaved && (
                  <>
                    {days.findIndex((day) => day.id === selectedDayId) <
                    days.length - 1 ? (
                      <Pressable
                        style={styles.nextDayButton}
                        onPress={() => {
                          const currentIndex = days.findIndex(
                            (day) => day.id === selectedDayId,
                          );

                          const nextDay = days[currentIndex + 1];

                          setSelectedDayId(nextDay.id);
                          setMemoryText(nextDay.memoryText);
                          setMemorySaved(false);
                        }}
                      >
                        <Text style={styles.nextDayButtonText}>
                          Next day →
                        </Text>
                      </Pressable>
                    ) : allDaysComplete ? (
                      <Pressable
                        style={styles.nextDayButton}
                        onPress={handleGenerateStory}
                        disabled={storySaving}
                      >
                        <Text style={styles.nextDayButtonText}>
                          {storySaving ? 'Creating...' : 'Create My Story'}
                        </Text>
                      </Pressable>
                    ) : null}
                  </>
                )}
              </>
            ) : (
              <Text style={styles.subtitle}>
                Loading your first day...
              </Text>
            )}

            <Text style={styles.progressTitle}>
              Your week
            </Text>

            <View style={styles.progressContainer}>
              {days.map((day) => {
                const isSelected = day.id === selectedDayId;
                const isCompleted = !!day.memoryText.trim();

                return (
                  <Pressable
                    key={day.id}
                    style={[
                      styles.progressItem,
                      isSelected && styles.progressItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedDayId(day.id);
                      setMemoryText(day.memoryText);
                    }}
                  >
                    <View
                      style={[
                        styles.progressDot,
                        isCompleted && styles.progressDotCompleted,
                        isSelected && styles.progressDotSelected,
                      ]}
                    />

                    <Text
                      style={[
                        styles.progressDay,
                        isSelected && styles.progressDaySelected,
                      ]}
                    >
                      {day.day_number}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        <GenerateStoryButton
          storySaving={storySaving}
          onPress={handleGenerateStory}
        />

      <CurrentStory story={story} />

      
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
