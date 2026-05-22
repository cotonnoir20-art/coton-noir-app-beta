import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, Share,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '../src/theme/colors';
import { useApp } from '../src/context/AppContext';
import { useAuth } from '../src/context/AuthContext';
import { useAchievements } from '../src/context/AchievementsContext';
import { BCEmojiAvatar } from '../src/components/blackCotton/BCEmojiAvatar';
import { AppHeader } from '../src/components/AppHeader';
import { CoinIcon } from '../src/components/CoinIcon';
import { hapticLight, hapticMedium, hapticSuccess } from '../src/lib/haptics';
import { fetchMyReferralCode } from '../src/lib/economyApi';
import {
  buildReferralCode,
  clearLegacyReferralCache,
  getInvitesLog,
  getInvitesSentCount,
  getReferralsCount,
  getReferrerCoinsEarned,
  getReferrerUsed,
  logInviteShare,
  REFERRER_REWARD_CC,
  type InviteLogEntry,
} from '../src/lib/referral';
import {
  REFERRAL_MAX_CC_EARNED,
  REFERRAL_MAX_REFEREES,
} from '../src/lib/cotonCoins';
import { trackProductEvent } from '../src/lib/productAnalytics';

const METHOD_LABEL: Record<InviteLogEntry['method'], { emoji: string; label: string }> = {
  copy:     { emoji: '📋', label: 'Code copié'      },
  share:    { emoji: '📤', label: 'Partage natif'   },
  whatsapp: { emoji: '💬', label: 'WhatsApp'        },
  email:    { emoji: '✉️', label: 'Email'           },
  sms:      { emoji: '📱', label: 'SMS'             },
};

const MONTHS_SHORT = [
  'janv.', 'févr.', 'mars', 'avril', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

function formatLogDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  if (sameDay) {
    return `Aujourd'hui · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

export default function InviteScreen() {
  const router = useRouter();
  const { state, applyReferralCodeSecure } = useApp();
  const { session } = useAuth();
  const { refreshExtras } = useAchievements();

  const fallbackCode = useMemo(() => buildReferralCode({
    id:       session?.user?.id,
    username: state.profile?.name,
    email:    session?.user?.email,
  }), [session?.user?.id, session?.user?.email, state.profile?.name]);

  const [referralCode, setReferralCode] = useState(fallbackCode);

  useEffect(() => {
    let cancelled = false;
    void fetchMyReferralCode().then(code => {
      if (!cancelled && code) setReferralCode(code);
      else if (!cancelled) setReferralCode(fallbackCode);
    });
    return () => { cancelled = true; };
  }, [fallbackCode]);

  // ── Stats live ────────────────────────────────────────────────────────
  const [invitesSent, setInvitesSent]       = useState(0);
  const [coinsEarned, setCoinsEarned]       = useState(0);
  const [referrerUsed, setReferrerUsed]     = useState<string | null>(null);
  const [log, setLog]                       = useState<InviteLogEntry[]>([]);
  const [copied, setCopied]                 = useState(false);
  const [showCodeModal, setShowCodeModal]   = useState(false);
  const [codeInput, setCodeInput]           = useState('');
  const [codeError, setCodeError]           = useState<string | null>(null);

  const reload = useCallback(async () => {
    await clearLegacyReferralCache();
    const [sent, earned, used, referralsCount, l] = await Promise.all([
      getInvitesSentCount(),
      getReferrerCoinsEarned(),
      getReferrerUsed(),
      getReferralsCount(),
      getInvitesLog(),
    ]);
    setInvitesSent(referralsCount > 0 ? referralsCount : sent);
    setCoinsEarned(earned);
    setReferrerUsed(used);
    setLog(l);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const buildShareMessage = useCallback((): string => (
    `Hey ! Je suis sur Coton Noir 🌱 — l'app qui m'aide à prendre soin de mes cheveux naturels.\n\n`
    + `Active mon code de parrainage ${referralCode} à l'inscription et reçois ${REFERRER_REWARD_CC} CotonCoins. `
    + `(et moi aussi 😉)`
  ), [referralCode]);

  // ── Actions ───────────────────────────────────────────────────────────
  const handleCopy = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(referralCode);
      hapticSuccess();
      await logInviteShare('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
      await reload();
      refreshExtras();
    } catch {
      hapticLight();
    }
  }, [referralCode, reload, refreshExtras]);

  const handleShare = useCallback(async () => {
    try {
      hapticMedium();
      const message = buildShareMessage();
      const result = await Share.share(
        Platform.OS === 'ios'
          ? { message, url: `https://cotonnoir.app/invite?code=${encodeURIComponent(referralCode)}` }
          : { message: `${message}\n\nhttps://cotonnoir.app/invite?code=${encodeURIComponent(referralCode)}` },
        { dialogTitle: 'Inviter une amie' },
      );
      // L'utilisatrice a effectivement partagé (sur iOS : action !== 'dismissedAction')
      if (result.action !== Share.dismissedAction) {
        await logInviteShare('share');
        await reload();
        refreshExtras();
        hapticSuccess();
        void trackProductEvent('invite_shared', { method: 'share' });
      }
    } catch {
      hapticLight();
    }
  }, [buildShareMessage, referralCode, reload, refreshExtras]);

  const openCodeModal = () => {
    if (referrerUsed) return;
    setCodeInput('');
    setCodeError(null);
    setShowCodeModal(true);
  };

  const handleApplyCode = useCallback(async () => {
    setCodeError(null);
    const clean = codeInput.trim().toUpperCase();
    if (!clean) {
      setCodeError('Entre le code reçu de ta marraine.');
      hapticLight();
      return;
    }
    if (clean === referralCode.toUpperCase()) {
      setCodeError("Tu ne peux pas utiliser ton propre code 😉");
      hapticLight();
      return;
    }

    const result = await applyReferralCodeSecure(clean);
    if (!result.ok) {
      const messages: Record<string, string> = {
        empty:           'Entre le code reçu de ta marraine.',
        invalid_format:  'Format invalide. Exemple : PAULA-3B2F',
        self:            "Tu ne peux pas utiliser ton propre code 😉",
        already:         'Tu as déjà activé un code parrain.',
        unknown_code:    'Code introuvable. Vérifie l’orthographe.',
        not_authenticated: 'Connecte-toi pour activer un code.',
        demo_account:    'Indisponible sur le compte démo.',
      };
      setCodeError(messages[result.referralError ?? result.error ?? ''] ?? 'Impossible d’activer ce code.');
      hapticLight();
      return;
    }
    hapticSuccess();
    setShowCodeModal(false);
    Alert.alert('Bienvenue 🎁', `+${REFERRER_REWARD_CC} CotonCoins crédités sur ton compte.`);
    refreshExtras();
    await reload();
  }, [codeInput, referralCode, applyReferralCodeSecure, reload, refreshExtras]);

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <AppHeader title="Inviter" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.content}>

        {/* ── Invite card ── */}
        <View style={S.inviteCard}>
          <Text style={S.giftEmoji}>🎁</Text>
          <Text style={S.inviteTitle}>Invite tes copines</Text>
          <Text style={S.inviteDesc}>
            Pour chaque inscription validée, gagne{' '}
            <Text style={S.highlight}>+{REFERRER_REWARD_CC} CotonCoins</Text>
            {'. Elles aussi.'}
          </Text>
          <Text style={S.inviteCap}>
            Plafond marraine : {REFERRAL_MAX_REFEREES} filleules rémunérées · {REFERRAL_MAX_CC_EARNED} CC max.
          </Text>

          {/* Stats */}
          <View style={S.statsRow}>
            <View style={S.statBox}>
              <Text style={S.statVal}>{invitesSent}</Text>
              <Text style={S.statLabel}>Invitations</Text>
            </View>
            <View style={[S.statBox, S.statBorder]}>
              <View style={S.statValRow}>
                <Text style={S.statVal}>{coinsEarned}</Text>
                <CoinIcon size={14} />
              </View>
              <Text style={S.statLabel}>CC reçus</Text>
            </View>
            <View style={[S.statBox, S.statBorder]}>
              <Text style={S.statVal}>{referrerUsed ? '✓' : '—'}</Text>
              <Text style={S.statLabel}>Code parrain</Text>
            </View>
          </View>

          {/* Referral code */}
          <View style={S.codeBox}>
            <Text style={S.codeText}>{referralCode}</Text>
            <Text style={S.codeHint}>Ton code unique · partage-le partout</Text>
          </View>

          {/* Action buttons */}
          <View style={S.btnRow}>
            <TouchableOpacity style={S.copyBtn} onPress={handleCopy} activeOpacity={0.85}>
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={15} color="#fff" />
              <Text style={S.copyBtnText}>{copied ? 'Copié' : 'Copier'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={S.shareBtn} onPress={handleShare} activeOpacity={0.85}>
              <Ionicons name="share-social-outline" size={15} color={Colors.ink} />
              <Text style={S.shareBtnText}>Partager</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Code parrain reçu ── */}
        <TouchableOpacity
          style={[S.referrerCard, referrerUsed && S.referrerCardUsed]}
          onPress={openCodeModal}
          activeOpacity={referrerUsed ? 1 : 0.85}
          disabled={!!referrerUsed}
        >
          <View style={S.referrerIcon}>
            <Text style={{ fontSize: 22 }}>{referrerUsed ? '✅' : '🎟️'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.referrerTitle}>
              {referrerUsed ? 'Code parrain activé' : "Tu as un code parrain ?"}
            </Text>
            <Text style={S.referrerSub}>
              {referrerUsed
                ? `${referrerUsed} · +${REFERRER_REWARD_CC} CC crédités`
                : `Active-le pour gagner ${REFERRER_REWARD_CC} CotonCoins immédiatement`}
            </Text>
          </View>
          {!referrerUsed && <Ionicons name="chevron-forward" size={18} color={Colors.warmGray} />}
        </TouchableOpacity>

        {/* ── Comment ça marche ── */}
        <View style={S.howCard}>
          <View style={S.howCardHeader}>
            <BCEmojiAvatar size={40} mood="playful" />
            <View style={{ flex: 1 }}>
              <Text style={S.howTitle}>Comment ça marche</Text>
              <Text style={S.howTitleSub}>3 étapes simples pour gagner des CotonCoins</Text>
            </View>
          </View>
          {[
            { n: '1', color: Colors.rose,  title: 'Partage ton code',     sub: 'Envoie-le sur WhatsApp, Insta ou TikTok' },
            { n: '2', color: Colors.amber, title: "Ton amie s'inscrit",   sub: "Elle utilise ton code à l'inscription"    },
            { n: '3', color: Colors.sage,  title: `+${REFERRER_REWARD_CC} CC chacune`, sub: 'Crédités dès qu’elle active ton code (compte récent)' },
          ].map((step, i) => (
            <View key={i} style={[S.howRow, i > 0 && S.howBorder]}>
              <View style={[S.howBubble, { backgroundColor: step.color }]}>
                <Text style={S.howNum}>{step.n}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.howStepTitle}>{step.title}</Text>
                <Text style={S.howStepSub}>{step.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Activité ── */}
        {log.length > 0 && (
          <View style={S.logCard}>
            <Text style={S.logTitle}>Mon activité de partage</Text>
            {log.slice(0, 6).map((entry, i) => {
              const meta = METHOD_LABEL[entry.method] ?? METHOD_LABEL.share;
              return (
                <View key={i} style={[S.logRow, i > 0 && S.logBorder]}>
                  <Text style={S.logEmoji}>{meta.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={S.logLabel}>{meta.label}</Text>
                    <Text style={S.logDate}>{formatLogDate(entry.at)}</Text>
                  </View>
                </View>
              );
            })}
            {log.length > 6 && (
              <Text style={S.logMore}>+ {log.length - 6} autres partages</Text>
            )}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Modal Saisie code parrain ── */}
      <Modal visible={showCodeModal} transparent animationType="fade" onRequestClose={() => setShowCodeModal(false)}>
        <KeyboardAvoidingView
          style={S.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity style={S.modalBackdrop} activeOpacity={1} onPress={() => setShowCodeModal(false)} />
          <View style={S.modalCard}>
            <Text style={S.modalTitle}>Active ton code parrain</Text>
            <Text style={S.modalSub}>
              Saisis le code reçu de ta marraine pour recevoir +{REFERRER_REWARD_CC} CotonCoins.
            </Text>
            <TextInput
              value={codeInput}
              onChangeText={t => { setCodeInput(t.toUpperCase()); setCodeError(null); }}
              placeholder="PAULA-3B2F"
              placeholderTextColor={Colors.warmGray}
              autoCapitalize="characters"
              autoCorrect={false}
              style={S.modalInput}
              maxLength={20}
            />
            {codeError && <Text style={S.modalError}>{codeError}</Text>}
            <View style={S.modalBtnRow}>
              <TouchableOpacity style={S.modalCancel} onPress={() => setShowCodeModal(false)}>
                <Text style={S.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={S.modalConfirm} onPress={handleApplyCode}>
                <Text style={S.modalConfirmText}>Activer +{REFERRER_REWARD_CC} CC</Text>
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

  // ── Invite card ──
  inviteCard: {
    backgroundColor: Colors.ink,
    borderRadius: 20, padding: 20,
    alignItems: 'center', marginBottom: 16,
  },
  giftEmoji:  { fontSize: 44, marginBottom: 10 },
  inviteTitle: {
    fontSize: 22, fontFamily: 'Poppins_700Bold',
    color: '#fff', textAlign: 'center', marginBottom: 8,
  },
  inviteDesc: {
    fontSize: 13, fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.6)', textAlign: 'center',
    lineHeight: 20, marginBottom: 8,
  },
  inviteCap: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
  },
  highlight: { color: Colors.amber, fontFamily: 'DMSans_700Bold' },

  statsRow: {
    flexDirection: 'row', width: '100%',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14, marginBottom: 16, overflow: 'hidden',
  },
  statBox:    { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statBorder: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.1)' },
  statValRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statVal:    { fontSize: 20, fontFamily: 'Poppins_700Bold', color: '#fff' },
  statLabel:  { fontSize: 10, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.5)', marginTop: 2 },

  codeBox: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 14, alignItems: 'center',
    marginBottom: 14,
  },
  codeText: { fontSize: 18, fontFamily: 'DMSans_700Bold', color: '#fff', letterSpacing: 3 },
  codeHint: { fontSize: 10, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.45)', marginTop: 4 },

  btnRow: { flexDirection: 'row', gap: 10, width: '100%' },
  copyBtn: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  copyBtnText:  { fontSize: 14, fontFamily: 'DMSans_700Bold', color: '#fff' },
  // CTA "Partager" : ambre (couleur de valeur / signature), bien contrasté sur le fond ink.
  shareBtn: {
    flex: 1, backgroundColor: Colors.amber,
    borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 6,
  },
  shareBtnText: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink },

  // ── Referrer card ──
  referrerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    padding: 14, marginBottom: 16,
  },
  referrerCardUsed: { backgroundColor: Colors.sageLight, borderColor: Colors.sage },
  referrerIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.amberLight,
    alignItems: 'center', justifyContent: 'center',
  },
  referrerTitle: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  referrerSub:   { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 2 },

  // ── How card ──
  howCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18, borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  howCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, backgroundColor: Colors.cream,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  howTitle:    { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: Colors.ink },
  howTitleSub: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 2 },
  howRow:      { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  howBorder:   { borderTopWidth: 1, borderTopColor: Colors.border },
  howBubble: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  howNum:       { fontSize: 14, fontFamily: 'DMSans_700Bold', color: '#fff' },
  howStepTitle: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 2 },
  howStepSub:   { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },

  // ── Log ──
  logCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18, borderWidth: 1, borderColor: Colors.border,
    padding: 16, marginTop: 16,
  },
  logTitle: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 10 },
  logRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  logBorder:{ borderTopWidth: 1, borderTopColor: Colors.border },
  logEmoji: { fontSize: 18 },
  logLabel: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },
  logDate:  { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 1 },
  logMore:  {
    fontSize: 11, fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray, marginTop: 8, textAlign: 'center',
  },

  // ── Modal ──
  modalRoot:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalCard: {
    width: '88%', maxWidth: 400,
    backgroundColor: '#fff', borderRadius: 20, padding: 22,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 }, elevation: 12,
  },
  modalTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: Colors.ink, marginBottom: 6 },
  modalSub:   { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginBottom: 18, lineHeight: 19 },
  modalInput: {
    backgroundColor: Colors.cream,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 16, fontFamily: 'DMSans_700Bold', color: Colors.ink,
    letterSpacing: 2, textAlign: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  modalError: { fontSize: 12, fontFamily: 'DMSans_500Medium', color: Colors.rose, marginTop: 8 },
  modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  modalCancel: {
    flex: 1, backgroundColor: Colors.cream,
    borderRadius: 14, paddingVertical: 13, alignItems: 'center',
  },
  modalCancelText: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.warmGray },
  modalConfirm: {
    flex: 1.4, backgroundColor: Colors.ink,
    borderRadius: 14, paddingVertical: 13, alignItems: 'center',
  },
  modalConfirmText: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: '#fff' },
});
