import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppIconBox } from '../AppIconBox';
import { Colors } from '../../theme/colors';
import { HOME_DISCOVER_SHORTCUTS } from '../../data/discoverModules';

type Props = {
  onSeeAll?: () => void;
};

export function HomeDiscoverShortcuts({ onSeeAll }: Props) {
  const router = useRouter();

  return (
    <View style={s.wrap}>
      <View style={s.header}>
        <Text style={s.title}>Découvrir</Text>
        {onSeeAll ? (
          <TouchableOpacity onPress={onSeeAll} hitSlop={8}>
            <Text style={s.seeAll}>Tout voir →</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.row}
      >
        {HOME_DISCOVER_SHORTCUTS.map(item => (
          <TouchableOpacity
            key={item.route}
            style={s.chip}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.85}
          >
            <AppIconBox
              name={item.ion}
              backgroundColor={item.ionBg}
              color={item.ionColor}
              size={40}
              iconSize={18}
              borderRadius={12}
            />
            <Text style={s.chipLabel} numberOfLines={1}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    marginBottom: 20,
    paddingHorizontal: 14,
    alignSelf: 'stretch',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.ink,
  },
  seeAll: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.amberDark,
  },
  row: { gap: 10, paddingRight: 14 },
  chip: {
    width: 88,
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  chipLabel: {
    fontSize: 10,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
    textAlign: 'center',
  },
});
