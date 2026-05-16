import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

type PostType = 'progres' | 'question' | 'astuce';

type Post = {
  id:           string;
  author_name:  string;
  verified:     boolean;
  type:         PostType | string;
  text:         string;
  image:        string | null;
  likes:        number;
  comments:     number;
  created_at:   string;
  /** absent sur anciennes lignes : traité comme publié */
  status?:      string;
  user_id?:     string | null;
};

const STATS = [
  { v: '12.4k', l: 'Membres'        },
  { v: '847',   l: 'Posts ce mois'  },
  { v: '94%',   l: 'Réponses < 24h' },
];

const TYPE_STYLE: Record<PostType, { bg: string; text: string; label: string }> = {
  progres:  { bg: Colors.blush,      text: Colors.rose,   label: 'Progrès'  },
  question: { bg: Colors.amberLight, text: '#B45309',     label: 'Question' },
  astuce:   { bg: Colors.sageLight,  text: '#3A6B2A',     label: 'Astuce'   },
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

const TIPS = [
  { e: '💬', title: 'Partage ton parcours',  tip: "Les posts avec photos Avant/Après génèrent le plus d'engagement et inspirent la communauté." },
  { e: '🤝', title: 'Sois bienveillante',    tip: "Encourage les autres membres — chaque commentaire positif booste leur motivation capillaire." },
  { e: '❓', title: 'Pose tes questions',     tip: "La communauté est là pour toi. N'hésite jamais à demander conseil sur tes soins ou coiffures." },
  { e: '🌟', title: 'Partage tes recettes',  tip: "Tes recettes maison peuvent aider d'autres femmes. Partage-les avec ingrédients et proportions." },
];

export default function CommunityScreen() {
  const { state } = useApp();
  const { session } = useAuth();
  const [joined, setJoined] = useState(false);
  const [posts, setPosts]         = useState<Post[]>([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [composeText, setComposeText]   = useState('');
  const [composeImageUri, setComposeImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting]     = useState(false);

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
          setPosts(rows.filter(p => !p.status || p.status === 'published'));
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  async function pickComposeImage(fromCamera: boolean) {
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
    if (!result.canceled && result.assets[0]?.uri) setComposeImageUri(result.assets[0].uri);
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
    setSubmitting(true);
    let imagePath: string | null = null;
    let imageUploadHint: string | null = null;
    if (composeImageUri) {
      const up = await uploadCommunityPostImage(uid, composeImageUri);
      if (up.ok) {
        imagePath = up.path;
      } else {
        imageUploadHint = up.error;
      }
    }
    const hadComposeImage = !!composeImageUri;
    // user_id : idem que auth.uid() ; la FK doit référencer auth.users (script fix-community-posts-user-id-fk.sql).
    const { error } = await supabase.from('community_posts').insert({
      author_name: state.profile.name?.trim() || 'Membre',
      user_id:     uid,
      verified:    false,
      type:        'progres',
      text,
      image:       imagePath,
      likes:       0,
      comments:    0,
      status:      'published',
    });
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
    setShowComposer(false);
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
          {STATS.map((s, i) => (
            <View key={i} style={[S.statCell, i < STATS.length - 1 && S.statBorder]}>
              <Text style={S.statValue}>{s.v}</Text>
              <Text style={S.statLabel}>{s.l}</Text>
            </View>
          ))}
        </View>

        {/* ── Challenge banner ── */}
        <View style={S.challenge}>
          <Text style={S.challengeDecor}>🧴</Text>
          <View style={S.challengeTimerPill}>
            <Text style={S.challengeTimerText}>⏱ 6 jours restants</Text>
          </View>
          <Text style={S.challengeTitle}>#HydraChallenge30</Text>
          <Text style={S.challengeSub}>
            30 jours d'hydratation profonde, post quotidien et photo finale.
          </Text>
          <View style={S.challengeMeta}>
            <Text style={S.challengeMetaText}>🏆 1.2k participants</Text>
            <Text style={S.challengeMetaText}>🔥 +{CHALLENGE_HYDRA_PTS_PER_DAY} {PTS_DEFI_LABEL}/jour</Text>
          </View>
          <TouchableOpacity
            style={[S.joinBtn, joined && S.joinBtnDone]}
            onPress={() => setJoined(j => !j)}
          >
            <Text style={S.joinBtnText}>{joined ? '✓ Tu as rejoint' : 'Rejoindre'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Post input ── */}
        <TouchableOpacity
          style={S.postInput}
          activeOpacity={0.8}
          onPress={() => {
            setComposeText('');
            setComposeImageUri(null);
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
          posts.map(p => {
            const t = TYPE_STYLE[(p.type as PostType)] ?? TYPE_STYLE.astuce;
            const initial = (p.author_name || '?')[0]?.toUpperCase() ?? '?';
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

                {p.image ? <CommunityPostImage image={p.image} /> : null}

                <View style={S.postActions}>
                  <TouchableOpacity style={S.actionBtn}>
                    <Text style={S.actionText}>❤️ {p.likes}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={S.actionBtn}>
                    <Text style={S.actionText}>💬 {p.comments}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[S.actionBtn, { marginLeft: 'auto' as any }]}>
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
            <TextInput
              style={S.composerInput}
              placeholder="Raconte ta routine, tes mesures, ton mood capillaire…"
              placeholderTextColor={Colors.warmGray}
              value={composeText}
              onChangeText={setComposeText}
              multiline
              textAlignVertical="top"
              editable={!submitting}
            />
            {composeImageUri ? (
              <View style={S.composePreviewWrap}>
                <Image source={{ uri: composeImageUri }} style={S.composePreview} contentFit="cover" />
                <TouchableOpacity style={S.composeRemovePhoto} onPress={() => setComposeImageUri(null)} disabled={submitting}>
                  <Ionicons name="close-circle" size={28} color={Colors.ink} />
                </TouchableOpacity>
              </View>
            ) : null}
            <View style={S.composerActions}>
              <TouchableOpacity style={S.composerIconBtn} onPress={() => pickComposeImage(true)} disabled={submitting}>
                <Ionicons name="camera-outline" size={22} color={Colors.ink} />
              </TouchableOpacity>
              <TouchableOpacity style={S.composerIconBtn} onPress={() => pickComposeImage(false)} disabled={submitting}>
                <Ionicons name="images-outline" size={22} color={Colors.ink} />
              </TouchableOpacity>
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
  joinBtn: {
    backgroundColor: Colors.amber,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'flex-start',
  },
  joinBtnDone: { backgroundColor: Colors.sage },
  joinBtnText: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.ink },

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
});
