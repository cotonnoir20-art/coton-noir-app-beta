import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { ONBOARDING_TESTIMONIALS } from '../../constants/onboardingTestimonials';
import {
  BLOCKER_OPTIONS,
  CONFIDENCE_OPTIONS,
  MAX_ONBOARDING_BLOCKERS,
  ROUTINE_CONSISTENCY_OPTIONS,
  weeksUntilGoalDate,
  type OnboardingBlockerId,
  type OnboardingConfidenceId,
  type OnboardingRoutineConsistencyId,
} from '../../constants/onboardingEmotional';
import { OnboardingPaceGauge } from './OnboardingPaceGauge';
import { BCEmojiAvatar } from '../blackCotton/BCEmojiAvatar';

type PillProps<T extends string> = {
  options: { id: T; emoji: string; label: string }[];
  value: T | '';
  onChange: (id: T) => void;
};

function PillSingleSelect<T extends string>({ options, value, onChange }: PillProps<T>) {
  return (
    <View style={s.pillList}>
      {options.map(o => {
        const active = value === o.id;
        return (
          <TouchableOpacity
            key={o.id}
            style={[s.pill, active && s.pillActive]}
            onPress={() => onChange(o.id)}
            activeOpacity={0.88}
          >
            <Text style={s.pillEmoji}>{o.emoji}</Text>
            <Text style={[s.pillLabel, active && s.pillLabelActive]}>{o.label}</Text>
            {active ? <Ionicons name="checkmark-circle" size={20} color={Colors.amber} /> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function OnboardingConfidenceStep({
  value,
  onChange,
}: {
  value: OnboardingConfidenceId | '';
  onChange: (v: OnboardingConfidenceId) => void;
}) {
  return (
    <>
      <Text style={s.stepTitle}>Comment te sens-tu par rapport à tes cheveux ?</Text>
      <Text style={s.stepSub}>Pas de jugement — on adapte le ton de Black Cotton à ton ressenti.</Text>
      <PillSingleSelect options={CONFIDENCE_OPTIONS} value={value} onChange={onChange} />
    </>
  );
}

export function OnboardingRoutineBlockersStep({
  routineValue,
  onRoutineChange,
  blockers,
  onToggleBlocker,
}: {
  routineValue: OnboardingRoutineConsistencyId | '';
  onRoutineChange: (v: OnboardingRoutineConsistencyId) => void;
  blockers: OnboardingBlockerId[];
  onToggleBlocker: (id: OnboardingBlockerId) => void;
}) {
  return (
    <>
      <Text style={s.stepTitle}>Ta routine & tes freins</Text>
      <Text style={s.stepSub}>Deux questions rapides pour adapter ton accompagnement.</Text>

      <Text style={s.sectionLabel}>À quel point ta routine est-elle régulière ?</Text>
      <PillSingleSelect
        options={ROUTINE_CONSISTENCY_OPTIONS}
        value={routineValue}
        onChange={onRoutineChange}
      />

      <Text style={[s.sectionLabel, { marginTop: 20 }]}>Qu’est-ce qui te freine le plus ?</Text>
      <Text style={s.sectionSub}>Choisis jusqu’à 3 freins (optionnel).</Text>
      <View style={[s.pillList, { marginTop: 8 }]}>
        {BLOCKER_OPTIONS.map(o => {
          const active = blockers.includes(o.id);
          const atMax = blockers.length >= MAX_ONBOARDING_BLOCKERS;
          const disabled = atMax && !active;
          return (
            <TouchableOpacity
              key={o.id}
              style={[s.pill, active && s.pillActive, disabled && s.pillDisabled]}
              onPress={() => onToggleBlocker(o.id)}
              disabled={disabled}
              activeOpacity={disabled ? 1 : 0.88}
            >
              <Text style={s.pillEmoji}>{o.emoji}</Text>
              <Text style={[s.pillLabel, active && s.pillLabelActive]}>{o.label}</Text>
              {active ? <Ionicons name="checkmark-circle" size={20} color={Colors.amber} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}

export function OnboardingTestimonialsStep() {
  return (
    <>
      <Text style={s.stepTitle}>Tu n’es pas seule.</Text>
      <Text style={s.stepSub}>
        Des femmes comme toi ont commencé au même point — voici ce qui a changé avec Coton Noir.
      </Text>
      <View style={s.testimonialList}>
        {ONBOARDING_TESTIMONIALS.map(t => (
          <View key={`${t.name}-${t.city}`} style={s.testimonialCard}>
            <Text style={s.testimonialQuote}>« {t.quote} »</Text>
            <Text style={s.testimonialMeta}>
              — {t.name}, {t.city}
            </Text>
          </View>
        ))}
      </View>
    </>
  );
}

export function OnboardingScanIntroStep() {
  return (
    <View style={s.trustWrap}>
      <BCEmojiAvatar size={88} mood="coaching" />
      <Text style={[s.stepTitle, s.scanTitle]}>Prête pour ton scan capillaire ?</Text>
      <Text style={s.stepSubCenter}>
        Merci de nous faire confiance — on prend ton parcours capillaire au sérieux. Tes réponses
        servent à construire une routine qui colle à ton profil, pas à te vendre n’importe quoi.
      </Text>
      <View style={s.scanCard}>
        <Text style={s.scanCardEmoji}>📸</Text>
        <Text style={s.scanCardText}>
          Photos guidées (racines, longueurs, pointes) + questionnaire — quelques secondes pour
          affiner ton plan. Tu pourras aussi le faire depuis l’accueil après inscription.
        </Text>
      </View>
    </View>
  );
}

export function OnboardingHairNotesField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const len = value.length;
  const max = 200;
  return (
    <View style={s.notesWrap}>
      <Text style={s.notesLabel}>En quelques mots (optionnel)</Text>
      <TextInput
        style={s.notesInput}
        placeholder="ex. Mes cheveux sont très secs en ce moment et je n’arrive pas à retenir l’hydratation…"
        placeholderTextColor={Colors.warmGray}
        value={value}
        onChangeText={t => onChange(t.slice(0, max))}
        multiline
        textAlignVertical="top"
      />
      <Text style={s.notesCount}>
        {len}/{max}
      </Text>
    </View>
  );
}

export function OnboardingResultsPaceStep({
  weeks,
  onWeeksChange,
  goalDateIso,
}: {
  weeks: number;
  onWeeksChange: (weeks: number) => void;
  goalDateIso: string;
}) {
  const goalWeeksHint = goalDateIso ? weeksUntilGoalDate(goalDateIso) : null;

  return (
    <>
      <Text style={s.stepTitle}>À quel rythme veux-tu voir des résultats ?</Text>
      <Text style={s.stepSub}>
        {goalWeeksHint
          ? 'Ta date cible donne une estimation — règle la jauge selon le rythme qui te convient.'
          : 'Glisse ou tape sur la jauge — la pousse et l’hydratation prennent du temps.'}
      </Text>
      <OnboardingPaceGauge
        weeks={weeks}
        onWeeksChange={onWeeksChange}
        goalWeeksHint={goalWeeksHint}
      />
    </>
  );
}

const s = StyleSheet.create({
  stepTitle: {
    fontSize: 24,
    fontFamily: 'Satoshi_500Medium',
    color: Colors.ink,
    marginBottom: 8,
    lineHeight: 32,
  },
  stepSub: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginBottom: 20,
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 15,
    fontFamily: 'Satoshi_500Medium',
    color: Colors.ink,
    marginBottom: 10,
  },
  sectionSub: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginBottom: 4,
  },
  stepSubCenter: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 8,
  },
  pillList: { gap: 10 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  pillActive: { borderColor: Colors.amber, backgroundColor: Colors.amberLight },
  pillDisabled: { opacity: 0.45 },
  pillEmoji: { fontSize: 22 },
  pillLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Satoshi_500Medium',
    color: Colors.ink,
  },
  pillLabelActive: { color: Colors.amberDark },
  testimonialList: { gap: 10 },
  testimonialCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  testimonialQuote: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    fontStyle: 'italic',
    color: Colors.ink,
    lineHeight: 22,
    marginBottom: 8,
  },
  testimonialMeta: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
  },
  trustWrap: { alignItems: 'center', paddingTop: 16 },
  scanTitle: { textAlign: 'center', marginTop: 16 },
  scanCard: {
    marginTop: 20,
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  scanCardEmoji: { fontSize: 28, lineHeight: 32 },
  scanCardText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.ink,
    lineHeight: 21,
  },
  trustIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.amberLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  notesWrap: { marginTop: 16 },
  notesLabel: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
    marginBottom: 8,
  },
  notesInput: {
    minHeight: 120,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.ink,
    lineHeight: 20,
  },
  notesCount: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'right',
    marginTop: 6,
  },
});
