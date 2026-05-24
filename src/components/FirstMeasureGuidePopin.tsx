import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BCEmojiAvatar } from './blackCotton/BCEmojiAvatar';
import { Colors } from '../theme/colors';

const STEPS = [
  {
    icon: 'resize-outline' as const,
    text: 'Prends un mètre ruban ou une règle, cheveux détendus (pas étirés).',
  },
  {
    icon: 'scan-outline' as const,
    text: 'Mesure le cheveu le plus long dans chaque zone : devant, côtés, derrière.',
  },
  {
    icon: 'create-outline' as const,
    text: 'Entre les centimètres (ex. 32,5). Une seule zone suffit pour commencer.',
  },
  {
    icon: 'trending-up-outline' as const,
    text: 'Reviens chaque mois : ton graphique de pousse se remplit tout seul.',
  },
];

export type FirstMeasureGuidePopinProps = {
  visible: boolean;
  onClose: () => void;
  onStartMeasure: () => void;
};

export function FirstMeasureGuidePopin({
  visible,
  onClose,
  onStartMeasure,
}: FirstMeasureGuidePopinProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={S.overlay} onPress={onClose}>
        <Pressable style={S.sheet} onPress={e => e.stopPropagation()}>
          <View style={S.handle} />
          <View style={S.header}>
            <BCEmojiAvatar size={48} mood="coaching" />
            <View style={S.headerText}>
              <Text style={S.label}>PREMIER PAS</Text>
              <Text style={S.hint}>Suivi de pousse</Text>
            </View>
            <TouchableOpacity
              style={S.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
            >
              <Ionicons name="close" size={20} color={Colors.warmGray} />
            </TouchableOpacity>
          </View>

          <Text style={S.title}>Comment prendre ta première mesure ?</Text>
          <Text style={S.intro}>
            En 2 minutes, tu poses ta base pour suivre ta longueur et ta santé capillaire.
          </Text>

          <View style={S.steps}>
            {STEPS.map((step, i) => (
              <View key={i} style={S.stepRow}>
                <View style={S.stepIcon}>
                  <Ionicons name={step.icon} size={18} color={Colors.amberDark} />
                </View>
                <Text style={S.stepText}>
                  <Text style={S.stepNum}>{i + 1}. </Text>
                  {step.text}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={S.cta} onPress={onStartMeasure} activeOpacity={0.85}>
            <Text style={S.ctaText}>Mesurer ma longueur</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.secondary} onPress={onClose} activeOpacity={0.7}>
            <Text style={S.secondaryText}>Plus tard</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const S = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: '88%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  headerText: { flex: 1 },
  label: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amber,
    letterSpacing: 1,
  },
  hint: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Satoshi_500Medium',
    color: Colors.ink,
    marginBottom: 8,
    lineHeight: 24,
  },
  intro: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 20,
    marginBottom: 16,
  },
  steps: { gap: 12, marginBottom: 20 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.amberLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.ink,
    lineHeight: 20,
  },
  stepNum: { fontFamily: 'DMSans_700Bold', color: Colors.amberDark },
  cta: {
    backgroundColor: Colors.ink,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: '#fff' },
  secondary: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
  },
});
