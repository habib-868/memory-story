import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { loadCompletedStories } from '../../services/journalService';

type Story = {
  id: string;
  journal_id: string;
  content: string;
  created_at: string;
  start_date: string | null;
  end_date: string | null;
};

function formatDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function WeekScreen() {
  const { storyId } = useLocalSearchParams<{ storyId?: string }>();

  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStory() {
      try {
        const stories = await loadCompletedStories();

        const selectedStory = stories.find(
          (item) => item.id === storyId
        );

        setStory((selectedStory as Story) ?? null);
      } catch (error) {
        console.error('Failed to load story:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStory();
  }, [storyId]);

  if (loading) {
    return (
      <ActivityIndicator
        style={{ flex: 1 }}
        size="large"
      />
    );
  }

  if (!story) {
    return (
      <ScrollView
        contentContainerStyle={{
          padding: 24,
          paddingBottom: 40,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: '600',
          }}
        >
          Story not found.
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 24,
        paddingBottom: 40,
      }}
    >
      <Text
        style={{
          fontSize: 14,
          marginBottom: 8,
        }}
      >
        {story.start_date && formatDate(story.start_date)}
        {' – '}
        {story.end_date && formatDate(story.end_date)}
      </Text>

      <Text
        style={{
          fontSize: 30,
          fontWeight: '700',
          marginBottom: 30,
        }}
      >
        Your Week
      </Text>

      <Text
        style={{
          fontSize: 17,
          lineHeight: 27,
        }}
      >
        {story.content}
      </Text>
    </ScrollView>
  );
}
