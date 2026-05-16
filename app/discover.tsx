import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppHeader } from '../src/components/AppHeader';
import { AppIconBox } from '../src/components/AppIconBox';
import { Colors } from '../src/theme/colors';
import { EXPLORER_SECTIONS } from '../src/data/explorerSections';
import { DISCOVER_LIST_SUBTITLE } from '../src/constants/productPitch';

export default function DiscoverScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const cardW = (width - 40 - 20) / 3;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <AppHeader title="Découvrir" subtitle={DISCOVER_LIST_SUBTITLE} rightAction="none" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {EXPLORER_SECTIONS.map(sec => (
          <View key={sec.id} style={s.section}>
            <Text style={s.sectionLabel}>{sec.label}</Text>
            <View style={s.grid}>
              {sec.items.map(item => (
                <TouchableOpacity
                  key={item.route}
                  style={[s.card, item.premium && s.cardPremium, { width: cardW }]}
                  onPress={() => router.push(item.route as any)}
                  accessibilityLabel={item.label}
                >
                  {item.premium && (
                    <View style={s.proBadge}>
                      <Text style={s.proBadgeText}>PRO</Text>
                    </View>
                  )}
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
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: 24 },
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
