import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../src/theme/colors';
import { supabase } from '../src/lib/supabase';
import { AppHeader } from '../src/components/AppHeader';
import { useAchievements } from '../src/context/AchievementsContext';
import { normalizeHttpUrl, openSafeUrl } from '../src/lib/safeLinking';

const LIKES_KEY = '@coton_noir_hairstyle_likes';

type HairstyleDetail = {
  id:           string;
  name:         string | null;
  duration:     string | null;
  stars:        number | null;
  likes:        number;
  level:        string | null;
  bg_color:     string | null;
  emoji:        string | null;
  image:        string | null;
  description:  string | null;
  steps:        string[] | null;
  tools:        string[] | null;
  hair_types:   string[] | null;
  tutorial_url: string | null;
};

export default function CoiffureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    duration?: string;
    stars?: string;
    likes?: string;
    level?: string;
    bg?: string;
    emoji?: string;
    image?: string;
  }>();

  const [data, setData]       = useState<HairstyleDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(!!params.id);
  const [error, setError]     = useState<string | null>(null);

  const [liked, setLiked]     = useState(false);
  const { refreshExtras } = useAchievements();

  useEffect(() => {
    if (!params.id) return;
    supabase
      .from('hairstyles')
      .select('id, name, duration, stars, likes, level, bg_color, emoji, image, description, steps, tools, hair_types, tutorial_url')
      .eq('id', params.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
          setData(null);
        } else if (data) {
          setData(data as HairstyleDetail);
        }
        setLoading(false);
      });
  }, [params.id]);

  // Likes locaux (per device)
  useEffect(() => {
    if (!params.id) return;
    AsyncStorage.getItem(LIKES_KEY).then(raw => {
      if (!raw) return;
      try {
        const obj = JSON.parse(raw) as Record<string, boolean>;
        if (obj[params.id!]) setLiked(true);
      } catch {}
    });
  }, [params.id]);

  async function toggleLike() {
    if (!params.id) return;
    const next = !liked;
    setLiked(next);
    try {
      const raw = await AsyncStorage.getItem(LIKES_KEY);
      const obj = raw ? JSON.parse(raw) as Record<string, boolean> : {};
      if (next) obj[params.id] = true; else delete obj[params.id];
      await AsyncStorage.setItem(LIKES_KEY, JSON.stringify(obj));
      refreshExtras();
    } catch {}
  }

  async function openTutorial() {
    const url = normalizeHttpUrl(data?.tutorial_url ?? '');
    if (!url) {
      Alert.alert('Tutoriel', "Aucun tutoriel vidéo n'est lié à cette coiffure.");
      return;
    }
    await openSafeUrl(url, 'partner', { alertTitle: 'Tutoriel' });
  }

  // Valeurs d'affichage : on combine ce qui vient des params (pour un rendu instantané)
  // avec ce qui vient de Supabase (pour les champs complets).
  const name     = data?.name        ?? params.name     ?? 'Coiffure';
  const duration = data?.duration    ?? params.duration ?? null;
  const stars    = data?.stars       ?? parseFloat(params.stars ?? '') ?? 0;
  const likes    = (data?.likes ?? parseInt(params.likes ?? '0', 10) ?? 0) + (liked ? 1 : 0);
  const level    = data?.level       ?? params.level    ?? null;
  const bg       = data?.bg_color    ?? params.bg       ?? '#3a2530';
  const emoji    = data?.emoji       ?? params.emoji    ?? '💇';
  const image    = data?.image       ?? params.image    ?? null;

  const description = data?.description ?? null;
  const steps       = (data?.steps      ?? []).filter(Boolean);
  const tools       = (data?.tools      ?? []).filter(Boolean);
  const hairTypes   = (data?.hair_types ?? []).filter(Boolean);
  const tutorialUrl = normalizeHttpUrl(data?.tutorial_url ?? '');
  const styleName = (data?.name ?? params.name ?? 'Ma coiffure').trim() || 'Ma coiffure';

  const levelLabel = level === 'débutant' ? 'Débutant'
    : level === 'inter'                  ? 'Intermédiaire'
    : level ?? '';
  const levelColor = level === 'débutant' ? Colors.amber
    : level === 'inter'                  ? Colors.sage
    : Colors.warmGray;

  return (
    <SafeAreaView style={S.safe} edges={['top']}>

      <AppHeader
        title=""
        rightAction="custom"
        rightSlot={
          <TouchableOpacity
            style={S.iconBtn}
            onPress={toggleLike}
            accessibilityRole="button"
            accessibilityLabel={liked ? 'Retirer le like' : 'Ajouter un like'}
          >
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={20}
              color={liked ? Colors.rose : Colors.ink}
            />
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.content}>

        {/* ── Hero ── */}
        <View style={[S.hero]}>
          {image ? (
            <Image
              source={{ uri: image }}
              style={S.heroImg}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <LinearGradient
              colors={[bg, '#1a1209']}
              start={{ x: 0.15, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={S.heroGradient}
            >
              <Text style={S.heroEmoji}>{emoji}</Text>
            </LinearGradient>
          )}

          {/* Likes badge */}
          <View style={S.likesBadge}>
            <Ionicons name="heart" size={11} color="#fff" />
            <Text style={S.likesText}>{likes}</Text>
          </View>

          {/* Level badge */}
          {levelLabel ? (
            <View style={[S.levelBadge, { backgroundColor: levelColor }]}>
              <Text style={S.levelText}>{levelLabel}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Info ── */}
        <View style={S.info}>
          <Text style={S.name}>{name}</Text>

          <View style={S.metaRow}>
            {duration ? (
              <View style={S.metaItem}>
                <Ionicons name="time-outline" size={14} color={Colors.warmGray} />
                <Text style={S.metaText}>{duration}</Text>
              </View>
            ) : null}
            <View style={S.metaItem}>
              <Ionicons name="star" size={14} color={Colors.amber} />
              <Text style={S.metaText}>{Number(stars || 0).toFixed(1)}</Text>
            </View>
            {hairTypes.length > 0 ? (
              <View style={S.metaItem}>
                <Ionicons name="person-outline" size={14} color={Colors.warmGray} />
                <Text style={S.metaText}>
                  {hairTypes.slice(0, 3).join(', ')}{hairTypes.length > 3 ? '…' : ''}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── Loader / error ── */}
        {loading ? (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <ActivityIndicator color={Colors.amber} />
          </View>
        ) : error ? (
          <View style={S.errorBox}>
            <Text style={S.errorTitle}>⚠️ {error}</Text>
            <Text style={S.errorHint}>
              Vérifie la connexion à Supabase ou la policy SELECT sur « hairstyles ».
            </Text>
          </View>
        ) : (
          <>
            {/* Description */}
            {description ? (
              <View style={S.section}>
                <Text style={S.sectionTitle}>Description</Text>
                <Text style={S.sectionBody}>{description}</Text>
              </View>
            ) : null}

            {/* Matériel */}
            {tools.length > 0 ? (
              <View style={S.section}>
                <Text style={S.sectionTitle}>Matériel nécessaire</Text>
                {tools.map((t, i) => (
                  <View key={`tool-${i}`} style={S.toolRow}>
                    <View style={S.toolBullet} />
                    <Text style={S.toolText}>{t}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Étapes */}
            <View style={S.section}>
              <View style={S.stepsHeader}>
                <Text style={S.sectionTitle}>Étapes</Text>
                {steps.length > 0 ? (
                  <Text style={S.stepsCount}>{steps.length} étapes</Text>
                ) : null}
              </View>

              {steps.length === 0 ? (
                <Text style={S.emptySteps}>
                  Les étapes détaillées de cette coiffure ne sont pas encore disponibles.
                </Text>
              ) : (
                steps.map((step, i) => (
                  <View key={`step-${i}`} style={S.stepRow}>
                    <View style={S.stepBadge}>
                      <Text style={S.stepBadgeText}>{i + 1}</Text>
                    </View>
                    <Text style={S.stepText}>{step}</Text>
                  </View>
                ))
              )}
            </View>

            {/* CTA tutoriel vidéo */}
            {tutorialUrl ? (
              <TouchableOpacity
                style={S.tutoBtn}
                onPress={openTutorial}
                activeOpacity={0.88}
              >
                <Ionicons name="play-circle-outline" size={18} color="#fff" />
                <Text style={S.tutoBtnText}>Voir le tutoriel vidéo</Text>
              </TouchableOpacity>
            ) : null}

            <View style={S.eventCard}>
              <Text style={S.sectionTitle}>Préparer un événement</Text>
              <Text style={S.eventSub}>
                Tutoriel → routine coiffage du jour → minuteur si besoin
              </Text>
              <TouchableOpacity
                style={S.eventPrimary}
                onPress={() =>
                  router.push({
                    pathname: '/routine-plan',
                    params: {
                      kind: 'daily',
                      source: 'event',
                      eventName: styleName,
                    },
                  } as any)
                }
              >
                <Ionicons name="sparkles-outline" size={18} color={Colors.amber} />
                <Text style={S.eventPrimaryText}>Coiffage du jour</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={S.eventSecondary}
                onPress={() => router.push('/washday' as any)}
              >
                <Ionicons name="timer-outline" size={18} color={Colors.ink} />
                <Text style={S.eventSecondaryText}>Minuteur de soin (wash day)</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 20 },

  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },

  // Hero
  hero: {
    height: 280,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImg: {
    width: '100%', height: '100%',
  },
  heroGradient: {
    width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center',
  },
  heroEmoji: { fontSize: 80 },

  likesBadge: {
    position: 'absolute', top: 14, right: 14,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
  },
  likesText: { fontSize: 11, fontFamily: 'DMSans_700Bold', color: '#fff' },

  levelBadge: {
    position: 'absolute', bottom: 14, left: 14,
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
  },
  levelText: { fontSize: 11, fontFamily: 'DMSans_700Bold', color: '#fff' },

  // Info
  info: { padding: 20, paddingBottom: 4 },
  name: {
    fontSize: 24, fontFamily: 'Poppins_700Bold', color: Colors.ink,
    lineHeight: 30, marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16,
    marginTop: 4,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },

  // Sections
  section: {
    marginHorizontal: 20, marginTop: 16,
    backgroundColor: Colors.surface, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.border,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.ink,
    marginBottom: 10,
  },
  sectionBody: {
    fontSize: 13, fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray, lineHeight: 20,
  },

  // Tools
  toolRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, paddingVertical: 5,
  },
  toolBullet: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.amber,
  },
  toolText: {
    flex: 1,
    fontSize: 13, fontFamily: 'DMSans_500Medium',
    color: Colors.ink,
  },

  // Steps
  stepsHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10,
  },
  stepsCount: {
    fontSize: 12, fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
  },
  stepRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 12, paddingVertical: 8,
  },
  stepBadge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.amberLight,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  stepBadgeText: {
    fontSize: 12, fontFamily: 'Poppins_700Bold',
    color: Colors.amberDark,
  },
  stepText: {
    flex: 1,
    fontSize: 14, fontFamily: 'DMSans_400Regular',
    color: Colors.ink, lineHeight: 21,
  },
  emptySteps: {
    fontSize: 13, fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray, lineHeight: 19,
    fontStyle: 'italic',
  },

  // Error
  errorBox: {
    marginHorizontal: 20, marginTop: 16,
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    padding: 16, alignItems: 'center', gap: 6,
  },
  errorTitle: { fontSize: 14, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },
  errorHint:  { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, textAlign: 'center', lineHeight: 17 },

  // CTA
  tutoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20, marginTop: 20,
    backgroundColor: Colors.ink,
    borderRadius: 14, paddingVertical: 14,
  },
  tutoBtnText: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: '#fff' },
  eventCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 14,
    borderRadius: 16,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  eventSub: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginBottom: 12,
    lineHeight: 17,
  },
  eventPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.ink,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  eventPrimaryText: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.amber },
  eventSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  eventSecondaryText: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },
});
