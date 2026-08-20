import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({

  container: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 40,
  },
  storyContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  storyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  storyText: {
    fontSize: 16,
    lineHeight: 24,
  },
  previousStoriesContainer: {
    width: '100%',
    marginTop: 24,
  },

  previousStoryCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  journeyTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },

  journeySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 32,
    marginBottom: 12,
  },

  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },

  progressItem: {
    alignItems: 'center',
  },

  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 4,
  },

  progressDotCompleted: {
    backgroundColor: '#111',
  },

  progressDay: {
    fontSize: 12,
  },

  currentDayText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
    dayContainer: {
    width: 180,
    alignItems: 'center',
    marginBottom: 20,
  },
  photo: {
    width: 180,
    height: 180,
    borderRadius: 12,
    marginTop: 8,
  },
  journalPhoto: {
    width: 280,
    height: 220,
    borderRadius: 16,
    marginBottom: 16,
  },
  noPhotoText: {
    width: 180,
    height: 180,
    borderRadius: 12,
    marginTop: 8,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 14,
  },
  memoryInput: {
    width: '100%',
    height: 100,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginTop: 12,
    textAlignVertical: 'top',
  },
  progressItemSelected: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
  },

  progressDotSelected: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },

  progressDaySelected: {
    fontWeight: '700',
  },
  nextDayButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
  },

  nextDayButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
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
  dayButton: {
    width: 180,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  selectedDayButton: {
    backgroundColor: '#111',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: '700',
  },
  signOutButton: {
    marginTop: 20,
    padding: 12,
  },
  signOutText: {
    fontSize: 16,
  },

});