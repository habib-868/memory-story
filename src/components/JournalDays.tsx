import { Text, View } from 'react-native';

import JournalDayCard from './JournalDayCard';

import { styles } from '../styles/indexStyles';

type JournalDay = {
  id: string;
  day_number: number;
  memoryText: string;
  photoId: string | null;
  storagePath: string | null;
  photoUrl: string | null;
};

type JournalDaysProps = {
  days: JournalDay[];
  selectedDayId: string | null;
  onSelectDay: (day: JournalDay) => void;
};

export default function JournalDays({
  days,
  selectedDayId,
  onSelectDay,
}: JournalDaysProps) {
  return (
    <View>
      <Text style={styles.sectionTitle}>
        Choose a day
      </Text>

      {days.map((day) => (
        <JournalDayCard
          key={day.id}
          dayNumber={day.day_number}
          selected={selectedDayId === day.id}
          photoUrl={day.photoUrl}
          onSelect={() => onSelectDay(day)}
        />
      ))}
    </View>
  );
}