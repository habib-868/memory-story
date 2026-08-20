import { Text, View } from 'react-native';

import { styles } from '../styles/indexStyles';

type CurrentStoryProps = {
  story: string;
};

export default function CurrentStory({
  story,
}: CurrentStoryProps) {
  if (!story) {
    return null;
  }

  return (
    <View style={styles.storyContainer}>
      <Text style={styles.storyTitle}>
        Your Story
      </Text>

      <Text style={styles.storyText}>
        {story}
      </Text>
    </View>
  );
}
