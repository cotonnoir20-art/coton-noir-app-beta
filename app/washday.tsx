import { useState, useEffect, useRef, useMemo } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/theme/colors';
import { useApp } from '../src/context/AppContext';
import { BCEmojiAvatar } from '../src/components/blackCotton/BCEmojiAvatar';
import { AppHeader } from '../src/components/AppHeader';
import { CompletionLottieOverlay } from '../src/components/animations/CompletionLottieOverlay';
import { hapticSuccess } from '../src/lib/haptics';
import { CC_WASHDAY_COMPLETE, PTS_WASHDAY_COMPLETE, formatDualEarnReward } from '../src/lib/cotonCoins';
import {
  averageMonthlyWashdays,
  averageWashdayIntervalDays,
  buildLast6MonthsWashdayFrequency,
  countWashdaysInMonth,
  formatWashdayHistoryDate,
  getCompletedWashdayDaysInMonth,
  getWashdayHistoryEntries,
} from '../src/lib/washdayHistory';

const WASH_TYPES = [
  'Shampoing classique',
  'Co-wash',
  'No-poo',
  'Shampoing clarifiant',
  'Shampoing doux',
];

/* ── Data ── */
const WEEK = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTH_NAMES_WD = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const CHECKLIST_STEPS = [
  { id: 1, label: 'Pré-poo',             icon: '🫙', dur: '30 min' },
  { id: 2, label: 'Démêlage',            icon: '🪮', dur: '15 min' },
  { id: 3, label: 'Shampoing',           icon: '🫧', dur: '10 min' },
  { id: 4, label: 'Masque hydratant',    icon: '🧴', dur: '20 min' },
  { id: 5, label: 'Rinçage froid',       icon: '❄️', dur: '5 min'  },
  { id: 6, label: 'Leave-in + huile',    icon: '💧', dur: '10 min' },
  { id: 7, label: 'Coiffage',            icon: '✨', dur: '15 min' },
  { id: 8, label: 'Protection nocturne', icon: '🌙', dur: '5 min'  },
];

const TIMER_PRESETS = [
  { label: 'Pré-poo',  min: 30, icon: '🫙' },
  { label: 'Masque',   min: 20, icon: '🧴' },
  { label: 'Leave-in', min: 10, icon: '💧' },
  { label: 'Perso',    min: 5,  icon: '⏱️', custom: true },
];

const REMINDER_TIMES = ['07:00', '08:00', '09:00', '10:00', '18:00', '20:00'];

const TIPS = [
  { e: '💧', title: 'Démêle sur humide',   tip: "Ne jamais démêler à sec. Applique un après-shampoing et travaille section par section de bas en haut." },
  { e: '🧴', title: 'Pré-poo protecteur',  tip: "Applique de l'huile avant le shampoing pour former un bouclier et limiter le dessèchement."           },
  { e: '❄️', title: 'Rinçage froid final', tip: "Termine toujours par un rinçage à l'eau froide pour sceller les cuticules et réduire les frisottis."   },
  { e: '📝', title: 'Note tes produits',   tip: "Après chaque wash day, note ce qui a fonctionné ou non pour affiner ta routine au fil du temps."        },
];

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function WashDayScreen() {
  const router = useRouter();
  const { state, dispatch, validateRoutineSecure } = useApp();
  const { width } = useWindowDimensions();
  const calWidth  = width - 40 - 32;
  const cellSize  = Math.floor((calWidth - 7 * 6) / 7);

  /* ── Compte à rebours prochain wash day ── */
  const todayMs       = new Date().setHours(0, 0, 0, 0);
  const todayStrWd    = new Date().toISOString().slice(0, 10);
  const futureSoinsWd = state.plannedSoins
    .filter(s => s.date >= todayStrWd)
    .sort((a, b) => a.date.localeCompare(b.date));
  const nextSoinWd    = futureSoinsWd[0] ?? null;
  const nextMs        = nextSoinWd ? new Date(nextSoinWd.date + 'T00:00:00').getTime() : null;
  const daysUntil     = nextMs !== null ? Math.max(0, Math.round((nextMs - todayMs) / 86400000)) : null;
  const nextWashLabel = nextSoinWd
    ? new Date(nextSoinWd.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    : 'Aucun soin planifié';

  /* ── Calendrier dynamique ── */
  const todayReal = new Date();
  const [calDate, setCalDate] = useState(() => { const n = new Date(); return { year: n.getFullYear(), month: n.getMonth() }; });
  const daysInMonthWd = new Date(calDate.year, calDate.month + 1, 0).getDate();
  const firstOffsetWd = (new Date(calDate.year, calDate.month, 1).getDay() + 6) % 7;
  const isCurMonthWd  = calDate.year === todayReal.getFullYear() && calDate.month === todayReal.getMonth();

  const washdayHistory = useMemo(
    () => getWashdayHistoryEntries(state.coinHistory),
    [state.coinHistory],
  );
  const hasWashdayHistory = washdayHistory.length > 0;

  const completedWashDaysWd = useMemo(
    () => getCompletedWashdayDaysInMonth(state.coinHistory, calDate.year, calDate.month),
    [state.coinHistory, calDate.year, calDate.month],
  );

  const washdaysThisMonth = useMemo(
    () => countWashdaysInMonth(state.coinHistory, todayReal.getFullYear(), todayReal.getMonth()),
    [state.coinHistory, todayReal],
  );

  const avgWashInterval = useMemo(
    () => averageWashdayIntervalDays(washdayHistory),
    [washdayHistory],
  );

  const monthlyFreq = useMemo(
    () => buildLast6MonthsWashdayFrequency(state.coinHistory),
    [state.coinHistory],
  );
  const avgMonthlyWash = useMemo(
    () => averageMonthlyWashdays(monthlyFreq),
    [monthlyFreq],
  );
  const freqMax = useMemo(
    () => Math.max(1, ...monthlyFreq.map(m => m.count)),
    [monthlyFreq],
  );

  const plannedSoinDaysWd = new Set(
    state.plannedSoins
      .filter(s => {
        const d = new Date(s.date);
        return d.getFullYear() === calDate.year && d.getMonth() === calDate.month;
      })
      .map(s => new Date(s.date).getDate())
  );

  function prevMonthWd() {
    setCalDate(d => d.month === 0 ? { year: d.year - 1, month: 11 } : { ...d, month: d.month - 1 });
  }
  function nextMonthWd() {
    setCalDate(d => d.month === 11 ? { year: d.year + 1, month: 0 } : { ...d, month: d.month + 1 });
  }

  /* ── Timer ── */
  const [timerPreset, setTimerPreset]   = useState(0);
  const [customMin, setCustomMin]       = useState(5);
  const [timeLeft, setTimeLeft]         = useState(TIMER_PRESETS[0].min * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerDone, setTimerDone]       = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedPreset = TIMER_PRESETS[timerPreset];
  const totalSecs      = (selectedPreset.custom ? customMin : selectedPreset.min) * 60;
  const timerPct       = totalSecs > 0 ? Math.round(((totalSecs - timeLeft) / totalSecs) * 100) : 0;

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current!);
            setTimerRunning(false);
            setTimerDone(true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current!);
    }
    return () => clearInterval(intervalRef.current!);
  }, [timerRunning]);

  const selectPreset = (i: number) => {
    setTimerPreset(i);
    const mins = TIMER_PRESETS[i].custom ? customMin : TIMER_PRESETS[i].min;
    setTimeLeft(mins * 60);
    setTimerRunning(false);
    setTimerDone(false);
  };

  const resetTimer = () => {
    const mins = selectedPreset.custom ? customMin : selectedPreset.min;
    setTimeLeft(mins * 60);
    setTimerRunning(false);
    setTimerDone(false);
  };

  const washPlan = state.routinePlans?.washday ?? null;

  const checklistSteps = useMemo(() => {
    if (washPlan) {
      return state.routineSteps.washday.map((s, i) => ({
        id: s.id,
        label: s.title,
        icon: ['🫙', '🪮', '🫧', '🧴', '❄️', '💧', '✨', '🌙'][i % 8],
        dur: s.duration,
      }));
    }
    return CHECKLIST_STEPS;
  }, [washPlan, state.routineSteps.washday]);

  /* ── Checklists ── */
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const doneCount = checklistSteps.filter(s => checked[s.id]).length;
  const checkPct  = checklistSteps.length > 0
    ? Math.round((doneCount / checklistSteps.length) * 100)
    : 0;

  /* ── Rappel ── */
  const [reminderTime, setReminderTime]     = useState('09:00');
  const [editingReminder, setEditingReminder] = useState(false);
  const [reminderSaved, setReminderSaved]   = useState(false);

  /* ── Soins planifiés ── */
  const futureSoins = futureSoinsWd;
  const nextSoin    = nextSoinWd;
  const [showGerer, setShowGerer] = useState(false);

  /* ── Édition d'un soin ── */
  const [showEdit, setShowEdit]           = useState(false);
  const [editingSoinId, setEditingSoinId] = useState<number | null>(null);
  const [editDate, setEditDate]           = useState(new Date());
  const [editType, setEditType]           = useState(WASH_TYPES[0]);
  const [showEditPicker, setShowEditPicker] = useState(false);

  function openEdit(s: { id: number; date: string; soinType: string }) {
    setEditingSoinId(s.id);
    setEditDate(new Date(s.date + 'T00:00:00'));
    setEditType(s.soinType);
    setShowEdit(true);
  }

  function onEditDateChange(_: any, date?: Date) {
    if (Platform.OS === 'android') setShowEditPicker(false);
    if (date) setEditDate(date);
  }

  function handleEditSave() {
    if (!editingSoinId) return;
    dispatch({
      type: 'updatePlannedSoin',
      id: editingSoinId,
      soin: { soinType: editType, date: editDate.toISOString().slice(0, 10) },
    });
    setShowEdit(false);
  }

  function formatSoinDate(iso: string) {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  /* ── Évaluation ── */
  const [showRating, setShowRating] = useState(false);
  const [stars, setStars]           = useState(0);
  const [ratingNote, setRatingNote] = useState('');
  const [ratingDone, setRatingDone] = useState(false);

  /* ── Récompense wash day (1× / jour) ── */
  const isWashdayValidated = state.validated.washday;
  const [completionOpen, setCompletionOpen] = useState(false);
  const earnLabel = formatDualEarnReward(CC_WASHDAY_COMPLETE, PTS_WASHDAY_COMPLETE);

  async function completeWashday(): Promise<boolean> {
    if (state.validated.washday) return false;
    hapticSuccess();
    const result = await validateRoutineSecure('washday');
    if (!result.ok) return false;
    setCompletionOpen(true);
    return true;
  }

  return (
    <SafeAreaView style={S.safe} edges={['top']}>

      <AppHeader title="Wash Day" />

      {/* ── Prochain wash day countdown (fixe) ── */}
      <View style={S.countdownCard}>
        <View style={S.countdownLeft}>
          <Text style={S.countdownLabel}>
            {daysUntil !== null ? 'PROCHAIN WASH DAY DANS' : 'PROCHAIN WASH DAY'}
          </Text>
          <View style={S.countdownRow}>
            {daysUntil !== null
              ? <>
                  <Text style={S.countdownNum}>{daysUntil}</Text>
                  <Text style={S.countdownUnit}>jours</Text>
                </>
              : <Text style={S.countdownUnit}>—</Text>
            }
          </View>
          <Text style={S.countdownDate}>{nextWashLabel}</Text>
        </View>
        <View style={S.countdownIcon}>
          <Text style={{ fontSize: 32 }}>🚿</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.content}>

        <TouchableOpacity
          style={S.planCard}
          onPress={() => router.push({ pathname: '/routine-plan', params: { kind: 'washday' } } as any)}
          activeOpacity={0.85}
        >
          <View style={S.planCardLeft}>
            <Text style={S.planCardEmoji}>{washPlan ? '✏️' : '🚿'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={S.planCardTitle}>
                {washPlan ? 'Modifier mon wash day' : 'Définir mon wash day'}
              </Text>
              <Text style={S.planCardSub} numberOfLines={2}>
                {washPlan
                  ? washPlan.mode === 'try_new'
                    ? `Test · ${washPlan.name}`
                    : washPlan.name
                  : 'Produits, recettes, étapes et retours sur tes cheveux'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.warmGray} />
        </TouchableOpacity>

        {washPlan && (washPlan.hairStateComment || washPlan.evolutionComment) ? (
          <View style={S.notesCard}>
            <View style={S.notesHeader}>
              <BCEmojiAvatar size={36} mood="thinking" />
              <Text style={S.notesTitle}>Tes notes cheveux</Text>
            </View>
            {!!washPlan.hairStateComment && (
              <Text style={S.notesText}>
                <Text style={S.notesBold}>État : </Text>
                {washPlan.hairStateComment}
              </Text>
            )}
            {!!washPlan.evolutionComment && (
              <Text style={[S.notesText, !!washPlan.hairStateComment && { marginTop: 8 }]}>
                <Text style={S.notesBold}>Évolution : </Text>
                {washPlan.evolutionComment}
              </Text>
            )}
          </View>
        ) : null}

        {/* ── Calendrier ── */}
        <View style={S.calCard}>
          {/* Boutons action */}
          <View style={S.calBtns}>
            <TouchableOpacity style={S.btnRose} onPress={() => router.push('/add-washday')}>
              <Text style={S.btnRoseText}>+ Ajouter un wash day</Text>
            </TouchableOpacity>
            <TouchableOpacity style={S.btnInk} onPress={() => router.push('/(tabs)/analyze')}>
              <Text style={S.btnInkText}>↗ Analyser</Text>
            </TouchableOpacity>
          </View>

          {/* En-tête calendrier */}
          <View style={S.calHeader}>
            <Text style={S.calTitle}>Calendrier des lavages</Text>
            <View style={S.calLegend}>
              <View style={S.legendItem}>
                <View style={[S.legendDot, { backgroundColor: Colors.rose }]} />
                <Text style={S.legendText}>Effectué</Text>
              </View>
              <View style={S.legendItem}>
                <View style={S.legendDotPlanned} />
                <Text style={S.legendText}>Planifié</Text>
              </View>
            </View>
          </View>

          {/* Navigation mois */}
          <View style={S.calNav}>
            <TouchableOpacity style={S.calNavBtn} onPress={prevMonthWd}><Text style={S.calNavArrow}>‹</Text></TouchableOpacity>
            <Text style={S.calMonth}>{MONTH_NAMES_WD[calDate.month]} {calDate.year}</Text>
            <TouchableOpacity style={S.calNavBtn} onPress={nextMonthWd}><Text style={S.calNavArrow}>›</Text></TouchableOpacity>
          </View>

          {/* Jours de la semaine */}
          <View style={S.weekRow}>
            {WEEK.map((d, i) => (
              <View key={i} style={[S.weekCell, { width: cellSize, margin: 3 }]}>
                <Text style={S.weekLabel}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Grille des jours */}
          <View style={S.daysGrid}>
            {Array.from({ length: firstOffsetWd }).map((_, i) => (
              <View key={'e' + i} style={{ width: cellSize, height: cellSize, margin: 3 }} />
            ))}
            {Array.from({ length: daysInMonthWd }, (_, i) => i + 1).map(d => {
              const isToday   = isCurMonthWd && d === todayReal.getDate();
              const isWash    = completedWashDaysWd.has(d);
              const isPlanned = plannedSoinDaysWd.has(d);
              return (
                <TouchableOpacity
                  key={d}
                  style={[
                    S.dayCell,
                    { width: cellSize, height: cellSize, borderRadius: cellSize / 2 },
                    isToday   && S.dayCellToday,
                    isWash    && S.dayCellWash,
                    isPlanned && S.dayCellPlanned,
                  ]}
                >
                  <Text style={[S.dayText, (isToday || isWash) && S.dayTextLight]}>{d}</Text>
                </TouchableOpacity>
              );
            })}
          </View>


        </View>

        {/* ── Prochain wash day (carte sombre) ── */}
        <View style={S.nextCard}>
          <Text style={S.nextEmoji}>🌿</Text>
          <View style={S.nextInfo}>
            <Text style={S.nextDate} numberOfLines={1}>
              {nextSoin ? formatSoinDate(nextSoin.date) : 'Aucun soin planifié'}
            </Text>
            <Text style={S.nextSub}>
              {nextSoin ? `Wash Day · ${nextSoin.soinType}` : 'Appuie sur Gérer pour planifier'}
            </Text>
          </View>
          <TouchableOpacity style={S.gererBtn} onPress={() => setShowGerer(true)}>
            <Text style={S.gererBtnText}>Gérer</Text>
          </TouchableOpacity>
        </View>

        {/* ── Modal gestion soins planifiés ── */}
        <Modal visible={showGerer} transparent animationType="slide" onRequestClose={() => setShowGerer(false)}>
          <TouchableOpacity style={S.modalOverlay} activeOpacity={1} onPress={() => setShowGerer(false)}>
            <View style={S.modalSheet}>
              <View style={S.modalHandle} />
              <Text style={S.modalTitle}>Wash days planifiés</Text>

              {futureSoins.length === 0 ? (
                <Text style={S.modalEmpty}>Aucun soin planifié</Text>
              ) : (
                futureSoins.map(s => (
                  <View key={s.id} style={S.modalRow}>
                    <View style={S.modalRowInfo}>
                      <Text style={S.modalRowDate} numberOfLines={1}>
                        {formatSoinDate(s.date)}
                      </Text>
                      <Text style={S.modalRowType}>{s.soinType}</Text>
                    </View>
                    <View style={S.modalRowBtns}>
                      <TouchableOpacity
                        style={S.modalEditBtn}
                        onPress={() => { setShowGerer(false); openEdit(s); }}
                      >
                        <Text style={S.modalEditText}>Modifier</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={S.modalDeleteBtn}
                        onPress={() => dispatch({ type: 'removePlannedSoin', id: s.id })}
                      >
                        <Ionicons name="trash-outline" size={15} color={Colors.rose} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}

              <TouchableOpacity
                style={S.modalAddBtn}
                onPress={() => { setShowGerer(false); router.push('/add-washday' as any); }}
              >
                <Text style={S.modalAddBtnText}>+ Ajouter un wash day</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* ── Modal édition soin ── */}
        <Modal visible={showEdit} transparent animationType="slide" onRequestClose={() => setShowEdit(false)}>
          <TouchableOpacity style={S.modalOverlay} activeOpacity={1} onPress={() => setShowEdit(false)}>
            <View style={S.editSheet}>
              <View style={S.modalHandle} />
              <Text style={S.modalTitle}>Modifier le soin</Text>

              {/* Date */}
              <Text style={S.editLabel}>Date</Text>
              <TouchableOpacity style={S.editDateRow} onPress={() => setShowEditPicker(true)}>
                <Ionicons name="calendar-outline" size={18} color={Colors.amber} />
                <Text style={S.editDateText}>
                  {editDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              </TouchableOpacity>

              {showEditPicker && Platform.OS === 'android' && (
                <DateTimePicker
                  value={editDate}
                  mode="date"
                  minimumDate={new Date()}
                  onChange={onEditDateChange}
                />
              )}
              {Platform.OS === 'ios' && showEditPicker && (
                <DateTimePicker
                  value={editDate}
                  mode="date"
                  display="spinner"
                  minimumDate={new Date()}
                  onChange={onEditDateChange}
                  locale="fr-FR"
                  style={{ width: '100%' }}
                />
              )}

              {/* Type */}
              <Text style={S.editLabel}>Type de soin</Text>
              <View style={S.editTypeWrap}>
                {WASH_TYPES.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[S.editTypePill, editType === t && S.editTypePillActive]}
                    onPress={() => setEditType(t)}
                  >
                    <Text style={[S.editTypePillText, editType === t && S.editTypePillTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Actions */}
              <View style={S.editBtns}>
                <TouchableOpacity style={S.editCancelBtn} onPress={() => setShowEdit(false)}>
                  <Text style={S.editCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={S.editSaveBtn} onPress={handleEditSave}>
                  <Text style={S.editSaveText}>Enregistrer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* ── Rappel ── */}
        <View style={S.reminderCard}>
          <View style={S.reminderTop}>
            <View style={S.reminderLeft}>
              <View style={S.reminderIcon}><Text style={{ fontSize: 20 }}>🔔</Text></View>
              <View>
                <Text style={S.reminderTitle}>
                  {reminderSaved ? `Rappel · ${reminderTime}` : 'Prochain rappel dans 2 jours'}
                </Text>
                <Text style={S.reminderSub}>
                  {reminderSaved ? 'Rappel enregistré ✓' : 'Vendredi 30 avr. · 09:00'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[S.reminderBtn, editingReminder && S.reminderBtnActive]}
              onPress={() => { setEditingReminder(e => !e); setReminderSaved(false); }}
            >
              <Text style={[S.reminderBtnText, editingReminder && S.reminderBtnTextActive]}>
                {editingReminder ? 'Fermer' : 'Modifier'}
              </Text>
            </TouchableOpacity>
          </View>

          {editingReminder && (
            <View style={{ marginTop: 14 }}>
              <Text style={S.reminderPickerLabel}>Choisir l'heure du rappel</Text>
              <View style={S.reminderTimesRow}>
                {REMINDER_TIMES.map(h => (
                  <TouchableOpacity
                    key={h}
                    style={[S.reminderTimePill, reminderTime === h && S.reminderTimePillActive]}
                    onPress={() => setReminderTime(h)}
                  >
                    <Text style={[S.reminderTimePillText, reminderTime === h && S.reminderTimePillTextActive]}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={S.reminderSaveBtn} onPress={() => { setReminderSaved(true); setEditingReminder(false); }}>
                <Text style={S.reminderSaveBtnText}>🔔 Enregistrer le rappel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Checklist wash day en cours ── */}
        <View style={[S.checklistCard, { borderColor: Colors.amber, marginTop: 14 }]}>
          <View style={S.checklistHeader}>
            <View>
              <Text style={S.checklistTitle}>
                {washPlan?.name?.trim() ? washPlan.name : 'Checklist wash day'}
              </Text>
              <Text style={S.checklistSub}>{doneCount}/{checklistSteps.length} étapes · {checkPct}%</Text>
              {!isWashdayValidated && (
                <Text style={S.checklistRewardHint}>Terminer pour {earnLabel}</Text>
              )}
            </View>
            {checkPct === 100 && (
              <View style={S.doneBadge}><Text style={S.doneBadgeText}>Terminé ✓</Text></View>
            )}
          </View>
          <View style={S.checklistBarBg}>
            <View style={[S.checklistBarFill, {
              width: `${checkPct}%` as any,
              backgroundColor: checkPct === 100 ? Colors.sage : Colors.amber,
            }]} />
          </View>
          {checklistSteps.map((step, i) => (
            <TouchableOpacity
              key={step.id}
              style={[S.checkRow, i < checklistSteps.length - 1 && S.checkRowBorder]}
              onPress={() => setChecked(c => ({ ...c, [step.id]: !c[step.id] }))}
            >
              <View style={[S.checkBox, { borderRadius: 6 }, checked[step.id] && S.checkBoxDone]}>
                {checked[step.id] && <Text style={S.checkMark}>✓</Text>}
              </View>
              <Text style={S.checkIcon}>{step.icon}</Text>
              <Text style={[S.checkLabel, { flex: 1 }, checked[step.id] && S.checkLabelDone]}>{step.label}</Text>
              <Text style={S.checkDur}>{step.dur}</Text>
            </TouchableOpacity>
          ))}
          {checkPct === 100 && !isWashdayValidated && (
            <TouchableOpacity style={S.validateBtn} onPress={completeWashday}>
              <Text style={S.validateBtnText}>🚿 Terminer mon wash day · {earnLabel}</Text>
            </TouchableOpacity>
          )}
          {isWashdayValidated && (
            <View style={S.washdayRewardCard}>
              <BCEmojiAvatar size={44} mood="celebrating" />
              <View style={{ flex: 1 }}>
                <Text style={S.washdayRewardTitle}>Wash day effectué aujourd'hui</Text>
                <Text style={S.washdayRewardSub}>
                  {earnLabel} crédités · visible dans Récompenses
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Minuteur ── */}
        <View style={S.timerCard}>
          <Text style={S.timerTitle}>⏱ Minuteur de soin</Text>
          {/* Presets */}
          <View style={S.timerPresets}>
            {TIMER_PRESETS.map((p, i) => (
              <TouchableOpacity
                key={i}
                style={[S.timerPreset, timerPreset === i && S.timerPresetActive]}
                onPress={() => selectPreset(i)}
              >
                <Text style={{ fontSize: 14 }}>{p.icon}</Text>
                <Text style={[S.timerPresetLabel, timerPreset === i && S.timerPresetLabelActive]}>{p.label}</Text>
                {!p.custom && <Text style={S.timerPresetMin}>{p.min} min</Text>}
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom minutes */}
          {selectedPreset.custom && (
            <View style={S.customRow}>
              <TouchableOpacity style={S.customBtn} onPress={() => { const m = Math.max(1, customMin - 1); setCustomMin(m); setTimeLeft(m * 60); }}>
                <Text style={S.customBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={S.customMin}>{customMin} min</Text>
              <TouchableOpacity style={S.customBtn} onPress={() => { const m = customMin + 1; setCustomMin(m); setTimeLeft(m * 60); }}>
                <Text style={S.customBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Timer circle (simplified - no SVG) */}
          <View style={S.timerCircleWrap}>
            <View style={[S.timerCircle, timerDone && S.timerCircleDone]}>
              <Text style={[S.timerTime, timerDone && S.timerTimeDone]}>
                {timerDone ? '✓' : fmt(timeLeft)}
              </Text>
              <Text style={S.timerLabel}>{timerDone ? 'Terminé !' : selectedPreset.label}</Text>
            </View>
            {/* Progress bar under circle */}
            <View style={S.timerBarBg}>
              <View style={[S.timerBarFill, { width: `${timerPct}%` as any, backgroundColor: timerDone ? Colors.sage : Colors.amber }]} />
            </View>
          </View>

          {/* Controls */}
          <View style={S.timerControls}>
            <TouchableOpacity
              style={[S.timerStartBtn, timerRunning && S.timerPauseBtn]}
              onPress={() => setTimerRunning(r => !r)}
              disabled={timerDone}
            >
              <Text style={S.timerStartBtnText}>{timerRunning ? '⏸ Pause' : '▶ Démarrer'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={S.timerResetBtn} onPress={resetTimer}>
              <Text style={S.timerResetBtnText}>↺ Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Évaluation ── */}
        {ratingDone ? (
          <View style={S.ratingDoneCard}>
            <Text style={{ fontSize: 22, textAlign: 'center', marginBottom: 6 }}>✓</Text>
            <Text style={S.ratingDoneTitle}>Évaluation enregistrée !</Text>
            <Text style={S.ratingDoneSub}>
              {'★'.repeat(stars)} · Ajouté à l'historique
              {isWashdayValidated ? ` · ${earnLabel}` : ''}
            </Text>
          </View>
        ) : !showRating ? (
          <TouchableOpacity style={S.ratingOpenBtn} onPress={() => setShowRating(true)}>
            <Text style={S.ratingOpenBtnText}>⭐ Évaluer ce wash day</Text>
          </TouchableOpacity>
        ) : (
          <View style={S.ratingCard}>
            <Text style={S.ratingCardTitle}>⭐ Évaluer ce wash day</Text>
            <Text style={S.ratingCardLabel}>Note globale</Text>
            <View style={S.starsRow}>
              {[1, 2, 3, 4, 5].map(s => (
                <TouchableOpacity key={s} onPress={() => setStars(s)}>
                  <Text style={[S.star, s <= stars && S.starActive]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={S.ratingCardLabel}>Commentaire rapide</Text>
            <TextInput
              style={S.ratingInput}
              multiline
              numberOfLines={3}
              placeholder="Comment étaient tes cheveux ? Qu'est-ce qui a bien fonctionné ?"
              placeholderTextColor={Colors.warmGray}
              value={ratingNote}
              onChangeText={setRatingNote}
            />
            <View style={S.ratingBtns}>
              <TouchableOpacity style={S.ratingCancelBtn} onPress={() => setShowRating(false)}>
                <Text style={S.ratingCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[S.ratingSaveBtn, !stars && S.ratingSaveBtnDisabled]}
                onPress={() => { if (stars > 0) { setRatingDone(true); setShowRating(false); } }}
              >
                <Text style={S.ratingSaveText}>Enregistrer l'évaluation</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Historique ── */}
        <Text style={S.secTitle}>Historique</Text>
        {!hasWashdayHistory ? (
          <View style={S.emptyBlock}>
            <Text style={S.emptyEmoji}>🚿</Text>
            <Text style={S.emptyTitle}>Aucun wash day enregistré</Text>
            <Text style={S.emptySub}>
              Termine ta checklist et valide ton wash day pour voir ton historique ici.
            </Text>
            <TouchableOpacity style={S.emptyBtn} onPress={() => router.push('/add-washday')}>
              <Text style={S.emptyBtnText}>Planifier un wash day</Text>
            </TouchableOpacity>
          </View>
        ) : (
          washdayHistory.map((h, i) => {
            const { d, m } = formatWashdayHistoryDate(h.date);
            return (
              <View key={h.id} style={S.histRow}>
                <View style={S.histDate}>
                  <Text style={S.histDay}>{d}</Text>
                  <Text style={S.histMonth}>{m}</Text>
                  {i < washdayHistory.length - 1 && <View style={S.histLine} />}
                </View>
                <View style={S.histCard}>
                  <View style={S.histCardTop}>
                    <View style={S.histTypePill}>
                      <Text style={S.histTypePillText}>Wash day</Text>
                    </View>
                    {h.amount > 0 && (
                      <Text style={S.histDur}>+{h.amount} CC</Text>
                    )}
                  </View>
                  <Text style={S.histNote}>{h.label}</Text>
                </View>
              </View>
            );
          })
        )}

        {/* ── Stats ── */}
        <Text style={S.secTitle}>Mes statistiques</Text>
        {!hasWashdayHistory ? (
          <View style={S.emptyBlock}>
            <Text style={S.emptyEmoji}>📊</Text>
            <Text style={S.emptyTitle}>Pas encore de statistiques</Text>
            <Text style={S.emptySub}>
              Valide ton premier wash day pour débloquer tes indicateurs personnalisés.
            </Text>
          </View>
        ) : (
          <View style={S.statsGrid}>
            <View style={S.statCard}>
              <Text style={{ fontSize: 22, marginBottom: 6 }}>💧</Text>
              <Text style={S.statVal}>{washdaysThisMonth}</Text>
              <Text style={S.statLabel}>Lavages ce mois</Text>
              <Text style={S.statSub}>
                {washdaysThisMonth === 0 ? 'Aucun ce mois-ci' : 'Wash days validés'}
              </Text>
            </View>
            <View style={S.statCard}>
              <Text style={{ fontSize: 22, marginBottom: 6 }}>📅</Text>
              <Text style={S.statVal}>{washdayHistory.length}</Text>
              <Text style={S.statLabel}>Total enregistrés</Text>
              <Text style={S.statSub}>Depuis ton inscription</Text>
            </View>
            <View style={S.statCard}>
              <Text style={{ fontSize: 22, marginBottom: 6 }}>⏱️</Text>
              <Text style={S.statVal}>
                {avgWashInterval != null ? `${avgWashInterval}j` : '—'}
              </Text>
              <Text style={S.statLabel}>Fréquence moyenne</Text>
              <Text style={S.statSub}>
                {avgWashInterval != null ? 'Entre deux lavages' : '2 wash days min.'}
              </Text>
            </View>
            <View style={S.statCard}>
              <Text style={{ fontSize: 22, marginBottom: 6 }}>⭐</Text>
              <Text style={S.statVal}>—</Text>
              <Text style={S.statLabel}>Note moyenne</Text>
              <Text style={S.statSub}>Évalue ton prochain wash day</Text>
            </View>
          </View>
        )}

        {/* ── Fréquence ── */}
        <Text style={S.secTitle}>Fréquence</Text>
        {!hasWashdayHistory ? (
          <View style={S.emptyBlock}>
            <Text style={S.emptyEmoji}>📅</Text>
            <Text style={S.emptyTitle}>Fréquence non calculée</Text>
            <Text style={S.emptySub}>
              Après quelques wash days, tu verras ici ton rythme idéal et l’évolution sur 6 mois.
            </Text>
          </View>
        ) : (
          <>
            {avgWashInterval != null && (
              <View style={S.freqBanner}>
                <View style={S.freqIcon}>
                  <Text style={{ fontSize: 22 }}>📊</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={S.freqText}>
                    Tu laves tes cheveux tous les{' '}
                    <Text style={S.freqHighlight}>{avgWashInterval} jours</Text>
                    {' '}en moyenne
                  </Text>
                  <View style={S.freqBadgeRow}>
                    {avgWashInterval >= 7 && avgWashInterval <= 10 ? (
                      <View style={S.freqBadge}>
                        <Text style={S.freqBadgeText}>✓ IDÉAL</Text>
                      </View>
                    ) : null}
                    <Text style={S.freqSub}>
                      {state.profile.hairType ? `Type ${state.profile.hairType}` : 'Ton profil'}
                      {' · '}Recommandé : 7–10 jours
                    </Text>
                  </View>
                </View>
              </View>
            )}
            <View style={S.freqChart}>
              <View style={S.freqChartTop}>
                <View>
                  <Text style={S.freqChartTitle}>Fréquence mensuelle</Text>
                  <Text style={S.freqChartSub}>Wash days sur 6 mois</Text>
                </View>
                {avgMonthlyWash != null && (
                  <View style={S.freqChartBadge}>
                    <Text style={S.freqChartBadgeText}>Moy. {String(avgMonthlyWash).replace('.', ',')}/mois</Text>
                  </View>
                )}
              </View>
              <View style={S.barsRow}>
                {monthlyFreq.map((m, i) => {
                  const isCurrent = i === monthlyFreq.length - 1;
                  const barH = Math.round((m.count / freqMax) * 72);
                  return (
                    <View key={`${m.year}-${m.month}`} style={S.barWrap}>
                      <Text style={[S.barVal, isCurrent && { color: Colors.amber }]}>{m.count}</Text>
                      <View style={[
                        S.bar,
                        {
                          height: barH,
                          backgroundColor: isCurrent ? Colors.amber : Colors.cream,
                          borderWidth: isCurrent ? 0 : 1,
                          borderColor: Colors.border,
                        },
                      ]} />
                      <Text style={S.barMonth}>{m.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {/* ── Produits favoris ── */}
        <Text style={S.secTitle}>Produits favoris</Text>
        <View style={S.emptyBlock}>
          <Text style={S.emptyEmoji}>🧴</Text>
          <Text style={S.emptyTitle}>
            {hasWashdayHistory ? 'Aucun produit noté' : 'Pas encore de favoris wash day'}
          </Text>
          <Text style={S.emptySub}>
            {hasWashdayHistory
              ? 'Évalue ton wash day et note tes produits pour les retrouver ici.'
              : 'Après ton premier wash day, tes produits les plus utilisés apparaîtront ici.'}
          </Text>
          <TouchableOpacity style={S.emptyBtn} onPress={() => router.push('/favorites')}>
            <Text style={S.emptyBtnText}>Voir mes favoris</Text>
          </TouchableOpacity>
        </View>

        {/* ── Tips ── */}
        <View style={S.tipsBlock}>
          <View style={S.tipsHeader}>
            <BCEmojiAvatar size={40} mood="coaching" />
            <View style={{ flex: 1 }}>
              <Text style={S.tipsHeaderTitle}>Conseils Black Cotton</Text>
              <Text style={S.tipsHeaderSub}>Astuces pour ton wash day</Text>
            </View>
          </View>
          {TIPS.map((tip, i) => (
            <View key={i} style={[S.tipRow, i < TIPS.length - 1 && S.tipRowBorder]}>
              <Text style={S.tipEmoji}>{tip.e}</Text>
              <View style={{ flex: 1 }}>
                <Text style={S.tipTitle}>{tip.title}</Text>
                <Text style={S.tipText}>{tip.tip}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <CompletionLottieOverlay
        visible={completionOpen}
        variant="strong"
        onClose={() => setCompletionOpen(false)}
        caption={`Wash day effectué ! ${earnLabel}`}
      />
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 20 },

  planCard: {
    marginTop: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
  },
  planCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  planCardEmoji: { fontSize: 28 },
  planCardTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: Colors.ink },
  planCardSub: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.warmGray, marginTop: 2 },
  notesCard: {
    marginBottom: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
  },
  notesHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  notesTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: Colors.ink },
  notesText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.ink, lineHeight: 19 },
  notesBold: { fontFamily: 'DMSans_700Bold' },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 20, fontFamily: 'Poppins_700Bold', color: Colors.ink },
  coinsBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.ink, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  coinsEmoji: { fontSize: 15 },
  coinsText:  { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.amber },

  // Countdown banner
  countdownCard: {
    backgroundColor: Colors.ink,
    paddingHorizontal: 20, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  countdownLeft:  { flex: 1 },
  countdownLabel: { fontSize: 9, fontFamily: 'DMSans_700Bold', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 },
  countdownRow:   { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 4 },
  countdownNum:   { fontSize: 52, fontFamily: 'DMSans_700Bold', color: Colors.amber, lineHeight: 56 },
  countdownUnit:  { fontSize: 18, fontFamily: 'DMSans_600SemiBold', color: 'rgba(255,255,255,0.7)' },
  countdownDate:  { fontSize: 12, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.55)', textTransform: 'capitalize' },
  countdownIcon:  { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  // Calendar
  calCard:    { backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.border, borderRadius: 18, padding: 16, marginTop: 8 },
  calHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  calTitle:   { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  calLegend:  { flexDirection: 'row', gap: 12 },
  calNav:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  calNavBtn:  { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  calNavArrow:{ fontSize: 18, color: Colors.ink, fontFamily: 'DMSans_600SemiBold' },
  calMonth:   { fontSize: 18, fontFamily: 'Poppins_700Bold', color: Colors.ink },
  weekRow:    { flexDirection: 'row', marginBottom: 8 },
  weekCell:   { alignItems: 'center' },
  weekLabel:  { fontSize: 10, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },
  daysGrid:   { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell:    { margin: 3, alignItems: 'center', justifyContent: 'center' },
  dayCellToday:   { backgroundColor: Colors.ink },
  dayCellWash:    { backgroundColor: Colors.rose },
  dayCellPlanned: { borderWidth: 2, borderColor: Colors.amber },
  dayText:      { fontSize: 12, fontFamily: 'DMSans_500Medium', color: Colors.ink },
  dayTextLight: { color: '#fff' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendDotPlanned: { width: 8, height: 8, borderRadius: 4, borderWidth: 2, borderColor: Colors.amber },
  legendText: { fontSize: 10, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
  calBtns:    { flexDirection: 'row', gap: 10, marginBottom: 14 },
  // CTA primaire : noir plein (action principale "Ajouter un wash day").
  btnRose:    { flex: 1, backgroundColor: Colors.ink, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  btnRoseText:{ fontSize: 13, fontFamily: 'DMSans_700Bold', color: '#fff' },
  // CTA secondaire : ghost cream (action complémentaire "Analyser").
  btnInk:     { flex: 1, backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  btnInkText: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink },

  // Next wash day card
  nextCard:  { backgroundColor: Colors.ink, borderRadius: 18, padding: 18, marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 14 },
  nextEmoji: { fontSize: 28 },
  nextInfo:  { flex: 1, minWidth: 0 },
  nextDate:  { fontSize: 20, fontFamily: 'Poppins_700Bold', color: '#fff' },
  nextSub:   { fontSize: 12, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  gererBtn:  { backgroundColor: Colors.amber, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, flexShrink: 0 },
  gererBtnText: { fontSize: 12, fontFamily: 'DMSans_700Bold', color: '#fff' },

  // Modal gestion
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet:   { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 16 },
  modalHandle:  { width: 40, height: 4, borderRadius: 999, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 8 },
  modalTitle:   { fontSize: 18, fontFamily: 'Poppins_700Bold', color: Colors.ink },
  modalEmpty:   { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, textAlign: 'center', paddingVertical: 16 },
  modalRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.cream, borderRadius: 14, padding: 14 },
  modalRowInfo: { flex: 1, minWidth: 0 },
  modalRowDate: { fontSize: 14, fontFamily: 'DMSans_600SemiBold', color: Colors.ink, textTransform: 'capitalize' },
  modalRowType: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 2 },
  modalRowBtns:    { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  modalEditBtn:    { backgroundColor: Colors.amberLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  modalEditText:   { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: Colors.amber },
  modalDeleteBtn:  { backgroundColor: Colors.blush, borderRadius: 10, width: 32, height: 32, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  modalDeleteText: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: Colors.rose },
  modalAddBtn:     { backgroundColor: Colors.ink, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  modalAddBtnText: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: '#fff' },

  // Edit modal
  editSheet:       { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 0 },
  editLabel:       { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.ink, marginBottom: 8, marginTop: 16 },
  editDateRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14 },
  editDateText:    { fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.ink },
  editTypeWrap:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  editTypePill:    { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.cream },
  editTypePillActive:     { borderColor: Colors.amber, backgroundColor: Colors.amberLight },
  editTypePillText:       { fontSize: 12, fontFamily: 'DMSans_500Medium', color: Colors.ink },
  editTypePillTextActive: { fontFamily: 'DMSans_600SemiBold', color: Colors.amber },
  editBtns:        { flexDirection: 'row', gap: 10, marginTop: 24 },
  editCancelBtn:   { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  editCancelText:  { fontSize: 14, fontFamily: 'DMSans_600SemiBold', color: Colors.warmGray },
  editSaveBtn:     { flex: 2, paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.ink, alignItems: 'center' },
  editSaveText:    { fontSize: 14, fontFamily: 'DMSans_700Bold', color: '#fff' },

  // Frequency banner
  freqBanner: { borderRadius: 18, padding: 16, marginTop: 14, backgroundColor: '#1A3A2A', flexDirection: 'row', alignItems: 'center', gap: 12 },
  freqIcon:   { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  freqText:   { fontSize: 13, fontFamily: 'DMSans_700Bold', color: '#fff', lineHeight: 20 },
  freqHighlight: { color: Colors.amber },
  freqBadgeRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  freqBadge:     { backgroundColor: Colors.sage, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  freqBadgeText: { fontSize: 9, fontFamily: 'DMSans_700Bold', color: '#fff' },
  freqSub:       { fontSize: 11, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.65)' },

  // Reminder
  reminderCard:  { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 18, padding: 16, marginTop: 14 },
  reminderTop:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reminderLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  reminderIcon:  { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FEF3E2', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  reminderTitle: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  reminderSub:   { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 1 },
  reminderBtn:   { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  reminderBtnActive: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  reminderBtnText:      { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },
  reminderBtnTextActive:{ color: '#fff' },
  reminderPickerLabel:  { fontSize: 12, fontFamily: 'DMSans_500Medium', color: Colors.warmGray, marginBottom: 10 },
  reminderTimesRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  reminderTimePill:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: '#fff' },
  reminderTimePillActive:     { borderColor: Colors.amber, backgroundColor: Colors.amberLight },
  reminderTimePillText:       { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },
  reminderTimePillTextActive: { color: Colors.amber },
  reminderSaveBtn:     { backgroundColor: Colors.ink, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  reminderSaveBtnText: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: '#fff' },

  // Section title
  secTitle: { fontSize: 17, fontFamily: 'Poppins_600SemiBold', color: Colors.ink, marginTop: 22, marginBottom: 12 },

  emptyBlock: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyEmoji: { fontSize: 32, marginBottom: 10 },
  emptyTitle: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.ink,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  emptyBtn: {
    backgroundColor: Colors.ink,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  emptyBtnText: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: '#fff' },

  // Checklists
  checklistCard:   { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 20, padding: 16 },
  checklistHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  checklistTitle:  { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  checklistSub:    { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 1 },
  checklistRewardHint: { fontSize: 11, fontFamily: 'DMSans_600SemiBold', color: Colors.amber, marginTop: 4 },
  validateBtn:     { marginTop: 14, backgroundColor: Colors.sage, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 12, alignItems: 'center' },
  validateBtnText: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: '#fff', textAlign: 'center' },
  washdayRewardCard: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.sageLight, borderRadius: 14, padding: 12 },
  washdayRewardTitle: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  washdayRewardSub:   { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 2 },
  doneBadge:       { backgroundColor: Colors.sage, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  doneBadgeText:   { fontSize: 10, fontFamily: 'DMSans_700Bold', color: '#fff' },
  checklistBarBg:  { height: 4, backgroundColor: Colors.cream, borderRadius: 999, overflow: 'hidden', marginBottom: 14 },
  checklistBarFill:{ height: 4, borderRadius: 999 },
  checkRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 4 },
  checkRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  checkBox:    { width: 22, height: 22, flexShrink: 0, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  checkBoxDone:      { backgroundColor: Colors.sage,  borderColor: Colors.sage  },
  checkBoxDoneGreen: { backgroundColor: '#A8D8B0',    borderColor: '#A8D8B0'    },
  checkMark:  { fontSize: 12, color: '#fff', fontFamily: 'DMSans_700Bold' },
  checkIcon:  { fontSize: 16, flexShrink: 0 },
  checkLabel: { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.ink },
  checkLabelDone: { textDecorationLine: 'line-through', color: Colors.warmGray },
  checkNote:  { fontSize: 10, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 1 },
  checkDur:   { fontSize: 10, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, flexShrink: 0 },

  // Timer
  timerCard: { backgroundColor: Colors.ink, borderRadius: 20, padding: 18, marginTop: 14 },
  timerTitle: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: '#fff', marginBottom: 12 },
  timerPresets: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  timerPreset: { flex: 1, padding: 8, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', gap: 2 },
  timerPresetActive: { borderColor: Colors.amber, backgroundColor: 'rgba(242,160,74,0.2)' },
  timerPresetLabel:  { fontSize: 9, fontFamily: 'DMSans_600SemiBold', color: 'rgba(255,255,255,0.6)' },
  timerPresetLabelActive: { color: Colors.amber },
  timerPresetMin: { fontSize: 9, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.4)' },
  customRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14 },
  customBtn:  { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  customBtnText: { fontSize: 18, color: '#fff' },
  customMin:  { fontSize: 20, fontFamily: 'DMSans_700Bold', color: '#fff', minWidth: 60, textAlign: 'center' },
  timerCircleWrap: { alignItems: 'center', marginBottom: 16 },
  timerCircle:     { width: 120, height: 120, borderRadius: 60, borderWidth: 8, borderColor: Colors.amber, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  timerCircleDone: { borderColor: Colors.sage },
  timerTime:       { fontSize: 26, fontFamily: 'DMSans_700Bold', color: '#fff' },
  timerTimeDone:   { color: Colors.sage },
  timerLabel:      { fontSize: 10, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  timerBarBg:      { width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999, overflow: 'hidden' },
  timerBarFill:    { height: 4, borderRadius: 999 },
  timerControls:   { flexDirection: 'row', gap: 10, marginTop: 4 },
  timerStartBtn:   { flex: 2, padding: 12, borderRadius: 14, backgroundColor: Colors.amber, alignItems: 'center' },
  timerPauseBtn:   { backgroundColor: 'rgba(255,255,255,0.15)' },
  timerStartBtnText:{ fontSize: 14, fontFamily: 'DMSans_700Bold', color: '#fff' },
  timerResetBtn:   { flex: 1, padding: 12, borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center' },
  timerResetBtnText:{ fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: 'rgba(255,255,255,0.8)' },

  // Rating
  ratingOpenBtn:  { marginTop: 14, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ratingOpenBtnText: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  ratingCard:     { marginTop: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, padding: 18 },
  ratingCardTitle:{ fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 14 },
  ratingCardLabel:{ fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: Colors.warmGray, marginBottom: 8 },
  starsRow:       { flexDirection: 'row', gap: 8, marginBottom: 14 },
  star:           { fontSize: 28, color: Colors.border },
  starActive:     { color: Colors.amber },
  ratingInput:    { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 10, fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.ink, minHeight: 80, textAlignVertical: 'top', marginBottom: 16 },
  ratingBtns:     { flexDirection: 'row', gap: 8 },
  ratingCancelBtn:{ flex: 1, padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  ratingCancelText:{ fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.warmGray },
  ratingSaveBtn:      { flex: 2, padding: 12, borderRadius: 12, backgroundColor: Colors.ink, alignItems: 'center' },
  ratingSaveBtnDisabled: { backgroundColor: Colors.border },
  ratingSaveText: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: '#fff' },
  ratingDoneCard: { marginTop: 14, backgroundColor: Colors.sage, borderRadius: 18, padding: 16, alignItems: 'center' },
  ratingDoneTitle:{ fontSize: 14, fontFamily: 'DMSans_700Bold', color: '#fff', textAlign: 'center' },
  ratingDoneSub:  { fontSize: 12, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.75)', marginTop: 4 },

  // History
  histRow:   { flexDirection: 'row', gap: 12 },
  histDate:  { width: 50, alignItems: 'center' },
  histDay:   { fontSize: 22, fontFamily: 'Poppins_700Bold', color: Colors.ink },
  histMonth: { fontSize: 10, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
  histLine:  { flex: 1, width: 2, backgroundColor: Colors.border, minHeight: 30, marginTop: 6 },
  histCard:  { flex: 1, backgroundColor: Colors.cream, borderRadius: 16, padding: 14, marginBottom: 10 },
  histCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  histTypePill: { backgroundColor: Colors.blush, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  histTypePillText: { fontSize: 10, fontFamily: 'DMSans_600SemiBold', color: Colors.rose },
  histDur:   { fontSize: 10, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginLeft: 'auto' as any },
  histTags:  { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 8 },
  histTag:   { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  histTagText: { fontSize: 10, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
  histNote:  { fontSize: 12, fontFamily: 'DMSans_400Regular', fontStyle: 'italic', color: Colors.warmGray },
  histStars: { fontSize: 12, marginTop: 6 },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard:  { width: '47%', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 14 },
  statVal:   { fontSize: 22, fontFamily: 'Poppins_700Bold', color: Colors.ink },
  statLabel: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: Colors.ink, marginTop: 2 },
  statSub:   { fontSize: 10, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 2 },

  // Freq chart
  freqChart:      { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 18, padding: 16, marginTop: 10 },
  freqChartTop:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  freqChartTitle: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  freqChartSub:   { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 1 },
  freqChartBadge: { backgroundColor: Colors.cream, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  freqChartBadgeText: { fontSize: 11, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },
  barsRow:  { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 8 },
  barWrap:  { flex: 1, alignItems: 'center', gap: 4 },
  barVal:   { fontSize: 10, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  bar:      { width: '100%', borderRadius: 6 },
  barMonth: { fontSize: 9, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },

  // Fav products
  favCard:   { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 18, padding: 4 },
  favRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  favRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  favEmoji:  { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  favName:   { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },
  favBrand:  { fontSize: 10, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 1 },
  favCatPill:{ backgroundColor: Colors.blush, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  favCatText:{ fontSize: 9, fontFamily: 'DMSans_600SemiBold', color: Colors.rose },
  favUses:   { fontSize: 10, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },

  // Next products
  nextProductsCard: { backgroundColor: Colors.ink, borderRadius: 20, padding: 16, marginTop: 14 },
  nextProductsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  nextProductsTitle:  { fontSize: 14, fontFamily: 'DMSans_700Bold', color: '#fff' },
  nextProductsSub:    { fontSize: 11, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  nextProductRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  nextProductRowFirst:{ borderColor: 'rgba(242,160,74,0.4)' },
  nextProductEmoji:   { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  nextProductName:    { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: '#fff' },
  nextProductReason:  { fontSize: 10, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  nextProductTag:     { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, flexShrink: 0 },
  nextProductTagText: { fontSize: 9, fontFamily: 'DMSans_700Bold', color: '#fff' },

  // Tips
  tipsBlock: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 20, overflow: 'hidden', marginTop: 24,
  },
  tipsHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, backgroundColor: Colors.cream,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tipsHeaderTitle: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: Colors.ink },
  tipsHeaderSub:   { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 2 },
  tipRow:       { flexDirection: 'row', gap: 12, padding: 14 },
  tipRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  tipEmoji: { fontSize: 18, marginTop: 1 },
  tipTitle: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 4 },
  tipText:  { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 18 },
});
