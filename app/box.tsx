import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePremium } from '../src/context/PremiumContext';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/theme/colors';
import { useApp } from '../src/context/AppContext';
import { AppHeader } from '../src/components/AppHeader';

type TabId = 'current' | 'archive' | 'soon';

type ContentItem = {
  n: string;
  t: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconBg: string;
  iconColor: string;
  status: 'unlocked' | 'premium';
};

const ITEMS: ContentItem[] = [
  { n: 'Routine vidéo Hydra+',        t: 'Vidéo · 18 min', icon: 'play-outline',     iconBg: '#DBEAFE', iconColor: '#1D4ED8', status: 'unlocked' },
  { n: 'Recette beurre karité maison', t: 'PDF · 4 pages',  icon: 'document-outline', iconBg: Colors.cream,   iconColor: Colors.warmGray, status: 'unlocked' },
  { n: 'Playlist soin du soir',        t: 'Audio · 45 min', icon: 'headset-outline',  iconBg: Colors.cream,   iconColor: Colors.warmGray, status: 'unlocked' },
  { n: 'Masterclass porosité',         t: 'Vidéo · 32 min', icon: 'library-outline',  iconBg: Colors.blush,   iconColor: Colors.rose,     status: 'premium'  },
];

const TABS: { id: TabId; label: string }[] = [
  { id: 'current', label: 'En cours'  },
  { id: 'archive', label: 'Archives'  },
  { id: 'soon',    label: 'À venir'   },
];

export default function BoxScreen() {
  const { requireAccess, openPremium } = usePremium();
  const router = useRouter();
  const { state } = useApp();
  const [tab, setTab] = useState<TabId>('current');

  return (
    <SafeAreaView style={S.safe} edges={['top']}>

      {/* ── Header ── */}
      <AppHeader title="Box Digitale" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.content}>

        {/* ── Featured box card (dark) ── */}
        <View style={S.darkCard}>
          <View style={S.boxPill}>
            <Text style={S.boxPillText}>📦 Box Avril 2026</Text>
          </View>
          <Text style={S.darkTitle}>Hydratation Intensive</Text>
          <Text style={S.darkSub}>
            4 contenus exclusifs pour booster ta routine ce mois-ci.
          </Text>
          <View style={S.progressBg}>
            <View style={[S.progressFill, { width: '75%' }]} />
          </View>
          <Text style={S.progressCaption}>3 / 4 contenus débloqués</Text>
        </View>

        {/* ── Segmented control ── */}
        <View style={S.segmented}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[S.seg, tab === t.id && S.segActive]}
              onPress={() => setTab(t.id)}
            >
              <Text style={[S.segText, tab === t.id && S.segTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── En cours ── */}
        {tab === 'current' && ITEMS.map((item, i) => {
          const isPremium = item.status === 'premium';
          return (
            <TouchableOpacity
              key={i}
              style={[
                S.itemCard,
                isPremium
                  ? { backgroundColor: Colors.cream,      borderColor: Colors.border, opacity: 0.75 }
                  : { backgroundColor: Colors.sageLight,  borderColor: Colors.sage },
              ]}
              activeOpacity={0.8}
              onPress={() => {
                if (isPremium) {
                  void requireAccess('box_masterclass').then(ok => {
                    if (!ok) openPremium('box_masterclass');
                  });
                }
              }}
            >
              <View style={[S.itemIconBox, { backgroundColor: '#fff' }]}>
                <Ionicons name={item.icon} size={22} color={isPremium ? Colors.rose : item.iconColor} />
              </View>
              <View style={S.itemInfo}>
                <Text style={S.itemName}>{item.n}</Text>
                <Text style={S.itemMeta}>{item.t}</Text>
              </View>
              {isPremium ? (
                <View style={S.premiumBadge}>
                  <Text style={S.premiumBadgeText}>Premium</Text>
                </View>
              ) : (
                <View style={S.unlockedBadge}>
                  <Text style={S.unlockedBadgeText}>✓ Débloqué</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* ── Archives ── */}
        {tab === 'archive' && (
          <View style={S.archiveCard}>
            <Text style={S.archiveText}>
              12 box précédentes — explore ton historique de contenus exclusifs.
            </Text>
          </View>
        )}

        {/* ── À venir ── */}
        {tab === 'soon' && (
          <View style={S.soonCard}>
            <Text style={S.soonEmoji}>📦</Text>
            <Text style={S.soonTitle}>Mai · Cuir Chevelu Sain</Text>
            <Text style={S.soonSub}>Disponible dans 4 jours · 12 h</Text>
          </View>
        )}

        {/* ── Countdown dashed card ── */}
        <View style={S.countdownCard}>
          <Text style={S.countdownEmoji}>⏳</Text>
          <Text style={S.countdownTitle}>Prochaine box dans 4 j</Text>
          <Text style={S.countdownSub}>Cuir Chevelu Sain · 5 contenus inédits</Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 16 },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 8,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 20, fontFamily: 'Satoshi_500Medium', color: Colors.ink },
  coinsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.ink,
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7,
  },
  coinsEmoji: { fontSize: 15 },
  coinsText:  { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.amber },

  // ── Dark card ──
  darkCard: {
    backgroundColor: Colors.ink,
    borderRadius: 20, padding: 20, marginBottom: 16,
  },
  boxPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.amberLight,
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
    marginBottom: 12,
  },
  boxPillText:     { fontSize: 10, fontFamily: 'DMSans_600SemiBold', color: Colors.amber },
  darkTitle: {
    fontSize: 26, fontFamily: 'Satoshi_500Medium', color: '#fff',
    marginBottom: 4,
  },
  darkSub: {
    fontSize: 13, fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.55)', lineHeight: 18, marginBottom: 14,
  },
  progressBg: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 999, overflow: 'hidden', marginBottom: 8,
  },
  progressFill:    { height: 6, backgroundColor: Colors.amber, borderRadius: 999 },
  progressCaption: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.55)' },

  // ── Segmented ──
  segmented: {
    flexDirection: 'row',
    backgroundColor: Colors.cream,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    padding: 4, marginBottom: 14,
  },
  seg: {
    flex: 1, paddingVertical: 10, borderRadius: 11,
    alignItems: 'center',
  },
  segActive: {
    backgroundColor: Colors.surface,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  segText:       { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },
  segTextActive: { fontFamily: 'DMSans_700Bold', color: Colors.ink },

  // ── Item cards ──
  itemCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10,
  },
  itemIconBox: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  itemInfo:  { flex: 1 },
  itemName:  { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },
  itemMeta:  { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 2 },

  unlockedBadge: {
    backgroundColor: Colors.sageLight, borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  unlockedBadgeText: { fontSize: 10, fontFamily: 'DMSans_600SemiBold', color: Colors.sage },

  premiumBadge: {
    backgroundColor: Colors.amberLight, borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  premiumBadgeText: { fontSize: 10, fontFamily: 'DMSans_600SemiBold', color: Colors.amber },

  // ── Archive / Soon ──
  archiveCard: {
    backgroundColor: Colors.cream, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
    padding: 22, alignItems: 'center',
  },
  archiveText: {
    fontSize: 13, fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray, textAlign: 'center', lineHeight: 20,
  },
  soonCard: {
    backgroundColor: Colors.cream, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
    padding: 22, alignItems: 'center',
  },
  soonEmoji: { fontSize: 28, marginBottom: 8 },
  soonTitle: { fontSize: 18, fontFamily: 'Satoshi_500Medium', color: Colors.ink },
  soonSub:   { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 4 },

  // ── Countdown dashed ──
  countdownCard: {
    borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed',
    borderRadius: 16, padding: 18, marginTop: 10,
    backgroundColor: Colors.cream, alignItems: 'center',
  },
  countdownEmoji: { fontSize: 22, marginBottom: 6 },
  countdownTitle: { fontSize: 16, fontFamily: 'Satoshi_500Medium', color: Colors.ink },
  countdownSub:   { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 3 },
});
