import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { router } from 'expo-router';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          Memory Story
        </Text>

        <Text style={styles.subtitle}>
          Create a 7-day journal
        </Text>

        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/memory-story-logo.png')}
            style={styles.logo}
            resizeMode="cover"
          />
        </View>

        <Pressable
          style={styles.enterButton}
          onPress={() => router.push('/journal')}
        >
          <Text style={styles.enterText}>
            ENTER
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  content: {
    width: '100%',
    alignItems: 'center',
  },

  title: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 18,
    marginBottom: 48,
  },

  logoContainer: {
    width: 240,
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 48,
  },

  logo: {
    width: '100%',
    height: '100%',
  },

  logoText: {
    fontSize: 32,
    fontWeight: '700',
  },

  enterButton: {
    minWidth: 180,
    minHeight: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
  },

  enterText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
});