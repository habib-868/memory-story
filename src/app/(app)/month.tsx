import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
} from 'react-native';

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
    month: 'short',
    day: 'numeric',
  });
}

export default function MonthScreen() {
  const { month } = useLocalSearchParams<{ month: string }>();

  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStories() {
      try {
        const data = await loadCompletedStories();
        setStories(data as Story[]);
      } catch (error) {
        console.error('Failed to load month stories:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStories();
  }, []);

  if (loading) {
    return (
      <ActivityIndicator
        style={{ flex: 1 }}
        size="large"
      />
    );
  }

  const monthStories = stories.filter((story) => {
    if (!story.start_date || !month) {
      return false;
    }

    const date = new Date(`${story.start_date}T00:00:00`);

    const storyMonth = date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    return storyMonth === month;
  });

  const uniqueWeeks = Array.from(
    new Map(
      monthStories
        .filter(
          (story) =>
            story.start_date &&
            story.end_date
        )
        .map((story) => [
          `${story.start_date}_${story.end_date}`,
          story,
        ])
    ).values()
  );

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 24,
        paddingBottom: 40,
      }}
    >
      <Text
        style={{
          fontSize: 30,
          fontWeight: '700',
          marginBottom: 30,
        }}
      >
        {month}
      </Text>

      {uniqueWeeks.map((story) => (
        <Pressable
          key={`${story.start_date}_${story.end_date}`}
          onPress={() =>
            router.push({
              pathname: '/(app)/week',
              params: {
                storyId: story.id,
              },
            })
          }
          style={{
            paddingVertical: 18,
            borderBottomWidth: 1,
            borderBottomColor: '#ddd',
          }}
        >
          <Text
            style={{
              fontSize: 14,
              marginBottom: 6,
            }}
          >
            {story.start_date && formatDate(story.start_date)}
            {' – '}
            {story.end_date && formatDate(story.end_date)}
          </Text>

          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
            }}
          >
            7-day story
          </Text>
        </Pressable>
      ))}

      {uniqueWeeks.length === 0 && (
        <Text
          style={{
            fontSize: 16,
            lineHeight: 24,
          }}
        >
          No stories found for this month.
        </Text>
      )}
    </ScrollView>
  );
}
