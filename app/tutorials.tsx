import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/theme/colors';
import { useApp } from '../src/context/AppContext';
import { AppHeader } from '../src/components/AppHeader';

const FILTERS = [
  { id: 'all',     l: 'Tous'         },
  { id: 'wash',    l: 'Wash day'     },
  { id: 'style',   l: 'Coiffage'     },
  { id: 'protect', l: 'Protectrices' },
  { id: 'natural', l: 'Recettes'     },
];

const TUTOS = [
  { t: 'Wash & Go définition parfaite',  creator: 'Naya · 32k',   views: '128k', dur: '8:42',  level: 'Débutant',      cat: 'Wash day',     stars: 4.9, bg: '#3a2530' },
  { t: 'Twist out longue durée',         creator: 'Esther · 21k', views: '94k',  dur: '12:08', level: 'Intermédiaire', cat: 'Coiffage',     stars: 4.7, bg: '#5a3a2a' },
  { t: 'Bantu knots tutoriel pas-à-pas', creator: 'Mariam · 14k', views: '52k',  dur: '15:30', level: 'Avancé',        cat: 'Protectrices', stars: 4.8, bg: '#3a2a4a' },
  { t: 'Masque DIY karité-avocat',       creator: 'Lina · 8k',    views: '38k',  dur: '5:20',  level: 'Débutant',      cat: 'Recettes',     stars: 4.6, bg: '#2a3a2a' },
];

const LVL_STYLE: Record<string, { bg: string; text: string }> = {
  'Débutant':      { bg: Colors.sageLight,  text: Colors.sage  },
  'Intermédiaire': { bg: Colors.amberLight, text: '#B45309'    },
  'Avancé':        { bg: Colors.blush,      text: Colors.rose  },
};

export default function TutorialsScreen() {
  const router = useRouter();
  const { state } = useApp();
  const [filter, setFilter] = useState('all');
  const { width } = useWindowDimensions();
  const featuredHeight = Math.round((width - 40) * 9 / 16);

  return (
    <SafeAreaView style={S.safe} edges={['top']}>

      {/* Header */}
      <AppHeader title="Tutoriels" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.content}>

        {/* ── Vidéo à la une ── */}
        <View style={[S.featured, { height: featuredHeight }]}>
          {/* Badge "À la une" */}
          <View style={S.featuredBadge}>
            <Text style={S.featuredBadgeText}>⭐ À la une</Text>
          </View>
          {/* Durée */}
          <View style={S.featuredDur}>
            <Text style={S.featuredDurText}>14:22</Text>
          </View>
          {/* Play button */}
          <TouchableOpacity style={S.playBtn}>
            <Text style={S.playBtnText}>▶</Text>
          </TouchableOpacity>
          {/* Titre + vues */}
          <View style={S.featuredMeta}>
            <Text style={S.featuredTitle}>Routine Wash Day complète</Text>
            <Text style={S.featuredSub}>Naya · 128k vues</Text>
          </View>
        </View>

        {/* ── Filtres ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={S.filtersRow}
          style={S.filtersScroll}
        >
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.id}
              style={[S.filterPill, filter === f.id && S.filterPillActive]}
              onPress={() => setFilter(f.id)}
            >
              <Text style={[S.filterPillText, filter === f.id && S.filterPillTextActive]}>
                {f.l}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Liste ── */}
        <Text style={S.secTitle}>Populaires cette semaine</Text>
        {TUTOS.map((t, i) => (
          <TouchableOpacity key={i} style={S.tutoCard}>
            {/* Thumbnail */}
            <View style={[S.thumb, { backgroundColor: t.bg }]}>
              <Text style={S.thumbPlay}>▶</Text>
              <View style={S.thumbDur}>
                <Text style={S.thumbDurText}>{t.dur}</Text>
              </View>
            </View>
            {/* Info */}
            <View style={S.tutoInfo}>
              <Text style={S.tutoTitle} numberOfLines={2}>{t.t}</Text>
              <Text style={S.tutoCreds}>{t.creator} · {t.views} vues</Text>
              <View style={S.tutoTags}>
                <View style={[S.levelBadge, { backgroundColor: LVL_STYLE[t.level].bg }]}>
                  <Text style={[S.levelBadgeText, { color: LVL_STYLE[t.level].text }]}>{t.level}</Text>
                </View>
                <View style={S.catBadge}>
                  <Text style={S.catBadgeText}>{t.cat}</Text>
                </View>
                <Text style={S.stars}>★ {t.stars}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 40 },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  backBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 20, fontFamily: 'Satoshi_500Medium', color: Colors.ink },
  coinsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.ink,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  coinsEmoji: { fontSize: 15 },
  coinsText:  { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.amber },

  // ── Featured ──
  featured: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: '#2a1a14',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredBadge: {
    position: 'absolute',
    top: 12, left: 12,
    backgroundColor: Colors.blush,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  featuredBadgeText: { fontSize: 10, fontFamily: 'DMSans_600SemiBold', color: Colors.rose },
  featuredDur: {
    position: 'absolute',
    bottom: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  featuredDurText: { fontSize: 11, fontFamily: 'DMSans_600SemiBold', color: '#fff' },
  playBtn: {
    width: 64, height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  playBtnText: { fontSize: 22, color: Colors.ink, marginLeft: 4 },
  featuredMeta: {
    position: 'absolute',
    bottom: 12, left: 14,
  },
  featuredTitle: { fontSize: 18, fontFamily: 'Satoshi_500Medium', color: '#fff' },
  featuredSub:   { fontSize: 11, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  // ── Filters ──
  filtersScroll: { marginBottom: 4 },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginRight: 8,
    flexShrink: 0,
  },
  filterPillActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  filterPillText:       { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },
  filterPillTextActive: { color: '#fff', fontFamily: 'DMSans_600SemiBold' },

  // ── Section title ──
  secTitle: {
    fontSize: 17,
    fontFamily: 'Satoshi_500Medium',
    color: Colors.ink,
    marginBottom: 12,
  },

  // ── Tutorial cards ──
  tutoCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  thumb: {
    width: 100,
    height: 72,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,
  },
  thumbPlay:    { fontSize: 22, color: 'rgba(255,255,255,0.85)' },
  thumbDur: {
    position: 'absolute',
    bottom: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  thumbDurText: { fontSize: 9, fontFamily: 'DMSans_600SemiBold', color: '#fff' },
  tutoInfo:     { flex: 1, minWidth: 0 },
  tutoTitle: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
    lineHeight: 18,
  },
  tutoCreds: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginTop: 3,
  },
  tutoTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  levelBadge: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  levelBadgeText: { fontSize: 9, fontFamily: 'DMSans_600SemiBold' },
  catBadge: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catBadgeText: { fontSize: 9, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
  stars: { fontSize: 10, fontFamily: 'DMSans_600SemiBold', color: Colors.amber, marginLeft: 'auto' as any },
});
