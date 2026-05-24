import { useMemo, useState } from 'react';
import {
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/theme/colors';
import { useApp } from '../src/context/AppContext';
import { AppHeader } from '../src/components/AppHeader';
import { MiniCalendar, formatFull } from '../src/components/MiniCalendar';
import { computeGrowthProjection } from '../src/lib/growthProjection';
import { toLocalISODate } from '../src/lib/homeGrowth';
import { HairLengthLandmarkPicker } from '../src/components/profile/HairLengthLandmarkPicker';
import { ProfileLengthLandmarksForm } from '../src/components/profile/ProfileLengthLandmarksForm';
import {
  isHairLengthLandmark,
  parseProfileLength,
  serializeProfileLength,
} from '../src/constants/hairLengthLandmarks';
import { trackProductEvent } from '../src/lib/productAnalytics';

export default function GrowthCalculatorScreen() {
  const router = useRouter();
  const { state, dispatch } = useApp();
  const projection = useMemo(
    () => computeGrowthProjection(state.growthHistory, state.profile),
    [state.growthHistory, state.profile],
  );

  const [showObjectif, setShowObjectif] = useState(false);
  const [objTargetLandmark, setObjTargetLandmark] = useState('');
  const [objTargetCm, setObjTargetCm] = useState('');
  const [objDate, setObjDate] = useState<Date | null>(null);
  const [showObjCal, setShowObjCal] = useState(false);
  const [landmarkLength, setLandmarkLength] = useState(state.profile.length ?? '');
  const [landmarkTarget, setLandmarkTarget] = useState(state.profile.targetLength ?? '');
  const [landmarkSaved, setLandmarkSaved] = useState(false);

  const {
    targetCm,
    currentCm,
    currentLabel,
    targetLabel,
    projectionIsEstimate,
    palierPct,
    remaining,
    monthsToTarget,
    growthPerMonth,
    growth3m,
    hasMeasurements,
  } = projection;

  function openGoalModal() {
    const parsed = parseProfileLength(state.profile.targetLength);
    setObjTargetLandmark(parsed.landmark ?? '');
    setObjTargetCm(parsed.cm != null ? String(parsed.cm) : '');
    const raw = state.profile.objectiveTargetDate?.trim();
    setObjDate(
      raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T12:00:00`) : null,
    );
    setShowObjCal(false);
    setShowObjectif(true);
  }

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <AppHeader
        title="Calculateur de pousse"
        subtitle="Objectif, rythme et délai estimé"
        rightAction="coins"
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.content}>
        {!hasMeasurements ? (
          <>
            <ProfileLengthLandmarksForm
              length={landmarkLength}
              targetLength={landmarkTarget}
              onLengthChange={v => {
                setLandmarkLength(v);
                setLandmarkSaved(false);
              }}
              onTargetChange={v => {
                setLandmarkTarget(v);
                setLandmarkSaved(false);
              }}
              showSaveButton
              onSave={() => {
                const length = landmarkLength.trim();
                const targetLength = landmarkTarget.trim();
                if (!length && !targetLength) return;
                dispatch({
                  type: 'updateProfile',
                  payload: { length, targetLength },
                });
                setLandmarkSaved(true);
              }}
              saved={landmarkSaved}
            />
            <View style={S.hintCard}>
              <Text style={S.hintEmoji}>📏</Text>
              <Text style={S.hintTitle}>Mesure au mètre (optionnel)</Text>
              <Text style={S.hintSub}>
                Pour estimer ton rythme de pousse, enregistre des mesures par zone (Devant, côtés…).
              </Text>
              <TouchableOpacity
                style={S.hintBtn}
                onPress={() => router.push('/hair-length' as any)}
              >
                <Text style={S.hintBtnText}>Mesurer mes 4 zones</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}

        {projectionIsEstimate ? (
          <View style={S.estimateBanner}>
            <Text style={S.estimateBannerText}>
              Projection indicative : repères ou cm affinés. Enregistre des mesures au mètre
              ruban pour un délai et un rythme fiables.
            </Text>
          </View>
        ) : null}

        <View style={S.statsRow}>
          <View style={S.statBox}>
            <Text style={S.statVal} numberOfLines={2}>
              {currentLabel !== '—' ? currentLabel : '—'}
            </Text>
            <Text style={S.statLabel}>Longueur actuelle</Text>
          </View>
          <View style={S.statBox}>
            <Text style={[S.statVal, { color: Colors.growth }]} numberOfLines={2}>
              {targetLabel !== '—' ? targetLabel : `${targetCm} cm`}
            </Text>
            <Text style={S.statLabel}>Objectif</Text>
          </View>
        </View>

        <View style={S.paceCard}>
          <Text style={S.paceLabel}>RYTHME ESTIMÉ</Text>
          <Text style={S.paceVal}>
            {growthPerMonth > 0 ? `+${growthPerMonth} cm / mois` : 'Pas encore calculable'}
          </Text>
          {growth3m !== null ? (
            <Text style={S.paceSub}>Sur 3 mois (Devant) : +{growth3m} cm</Text>
          ) : (
            <Text style={S.paceSub}>Enregistre 2 mesures espacées pour activer l’estimation.</Text>
          )}
        </View>

        <View style={S.palierCard}>
          <View style={S.palierHeader}>
            <Text style={{ fontSize: 22 }}>🎯</Text>
            <View style={{ flex: 1 }}>
              <Text style={S.palierTitle}>Temps vers l’objectif</Text>
              <Text style={S.palierSub}>
                Il te reste{' '}
                <Text style={S.palierBold}>{remaining} cm</Text> pour atteindre {targetCm} cm
              </Text>
            </View>
          </View>
          <View style={S.barBg}>
            <View style={[S.barFill, { width: `${palierPct}%` }]} />
          </View>
          <Text style={S.palierNote}>
            {monthsToTarget !== null ? (
              <>
                À ton rythme actuel, environ{' '}
                <Text style={S.palierBold}>~{monthsToTarget} mois</Text> 🌱
              </>
            ) : projectionIsEstimate ? (
              'Précise en cm ou mesure 2× au mètre (espacées de 1 mois) pour activer le délai estimé.'
            ) : growthPerMonth <= 0 ? (
              'Ajoute des mesures régulières pour obtenir une projection.'
            ) : (
              'Tu as déjà atteint ou dépassé ton objectif — bravo !'
            )}
          </Text>
          <Text style={S.palierPct}>{palierPct}% de l’objectif</Text>
        </View>

        <TouchableOpacity style={S.primaryBtn} onPress={openGoalModal}>
          <Ionicons name="flag-outline" size={18} color="#fff" />
          <Text style={S.primaryBtnText}>Modifier mon objectif</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={S.secondaryBtn}
          onPress={() => router.push('/hair-length' as any)}
        >
          <Ionicons name="add-circle-outline" size={18} color={Colors.ink} />
          <Text style={S.secondaryBtnText}>Nouvelle mesure</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={S.linkBtn}
          onPress={() => router.push('/growth' as any)}
        >
          <Text style={S.linkBtnText}>Voir toute ma progression →</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showObjectif} transparent animationType="fade" onRequestClose={() => setShowObjectif(false)}>
        <TouchableOpacity style={S.modalOverlay} activeOpacity={1} onPress={() => setShowObjectif(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%', paddingHorizontal: 24 }}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <View style={S.objSheet}>
                <Text style={S.objTitle}>Objectif de longueur</Text>
                <HairLengthLandmarkPicker
                  title="Longueur souhaitée"
                  value={objTargetLandmark}
                  onChange={setObjTargetLandmark}
                />
                {objTargetLandmark ? (
                  <>
                    <Text style={[S.objLabel, { marginTop: 10 }]}>Préciser en cm (optionnel)</Text>
                    <TextInput
                      style={S.objInput}
                      value={objTargetCm}
                      onChangeText={setObjTargetCm}
                      keyboardType="decimal-pad"
                      placeholder="ex. 50"
                      placeholderTextColor={Colors.border}
                    />
                  </>
                ) : null}
                <Text style={[S.objLabel, { marginTop: 14 }]}>Date cible (optionnel)</Text>
                <TouchableOpacity style={[S.objInput, S.objDateRow]} onPress={() => setShowObjCal(v => !v)}>
                  <Text style={objDate ? S.objDateText : S.objDatePlaceholder}>
                    {objDate ? formatFull(objDate) : 'Choisir une date'}
                  </Text>
                  <Ionicons name="calendar-outline" size={18} color={Colors.warmGray} />
                </TouchableOpacity>
                {showObjCal ? (
                  <MiniCalendar
                    selectedDate={objDate}
                    onSelect={d => {
                      setObjDate(d);
                      setShowObjCal(false);
                    }}
                    horizontalOffset={96}
                  />
                ) : null}
                <TouchableOpacity
                  style={[S.objBtn, !objTargetLandmark.trim() && S.objBtnDisabled]}
                  disabled={!objTargetLandmark.trim()}
                  onPress={() => {
                    if (!objTargetLandmark.trim()) return;
                    dispatch({
                      type: 'updateProfile',
                      payload: {
                        targetLength: objTargetLandmark.trim(),
                        ...(objDate
                          ? { objectiveTargetDate: toLocalISODate(objDate) }
                          : {}),
                      },
                    });
                    void trackProductEvent('growth_goal_set', {
                      target_cm: objTargetLandmark.trim(),
                      target_date: objDate ? toLocalISODate(objDate) : '',
                    });
                    setShowObjectif(false);
                  }}
                >
                  <Text style={S.objBtnText}>Enregistrer</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 32 },

  estimateBanner: {
    backgroundColor: Colors.amberLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.amber + '44',
    padding: 12,
    marginBottom: 12,
  },
  estimateBannerText: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.ink,
    lineHeight: 17,
  },

  hintCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  hintEmoji: { fontSize: 36, marginBottom: 8 },
  hintTitle: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 6 },
  hintSub: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 14,
  },
  hintBtn: {
    backgroundColor: Colors.ink,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  hintBtnText: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: '#fff' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    alignItems: 'center',
  },
  statVal: { fontSize: 22, fontFamily: 'Satoshi_500Medium', color: Colors.ink },
  statLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginTop: 4,
    textAlign: 'center',
  },

  paceCard: {
    backgroundColor: Colors.growthLight,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.growth + '33',
  },
  paceLabel: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    color: Colors.growth,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  paceVal: { fontSize: 18, fontFamily: 'Satoshi_500Medium', color: Colors.ink },
  paceSub: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginTop: 6,
    lineHeight: 17,
  },

  palierCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 16,
  },
  palierHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  palierTitle: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  palierSub: { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 4 },
  palierBold: { fontFamily: 'DMSans_700Bold', color: Colors.amber },
  barBg: {
    height: 8,
    backgroundColor: Colors.cream,
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: Colors.amber, borderRadius: 999 },
  palierNote: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.ink,
    marginTop: 12,
    lineHeight: 19,
  },
  palierPct: {
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
    marginTop: 8,
    textAlign: 'right',
  },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.ink,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  primaryBtnText: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: '#fff' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    marginBottom: 12,
  },
  secondaryBtnText: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  linkBtn: { alignItems: 'center', paddingVertical: 8 },
  linkBtnText: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.amberDark },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
  },
  objSheet: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 22,
  },
  objTitle: { fontSize: 18, fontFamily: 'Satoshi_500Medium', color: Colors.ink, marginBottom: 16 },
  objLabel: { fontSize: 12, fontFamily: 'DMSans_700Bold', color: Colors.warmGray, marginBottom: 6 },
  objInput: {
    backgroundColor: Colors.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: Colors.ink,
  },
  objDateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  objDateText: { fontSize: 15, fontFamily: 'DMSans_400Regular', color: Colors.ink },
  objDatePlaceholder: { fontSize: 15, fontFamily: 'DMSans_400Regular', color: Colors.border },
  objBtn: {
    marginTop: 18,
    backgroundColor: Colors.ink,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  objBtnDisabled: { backgroundColor: Colors.border },
  objBtnText: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: '#fff' },
});
