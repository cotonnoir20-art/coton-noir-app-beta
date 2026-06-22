import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import * as Notifications from 'expo-notifications';
import { Colors } from '../src/theme/colors';
import { Fonts } from '../src/theme/typography';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

type Phase = 'prep' | 'pose' | 'done';

const RADIUS = 88;
const STROKE = 10;
const CIRCUM = 2 * Math.PI * RADIUS;
const SIZE = 220;
const CENTER = SIZE / 2;

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

async function scheduleNotif(id: string, seconds: number, title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: { title, body, sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, repeats: false },
  });
}

async function cancelNotif(id: string) {
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}

async function requestNotifPermission() {
  if (Platform.OS === 'web') return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export default function SoinTimerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    name?: string;
    prepMinutes?: string;
    poseMinutes?: string;
  }>();

  const recipeName  = params.name ?? 'Soin';
  const prepTotal   = Math.round(Number(params.prepMinutes ?? 0) * 60);
  const poseTotal   = Math.round(Number(params.poseMinutes ?? 20) * 60);

  const [phase, setPhase]         = useState<Phase>(prepTotal > 0 ? 'prep' : 'pose');
  const [secondsLeft, setSeconds] = useState(prepTotal > 0 ? prepTotal : poseTotal);
  const [running, setRunning]     = useState(false);
  const [paused, setPaused]       = useState(false);

  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef  = useRef<number>(0);
  const phaseRef      = useRef<Phase>(prepTotal > 0 ? 'prep' : 'pose');
  const notifPrepId   = 'soin-prep-end';
  const notifPoseId   = 'soin-pose-end';

  const phaseTotal = phase === 'prep' ? prepTotal : poseTotal;
  const progress   = phaseTotal > 0 ? secondsLeft / phaseTotal : 0;

  const phaseColor =
    phase === 'done' ? '#2E7D32'
    : phase === 'prep' ? '#5C6BC0'
    : Colors.amber;

  // ── Tick — utilise phaseRef pour éviter la stale closure ──
  const tick = useCallback(() => {
    setSeconds(prev => {
      if (prev <= 1) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;

        if (phaseRef.current === 'prep') {
          phaseRef.current = 'pose';
          setPhase('pose');
          setSeconds(poseTotal);
          setRunning(false);
        } else {
          phaseRef.current = 'done';
          setPhase('done');
          setRunning(false);
        }
        return 0;
      }
      return prev - 1;
    });
  }, [poseTotal]);

  // ── Auto-démarrer la pose après la prep ──
  useEffect(() => {
    if (phase === 'pose' && !running && !paused && secondsLeft === poseTotal && poseTotal > 0) {
      startPhase('pose');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Reprendre depuis le background ──
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active' && running && startedAtRef.current > 0) {
        const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
        setSeconds(prev => Math.max(0, prev - elapsed));
        startedAtRef.current = Date.now();
      }
    });
    return () => sub.remove();
  }, [running]);

  // ── Cleanup ──
  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current!);
      cancelNotif(notifPrepId);
      cancelNotif(notifPoseId);
    };
  }, []);

  async function startPhase(p: Phase) {
    const permitted = await requestNotifPermission();
    const secs = p === 'prep' ? prepTotal : poseTotal;

    if (permitted && secs > 0) {
      if (p === 'prep') {
        await scheduleNotif(notifPrepId, secs,
          'Préparation terminée ✅',
          `Applique maintenant ton soin ${recipeName}.`);
        if (poseTotal > 0) {
          await scheduleNotif(notifPoseId, secs + poseTotal,
            `${recipeName} terminé 🎉`,
            'Ton soin est prêt — rince ou coiffe !');
        }
      } else {
        await cancelNotif(notifPrepId);
        await scheduleNotif(notifPoseId, secs,
          `${recipeName} terminé 🎉`,
          'Ton soin est prêt — rince ou coiffe !');
      }
    }

    startedAtRef.current = Date.now();
    setRunning(true);
    setPaused(false);
    intervalRef.current = setInterval(tick, 1000);
  }

  function pause() {
    clearInterval(intervalRef.current!);
    intervalRef.current = null;
    cancelNotif(notifPrepId);
    cancelNotif(notifPoseId);
    setRunning(false);
    setPaused(true);
  }

  function resume() {
    startedAtRef.current = Date.now();
    setRunning(true);
    setPaused(false);
    // Replanifier les notifs avec le temps restant
    requestNotifPermission().then(ok => {
      if (!ok) return;
      if (phase === 'pose') {
        scheduleNotif(notifPoseId, secondsLeft,
          `${recipeName} terminé 🎉`,
          'Ton soin est prêt — rince ou coiffe !');
      }
    });
    intervalRef.current = setInterval(tick, 1000);
  }

  function stop() {
    clearInterval(intervalRef.current!);
    cancelNotif(notifPrepId);
    cancelNotif(notifPoseId);
    router.back();
  }

  function restart() {
    clearInterval(intervalRef.current!);
    cancelNotif(notifPrepId);
    cancelNotif(notifPoseId);
    const initPhase: Phase = prepTotal > 0 ? 'prep' : 'pose';
    phaseRef.current = initPhase;
    setPhase(initPhase);
    setSeconds(initPhase === 'prep' ? prepTotal : poseTotal);
    setRunning(false);
    setPaused(false);
  }

  // ── Libellés ──
  const phaseLabel =
    phase === 'prep' ? 'Préparation'
    : phase === 'pose' ? 'Temps de pose'
    : 'Soin terminé !';

  const hasPrep  = prepTotal > 0;
  const hasPose  = poseTotal > 0;

  return (
    <SafeAreaView style={S.safe} edges={['top', 'bottom']}>

      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={stop} style={S.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={20} color={Colors.ink} />
        </TouchableOpacity>
        <View style={S.headerCenter}>
          <Text style={S.headerTitle} numberOfLines={1}>{recipeName}</Text>
          <Text style={S.headerSub}>Timer soin</Text>
        </View>
        {(running || paused) && (
          <TouchableOpacity onPress={stop} hitSlop={12}>
            <Text style={S.stopText}>Arrêter</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={S.body}>

        {/* Phases indicator */}
        {hasPrep && hasPose && (
          <View style={S.phases}>
            <View style={S.phaseStep}>
              <View style={[S.phaseDot, phase !== 'prep' && { backgroundColor: '#2E7D32' },
                phase === 'prep' && { backgroundColor: '#5C6BC0' }]} />
              <Text style={[S.phaseStepLabel,
                phase === 'prep' && { color: '#5C6BC0', fontFamily: Fonts.bodySemi }]}>
                Prépa
              </Text>
            </View>
            <View style={[S.phaseLine, phase !== 'prep' && { backgroundColor: '#2E7D32' }]} />
            <View style={S.phaseStep}>
              <View style={[S.phaseDot,
                phase === 'done' && { backgroundColor: '#2E7D32' },
                phase === 'pose' && { backgroundColor: Colors.amber },
                phase === 'prep' && { backgroundColor: Colors.border }]} />
              <Text style={[S.phaseStepLabel,
                phase === 'pose' && { color: Colors.amber, fontFamily: Fonts.bodySemi },
                phase === 'prep' && { color: Colors.warmGray }]}>
                Pose
              </Text>
            </View>
            <View style={[S.phaseLine, phase === 'done' && { backgroundColor: '#2E7D32' }]} />
            <View style={S.phaseStep}>
              <View style={[S.phaseDot,
                phase === 'done' && { backgroundColor: '#2E7D32' },
                phase !== 'done' && { backgroundColor: Colors.border }]} />
              <Text style={[S.phaseStepLabel,
                phase === 'done' && { color: '#2E7D32', fontFamily: Fonts.bodySemi },
                phase !== 'done' && { color: Colors.warmGray }]}>
                Terminé
              </Text>
            </View>
          </View>
        )}

        {/* Cercle SVG */}
        <View style={S.circleWrap}>
          <Svg width={SIZE} height={SIZE}>
            {/* Fond */}
            <Circle
              cx={CENTER} cy={CENTER} r={RADIUS}
              stroke={Colors.border} strokeWidth={STROKE} fill="none"
            />
            {/* Progression */}
            {phase !== 'done' && (
              <Circle
                cx={CENTER} cy={CENTER} r={RADIUS}
                stroke={phaseColor} strokeWidth={STROKE} fill="none"
                strokeLinecap="round"
                strokeDasharray={CIRCUM}
                strokeDashoffset={CIRCUM * (1 - progress)}
                transform={`rotate(-90 ${CENTER} ${CENTER})`}
              />
            )}
            {/* Complet */}
            {phase === 'done' && (
              <Circle
                cx={CENTER} cy={CENTER} r={RADIUS}
                stroke="#2E7D32" strokeWidth={STROKE} fill="none"
              />
            )}
          </Svg>

          {/* Contenu central */}
          <View style={S.circleContent}>
            {phase === 'done' ? (
              <>
                <Ionicons name="checkmark-circle" size={48} color="#2E7D32" />
                <Text style={S.doneLabel}>Soin terminé !</Text>
              </>
            ) : (
              <>
                <Text style={[S.countdown, { color: phaseColor }]}>{fmt(secondsLeft)}</Text>
                <Text style={S.phaseLabel}>{phaseLabel}</Text>
              </>
            )}
          </View>
        </View>

        {/* Boutons */}
        {phase === 'done' ? (
          <View style={S.actions}>
            <TouchableOpacity style={[S.btn, S.btnSecondary]} onPress={restart}>
              <Ionicons name="refresh" size={18} color={Colors.ink} />
              <Text style={S.btnSecondaryText}>Recommencer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[S.btn, S.btnPrimary, { backgroundColor: '#2E7D32' }]} onPress={stop}>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={S.btnPrimaryText}>Terminer</Text>
            </TouchableOpacity>
          </View>
        ) : !running && !paused ? (
          <TouchableOpacity
            style={[S.btn, S.btnPrimary, S.btnFull, { backgroundColor: phaseColor }]}
            onPress={() => startPhase(phase)}
            activeOpacity={0.85}
          >
            <Ionicons name="play" size={20} color="#fff" />
            <Text style={S.btnPrimaryText}>
              {phase === 'prep' ? 'Commencer la préparation' : 'Commencer le soin'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={S.actions}>
            <TouchableOpacity style={[S.btn, S.btnSecondary]} onPress={running ? pause : resume}>
              <Ionicons name={running ? 'pause' : 'play'} size={18} color={Colors.ink} />
              <Text style={S.btnSecondaryText}>{running ? 'Pause' : 'Reprendre'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[S.btn, S.btnPrimary]} onPress={stop}>
              <Ionicons name="stop" size={18} color="#fff" />
              <Text style={S.btnPrimaryText}>Arrêter</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Durées récap */}
        {phase !== 'done' && (
          <View style={S.durations}>
            {hasPrep && (
              <View style={S.durChip}>
                <Ionicons name="time-outline" size={14} color="#5C6BC0" />
                <Text style={S.durText}>Prépa {Math.round(prepTotal / 60)} min</Text>
              </View>
            )}
            {hasPose && (
              <View style={S.durChip}>
                <Ionicons name="hourglass-outline" size={14} color={Colors.amber} />
                <Text style={S.durText}>Pose {Math.round(poseTotal / 60)} min</Text>
              </View>
            )}
          </View>
        )}

        {Platform.OS !== 'web' && (
          <Text style={S.notifHint}>
            Une notification te préviendra même si tu fermes l'app.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  backBtn:      { padding: 4 },
  headerCenter: { flex: 1 },
  headerTitle:  { fontSize: 16, fontFamily: Fonts.displayBold, color: Colors.ink },
  headerSub:    { fontSize: 12, fontFamily: Fonts.body, color: Colors.warmGray, marginTop: 1 },
  stopText:     { fontSize: 13, fontFamily: Fonts.bodyMedium, color: '#D32F2F' },

  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 32,
  },

  // Phases
  phases: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  phaseStep:  { alignItems: 'center', gap: 4 },
  phaseDot:   { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.border },
  phaseLine:  { width: 48, height: 2, backgroundColor: Colors.border, marginBottom: 16 },
  phaseStepLabel: {
    fontSize: 11,
    fontFamily: Fonts.body,
    color: Colors.ink,
    marginTop: 4,
  },

  // Cercle
  circleWrap: { position: 'relative', width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  circleContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  countdown:  { fontSize: 52, fontFamily: Fonts.displayBold, lineHeight: 56 },
  phaseLabel: { fontSize: 13, fontFamily: Fonts.body, color: Colors.warmGray },
  doneLabel:  { fontSize: 18, fontFamily: Fonts.displayBold, color: '#2E7D32', marginTop: 8 },

  // Boutons
  actions: { flexDirection: 'row', gap: 12, width: '100%' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 15,
    flex: 1,
  },
  btnFull:      { flex: 0, width: '100%' },
  btnPrimary:   { backgroundColor: Colors.amber },
  btnSecondary: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  btnPrimaryText:   { fontSize: 15, fontFamily: Fonts.displayBold, color: '#fff' },
  btnSecondaryText: { fontSize: 15, fontFamily: Fonts.displayBold, color: Colors.ink },

  // Durées
  durations: { flexDirection: 'row', gap: 12 },
  durChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  durText: { fontSize: 12, fontFamily: Fonts.bodySemi, color: Colors.ink },

  notifHint: {
    fontSize: 11,
    fontFamily: Fonts.body,
    color: Colors.warmGray,
    textAlign: 'center',
  },
});
