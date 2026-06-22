import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { AppIconBox } from '../AppIconBox';
import { Colors } from '../../theme/colors';
import { EXPLORER_SECTIONS } from '../../data/explorerSections';

type Props = {
  contentPaddingBottom?: number;
};

export function ShortcutsExplorer({ contentPaddingBottom = 24 }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const cardW = (width - 40 - 20) / 3;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: contentPaddingBottom }}>
      {EXPLORER_SECTIONS.map(sec => (
        <View key={sec.id} style={s.section}>
          <Text style={s.sectionLabel}>{sec.label}</Text>
          <View style={s.grid}>
            {sec.items.map(item => (
              <TouchableOpacity
                key={item.label}
                style={[s.card, item.premium && s.cardPremium, { width: cardW }]}
                onPress={() => router.push(item.route as any)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                {item.premium ? (
                  <View style={s.proBadge}>
                    <Text style={s.proBadgeText}>PRO</Text>
                  </View>
                ) : null}
                <AppIconBox
                  name={item.ion}
                  backgroundColor={item.premium ? 'rgba(255,255,255,0.12)' : item.ionBg}
                  color={item.premium ? Colors.amber : item.ionColor}
                  size={36}
                  iconSize={18}
                  borderRadius={12}
                />
                <Text style={[s.label, item.premium && s.labelPremium]} numberOfLines={2}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  section: { marginTop: 8 },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
    color: Colors.warmGray,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20 },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  cardPremium: { backgroundColor: Colors.ink, borderColor: '#3a3028' },
  label: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.ink, textAlign: 'center' },
  labelPremium: { color: '#fff' },
  proBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: Colors.amber,
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  proBadgeText: { fontSize: 8, fontFamily: 'DMSans_700Bold', color: Colors.ink, letterSpacing: 0.4 },
});
