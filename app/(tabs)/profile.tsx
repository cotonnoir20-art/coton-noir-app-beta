import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BackButton } from '../../src/components/BackButton';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../src/theme/colors';
import { useApp } from '../../src/context/AppContext';
import { scheduleRoutineReminder } from '../../src/lib/routineReminder';
import { getProfileCompletion } from '../../src/lib/profileCompleteness';
import { ProfileCompletionCard } from '../../src/components/profile/ProfileCompletionCard';
import { RoutineReminderSettings } from '../../src/components/profile/RoutineReminderSettings';
import { loadUserPrefs, saveUserPrefs } from '../../src/lib/userPrefs';
import { useAuth } from '../../src/context/AuthContext';
import { useBlackCotton } from '../../src/components/blackCotton';
import { CoinIcon } from '../../src/components/CoinIcon';
import { getCurrentLevel, getLevelProgress, getNextLevel } from '../../src/data/levels';
import { displayObjective } from '../../src/constants/hairObjectives';
import { formatProfileLengthDisplay } from '../../src/constants/hairLengthLandmarks';
import { useAchievements } from '../../src/context/AchievementsContext';
import { mapSupabaseAuthError, validatePassword } from '../../src/lib/passwordPolicy';
import { openSafeMailto } from '../../src/lib/safeLinking';

const AVATAR_EMOJIS = ['👩🏾‍🦱', '👩🏿‍🦱', '👩🏽‍🦱', '🌸', '🌿', '🦋', '🌺', '✨', '🌙', '💎', '🪄', '🔥'];
const AVATAR_COLORS = ['#B45309', '#4C1D95', '#1A4731', '#3D2B1F', '#164E63', '#831843', '#374151', '#3B0764'];

const PREOCCUPATION_STYLE: Record<string, { color: string; text: string }> = {
  Sécheresse: { color: Colors.blush, text: Colors.rose },
  Casse: { color: Colors.cream, text: Colors.warmGray },
  Pellicules: { color: Colors.sageLight, text: Colors.sage },
  Frisottis: { color: Colors.amberLight, text: Colors.amberDark },
  'Cheveux fins': { color: Colors.sageLight, text: Colors.sage },
  'Cheveux gras': { color: Colors.cream, text: Colors.warmGray },
  'Manque de brillance': { color: Colors.amberLight, text: Colors.amberDark },
  'Nœuds fréquents': { color: Colors.blush, text: Colors.rose },
  'Pousse lente': { color: Colors.sageLight, text: Colors.sage },
  'Dommages chaleur': { color: Colors.amberLight, text: Colors.amberDark },
  'Dommages chimiques': { color: Colors.blush, text: Colors.rose },
  'Nœuds': { color: Colors.blush, text: Colors.rose },
  Fourches: { color: Colors.blush, text: Colors.rose },
  Rétraction: { color: Colors.amberLight, text: Colors.amberDark },
};

const CONSEILS = [
  { icon: '🧡', title: 'Profil à jour',      desc: 'Un profil complet = des recommandations plus précises. Mets-le à jour après chaque changement capillaire.' },
  { icon: '🔬', title: 'Teste ta porosité',  desc: "Plonge un cheveu propre dans un verre d'eau. Il coule = porosité élevée. Il flotte = faible." },
];

const PROTECTIVE_STYLES = [
  { id: 'braids',      emoji: '🧶', label: 'Tresses / Box braids' },
  { id: 'extensions',  emoji: '💇', label: 'Extensions / Vanilles' },
  { id: 'locks',       emoji: '🌿', label: 'Locks / Dreadlocks'    },
  { id: 'weave',       emoji: '👑', label: 'Tissage / Weave'       },
  { id: 'twists',      emoji: '🌀', label: 'Twists'                },
  { id: 'autre',       emoji: '🎀', label: 'Autre coiffure'        },
];

const ABOUT_FEATURES = [
  { icon: '🔬', title: 'Black Cotton',     desc: 'Analyse photo de tes cheveux et recommandations personnalisées' },
  { icon: '📅', title: 'Suivi & Routines', desc: 'Planifie tes wash days et suis tes soins au quotidien' },
  { icon: '📈', title: 'Progression',      desc: "Visualise l'évolution de tes cheveux mois après mois" },
  { icon: '🏆', title: 'Récompenses',      desc: 'Gagne des CotonCoins et échange-les contre des avantages' },
  { icon: '🤝', title: 'Partenaires',      desc: 'Profite de réductions exclusives chez nos partenaires' },
  { icon: '👩‍💼', title: 'Experts',         desc: 'Consultations avec des coiffeuses spécialisées cheveux naturels' },
];

const MONTHS_SHORT = [
  'janv.', 'févr.', 'mars', 'avril', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

function formatMemberSince(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

function formatBadgeDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { state, flushProfileSync } = useApp();
  const { coins, streak, profile, coinHistory, memberSince } = state;
  const { signOut, session } = useAuth();
  const { fire } = useBlackCotton();
  const { achievements, unlockedCount, totalCount } = useAchievements();
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [avatarEmoji, setAvatarEmoji]     = useState('👩🏾‍🦱');
  const [avatarBg, setAvatarBg]           = useState('#3A1A0A');
  const [avatarPhoto, setAvatarPhoto]     = useState<string | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [tempEmoji, setTempEmoji]         = useState('👩🏾‍🦱');
  const [tempBg, setTempBg]               = useState('#3A1A0A');
  // Guard pour ne pas écraser les prefs (notamment celles d'un compte démo)
  // avec les valeurs par défaut avant que le getItem initial soit revenu.
  const [prefsLoaded, setPrefsLoaded]     = useState(false);

  async function pickFromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled) { setAvatarPhoto(result.assets[0].uri); setShowAvatarModal(false); }
  }

  async function takePhoto() {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled) { setAvatarPhoto(result.assets[0].uri); setShowAvatarModal(false); }
  }

  function openAvatarModal() {
    setTempEmoji(avatarEmoji);
    setTempBg(avatarBg);
    setShowAvatarModal(true);
  }

  function confirmAvatar() {
    setAvatarEmoji(tempEmoji);
    setAvatarBg(tempBg);
    setAvatarPhoto(null);
    setShowAvatarModal(false);
  }
  const [isProtective, setIsProtective]         = useState(false);
  const [protectiveType, setProtectiveType]     = useState('');
  const [showProtectiveModal, setShowProtectiveModal] = useState(false);
  const [rappelHour, setRappelHour]     = useState(21);
  const [rappelMin, setRappelMin]       = useState(0);
  const [rappelRoutine, setRappelRoutine] = useState<'daily' | 'night'>('night');
  const [langue, setLangue]             = useState<'fr' | 'en'>('fr');
  const [showLangue, setShowLangue]     = useState(false);

  // ── Email / Password ──
  const [showEmailModal,    setShowEmailModal]    = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newEmail,          setNewEmail]          = useState('');
  const [currentPassword,   setCurrentPassword]   = useState('');
  const [newPassword,       setNewPassword]       = useState('');
  const [confirmPassword,   setConfirmPassword]   = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const [authLoading,       setAuthLoading]       = useState(false);
  const [authError,         setAuthError]         = useState('');

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(res => setTimeout(res, 600));
    setRefreshing(false);
  }, []);

  async function changeEmail() {
    if (!newEmail.trim() || !/\S+@\S+\.\S+/.test(newEmail)) {
      setAuthError('Adresse email invalide'); return;
    }
    setAuthLoading(true); setAuthError('');
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setAuthLoading(false);
    if (error) { setAuthError(error.message); }
    else {
      Alert.alert('Email modifié', 'Un lien de confirmation a été envoyé à la nouvelle adresse.');
      setShowEmailModal(false); setNewEmail('');
    }
  }

  async function changePassword() {
    if (!currentPassword) { setAuthError('Entre ton mot de passe actuel'); return; }
    const pwdCheck = validatePassword(newPassword);
    if (!pwdCheck.ok) { setAuthError(pwdCheck.message); return; }
    if (newPassword !== confirmPassword) { setAuthError('Les mots de passe ne correspondent pas'); return; }
    setAuthLoading(true); setAuthError('');
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: session?.user?.email ?? '', password: currentPassword,
    });
    if (signInErr) { setAuthLoading(false); setAuthError('Mot de passe actuel incorrect'); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setAuthLoading(false);
    if (error) { setAuthError(mapSupabaseAuthError(error.message)); }
    else {
      Alert.alert('Succès', 'Ton mot de passe a été mis à jour.');
      setShowPasswordModal(false);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    }
  }

  const profileCompletion = useMemo(() => getProfileCompletion(profile), [profile]);

  const userPreoccupations = profile.problematics?.length
    ? profile.problematics
    : [];

  const applyPrefs = useCallback((p: Awaited<ReturnType<typeof loadUserPrefs>>) => {
    if (p.avatarEmoji) setAvatarEmoji(p.avatarEmoji);
    if (p.avatarBg) setAvatarBg(p.avatarBg);
    if (p.avatarPhoto) setAvatarPhoto(p.avatarPhoto);
    if (p.isProtective !== undefined) setIsProtective(p.isProtective);
    if (p.protectiveType) setProtectiveType(p.protectiveType);
    if (p.rappelHour !== undefined) setRappelHour(p.rappelHour);
    if (p.rappelMin !== undefined) setRappelMin(p.rappelMin);
    if (p.rappelRoutine === 'daily' || p.rappelRoutine === 'night') {
      setRappelRoutine(p.rappelRoutine);
    }
    if (p.notifEnabled !== undefined) setNotifEnabled(p.notifEnabled);
    if (p.langue === 'en' || p.langue === 'fr') setLangue(p.langue);
  }, []);

  useEffect(() => {
    void loadUserPrefs().then(p => {
      applyPrefs(p);
      setPrefsLoaded(true);
    });
  }, [applyPrefs, session?.user?.id]);

  const handleSignOut = useCallback(async () => {
    if (signingOut) return;
    setSigningOut(true);
    // Sync best-effort — on ne bloque jamais la déconnexion sur un échec réseau
    await flushProfileSync().catch(() => {});
    const result = await signOut();
    if (!result.ok) {
      Alert.alert("Déconnexion impossible", result.error);
      setSigningOut(false);
    }
    // Pas de router.replace : le guard _layout.tsx redirige automatiquement
    // vers /(auth)/welcome quand la session devient null.
  }, [flushProfileSync, signOut, signingOut]);

  useFocusEffect(
    useCallback(() => {
      if (!prefsLoaded) return;
      void loadUserPrefs().then(applyPrefs);
    }, [prefsLoaded, applyPrefs]),
  );

  useEffect(() => {
    if (!prefsLoaded) return;
    void (async () => {
      const payload = {
        avatarEmoji,
        avatarBg,
        avatarPhoto,
        isProtective,
        protectiveType,
        rappelHour,
        rappelMin,
        rappelRoutine,
        notifEnabled,
        langue,
      };
      await saveUserPrefs(payload);
      await scheduleRoutineReminder(payload);
    })();
  }, [
    prefsLoaded,
    avatarEmoji,
    avatarBg,
    avatarPhoto,
    isProtective,
    protectiveType,
    rappelHour,
    rappelMin,
    rappelRoutine,
    notifEnabled,
    langue,
  ]);

  function handleDeleteAccount() {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Écris-nous à support@coton-noir.com avec l’email de ton compte pour demander la suppression de tes données.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Contacter le support',
          onPress: () => openSafeMailto('support@coton-noir.com?subject=Suppression%20compte%20Coton%20Noir'),
        },
      ],
    );
  }

  const { totalEarned } = state;
  const level     = getCurrentLevel(totalEarned);
  const nextLevel = getNextLevel(totalEarned);
  const progress  = getLevelProgress(totalEarned);

  const recentHistory = coinHistory.slice(0, 3);

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={S.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.amber}
            colors={[Colors.amber]}
          />
        }
      >

        {/* ── Header ── */}
        <View style={S.header}>
          <BackButton onPress={() => router.back()} style={S.backBtn} />
          <Text style={S.headerTitle}>Profil</Text>
          <TouchableOpacity style={S.coinsBadge} onPress={() => router.push('/rewards')}>
            <CoinIcon size={16} />
            <Text style={S.coinsText}>{coins}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Avatar ── */}
        <View style={S.avatarSection}>
          <TouchableOpacity onPress={openAvatarModal} style={S.avatarWrap}>
            <View style={[S.avatarCircle, { backgroundColor: avatarBg }]}>
              {avatarPhoto
                ? <Image source={{ uri: avatarPhoto }} style={S.avatarPhoto} />
                : <Text style={S.avatarEmoji}>{avatarEmoji}</Text>
              }
            </View>
            <View style={S.avatarEditBadge}>
              <Ionicons name="pencil" size={11} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={S.userName}>{profile.name}</Text>
          <Text style={S.memberSince}>
            Membre depuis {formatMemberSince(memberSince ?? session?.user?.created_at)}
          </Text>
        </View>

        {/* ── Level card ── */}
        <LinearGradient
          colors={[level.color, Colors.ink]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={S.levelCard}
        >
          <View style={S.levelTop}>
            <View style={S.levelLeft}>
              <Text style={S.levelBadge}>NIVEAU {level.id}</Text>
              <View style={S.levelNameRow}>
                <View style={[S.levelIconBox, { backgroundColor: level.color + '33' }]}>
                  <Text style={S.levelIconEmoji}>{level.emoji}</Text>
                </View>
                <Text style={S.levelName}>{level.name}</Text>
              </View>
            </View>
            <TouchableOpacity style={S.levelBtn} onPress={() => router.push('/rewards')}>
              <Text style={S.levelBtnText}>Voir les niveaux →</Text>
            </TouchableOpacity>
          </View>

          {/* Progress bar */}
          <View style={S.progressBg}>
            <View style={[S.progressFill, { width: `${progress}%`, backgroundColor: level.color }]} />
          </View>

          <View style={S.levelFooter}>
            <Text style={S.levelCC}>{totalEarned} pts cumulés</Text>
            {nextLevel && (
              <Text style={S.levelNext}>
                Prochain : {nextLevel.name} à {nextLevel.min} pts · {progress}%
              </Text>
            )}
          </View>
        </LinearGradient>

        {/* ── CotonCoins card ── */}
        <View style={S.coinsCard}>
          <View style={S.coinsTop}>
            <View>
              <Text style={S.coinsBalance}>{coins}</Text>
              <Text style={S.coinsLabel}>CotonCoins disponibles</Text>
            </View>
            <TouchableOpacity style={S.exchangeBtn} onPress={() => router.push('/rewards')}>
              <Text style={S.exchangeBtnText}>Échanger</Text>
            </TouchableOpacity>
          </View>

          {recentHistory.length === 0 ? (
            <Text style={S.emptyHistory}>Aucune transaction pour l'instant</Text>
          ) : (
            recentHistory.map((entry, i) => (
              <View key={entry.id} style={[S.historyRow, i > 0 && S.historyBorder]}>
                <View style={S.historyIconBox}>
                  <CoinIcon size={20} />
                </View>
                <View style={S.historyInfo}>
                  <Text style={S.historyLabel}>{entry.label}</Text>
                  <Text style={S.historyDate}>{entry.date}</Text>
                </View>
                <Text style={entry.amount > 0 ? S.amountPos : S.amountNeg}>
                  {entry.amount > 0 ? '+' : ''}{entry.amount} CC
                </Text>
              </View>
            ))
          )}
        </View>

        <ProfileCompletionCard
          completion={profileCompletion}
          onPress={() => router.push('/hair-profile')}
        />

        {/* ── Profil capillaire ── */}
        <View style={S.sectionHeader}>
          <Text style={S.secTitle}>Affiner le profil capillaire</Text>
          <TouchableOpacity style={S.modifierBtn} onPress={() => router.push('/hair-profile')}>
            <Ionicons name="pencil-outline" size={13} color={Colors.amber} />
            <Text style={S.modifierText}>Modifier</Text>
          </TouchableOpacity>
        </View>

        <View style={S.hairCard}>
          {[
            { label: 'Type de cheveux', value: profile.hairType, pill: true  },
            { label: 'Porosité',        value: profile.porosity, pill: false  },
            { label: 'Densité',         value: profile.density,  pill: false  },
            { label: 'Longueur actuelle',  value: formatProfileLengthDisplay(profile.length), pill: false },
            { label: 'Longueur souhaitée', value: formatProfileLengthDisplay(profile.targetLength), pill: false },
            { label: 'Objectif',        value: displayObjective(profile.objective), pill: false  },
          ].map((row, i) => (
            <View key={i} style={[S.hairRow, i > 0 && S.hairBorder]}>
              <Text style={S.hairLabel}>{row.label}</Text>
              {row.pill ? (
                <View style={S.hairTypePill}>
                  <Text style={S.hairTypePillText}>{row.value}</Text>
                </View>
              ) : (
                <Text style={S.hairValue}>{row.value}</Text>
              )}
            </View>
          ))}
        </View>

        {/* ── Mode coiffure protectrice ── */}
        {isProtective ? (
          <TouchableOpacity style={S.protectiveCardActive} onPress={() => setShowProtectiveModal(true)}>
            <View style={S.protectiveActiveLeft}>
              <Text style={S.protectiveActiveBadge}>MODE ACTIF</Text>
              <Text style={S.protectiveActiveTitle}>
                {PROTECTIVE_STYLES.find(p => p.id === protectiveType)?.emoji ?? '🛡️'}{' '}
                {PROTECTIVE_STYLES.find(p => p.id === protectiveType)?.label ?? 'Coiffure protectrice'}
              </Text>
              <Text style={S.protectiveActiveSub}>Routine & conseils adaptés · Touche pour modifier</Text>
            </View>
            <TouchableOpacity
              style={S.protectiveDeactivateBtn}
              onPress={() => { setIsProtective(false); setProtectiveType(''); }}
            >
              <Text style={S.protectiveDeactivateText}>Désactiver</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={S.protectiveCard} onPress={() => setShowProtectiveModal(true)}>
            <View style={S.protectiveIconBox}>
              <Text style={{ fontSize: 22 }}>🛡️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.protectiveTitle}>Mode coiffure protectrice</Text>
              <Text style={S.protectiveSub}>Tresses, extensions, locks, tissage…</Text>
            </View>
            <View style={S.protectiveToggle}>
              <Text style={S.protectiveToggleText}>Activer</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ── Préoccupations (profil capillaire) ── */}
        <Text style={S.secTitle}>Préoccupations</Text>
        <View style={S.preoccRow}>
          {userPreoccupations.map(label => {
            const style = PREOCCUPATION_STYLE[label] ?? { color: Colors.cream, text: Colors.ink };
            return (
              <View key={label} style={[S.preoccPill, { backgroundColor: style.color }]}>
                <Text style={[S.preoccText, { color: style.text }]}>{label}</Text>
              </View>
            );
          })}
          <TouchableOpacity style={S.preoccAdd} onPress={() => router.push('/hair-profile')}>
            <Text style={S.preoccAddText}>
              {userPreoccupations.length ? '+ Modifier' : '+ Ajouter'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Conseils ── */}
        <Text style={S.secTitle}>💡 Conseils</Text>
        <View style={S.conseilsGrid}>
          {CONSEILS.map((c, i) => (
            <View key={i} style={S.conseilCard}>
              <Text style={{ fontSize: 26, marginBottom: 8 }}>{c.icon}</Text>
              <Text style={S.conseilTitle}>{c.title}</Text>
              <Text style={S.conseilDesc}>{c.desc}</Text>
            </View>
          ))}
        </View>

        {/* ── Badges ── */}
        <View style={S.badgesHeader}>
          <Text style={S.secTitle}>Mes badges</Text>
          <TouchableOpacity onPress={() => router.push('/achievements')} hitSlop={10}>
            <Text style={S.badgesSeeAll}>{unlockedCount}/{totalCount} · Voir tout →</Text>
          </TouchableOpacity>
        </View>
        <View style={S.badgesGrid}>
          {achievements
            // Affiche en priorité les débloqués (récents en haut), puis les locked les plus avancés
            .slice()
            .sort((a, b) => {
              if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
              if (a.unlocked && b.unlocked) {
                return (b.unlockedAt ?? '').localeCompare(a.unlockedAt ?? '');
              }
              return b.progress - a.progress;
            })
            .slice(0, 6)
            .map(a => (
              <TouchableOpacity
                key={a.def.id}
                style={[S.badgeCard, !a.unlocked && S.badgeLocked]}
                onPress={() => router.push('/achievements' as any)}
                activeOpacity={0.85}
              >
                <Text style={[S.badgeEmoji, !a.unlocked && { opacity: 0.4 }]}>{a.def.emoji}</Text>
                <Text style={S.badgeName} numberOfLines={1}>{a.def.name}</Text>
                <Text style={S.badgeDesc} numberOfLines={2}>{a.def.desc}</Text>
                {a.unlocked
                  ? <Text style={S.badgeDate}>{a.unlockedAt ? formatBadgeDate(a.unlockedAt) : 'Débloqué'}</Text>
                  : <Text style={S.badgeLockLabel}>{a.progress > 0 ? `${Math.round(a.progress * 100)}%` : 'Verrouillé'}</Text>
                }
              </TouchableOpacity>
            ))}
        </View>

        {/* ── Statistiques ── */}
        <Text style={S.secTitle}>Statistiques</Text>
        <View style={S.statsRow}>
          {[
            { val: '15',       label: 'Routines'    },
            { val: String(streak), label: 'Jours streak' },
            { val: String(coins),  label: 'CC gagnés'    },
          ].map((s, i) => (
            <View key={i} style={S.statBox}>
              <Text style={S.statVal}>{s.val}</Text>
              <Text style={S.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Communauté & viralité ── */}
        <Text style={S.secTitle}>Communauté & viralité</Text>
        <View style={S.settingsCard}>
          <TouchableOpacity style={S.settingsRow} onPress={() => router.push('/community' as any)}>
            <View style={S.settingsLeft}>
              <View style={S.settingsIconBox}>
                <Ionicons name="chatbubbles-outline" size={18} color={Colors.sage} />
              </View>
              <Text style={S.settingsLabel}>Communauté</Text>
            </View>
            <View style={S.settingsRight}>
              <Text style={S.settingsValue}>Posts & avant/après</Text>
              <Ionicons name="chevron-forward" size={15} color={Colors.border} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[S.settingsRow, S.settingsBorder]} onPress={() => router.push('/hydra-challenge' as any)}>
            <View style={S.settingsLeft}>
              <View style={S.settingsIconBox}>
                <Ionicons name="water-outline" size={18} color={Colors.amberDark} />
              </View>
              <Text style={S.settingsLabel}>Hydra Challenge 30</Text>
            </View>
            <View style={S.settingsRight}>
              <Text style={S.settingsValue}>Classement</Text>
              <Ionicons name="chevron-forward" size={15} color={Colors.border} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[S.settingsRow, S.settingsBorder]} onPress={() => router.push('/highlights' as any)}>
            <View style={S.settingsLeft}>
              <View style={S.settingsIconBox}>
                <Ionicons name="flash-outline" size={18} color={Colors.amberDark} />
              </View>
              <Text style={S.settingsLabel}>Moments forts</Text>
            </View>
            <View style={S.settingsRight}>
              <Text style={S.settingsValue}>Défis & actus</Text>
              <Ionicons name="chevron-forward" size={15} color={Colors.border} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[S.settingsRow, S.settingsBorder]} onPress={() => router.push('/invite' as any)}>
            <View style={S.settingsLeft}>
              <View style={S.settingsIconBox}>
                <Ionicons name="gift-outline" size={18} color={Colors.rose} />
              </View>
              <Text style={S.settingsLabel}>Inviter une amie</Text>
            </View>
            <View style={S.settingsRight}>
              <Text style={S.settingsValue}>CotonCoins</Text>
              <Ionicons name="chevron-forward" size={15} color={Colors.border} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Rappels ── */}
        <Text style={S.secTitle}>Rappels & notifications</Text>
        <RoutineReminderSettings variant="card" />

        {/* ── Compte & légal ── */}
        <Text style={S.secTitle}>Compte & sérénité</Text>
        <View style={S.settingsCard}>

          {/* Email */}
          <TouchableOpacity style={S.settingsRow} onPress={() => { setNewEmail(session?.user?.email ?? ''); setAuthError(''); setShowEmailModal(true); }}>
            <View style={S.settingsLeft}>
              <View style={S.settingsIconBox}>
                <Ionicons name="mail-outline" size={18} color={Colors.warmGray} />
              </View>
              <Text style={S.settingsLabel}>Email</Text>
            </View>
            <View style={S.settingsRight}>
              <Text style={S.settingsValue} numberOfLines={1}>{session?.user?.email ?? '—'}</Text>
              <Ionicons name="chevron-forward" size={15} color={Colors.border} />
            </View>
          </TouchableOpacity>

          {/* Mot de passe */}
          <TouchableOpacity style={[S.settingsRow, S.settingsBorder]} onPress={() => { setAuthError(''); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setShowPasswordModal(true); }}>
            <View style={S.settingsLeft}>
              <View style={S.settingsIconBox}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.warmGray} />
              </View>
              <Text style={S.settingsLabel}>Mot de passe</Text>
            </View>
            <View style={S.settingsRight}>
              <Text style={S.settingsValue}>Modifier</Text>
              <Ionicons name="chevron-forward" size={15} color={Colors.border} />
            </View>
          </TouchableOpacity>

          {/* Centre notifications */}
          <TouchableOpacity style={[S.settingsRow, S.settingsBorder]} onPress={() => router.push('/notifications')}>
            <View style={S.settingsLeft}>
              <View style={S.settingsIconBox}>
                <Ionicons name="notifications-outline" size={18} color={Colors.warmGray} />
              </View>
              <Text style={S.settingsLabel}>Centre notifications</Text>
            </View>
            <View style={S.settingsRight}>
              <Text style={S.settingsValue}>Historique</Text>
              <Ionicons name="chevron-forward" size={15} color={Colors.border} />
            </View>
          </TouchableOpacity>

          {/* Légal */}
          <TouchableOpacity style={[S.settingsRow, S.settingsBorder]} onPress={() => router.push('/legal')}>
            <View style={S.settingsLeft}>
              <View style={S.settingsIconBox}>
                <Ionicons name="document-text-outline" size={18} color={Colors.warmGray} />
              </View>
              <Text style={S.settingsLabel}>Légal</Text>
            </View>
            <View style={S.settingsRight}>
              <Ionicons name="chevron-forward" size={15} color={Colors.border} />
            </View>
          </TouchableOpacity>

          {/* Langue */}
          <TouchableOpacity style={[S.settingsRow, S.settingsBorder]} onPress={() => setShowLangue(true)}>
            <View style={S.settingsLeft}>
              <View style={S.settingsIconBox}>
                <Ionicons name="language-outline" size={18} color={Colors.warmGray} />
              </View>
              <Text style={S.settingsLabel}>Langue</Text>
            </View>
            <View style={S.settingsRight}>
              <Text style={S.settingsValue}>{langue === 'fr' ? '🇫🇷 Français' : '🇬🇧 English'}</Text>
              <Ionicons name="chevron-forward" size={15} color={Colors.border} />
            </View>
          </TouchableOpacity>

          {/* Mes avis */}
          <TouchableOpacity style={[S.settingsRow, S.settingsBorder]} onPress={() => router.push('/avis')}>
            <View style={S.settingsLeft}>
              <View style={S.settingsIconBox}>
                <Ionicons name="star-outline" size={18} color={Colors.warmGray} />
              </View>
              <Text style={S.settingsLabel}>Mes avis</Text>
            </View>
            <View style={S.settingsRight}>
              <Text style={S.settingsValue}>Produits & recettes</Text>
              <Ionicons name="chevron-forward" size={15} color={Colors.border} />
            </View>
          </TouchableOpacity>

          {/* Aide & Contact */}
          <TouchableOpacity
            style={[S.settingsRow, S.settingsBorder]}
            onPress={() => openSafeMailto('support@coton-noir.com')}
          >
            <View style={S.settingsLeft}>
              <View style={S.settingsIconBox}>
                <Ionicons name="help-circle-outline" size={18} color={Colors.warmGray} />
              </View>
              <Text style={S.settingsLabel}>Aide & Contact</Text>
            </View>
            <View style={S.settingsRight}>
              <Ionicons name="chevron-forward" size={15} color={Colors.border} />
            </View>
          </TouchableOpacity>

        </View>

        {/* ── À propos ── */}
        <Text style={[S.secTitle, { marginTop: 8 }]}>À propos</Text>
        <Text style={S.aboutIntro}>Ce que Coton Noir t'apporte au quotidien</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={S.aboutCarousel}
        >
          {ABOUT_FEATURES.map((f, i) => (
            <View key={i} style={S.aboutCard}>
              <View style={S.aboutIconBox}>
                <Text style={{ fontSize: 22 }}>{f.icon}</Text>
              </View>
              <Text style={S.aboutCardTitle}>{f.title}</Text>
              <Text style={S.aboutCardDesc}>{f.desc}</Text>
            </View>
          ))}
        </ScrollView>

        {/* ── Actions compte ── */}
        <TouchableOpacity
          style={[S.logoutBtn, signingOut && S.logoutBtnDisabled]}
          onPress={() => void handleSignOut()}
          disabled={signingOut}
          activeOpacity={0.85}
        >
          <Text style={S.logoutText}>{signingOut ? 'Déconnexion...' : 'Se déconnecter'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={S.deleteBtn} onPress={handleDeleteAccount}>
          <Text style={S.deleteText}>Supprimer le compte</Text>
          <Text style={S.deleteHint}>Irréversible</Text>
        </TouchableOpacity>

        <View style={S.aboutMeta}>
          <Text style={S.aboutMetaName}>🪡 Coton Noir</Text>
          <Text style={S.aboutMetaRights}>© 2026 Coton Noir · Tous droits réservés</Text>
          <Text style={S.aboutMetaVersion}>V 1.0.0-beta</Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Modal Coiffure Protectrice ── */}
      <Modal visible={showProtectiveModal} transparent animationType="slide" onRequestClose={() => setShowProtectiveModal(false)}>
        <View style={S.avOverlay}>
          <TouchableOpacity style={S.avBackdrop} activeOpacity={1} onPress={() => setShowProtectiveModal(false)} />
          <View style={S.protectiveSheet}>
            <View style={S.avHandle} />
            <Text style={S.protectiveSheetTitle}>🛡️ Coiffure protectrice</Text>
            <Text style={S.protectiveSheetSub}>Sélectionne ta coiffure pour adapter ta routine.</Text>
            {PROTECTIVE_STYLES.map(p => (
              <TouchableOpacity
                key={p.id}
                style={[S.protectiveOption, protectiveType === p.id && S.protectiveOptionActive]}
                onPress={() => setProtectiveType(p.id)}
              >
                <Text style={S.protectiveOptionEmoji}>{p.emoji}</Text>
                <Text style={[S.protectiveOptionLabel, protectiveType === p.id && S.protectiveOptionLabelActive]}>
                  {p.label}
                </Text>
                {protectiveType === p.id && <Ionicons name="checkmark-circle" size={22} color={Colors.amber} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[S.protectiveConfirmBtn, !protectiveType && { opacity: 0.4 }]}
              disabled={!protectiveType}
              onPress={() => {
                setIsProtective(true);
                setRappelRoutine('night');
                setShowProtectiveModal(false);
                fire('protective_mode_on');
                router.push('/(tabs)/routine?routine=night' as any);
              }}
            >
              <Text style={S.protectiveConfirmText}>Activer · Voir routine soir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Modal Avatar ── */}
      <Modal visible={showAvatarModal} transparent animationType="slide" onRequestClose={() => setShowAvatarModal(false)}>
        <View style={S.avOverlay}>
          <TouchableOpacity style={S.avBackdrop} activeOpacity={1} onPress={() => setShowAvatarModal(false)} />
          <View style={S.avSheet}>
            <View style={S.avHandle} />

            {/* Preview */}
            <View style={S.avPreviewRow}>
              <View style={[S.avPreviewCircle, { backgroundColor: tempBg }]}>
                {avatarPhoto
                  ? <Image source={{ uri: avatarPhoto }} style={S.avPreviewPhoto} />
                  : <Text style={{ fontSize: 40 }}>{tempEmoji}</Text>
                }
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.avPreviewName}>{profile.name}</Text>
                <Text style={S.avPreviewSub}>Aperçu de l'avatar</Text>
              </View>
            </View>

            {/* Photo buttons */}
            <View style={S.avPhotoRow}>
              <TouchableOpacity style={S.avPhotoBtn} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={18} color={Colors.ink} />
                <Text style={S.avPhotoBtnText}>Prendre une photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={S.avPhotoBtn} onPress={pickFromGallery}>
                <Ionicons name="images-outline" size={18} color={Colors.ink} />
                <Text style={S.avPhotoBtnText}>Galerie</Text>
              </TouchableOpacity>
            </View>

            {/* Emoji grid */}
            <Text style={S.avSectionLabel}>Choisir un emoji</Text>
            <View style={S.avEmojiGrid}>
              {AVATAR_EMOJIS.map(e => (
                <TouchableOpacity
                  key={e}
                  style={[S.avEmojiCell, tempEmoji === e && S.avEmojiCellActive]}
                  onPress={() => { setTempEmoji(e); setAvatarPhoto(null); }}
                >
                  <Text style={{ fontSize: 26 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Color palette */}
            <Text style={S.avSectionLabel}>Couleur de fond</Text>
            <View style={S.avColorRow}>
              {AVATAR_COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[S.avColorDot, { backgroundColor: c }, tempBg === c && S.avColorDotActive]}
                  onPress={() => setTempBg(c)}
                />
              ))}
            </View>

            <TouchableOpacity style={S.avConfirmBtn} onPress={confirmAvatar}>
              <Text style={S.avConfirmText}>Valider</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Modal Email ── */}
      <Modal visible={showEmailModal} transparent animationType="fade" onRequestClose={() => setShowEmailModal(false)}>
        <TouchableOpacity style={S.modalOverlay} activeOpacity={1} onPress={() => setShowEmailModal(false)}>
          <TouchableOpacity activeOpacity={1} style={S.modalSheet}>
            <View style={S.modalHeader}>
              <Text style={S.modalTitle}>Modifier l'email</Text>
              <TouchableOpacity onPress={() => setShowEmailModal(false)} style={S.modalClose}>
                <Ionicons name="close" size={18} color={Colors.ink} />
              </TouchableOpacity>
            </View>
            <Text style={S.modalSub}>Un lien de confirmation sera envoyé à la nouvelle adresse.</Text>
            <TextInput
              style={S.authInput}
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="Nouvelle adresse email"
              placeholderTextColor={Colors.warmGray}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {authError ? <Text style={S.authError}>{authError}</Text> : null}
            <TouchableOpacity style={[S.modalBtn, { marginTop: 14 }, authLoading && { opacity: 0.6 }]} onPress={changeEmail} disabled={authLoading}>
              {authLoading ? <ActivityIndicator color="#fff" /> : <Text style={S.modalBtnText}>Envoyer le lien →</Text>}
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Modal Mot de passe ── */}
      <Modal visible={showPasswordModal} transparent animationType="fade" onRequestClose={() => setShowPasswordModal(false)}>
        <TouchableOpacity style={S.modalOverlay} activeOpacity={1} onPress={() => setShowPasswordModal(false)}>
          <TouchableOpacity activeOpacity={1} style={S.modalSheet}>
            <View style={S.modalHeader}>
              <Text style={S.modalTitle}>Modifier le mot de passe</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)} style={S.modalClose}>
                <Ionicons name="close" size={18} color={Colors.ink} />
              </TouchableOpacity>
            </View>
            <Text style={S.modalSub}>Au moins 6 caractères.</Text>
            <TextInput
              style={S.authInput}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Mot de passe actuel"
              placeholderTextColor={Colors.warmGray}
              secureTextEntry
            />
            <TextInput
              style={[S.authInput, { marginTop: 10 }]}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Nouveau mot de passe"
              placeholderTextColor={Colors.warmGray}
              secureTextEntry
            />
            <TextInput
              style={[S.authInput, { marginTop: 10 }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirmer le nouveau mot de passe"
              placeholderTextColor={Colors.warmGray}
              secureTextEntry
            />
            {authError ? <Text style={S.authError}>{authError}</Text> : null}
            <TouchableOpacity style={[S.modalBtn, { marginTop: 14 }, authLoading && { opacity: 0.6 }]} onPress={changePassword} disabled={authLoading}>
              {authLoading ? <ActivityIndicator color="#fff" /> : <Text style={S.modalBtnText}>Modifier le mot de passe</Text>}
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Modal Langue ── */}
      <Modal visible={showLangue} transparent animationType="fade" onRequestClose={() => setShowLangue(false)}>
        <TouchableOpacity style={S.modalOverlay} activeOpacity={1} onPress={() => setShowLangue(false)}>
          <TouchableOpacity activeOpacity={1} style={S.modalSheet}>
            <View style={S.modalHeader}>
              <Text style={S.modalTitle}>Langue</Text>
              <TouchableOpacity onPress={() => setShowLangue(false)} style={S.modalClose}>
                <Ionicons name="close" size={18} color={Colors.ink} />
              </TouchableOpacity>
            </View>

            {([
              { code: 'fr', flag: '🇫🇷', label: 'Français' },
              { code: 'en', flag: '🇬🇧', label: 'English'  },
            ] as const).map(l => (
              <TouchableOpacity
                key={l.code}
                style={[S.langueRow, langue === l.code && S.langueRowActive]}
                onPress={() => { setLangue(l.code); setShowLangue(false); }}
              >
                <Text style={S.langueFlag}>{l.flag}</Text>
                <Text style={[S.langueLabel, langue === l.code && S.langueLabelActive]}>{l.label}</Text>
                {langue === l.code && <Ionicons name="checkmark-circle" size={20} color={Colors.rose} />}
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 16 },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  backBtn:     { marginRight: 4, flexShrink: 0 },
  headerTitle: { fontSize: 24, fontFamily: 'Satoshi_500Medium', color: Colors.ink, flex: 1 },
  coinsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.ink,
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7,
  },
  coinsEmoji: { fontSize: 15 },
  coinsText:  { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.amber },

  // ── Avatar ──
  avatarSection:   { alignItems: 'center', paddingVertical: 20 },
  avatarWrap:      { position: 'relative', marginBottom: 12 },
  avatarCircle: {
    width: 84, height: 84, borderRadius: 42,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarPhoto:     { width: 84, height: 84, borderRadius: 42 },
  avatarEmoji:     { fontSize: 44 },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.ink, borderWidth: 2, borderColor: Colors.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  userName:     { fontSize: 22, fontFamily: 'Satoshi_500Medium', color: Colors.ink, marginBottom: 4 },
  memberSince:  { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },

  // ── Level card ──
  levelCard: {
    backgroundColor: Colors.ink, borderRadius: 20,
    marginHorizontal: 20, padding: 18, marginBottom: 14,
  },
  levelTop: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 14,
  },
  levelLeft: { flex: 1 },
  levelBadge: {
    fontSize: 10, fontFamily: 'DMSans_700Bold',
    color: 'rgba(255,255,255,0.45)', letterSpacing: 0.8, marginBottom: 6,
  },
  levelNameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  levelIconBox: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  levelIconEmoji: { fontSize: 18 },
  levelName:      { fontSize: 18, fontFamily: 'DMSans_700Bold', color: '#fff' },
  levelBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  levelBtnText: { fontSize: 11, fontFamily: 'DMSans_600SemiBold', color: 'rgba(255,255,255,0.75)' },

  progressBg: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999, overflow: 'hidden', marginBottom: 8,
  },
  progressFill: { height: 6, borderRadius: 999 },

  levelFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  levelCC:      { fontSize: 12, fontFamily: 'DMSans_700Bold', color: 'rgba(255,255,255,0.7)' },
  levelNext:    { fontSize: 10, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.45)', flex: 1, textAlign: 'right' },

  // ── CotonCoins card ──
  coinsCard: {
    backgroundColor: Colors.surface, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.border,
    marginHorizontal: 20, padding: 16, marginBottom: 20,
  },
  coinsTop: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14,
  },
  coinsBalance:  { fontSize: 32, fontFamily: 'Satoshi_500Medium', color: Colors.amber },
  coinsLabel:    { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 2 },
  exchangeBtn:   { backgroundColor: Colors.amber, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11 },
  exchangeBtnText: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: '#fff' },

  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  historyBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  historyIconBox: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.amberLight, alignItems: 'center', justifyContent: 'center',
  },
  historyIconEmoji: { fontSize: 16 },
  historyInfo:   { flex: 1 },
  historyLabel:  { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },
  historyDate:   { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 1 },
  amountPos:     { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.sage },
  amountNeg:     { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.rose },
  emptyHistory:  { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, textAlign: 'center', paddingVertical: 8 },

  // ── Section header ──
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 12,
  },
  secTitle: {
    fontSize: 20, fontFamily: 'Satoshi_500Medium',
    color: Colors.ink, paddingHorizontal: 20, marginBottom: 12,
  },
  modifierBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.amberLight, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  modifierText: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: Colors.amber },

  // ── Hair card ──
  hairCard: {
    backgroundColor: Colors.surface, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.border,
    marginHorizontal: 20, overflow: 'hidden', marginBottom: 24,
  },
  hairRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  hairBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  hairLabel:  { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
  hairValue:  { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },
  hairTypePill: {
    backgroundColor: Colors.blush, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  hairTypePillText: { fontSize: 12, fontFamily: 'DMSans_700Bold', color: Colors.rose },

  // ── Mode coiffure protectrice ──
  protectiveCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
    marginHorizontal: 20, padding: 14, marginBottom: 16,
  },
  protectiveIconBox: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center',
  },
  protectiveTitle: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 2 },
  protectiveSub:   { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
  protectiveToggle: {
    backgroundColor: Colors.ink, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  protectiveToggleText: { fontSize: 12, fontFamily: 'DMSans_700Bold', color: '#fff' },

  protectiveCardActive: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.ink, borderRadius: 16,
    marginHorizontal: 20, padding: 16, marginBottom: 16,
  },
  protectiveActiveLeft: { flex: 1, marginRight: 12 },
  protectiveActiveBadge: {
    fontSize: 9, fontFamily: 'DMSans_700Bold',
    color: Colors.amber, letterSpacing: 1.2, marginBottom: 6,
  },
  protectiveActiveTitle: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: '#fff', marginBottom: 4 },
  protectiveActiveSub:   { fontSize: 11, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.6)' },
  protectiveDeactivateBtn: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7,
  },
  protectiveDeactivateText: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: 'rgba(255,255,255,0.75)' },

  // ── Modal coiffure protectrice ──
  protectiveSheet: {
    backgroundColor: Colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12,
  },
  protectiveSheetTitle: { fontSize: 18, fontFamily: 'Satoshi_500Medium', color: Colors.ink, marginBottom: 4 },
  protectiveSheetSub:   { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginBottom: 20 },
  protectiveOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1.5, borderColor: Colors.border,
    padding: 14, marginBottom: 10,
  },
  protectiveOptionActive: { borderColor: Colors.amber, backgroundColor: Colors.amberLight },
  protectiveOptionEmoji:  { fontSize: 26 },
  protectiveOptionLabel:  { flex: 1, fontSize: 14, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },
  protectiveOptionLabelActive: { color: Colors.amber },
  protectiveConfirmBtn: {
    backgroundColor: Colors.ink, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', marginTop: 4,
  },
  protectiveConfirmText: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: '#fff' },

  // ── Bannière profil ──
  profileBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.amberLight, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.amber,
    marginHorizontal: 20, padding: 14, marginBottom: 20,
  },
  profileBannerIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.amber + '33',
    alignItems: 'center', justifyContent: 'center',
  },
  profileBannerTitle: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 2 },
  profileBannerSub:   { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },

  // ── Préoccupations ──
  preoccRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 20 },
  preoccPill: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  preoccText: { fontSize: 13, fontFamily: 'DMSans_600SemiBold' },
  preoccAdd: {
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: Colors.border,
  },
  preoccAddText: { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },

  // ── Conseils ──
  conseilsGrid: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 24 },
  conseilCard: {
    flex: 1, backgroundColor: Colors.cream,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 14,
  },
  conseilTitle: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 6 },
  conseilDesc:  { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 16 },

  // ── Badges ──
  badgesHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingRight: 20,
  },
  badgesSeeAll: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.amber,
  },
  badgesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    paddingHorizontal: 20, marginBottom: 24,
  },
  badgeCard: {
    width: '47%', backgroundColor: Colors.surface,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    padding: 14, alignItems: 'center', gap: 4,
  },
  badgeLocked:    { opacity: 0.45 },
  badgeEmoji:     { fontSize: 28, marginBottom: 4 },
  badgeName:      { fontSize: 12, fontFamily: 'DMSans_700Bold', color: Colors.ink, textAlign: 'center' },
  badgeDesc:      { fontSize: 10, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, textAlign: 'center' },
  badgeDate:      { fontSize: 10, fontFamily: 'DMSans_500Medium', color: Colors.sage },
  badgeLockLabel: { fontSize: 10, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 20, marginBottom: 24,
  },
  statBox: {
    flex: 1, backgroundColor: Colors.surface,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    padding: 14, alignItems: 'center',
  },
  statVal:   { fontSize: 20, fontFamily: 'Satoshi_500Medium', color: Colors.ink },
  statLabel: { fontSize: 10, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 3, textAlign: 'center' },

  // ── Settings ──
  settingsCard: {
    backgroundColor: Colors.surface, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.border,
    marginHorizontal: 20, overflow: 'hidden', marginBottom: 16,
  },
  settingsRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 14,
  },
  settingsBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  settingsLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingsIconBox: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center',
  },
  settingsLabel:  { fontSize: 14, fontFamily: 'DMSans_500Medium', color: Colors.ink },
  settingsRight:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingsValue:  { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },

  // ── À propos ──
  aboutIntro: {
    fontSize: 13, fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray, paddingHorizontal: 20,
    marginTop: -4, marginBottom: 12,
  },
  aboutCarousel: { paddingLeft: 20, paddingRight: 8, paddingBottom: 4 },
  aboutCard: {
    width: 200, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 18, padding: 16, marginRight: 12,
  },
  aboutIconBox: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: Colors.cream,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  aboutCardTitle: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 4 },
  aboutCardDesc:  { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 16 },
  aboutMeta: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 18,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  aboutMetaName:    { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 4 },
  aboutMetaRights:  { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginBottom: 3 },
  aboutMetaVersion: { fontSize: 10, fontFamily: 'DMSans_400Regular', color: Colors.border, letterSpacing: 0.5 },

  // ── Account actions ──
  logoutBtn: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.amber,
    marginBottom: 10,
  },
  logoutBtnDisabled: {
    opacity: 0.6,
  },
  logoutText:  { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.amber },
  deleteBtn: {
    marginHorizontal: 20, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', backgroundColor: '#FEE2E2',
    borderWidth: 1, borderColor: '#FCA5A5',
    marginBottom: 8,
  },
  deleteText:  { fontSize: 14, fontFamily: 'DMSans_700Bold', color: '#DC2626' },
  deleteHint:  { fontSize: 10, fontFamily: 'DMSans_400Regular', color: '#EF4444', marginTop: 2 },

  // ── Modals ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  modalSheet: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    width: '88%',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 30, elevation: 16,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  modalTitle:  { fontSize: 17, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  modalClose:  { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center' },
  modalSub:    { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginBottom: 24 },

  rappelKindRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  rappelKindChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  rappelKindChipActive: {
    borderColor: Colors.amber,
    backgroundColor: Colors.amberLight,
  },
  rappelKindText: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
  },
  rappelKindTextActive: {
    color: Colors.ink,
    fontFamily: 'DMSans_700Bold',
  },

  // Time picker
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 },
  timeCol: { alignItems: 'center', gap: 4 },
  timeBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center' },
  timeVal: { fontSize: 40, fontFamily: 'DMSans_700Bold', color: Colors.ink, width: 72, textAlign: 'center' },
  timeSep: { fontSize: 36, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 8 },

  modalBtn:     { backgroundColor: Colors.ink, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  modalBtnText: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: '#fff' },

  // Auth inputs
  authInput: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.ink,
    backgroundColor: Colors.surface,
  },
  authError: {
    fontSize: 12, fontFamily: 'DMSans_500Medium', color: '#DC2626', marginTop: 8,
  },

  // Language picker
  langueRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 4,
    borderRadius: 12, marginBottom: 8,
  },
  langueRowActive: { backgroundColor: Colors.blush },
  langueFlag:      { fontSize: 26 },
  langueLabel:     { flex: 1, fontSize: 15, fontFamily: 'DMSans_500Medium', color: Colors.ink },
  langueLabelActive: { fontFamily: 'DMSans_700Bold', color: Colors.rose },

  // ── Avatar modal ──
  avOverlay:  { flex: 1, justifyContent: 'flex-end' },
  avBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  avSheet: {
    backgroundColor: Colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12,
  },
  avHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 20 },

  avPreviewRow:    { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  avPreviewCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  avPreviewPhoto:  { width: 64, height: 64, borderRadius: 32 },
  avPreviewName:   { fontSize: 16, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  avPreviewSub:    { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 2 },

  avPhotoRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  avPhotoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingVertical: 12, backgroundColor: Colors.surface,
  },
  avPhotoBtnText: { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.ink },

  avSectionLabel: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.ink, marginBottom: 12 },

  avEmojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  avEmojiCell: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  avEmojiCellActive: { borderColor: Colors.amber, backgroundColor: Colors.amberLight },

  avColorRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  avColorDot: { width: 36, height: 36, borderRadius: 18 },
  avColorDotActive: { borderWidth: 3, borderColor: Colors.amber },

  avConfirmBtn:  { backgroundColor: Colors.ink, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  avConfirmText: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: '#fff' },
});
