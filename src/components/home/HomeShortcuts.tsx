import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../theme/colors';
import { FontDisplay } from '../../theme/typography';
import { AppIconBox, type IonName } from '../AppIconBox';

const SHORTCUTS: { ion: IonName; ionBg: string; ionColor: string; label: string; route: string }[] = [
  { ion: 'camera-outline', ionBg: Colors.cream, ionColor: Colors.ink, label: 'Analyse IA', route: '/(tabs)/analyze' },
  { ion: 'water-outline', ionBg: '#DBEAFE', ionColor: '#2563EB', label: 'Wash day', route: '/washday' },
  { ion: 'play-circle-outline', ionBg: Colors.amberLight, ionColor: Colors.amberDark, label: 'Tutos', route: '/tutorials' },
  { ion: 'bag-handle-outline', ionBg: Colors.cream, ionColor: Colors.ink, label: 'Produits', route: '/shop' },
];

export function HomeShortcuts() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const cell = (width - 40 - 24) / 4;

  return (
    <View style={s.section}>
      <Text style={s.title}>Raccourcis</Text>
      <View style={s.row}>
        {SHORTCUTS.map(item => (
          <TouchableOpacity
            key={item.route}
            style={[s.cell, { width: cell }]}
            onPress={() => router.push(item.route as any)}
            accessibilityLabel={item.label}
          >
            <AppIconBox name={item.ion} backgroundColor={item.ionBg} color={item.ionColor} size={40} iconSize={22} borderRadius={14} />
            <Text style={s.label} numberOfLines={2}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={s.moreRow} onPress={() => router.push('/discover' as any)} activeOpacity={0.85}>
        <Text style={s.moreText}>Plus d&apos;outils et offres</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.amberDark} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  section: { marginBottom: 24, paddingHorizontal: 20 },
  title: { fontSize: 18, fontFamily: FontDisplay, color: Colors.ink, marginBottom: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  cell: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 8,
  },
  label: { fontSize: 11, fontFamily: 'DMSans_500Medium', color: Colors.ink, textAlign: 'center' },
  moreRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cream,
  },
  moreText: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },
});
