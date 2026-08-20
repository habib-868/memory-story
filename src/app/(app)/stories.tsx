import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
} from 'react-native';
import { router } from 'expo-router';

import { loadCompletedStories } from '../../services/journalService';

type Story = {
  id: string;
  journal_id: string;
  content: string;
  created_at: string;
  start_date: string | null;
  end_date: string | null;
};

function formatMonth(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export default function StoriesScreen() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStories() {
      try {
        const data = await loadCompletedStories();

        console.log('Completed stories from Supabase:', data);

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

  const months = Array.from(
    new Set(
      stories
        .filter((story) => story.start_date)
        .map((story) => formatMonth(story.start_date!))
    )
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
        My Stories
      </Text>

      {months.map((month) => {
        const monthStories = stories.filter(
          (story) =>
            story.start_date &&
            formatMonth(story.start_date) === month
        );

        return (
          <Pressable
            key={month}
            onPress={() =>
              router.push({
                pathname: '/(app)/month',
                params: { month },
              })
            }
            style={{
              paddingVertical: 20,
              paddingHorizontal: 18,
              borderWidth: 1,
              borderColor: '#ddd',
              borderRadius: 12,
              marginBottom: 14,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: '600',
              }}
            >
              {month}
            </Text>

            <Text
              style={{
                fontSize: 14,
                marginTop: 6,
              }}
            >
              {monthStories.length}{' '}
              {monthStories.length === 1 ? 'story' : 'stories'}
            </Text>
          </Pressable>
        );
      })}

      {stories.length === 0 && (
        <Text
          style={{
            fontSize: 16,
            lineHeight: 24,
          }}
        >
          No completed stories yet.
        </Text>
      )}
    </ScrollView>
  );
}
