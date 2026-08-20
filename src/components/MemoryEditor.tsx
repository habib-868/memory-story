import {
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { styles } from '../styles/indexStyles';

type MemoryEditorProps = {
  visible: boolean;
  memoryText: string;
  saving: boolean;
  onChangeText: (text: string) => void;
  onSave: () => void;
};

export default function MemoryEditor({
  visible,
  memoryText,
  saving,
  onChangeText,
  onSave,
}: MemoryEditorProps) {
  if (!visible) {
    return null;
  }

  return (
    <View>
      <TextInput
        style={styles.memoryInput}
        value={memoryText}
        onChangeText={onChangeText}
        placeholder="Write what you remember about this day..."
        multiline
        textAlignVertical="top"
      />

      <Pressable
        style={styles.button}
        onPress={onSave}
        disabled={saving}
      >
        <Text style={styles.buttonText}>
          {saving ? 'Saving...' : 'Save memory'}
        </Text>
      </Pressable>
    </View>
  );
}
