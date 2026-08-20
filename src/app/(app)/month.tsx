import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

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

function formatMonth(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export default function MonthScreen() {
  const { month } = useLocalSearchParams<{ month?: string }>();

  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStories() {
      try {
        const data = await loadCompletedStories();

        setStories(data as Story[]);
      } catch (error) {
        console.error('Failed to load stories:', error);
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
    if (!story.start_date) {
      return false;
    }

    return formatMonth(story.start_date) === month;
  });

  // Remove duplicate test stories with the same date range.
  const uniqueWeeks = Array.from(
    monthStories
      .filter(
        (story) =>
          story.start_date &&
          story.end_date
      )
      .reduce((map, story) => {
        const key = `${story.start_date}_${story.end_date}`;

        const existing = map.get(key);

        if (
          !existing ||
          new Date(story.created_at).getTime() >
            new Date(existing.created_at).getTime()
        ) {
          map.set(key, story);
        }

        return map;
      }, new Map<string, Story>())
      .values()
  );

  uniqueWeeks.sort((a, b) => {
    return (
      new Date(`${b.start_date}T00:00:00`).getTime() -
      new Date(`${a.start_date}T00:00:00`).getTime()
    );
  });

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
              fontSize: 16,
              marginBottom: 6,
            }}
          >
            {formatDate(story.start_date!)}
            {' – '}
            {formatDate(story.end_date!)}
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
          No completed weeks in this month yet.
        </Text>
      )}
    </ScrollView>
  );
}
