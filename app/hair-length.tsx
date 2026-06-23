import { useCallback, useState } from 'react';
import { FirstMeasureGuidePopin } from '../src/components/FirstMeasureGuidePopin';
import {
  Image, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/theme/colors';
import { useApp, type GrowthEntry } from '../src/context/AppContext';
import {
  avgLatestGrowthCm,
  buildPostMeasurementContext,
} from '../src/lib/coachMoments';
import { AppHeader } from '../src/components/AppHeader';
import { ProfileLengthLandmarksForm } from '../src/components/profile/ProfileLengthLandmarksForm';
import { HAIR_MEASURE_ZONES, type HairMeasureZoneKey } from '../src/constants/growthZones';
import { toLocalISODate, latestCmByZone } from '../src/lib/homeGrowth';
import { trackMeasurementSaved } from '../src/lib/growthAnalytics';
import { isHairLengthLandmark } from '../src/constants/hairLengthLandmarks';

const ZONES = HAIR_MEASURE_ZONES;
type ZoneKey = HairMeasureZoneKey;

export default function HairLengthScreen() {
  const router = useRouter();
  const { state, dispatch, queueBcTrigger } = useApp();
  const { growthHistory, profile } = state;

  const TODAY = toLocalISODate(new Date());

  const [values, setValues] = useState<Record<ZoneKey, string>>({
    devant: '', gauche: '', droite: '', derriere: '',
  });
  const [guideOpen, setGuideOpen] = useState(false);
  const [landmarkLength, setLandmarkLength] = useState(profile.length ?? '');
  const [landmarkTarget, setLandmarkTarget] = useState(profile.targetLength ?? '');
  const [landmarkSaved, setLandmarkSaved] = useState(false);

  // Re-sync depuis le profil quand l'utilisateur revient sur cet écran
  useFocusEffect(useCallback(() => {
    setLandmarkLength(profile.length ?? '');
    setLandmarkTarget(profile.targetLength ?? '');
    setLandmarkSaved(false);
  }, [profile.length, profile.targetLength]));

  const hasZoneHistory = growthHistory.length > 0;

  const zoneLengths = ZONES.map(z => {
    const input = parseFloat(values[z.key]);
    const last  = latestCmByZone(growthHistory, z.zone);
    return isNaN(input) ? last : input;
  }).filter((v): v is number => v !== null);

  const avgLength = zoneLengths.length > 0
    ? Math.round((zoneLengths.reduce((a, b) => a + b, 0) / zoneLengths.length) * 10) / 10
    : 0;

  function handleSave() {
    const wasEmpty = growthHistory.length === 0;
    let saved = false;
    ZONES.forEach(z => {
      const cm = parseFloat(values[z.key]);
      if (!isNaN(cm) && cm > 0) {
        dispatch({ type: 'addGrowthEntry', entry: { date: TODAY, zone: z.zone, cm } });
        saved = true;
      }
    });
    if (saved) {
      const zonesCount = ZONES.filter(z => {
        const cm = parseFloat(values[z.key]);
        return !isNaN(cm) && cm > 0;
      }).length;
      const beforeAvg = avgLatestGrowthCm(growthHistory);
      const added: Pick<GrowthEntry, 'date' | 'zone' | 'cm'>[] = ZONES.flatMap(z => {
        const cm = parseFloat(values[z.key]);
        return !isNaN(cm) && cm > 0 ? [{ date: TODAY, zone: z.zone, cm }] : [];
      });
      const afterAvg = avgLatestGrowthCm([...growthHistory, ...added]);
      const deltaCm =
        beforeAvg != null && afterAvg != null ? +(afterAvg - beforeAvg).toFixed(1) : null;
      queueBcTrigger('post_measurement', buildPostMeasurementContext({
        streak: state.streak,
        deltaCm: wasEmpty ? null : deltaCm,
        currentCm: afterAvg,
      }));
      void trackMeasurementSaved({
        source: 'hair_length',
        zonesCount,
        wasFirst: wasEmpty,
      });
      router.back();
    }
  }

  const anyFilled = ZONES.some(z => parseFloat(values[z.key]) > 0);

  function handleSaveLandmarks() {
    const length = landmarkLength.trim();
    const targetLength = landmarkTarget.trim();
    if (!length && !targetLength) return;
    dispatch({
      type: 'updateProfile',
      payload: { length, targetLength },
    });
    setLandmarkSaved(true);
    void trackMeasurementSaved({
      source: 'hair_length_landmark',
      zonesCount: 0,
      wasFirst: !hasZoneHistory && !isHairLengthLandmark(profile.length),
    });
  }

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <AppHeader
          title="Ma longueur"
          rightAction="custom"
          rightSlot={
            <TouchableOpacity
              style={S.graphBtn}
              onPress={() => router.push('/growth' as any)}
              accessibilityRole="button"
              accessibilityLabel="Voir la progression"
            >
              <Text style={S.graphBtnText}>📈 Progression</Text>
            </TouchableOpacity>
          }
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.content}>

          {!hasZoneHistory ? (
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
              onSave={handleSaveLandmarks}
              saved={landmarkSaved}
            />
          ) : null}

          {!hasZoneHistory ? (
            <Text style={S.orDivider}>Ou mesure au mètre ruban</Text>
          ) : null}

          {/* Carte longueur max */}
          <View style={S.summaryCard}>
            <View>
              <Text style={S.summaryLabel}>LONGUEUR MOYENNE</Text>
              <Text style={S.summaryValue}>
                {avgLength > 0 ? `${avgLength} cm` : '— cm'}
              </Text>
              <Text style={S.summarySub}>
                {avgLength > 0 ? 'Mise à jour aujourd\'hui' : 'Saisis tes mesures ci-dessous'}
              </Text>
            </View>
            <View style={S.summaryIcon}>
              <Text style={{ fontSize: 36 }}>📏</Text>
            </View>
          </View>

          {/* Zones */}
          <Text style={S.secTitle}>Mesure par zone</Text>
          <Text style={S.secSub}>Entre la longueur en centimètres du cheveu le plus long dans chaque zone.</Text>
          <TouchableOpacity
            onPress={() => setGuideOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Voir le guide de première mesure"
          >
            <Text style={S.guideLink}>Comment mesurer ? Voir le guide pas à pas</Text>
          </TouchableOpacity>

          <View style={S.zonesCard}>
            {ZONES.map((z, i) => {
              const last = latestCmByZone(growthHistory, z.zone);
              return (
                <View key={z.key} style={[S.zoneRow, i < ZONES.length - 1 && S.zoneBorder]}>
                  {/* Image */}
                  <View style={S.zoneImgWrap}>
                    <Image source={z.img} style={S.zoneImg} resizeMode="contain" />
                  </View>

                  {/* Infos + input */}
                  <View style={S.zoneBody}>
                    <Text style={S.zoneLabel}>{z.label.toUpperCase()}</Text>
                    {last !== null && (
                      <Text style={S.zoneLast}>Dernier relevé : {last} cm</Text>
                    )}
                    <View style={S.zoneInputRow}>
                      <TextInput
                        style={S.zoneInput}
                        placeholder={last !== null ? String(last) : '0'}
                        placeholderTextColor={Colors.warmGray}
                        keyboardType="decimal-pad"
                        value={values[z.key]}
                        onChangeText={v => setValues(prev => ({ ...prev, [z.key]: v }))}
                      />
                      <Text style={S.zoneUnit}>cm</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Bouton sauvegarder */}
          <TouchableOpacity
            style={[S.saveBtn, !anyFilled && S.saveBtnDisabled]}
            disabled={!anyFilled}
            onPress={handleSave}
          >
            <Text style={S.saveBtnText}>Enregistrer les mesures</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <FirstMeasureGuidePopin
        visible={guideOpen}
        onClose={() => setGuideOpen(false)}
        onStartMeasure={() => setGuideOpen(false)}
      />
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 8 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontFamily: 'Satoshi_500Medium', color: Colors.ink },
  graphBtn: {
    backgroundColor: Colors.cream, borderRadius: 999,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  graphBtnText: { fontSize: 11, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },

  // Summary card
  summaryCard: {
    backgroundColor: Colors.ink, borderRadius: 20, padding: 20,
    marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 10, fontFamily: 'DMSans_700Bold',
    color: 'rgba(255,255,255,0.45)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6,
  },
  summaryValue: {
    fontSize: 42, fontFamily: 'Satoshi_500Medium', color: Colors.amber, lineHeight: 48,
  },
  summarySub: {
    fontSize: 11, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.5)', marginTop: 4,
  },
  summaryIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },

  orDivider: {
    marginTop: 8,
    marginBottom: 4,
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
    textAlign: 'center',
  },

  // Section
  secTitle: { fontSize: 18, fontFamily: 'Satoshi_500Medium', color: Colors.ink, marginTop: 24, marginBottom: 4 },
  secSub:   { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 18, marginBottom: 8 },
  guideLink: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.amberDark,
    marginBottom: 16,
  },

  // Zones
  zonesCard: {
    backgroundColor: Colors.surface, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  zoneRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 16, padding: 16,
  },
  zoneBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  zoneImgWrap: {
    width: 80, height: 80, borderRadius: 16,
    backgroundColor: Colors.cream,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  zoneImg: { width: 70, height: 70 },
  zoneBody: { flex: 1 },
  zoneLabel: {
    fontSize: 11, fontFamily: 'DMSans_700Bold', color: Colors.ink,
    letterSpacing: 0.8, marginBottom: 4,
  },
  zoneLast: {
    fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginBottom: 8,
  },
  zoneInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  zoneInput: {
    flex: 1, backgroundColor: Colors.cream,
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 18, fontFamily: 'DMSans_700Bold', color: Colors.ink,
    textAlign: 'center',
  },
  zoneUnit: {
    fontSize: 14, fontFamily: 'DMSans_600SemiBold', color: Colors.warmGray,
  },

  // Save
  saveBtn: {
    marginTop: 20, backgroundColor: Colors.ink,
    borderRadius: 16, paddingVertical: 16, alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: Colors.border },
  saveBtnText: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: '#fff' },
});
