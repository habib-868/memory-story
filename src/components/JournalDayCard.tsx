import {
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';

import { styles } from '../styles/indexStyles';

type JournalDayCardProps = {
  dayNumber: number;
  selected: boolean;
  photoUrl: string | null;
  onSelect: () => void;
};

export default function JournalDayCard({
  dayNumber,
  selected,
  photoUrl,
  onSelect,
}: JournalDayCardProps) {
  return (
    <View style={styles.dayContainer}>
      <Pressable
        style={[
          styles.dayButton,
          selected && styles.selectedDayButton,
        ]}
        onPress={onSelect}
      >
        <Text
          style={[
            styles.dayText,
            selected && styles.selectedDayText,
          ]}
        >
          Day {dayNumber}
        </Text>
      </Pressable>

      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          style={styles.photo}
        />
      ) : (
        <Text style={styles.noPhotoText}>
          No photo yet
        </Text>
      )}
    </View>
  );
}