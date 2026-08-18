import { Pressable, StyleSheet, Text } from 'react-native';

type GenerateStoryButtonProps = {
  storySaving: boolean;
  onPress: () => void;
};

export default function GenerateStoryButton({
  storySaving,
  onPress,
}: GenerateStoryButtonProps) {
  return (
    <Pressable
      style={styles.button}
      onPress={onPress}
      disabled={storySaving}
    >
      <Text style={styles.buttonText}>
        {storySaving
          ? 'Creating your story...'
          : 'Create My Story'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    paddingHorizontal: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});