import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { PREMIUM_MOMENTS, type PremiumMomentId } from '../../data/premiumMoments';
import { TRIAL_DAYS } from '../../lib/premiumTrial';

type Props = {
  visible: boolean;
  momentId: PremiumMomentId | null;
  purchasesEnabled?: boolean;
  purchasesBlockReason?: string | null;
  onClose: () => void;
  onStartTrial: () => void;
  onSeePlans: () => void;
};

export function PremiumPaywallModal({
  visible,
  momentId,
  purchasesEnabled = true,
  purchasesBlockReason,
  onClose,
  onStartTrial,
  onSeePlans,
}: Props) {
  if (!momentId) return null;
  const config = PREMIUM_MOMENTS[momentId];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={S.overlay} onPress={onClose}>
        <Pressable style={S.sheet} onPress={e => e.stopPropagation()}>
          <TouchableOpacity style={S.close} onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={Colors.ink} />
          </TouchableOpacity>

          <View style={S.badge}>
            <Text style={S.badgeText}>PREMIUM</Text>
          </View>
          <Text style={S.title}>{config.title}</Text>
          <Text style={S.subtitle}>{config.subtitle}</Text>

          {config.bullets.map(b => (
            <View key={b} style={S.bulletRow}>
              <Text style={S.bulletMark}>✓</Text>
              <Text style={S.bulletText}>{b}</Text>
            </View>
          ))}

          <TouchableOpacity style={S.primaryBtn} onPress={onStartTrial}>
            <Text style={S.primaryText}>{config.cta}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.secondaryBtn} onPress={onSeePlans}>
            <Text style={S.secondaryText}>
              {purchasesEnabled
                ? `Voir les offres · ${TRIAL_DAYS}j gratuits`
                : 'Découvrir Premium'}
            </Text>
          </TouchableOpacity>
          <Text style={S.hint}>
            {purchasesEnabled
              ? config.trialHint
              : purchasesBlockReason ??
                'Les paiements s’ouvriront quand toutes les fonctionnalités Premium seront prêtes.'}
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const S = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 28,
  },
  close: { alignSelf: 'flex-end', marginBottom: 4 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.amberLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  badgeText: { fontSize: 10, fontFamily: 'DMSans_700Bold', color: Colors.amberDark },
  title: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: Colors.ink, marginBottom: 6 },
  subtitle: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 20,
    marginBottom: 14,
  },
  bulletRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  bulletMark: { fontSize: 14, color: Colors.sage, fontFamily: 'DMSans_700Bold' },
  bulletText: { flex: 1, fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.ink },
  primaryBtn: {
    backgroundColor: Colors.ink,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryText: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.amber },
  secondaryBtn: { marginTop: 10, alignItems: 'center', paddingVertical: 8 },
  secondaryText: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },
  hint: {
    marginTop: 10,
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
  },
});
