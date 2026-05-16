import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../theme/colors';
import { CoinIcon } from '../CoinIcon';

type Props = {
  coins: number;
  streak: number;
  unreadCount: number;
  onCoinsPress: () => void;
  onStreakPress: () => void;
  onNotifPress: () => void;
  /** Fond transparent (hero sur dégradé). */
  transparent?: boolean;
};

export function HomeTopBar({
  coins,
  streak,
  unreadCount,
  onCoinsPress,
  onStreakPress,
  onNotifPress,
  transparent = false,
}: Props) {
  return (
    <View style={[s.row, transparent && s.rowTransparent]}>
      <TouchableOpacity style={s.coinsBadge} onPress={onCoinsPress} activeOpacity={0.85}>
        <CoinIcon size={16} />
        <Text style={s.coinsText}>{coins.toLocaleString('fr-FR')}</Text>
      </TouchableOpacity>
      <View style={s.right}>
        <TouchableOpacity style={s.streakPill} onPress={onStreakPress} activeOpacity={0.85}>
          <Text style={s.streakEmoji}>🔥</Text>
          <Text style={s.streakNum}>{streak}</Text>
          <Text style={s.streakUnit}> j</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.bellBtn} onPress={onNotifPress} accessibilityLabel="Notifications">
          <Ionicons name="notifications-outline" size={20} color={Colors.amberDark} />
          {unreadCount > 0 && (
            <View style={s.bellBadge}>
              <Text style={s.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowTransparent: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
  },
  coinsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.ink,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  coinsText: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.amber },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  streakEmoji: { fontSize: 14 },
  streakNum: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  streakUnit: { fontSize: 11, fontFamily: 'DMSans_600SemiBold', color: Colors.warmGray, marginLeft: -2 },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.rose,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.surface,
    paddingHorizontal: 3,
  },
  bellBadgeText: { fontSize: 9, fontFamily: 'DMSans_700Bold', color: '#fff' },
});
