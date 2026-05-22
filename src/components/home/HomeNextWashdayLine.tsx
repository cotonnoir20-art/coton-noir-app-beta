import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { PlannedSoin } from '../../context/AppContext';
import { Colors } from '../../theme/colors';
import { getNextWashdayCountdown } from '../../lib/homeWashdayCountdown';

type Props = {
  plannedSoins: PlannedSoin[];
};

export function HomeNextWashdayLine({ plannedSoins }: Props) {
  const router = useRouter();
  const countdown = getNextWashdayCountdown(plannedSoins);
  if (!countdown) return null;

  const onPress = () => {
    if (countdown.daysUntil <= 0) {
      router.push('/washday' as any);
    } else {
      router.push({ pathname: '/add-washday', params: { date: countdown.dateIso } } as any);
    }
  };

  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.88}>
      <Ionicons name="water-outline" size={16} color="#2563EB" />
      <Text style={s.text} numberOfLines={1}>
        {countdown.label}
        {countdown.soinType ? ` · ${countdown.soinType}` : ''}
      </Text>
      <Ionicons name="chevron-forward" size={14} color={Colors.warmGray} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(219, 234, 254, 0.55)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  text: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
  },
});
