import {
  Pressable,
  Text,
  View,
} from 'react-native';

import { styles } from '../styles/indexStyles';

type PhotoActionsProps = {
  hasPhoto: boolean;
  onPickPhoto: () => void;
  onDeletePhoto: () => void;
};

export default function PhotoActions({
  hasPhoto,
  onPickPhoto,
  onDeletePhoto,
}: PhotoActionsProps) {
  return (
    <View>
      <Pressable
        style={styles.button}
        onPress={onPickPhoto}
      >
        <Text style={styles.buttonText}>
          {hasPhoto ? 'Replace photo' : 'Choose a photo'}
        </Text>
      </Pressable>

      {hasPhoto ? (
        <Pressable
          style={styles.button}
          onPress={onDeletePhoto}
        >
          <Text style={styles.buttonText}>
            Delete photo
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}