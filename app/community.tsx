import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/theme/colors';
import { useApp } from '../src/context/AppContext';
import { useAuth } from '../src/context/AuthContext';
import {
  getCommunityImageSignedUrl,
  uploadCommunityPostImage,
} from '../src/lib/communityStorage';
import { supabase } from '../src/lib/supabase';
import { AppHeader } from '../src/components/AppHeader';
import { EmptyAnimation } from '../src/components/animations/EmptyAnimation';
import { CHALLENGE_HYDRA_PTS_PER_DAY, PTS_DEFI_LABEL } from '../src/constants/productPitch';
import {
  fetchMyLikedPostIds,
  toggleCommunityPostLike,
} from '../src/lib/communityLikes';
import {
  HYDRA_SLUG,
  type HydraChallengeState,
  hydraDayNumber,
  hydraDaysRemaining,
  joinHydraChallenge,
  loadHydraChallengeState,
  recordHydraPostDay,
} from '../src/lib/hydraChallenge';
import { trackProductEvent } from '../src/lib/productAnalytics';

type PostType = 'progres' | 'question' | 'astuce' | 'avant_apres';

type Post = {
  id:           string;
  author_name:  string;
  verified:     boolean;
  type:         PostType | string;
  text:         string;
  image:        string | null;
  image_after?: string | null;
  challenge_slug?: string | null;
  likes:        number;
  comments:     number;
  created_at:   string;
  status?:      string;
  user_id?:     string | null;
};

type ComposeMode = 'story' | 'avant_apres';

const TYPE_STYLE: Record<PostType, { bg: string; text: string; label: string }> = {
  progres:      { bg: Colors.blush,      text: Colors.rose,   label: 'Progrès'      },
  question:     { bg: Colors.amberLight, text: '#B45309',     label: 'Question'     },
  astuce:       { bg: Colors.sageLight,  text: '#3A6B2A',     label: 'Astuce'       },
  avant_apres:  { bg: '#E8F4FD',        text: '#2563EB',     label: 'Avant / Après' },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60000);
  if (min < 1)     return "à l'instant";
  if (min < 60)    return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24)      return `${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1)     return 'hier';
  if (d < 7)       return `${d} j`;
  return new Date(iso).toLocaleDateString('fr-FR');
}

const MAX_POST_TEXT = 2000;

function CommunityPostImage({ image }: { image: string }) {
  const [uri, setUri] = useState<string | null>(null);
  const [loadingImg, setLoadingImg] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingImg(true);
    setUri(null);
    (async () => {
      const resolved = await getCommunityImageSignedUrl(image);
      if (cancelled) return;
      setUri(resolved);
      setLoadingImg(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [image]);

  if (loadingImg) {
    return (
      <View style={[S.postImage, S.postImageLoading]}>
        <ActivityIndicator color={Colors.rose} />
      </View>
    );
  }
  if (!uri) {
    return (
      <View style={S.imgPlaceholder}>
        <Text style={S.imgPlaceholderText}>photo indisponible</Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={S.postImage}
      contentFit="cover"
      transition={200}
    />
  );
}

function CommunityBeforeAfterImages({ before, after }: { before: string; after: string }) {
  return (
    <View style={S.beforeAfterRow}>
      <View style={S.beforeAfterCol}>
        <Text style={S.beforeAfterLabel}>Avant</Text>
        <CommunityPostImage image={before} />
      </View>
      <View style={S.beforeAfterCol}>
        <Text style={S.beforeAfterLabel}>Après</Text>
        <CommunityPostImage image={after} />
      </View>
    </View>
  );
}

const TIPS = [
  { e: '💬', title: 'Partage ton parcours',  tip: "Les posts avec photos Avant/Après génèrent le plus d'engagement et inspirent la communauté." },
  { e: '🤝', title: 'Sois bienveillante',    tip: "Encourage les autres membres — chaque commentaire positif booste leur motivation capillaire." },
  { e: '❓', title: 'Pose tes questions',     tip: "La communauté est là pour toi. N'hésite jamais à demander conseil sur tes soins ou coiffures." },
  { e: '🌟', title: 'Partage tes recettes',  tip: "Tes recettes maison peuvent aider d'autres femmes. Partage-les avec ingrédients et proportions." },
];

export default function CommunityScreen() {
  const router = useRouter();
  const { state } = useApp();
  const { session } = useAuth();
  const params = useLocalSearchParams<{ challenge?: string | string[] }>();
  const challengeParam = Array.isArray(params.challenge) ? params.challenge[0] : params.challenge;

  const [hydra, setHydra] = useState<HydraChallengeState>({
    joined: false,
    joinedAt: null,
    postDays: [],
  });
  const [posts, setPosts]         = useState<Post[]>([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [composeMode, setComposeMode] = useState<ComposeMode>('story');
  const [composeText, setComposeText]   = useState('');
  const [composeImageUri, setComposeImageUri] = useState<string | null>(null);
  const [composeImageAfterUri, setComposeImageAfterUri] = useState<string | null>(null);
  const [submitting, setSubmitting]     = useState(false);
  const [likedByMe, setLikedByMe] = useState<Record<string, true>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  const loadPosts = useCallback(() => {
    setLoading(true);
    supabase
      .from('community_posts')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setLoadError(error.message);
          setPosts([]);
        } else {
          setLoadError(null);
          const rows = (data ?? []) as Post[];
          const published = rows.filter(p => !p.status || p.status === 'published');
          setPosts(published);
          const counts: Record<string, number> = {};
          for (const p of published) counts[p.id] = Math.max(0, p.likes ?? 0);
          setLikeCounts(counts);
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    void loadHydraChallengeState().then(setHydra);
    if (session?.user?.id) {
      void fetchMyLikedPostIds().then(setLikedByMe);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (challengeParam !== 'hydra') return;
    void (async () => {
      const next = await joinHydraChallenge();
      setHydra(next);
      void trackProductEvent('challenge_joined', { challenge_slug: HYDRA_SLUG, source: 'highlight' });
      setComposeText('#HydraChallenge30 · ');
      setShowComposer(true);
    })();
  }, [challengeParam]);

  const sortedPosts = useMemo(() => {
    const copy = [...posts];
    copy.sort((a, b) => {
      const aInspo = (a.type === 'avant_apres' || !!a.image) ? 1 : 0;
      const bInspo = (b.type === 'avant_apres' || !!b.image) ? 1 : 0;
      if (aInspo !== bInspo) return bInspo - aInspo;
      return b.created_at.localeCompare(a.created_at);
    });
    return copy;
  }, [posts]);

  const stats = useMemo(
    () => [
      { v: posts.length > 0 ? String(posts.length) : '—', l: 'Posts publiés' },
      {
        v: hydra.joined ? String(hydra.postDays.length) : '—',
        l: 'Jours défi Hydra',
      },
      { v: hydra.joined ? `${hydra.postDays.length}/30` : '30j', l: 'Objectif défi' },
    ],
    [posts.length, hydra],
  );

  async function pickComposeImage(fromCamera: boolean, slot: 'before' | 'after' | 'single' = 'single') {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission', "Autorise l'accès à la caméra ou à la galerie pour ajouter une photo.");
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (!result.canceled && result.assets[0]?.uri) {
      const uri = result.assets[0].uri;
      if (slot === 'after') setComposeImageAfterUri(uri);
      else setComposeImageUri(uri);
    }
  }

  async function handleJoinHydra() {
    if (hydra.joined) {
      setComposeText('#HydraChallenge30 · ');
      setShowComposer(true);
      return;
    }
    const next = await joinHydraChallenge();
    setHydra(next);
    void trackProductEvent('challenge_joined', { challenge_slug: HYDRA_SLUG, source: 'community' });
    Alert.alert(
      'Tu es inscrite au défi 💧',
      'Publie ta progression (photo ou avant/après) avec le tag #HydraChallenge30.',
      [
        { text: 'Plus tard', style: 'cancel' },
        {
          text: 'Publier maintenant',
          onPress: () => {
            setComposeText('#HydraChallenge30 · ');
            setShowComposer(true);
          },
        },
      ],
    );
  }

  async function publishPost() {
    const uid = session?.user?.id;
    if (!uid) {
      Alert.alert('Connexion requise', 'Connecte-toi pour partager ta progression.');
      return;
    }
    const text = composeText.trim().slice(0, MAX_POST_TEXT);
    if (!text) {
      Alert.alert('Texte requis', 'Écris quelques mots sur ta progression.');
      return;
    }
    if (composeMode === 'avant_apres' && (!composeImageUri || !composeImageAfterUri)) {
      Alert.alert('Photos requises', 'Ajoute une photo Avant et une photo Après.');
      return;
    }
    setSubmitting(true);
    let imagePath: string | null = null;
    let imageAfterPath: string | null = null;
    let imageUploadHint: string | null = null;
    if (composeImageUri) {
      const up = await uploadCommunityPostImage(uid, composeImageUri);
      if (up.ok) imagePath = up.path;
      else imageUploadHint = up.error;
    }
    if (composeMode === 'avant_apres' && composeImageAfterUri) {
      const up2 = await uploadCommunityPostImage(uid, composeImageAfterUri);
      if (up2.ok) imageAfterPath = up2.path;
      else if (!imageUploadHint) imageUploadHint = up2.error;
    }
    const hadComposeImage = !!composeImageUri || !!composeImageAfterUri;
    const postType: PostType = composeMode === 'avant_apres' ? 'avant_apres' : 'progres';

    const baseRow: Record<string, unknown> = {
      author_name: state.profile.name?.trim() || 'Membre',
      user_id:     uid,
      verified:    false,
      type:        postType,
      text,
      image:       imagePath,
      likes:       0,
      comments:    0,
      status:      'published',
    };
    if (imageAfterPath) baseRow.image_after = imageAfterPath;
    if (hydra.joined || text.toLowerCase().includes('hydrachallenge')) {
      baseRow.challenge_slug = HYDRA_SLUG;
    }

    let { error } = await supabase.from('community_posts').insert(baseRow);
    if (error && imageAfterPath && /image_after|column/i.test(error.message)) {
      delete baseRow.image_after;
      ({ error } = await supabase.from('community_posts').insert(baseRow));
    }
    setSubmitting(false);
    if (error) {
      const fkUserId =
        /community_posts_user_id_fkey|foreign key constraint.*user_id/i.test(error.message);
      const needsMigration =
        !fkUserId &&
        (/schema cache|PGRST204|could not find.*user_id column/i.test(error.message) ||
          /column.*community_posts.*does not exist/i.test(error.message));
      const rls =
        /row-level security|violates row-level security/i.test(error.message);
      const statusChk = /community_posts_status_chk|check constraint.*status/i.test(error.message);
      let body = error.message;
      if (fkUserId) {
        body += `\n\nLa clé étrangère user_id ne pointe probablement pas vers auth.users (ex. profiles). Exécute « supabase/fix-community-posts-user-id-fk.sql » ou « supabase/fix-community-posts-rls-storage-only.sql » (section FK), puis réessaie.`;
      } else if (needsMigration) {
        body += `\n\nDans Supabase → SQL Editor, exécute « supabase/fix-user-measures-washday-community-premium.sql » (colonne user_id, trigger, policies).`;
      } else if (statusChk) {
        body += `\n\nLa base n’accepte pas encore status = « published ». Exécute « supabase/fix-community-posts-rls-storage-only.sql » (section contrainte status) ou le script complet fix-user-measures-washday-community-premium.sql, puis réessaie.`;
      } else if (rls) {
        body += `\n\nDans Supabase → SQL Editor, exécute « supabase/security-community-storage.sql » (RLS communauté + storage), puis réessaie.`;
      }
      Alert.alert('Publication', body);
      return;
    }
    setComposeText('');
    setComposeImageUri(null);
    setComposeImageAfterUri(null);
    setComposeMode('story');
    setShowComposer(false);
    if (hydra.joined || baseRow.challenge_slug) {
      const nextHydra = await recordHydraPostDay();
      setHydra(nextHydra);
    }
    void trackProductEvent('community_post_published', {
      post_type: postType,
      has_image: !!imagePath,
      has_before_after: !!imageAfterPath,
      challenge_slug: (baseRow.challenge_slug as string) ?? null,
    });
    loadPosts();
    if (hadComposeImage && !imagePath && imageUploadHint) {
      Alert.alert(
        'Photo',
        `Le post est en ligne sans image.\n\nDétail upload : ${imageUploadHint}\n\nExécute « supabase/security-community-storage.sql » dans Supabase si besoin.`,
      );
    }
  }

  return (
    <SafeAreaView style={S.safe} edges={['top']}>

      {/* ── Header ── */}
      <AppHeader title="Communauté" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.content}>

        {/* ── Stats ── */}
        <View style={S.statsCard}>
          {stats.map((s, i) => (
            <View key={i} style={[S.statCell, i < stats.length - 1 && S.statBorder]}>
              <Text style={S.statValue}>{s.v}</Text>
              <Text style={S.statLabel}>{s.l}</Text>
            </View>
          ))}
        </View>

        {/* ── Challenge banner ── */}
        <View style={S.challenge}>
          <Text style={S.challengeDecor}>🧴</Text>
          <View style={S.challengeTimerPill}>
            <Text style={S.challengeTimerText}>
              {hydra.joined
                ? `⏱ Jour ${hydraDayNumber(hydra.joinedAt)} · ${hydraDaysRemaining(hydra.joinedAt)} j restants`
                : '⏱ 30 jours · défi collectif'}
            </Text>
          </View>
          <Text style={S.challengeTitle}>#HydraChallenge30</Text>
          <Text style={S.challengeSub}>
            30 jours d&apos;hydratation profonde — publie ta progression (avant/après bienvenus).
          </Text>
          <View style={S.challengeMeta}>
            <Text style={S.challengeMetaText}>🏆 Défi communauté</Text>
            <Text style={S.challengeMetaText}>🔥 +{CHALLENGE_HYDRA_PTS_PER_DAY} {PTS_DEFI_LABEL}/jour</Text>
          </View>
          <View style={S.challengeBtnRow}>
            <TouchableOpacity
              style={[S.joinBtn, hydra.joined && S.joinBtnDone]}
              onPress={() => void handleJoinHydra()}
            >
              <Text style={S.joinBtnText}>
                {hydra.joined ? '✓ Inscrite · Publier' : 'Rejoindre le défi'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={S.rankBtn}
              onPress={() => router.push('/hydra-challenge' as any)}
            >
              <Text style={S.rankBtnText}>Classement</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Post input ── */}
        <TouchableOpacity
          style={S.postInput}
          activeOpacity={0.8}
          onPress={() => {
            setComposeText(hydra.joined ? '#HydraChallenge30 · ' : '');
            setComposeImageUri(null);
            setComposeImageAfterUri(null);
            setComposeMode('story');
            setShowComposer(true);
          }}
        >
          <View style={S.postAvatar}>
            <Text style={S.postAvatarLetter}>
              {(state.profile.name || '?')[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text style={S.postPlaceholder}>Partage ta progression…</Text>
          <View style={S.cameraBtn}>
            <Text style={{ fontSize: 18 }}>📷</Text>
          </View>
        </TouchableOpacity>

        {/* ── Fil communauté ── */}
        <Text style={S.secTitle}>Fil communauté</Text>

        {loading ? (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <ActivityIndicator color={Colors.amber} />
          </View>
        ) : loadError ? (
          <View style={S.emptyBox}>
            <EmptyAnimation emoji="⚠️" size={88} />
            <Text style={S.emptyText}>Connexion communauté : {loadError}</Text>
            <Text style={S.emptyHint}>
              Vérifie dans Supabase : table « community_posts », policies SELECT, et le script
              security-community-storage.sql pour la publication par les membres.
            </Text>
          </View>
        ) : posts.length === 0 ? (
          <View style={S.emptyBox}>
            <EmptyAnimation emoji="💬" size={88} />
            <Text style={S.emptyText}>Aucun post publié pour le moment.</Text>
          </View>
        ) : (
          sortedPosts.map(p => {
            const t = TYPE_STYLE[(p.type as PostType)] ?? TYPE_STYLE.astuce;
            const initial = (p.author_name || '?')[0]?.toUpperCase() ?? '?';
            const liked = !!likedByMe[p.id];
            const likeCount = likeCounts[p.id] ?? Math.max(0, p.likes ?? 0);
            return (
              <View key={p.id} style={S.postCard}>
                <View style={S.postHeader}>
                  <View style={S.avatar}>
                    <Text style={S.avatarLetter}>{initial}</Text>
                  </View>
                  <View style={S.authorInfo}>
                    <View style={S.authorNameRow}>
                      <Text style={S.authorName}>{p.author_name}</Text>
                      {p.verified && <Text style={S.checkmark}> ✓</Text>}
                      <Text style={S.postTime}> · {relativeTime(p.created_at)}</Text>
                    </View>
                  </View>
                  <View style={[S.typeBadge, { backgroundColor: t.bg }]}>
                    <Text style={[S.typeBadgeText, { color: t.text }]}>{t.label}</Text>
                  </View>
                </View>

                <Text style={S.postText}>{p.text}</Text>

                {p.type === 'avant_apres' && p.image && p.image_after ? (
                  <CommunityBeforeAfterImages before={p.image} after={p.image_after} />
                ) : p.image ? (
                  <CommunityPostImage image={p.image} />
                ) : null}

                {p.challenge_slug === HYDRA_SLUG ? (
                  <Text style={S.challengeTag}>#HydraChallenge30</Text>
                ) : null}

                <View style={S.postActions}>
                  <TouchableOpacity
                    style={S.actionBtn}
                    onPress={() => {
                      if (!session?.user?.id) {
                        Alert.alert('Connexion requise', 'Connecte-toi pour liker un post.');
                        return;
                      }
                      void toggleCommunityPostLike(p.id, likeCount).then(result => {
                        setLikedByMe(prev => {
                          const next = { ...prev };
                          if (result.liked) next[p.id] = true;
                          else delete next[p.id];
                          return next;
                        });
                        setLikeCounts(prev => ({ ...prev, [p.id]: result.likesCount }));
                      });
                    }}
                  >
                    <Text style={S.actionText}>{liked ? '❤️' : '🤍'} {likeCount}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={S.actionBtn}>
                    <Text style={S.actionText}>💬 {p.comments}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[S.actionBtn, { marginLeft: 'auto' as any }]}
                    onPress={() => {
                      void Share.share({
                        message: `${p.author_name} sur Coton Noir :\n${p.text}\n\nRejoins la communauté capillaire !`,
                      });
                    }}
                  >
                    <Text style={S.actionText}>↗</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        {/* ── Tips ── */}
        <Text style={S.secTitle}>Conseils communauté</Text>
        {TIPS.map((tip, i) => (
          <View key={i} style={S.tipCard}>
            <Text style={S.tipEmoji}>{tip.e}</Text>
            <View style={{ flex: 1 }}>
              <Text style={S.tipTitle}>{tip.title}</Text>
              <Text style={S.tipText}>{tip.tip}</Text>
            </View>
          </View>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>

      <Modal visible={showComposer} animationType="slide" transparent onRequestClose={() => setShowComposer(false)}>
        <KeyboardAvoidingView
          style={S.composerOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity style={S.composerBackdrop} activeOpacity={1} onPress={() => !submitting && setShowComposer(false)} />
          <View style={S.composerSheet}>
            <View style={S.composerHeader}>
              <Text style={S.composerTitle}>Partager ta progression</Text>
              <TouchableOpacity onPress={() => !submitting && setShowComposer(false)} hitSlop={12}>
                <Ionicons name="close" size={22} color={Colors.ink} />
              </TouchableOpacity>
            </View>
            <View style={S.composeModeRow}>
              <TouchableOpacity
                style={[S.composeModePill, composeMode === 'story' && S.composeModePillOn]}
                onPress={() => setComposeMode('story')}
                disabled={submitting}
              >
                <Text style={[S.composeModeText, composeMode === 'story' && S.composeModeTextOn]}>Progression</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[S.composeModePill, composeMode === 'avant_apres' && S.composeModePillOn]}
                onPress={() => setComposeMode('avant_apres')}
                disabled={submitting}
              >
                <Text style={[S.composeModeText, composeMode === 'avant_apres' && S.composeModeTextOn]}>Avant / Après</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={S.composerInput}
              placeholder={
                composeMode === 'avant_apres'
                  ? 'Raconte ta transformation (routine, produits, délai)…'
                  : 'Raconte ta routine, tes mesures, ton mood capillaire…'
              }
              placeholderTextColor={Colors.warmGray}
              value={composeText}
              onChangeText={setComposeText}
              multiline
              textAlignVertical="top"
              editable={!submitting}
            />
            {composeMode === 'avant_apres' ? (
              <View style={S.dualPhotoRow}>
                {composeImageUri ? (
                  <View style={S.composePreviewWrap}>
                    <Text style={S.beforeAfterLabel}>Avant</Text>
                    <Image source={{ uri: composeImageUri }} style={S.composePreview} contentFit="cover" />
                    <TouchableOpacity style={S.composeRemovePhoto} onPress={() => setComposeImageUri(null)} disabled={submitting}>
                      <Ionicons name="close-circle" size={28} color={Colors.ink} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={S.addPhotoBox} onPress={() => pickComposeImage(false, 'before')} disabled={submitting}>
                    <Text style={S.addPhotoText}>+ Avant</Text>
                  </TouchableOpacity>
                )}
                {composeImageAfterUri ? (
                  <View style={S.composePreviewWrap}>
                    <Text style={S.beforeAfterLabel}>Après</Text>
                    <Image source={{ uri: composeImageAfterUri }} style={S.composePreview} contentFit="cover" />
                    <TouchableOpacity style={S.composeRemovePhoto} onPress={() => setComposeImageAfterUri(null)} disabled={submitting}>
                      <Ionicons name="close-circle" size={28} color={Colors.ink} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={S.addPhotoBox} onPress={() => pickComposeImage(false, 'after')} disabled={submitting}>
                    <Text style={S.addPhotoText}>+ Après</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : composeImageUri ? (
              <View style={S.composePreviewWrap}>
                <Image source={{ uri: composeImageUri }} style={S.composePreview} contentFit="cover" />
                <TouchableOpacity style={S.composeRemovePhoto} onPress={() => setComposeImageUri(null)} disabled={submitting}>
                  <Ionicons name="close-circle" size={28} color={Colors.ink} />
                </TouchableOpacity>
              </View>
            ) : null}
            <View style={S.composerActions}>
              {composeMode === 'story' ? (
                <>
                  <TouchableOpacity style={S.composerIconBtn} onPress={() => pickComposeImage(true)} disabled={submitting}>
                    <Ionicons name="camera-outline" size={22} color={Colors.ink} />
                  </TouchableOpacity>
                  <TouchableOpacity style={S.composerIconBtn} onPress={() => pickComposeImage(false)} disabled={submitting}>
                    <Ionicons name="images-outline" size={22} color={Colors.ink} />
                  </TouchableOpacity>
                </>
              ) : null}
              <TouchableOpacity
                style={[S.composerPublish, submitting && { opacity: 0.6 }]}
                onPress={publishPost}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={S.composerPublishText}>Publier</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 16 },

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
  headerTitle: { flex: 1, fontSize: 20, fontFamily: 'Poppins_700Bold', color: Colors.ink },
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

  // ── Stats ──
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.cream,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    overflow: 'hidden',
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  statBorder: {
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  statValue: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: Colors.ink },
  statLabel: { fontSize: 10, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 2 },

  // ── Challenge ──
  challenge: {
    backgroundColor: Colors.ink,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  challengeDecor: {
    position: 'absolute',
    right: -10,
    top: -20,
    fontSize: 90,
    opacity: 0.08,
  },
  challengeTimerPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.amberLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  challengeTimerText: { fontSize: 10, fontFamily: 'DMSans_600SemiBold', color: Colors.amber },
  challengeTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
    marginBottom: 6,
  },
  challengeSub: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 18,
  },
  challengeMeta: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 12,
    marginBottom: 14,
  },
  challengeMetaText: {
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    color: 'rgba(255,255,255,0.7)',
  },
  challengeBtnRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  joinBtn: {
    backgroundColor: Colors.amber,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  joinBtnDone: { backgroundColor: Colors.sage },
  joinBtnText: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  rankBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  rankBtnText: { fontSize: 14, fontFamily: 'DMSans_600SemiBold', color: '#fff' },

  // ── Post input ──
  postInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    gap: 10,
    marginBottom: 20,
  },
  postAvatar: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAvatarLetter: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.amber },
  postPlaceholder:  { flex: 1, fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
  cameraBtn: {
    width: 32, height: 32,
    borderRadius: 8,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },

  postImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: Colors.cream,
  },
  postImageLoading: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  composerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  composerBackdrop: {
    flex: 1,
  },
  composerSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  composerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  composerTitle: { fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: Colors.ink },
  composerInput: {
    minHeight: 120,
              maxLength: MAX_POST_TEXT,
              maxHeight: 220,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: Colors.ink,
    marginBottom: 12,
  },
  composePreviewWrap: {
    alignSelf: 'stretch',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  composePreview: { width: '100%', height: 160, backgroundColor: Colors.cream },
  composeRemovePhoto: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 999,
  },
  composerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  composerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cream,
  },
  composerPublish: {
    marginLeft: 'auto' as any,
    backgroundColor: Colors.ink,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 120,
    alignItems: 'center',
  },
  composerPublishText: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
  },

  // ── Section title ──
  secTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.ink,
    marginBottom: 12,
  },

  // ── Post cards ──
  postCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: Colors.blush,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarLetter: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.rose },
  authorInfo:   { flex: 1 },
  authorNameRow: { flexDirection: 'row', alignItems: 'center' },
  authorName: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },
  checkmark:  { fontSize: 11, color: Colors.rose },
  postTime:   { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
  typeBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeBadgeText: { fontSize: 10, fontFamily: 'DMSans_600SemiBold' },

  postText: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.ink,
    lineHeight: 21,
    marginBottom: 10,
  },

  imgPlaceholder: {
    aspectRatio: 4 / 3,
    backgroundColor: Colors.cream,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  imgPlaceholderText: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },

  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionBtn:  {},
  actionText: { fontSize: 12, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },

  // ── Empty / Error state ──
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    backgroundColor: Colors.cream,
    borderRadius: 14,
    marginBottom: 16,
  },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  emptyText:  {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    color: Colors.ink,
    textAlign: 'center',
  },
  emptyHint:  {
    marginTop: 8,
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 17,
  },

  // ── Tips ──
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.cream,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  tipEmoji: { fontSize: 22 },
  tipTitle: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 17,
  },

  beforeAfterRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  beforeAfterCol: { flex: 1 },
  beforeAfterLabel: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    color: Colors.warmGray,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  challengeTag: {
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amberDark,
    marginBottom: 8,
  },
  composeModeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  composeModePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.cream,
  },
  composeModePillOn: { borderColor: Colors.rose, backgroundColor: Colors.blush },
  composeModeText: { fontSize: 12, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },
  composeModeTextOn: { fontFamily: 'DMSans_700Bold', color: Colors.rose },
  dualPhotoRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  addPhotoBox: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cream,
  },
  addPhotoText: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.warmGray },
});
