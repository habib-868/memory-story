import { Text, View } from 'react-native';

import { styles } from '../styles/indexStyles';

type PreviousStory = {
  id: string;
  content: string;
  created_at: string;
};

type PreviousStoriesProps = {
  stories: PreviousStory[];
};

export default function PreviousStories({
  stories,
}: PreviousStoriesProps) {
  if (stories.length === 0) {
    return null;
  }

  return (
    <View style={styles.previousStoriesContainer}>
      <Text style={styles.storyTitle}>
        Previous Stories
      </Text>

      {stories.map((previousStory) => (
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
  );
}