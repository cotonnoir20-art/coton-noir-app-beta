import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../theme/colors';
import { Type } from '../../theme/typography';
import { CoinIcon } from '../CoinIcon';

type RoutineFocus = {
  kind: 'routine';
  done: number;
  total: number;
  reward: number;
  /** Libellé court catalogue (Matin, Nuit…) */
  label: string;
  /** Libellé accueil (Routine matin, Routine soir…) */
  displayLabel: string;
  allStepsDone: boolean;
};

type AllDone = { kind: 'all_done'; levelName: string; levelEmoji: string };

export type HomeRoutineFocus = RoutineFocus | AllDone;

type Props = {
  focus: HomeRoutineFocus;
  onPress: () => void;
};

export function HomeRoutineCTA({ focus, onPress }: Props) {
  if (focus.kind === 'all_done') {
    return (
      <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.9}>
        <View style={s.leftIcon}>
          <Ionicons name="checkmark-done" size={22} color={Colors.amber} />
        </View>
        <View style={s.mid}>
          <Text style={s.title}>Journée complète</Text>
          <Text style={s.sub}>Niveau {focus.levelName} {focus.levelEmoji}</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.6)" />
      </TouchableOpacity>
    );
  }

  const sub = focus.allStepsDone
    ? `Valide ${focus.displayLabel.toLowerCase()} pour créditer +${focus.reward} CC`
    : `${focus.displayLabel} · ${focus.done} / ${focus.total} étapes`;

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.92}>
      <View style={s.leftIcon}>
        <Ionicons name="checkmark" size={22} color={Colors.ink} />
      </View>
      <View style={s.mid}>
        <Text style={s.title}>Valider ma routine</Text>
        <Text style={s.sub} numberOfLines={2}>{sub}</Text>
      </View>
      <View style={s.rewardPill}>
        <Text style={s.rewardText}>+{focus.reward}</Text>
        <CoinIcon size={14} />
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.ink,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    shadowColor: '#1A1209',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  leftIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mid: { flex: 1, minWidth: 0 },
  title: {
    ...Type.sectionTitle,
    fontSize: 17,
    lineHeight: 22,
    color: '#fff',
    letterSpacing: -0.2,
  },
  sub: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.72)',
    marginTop: 4,
    lineHeight: 16,
  },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.amber,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  rewardText: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink },
});
