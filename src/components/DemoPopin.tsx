import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BCEmojiAvatar } from './blackCotton/BCEmojiAvatar';
import type { BlackCottonMood } from './blackCotton/types';
import { Colors } from '../theme/colors';

export type DemoPopinProps = {
  visible: boolean;
  onClose: () => void;
  label?: string;
  title: string;
  body: string;
  ctaText?: string;
  hint?: string;
  mood?: BlackCottonMood;
};

/** Bottom sheet d’exemple pour les comptes démo (paiements / actions réelles désactivés). */
export function DemoPopin({
  visible,
  onClose,
  label = 'MODE DÉMO',
  title,
  body,
  ctaText = 'Compris, continuer la démo',
  hint,
  mood = 'playful',
}: DemoPopinProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={S.overlay} onPress={onClose}>
        <Pressable style={S.sheet} onPress={e => e.stopPropagation()}>
          <View style={S.handle} />
          <View style={S.header}>
            <BCEmojiAvatar size={48} mood={mood} />
            <View style={S.headerText}>
              <Text style={S.label}>{label}</Text>
              {hint ? <Text style={S.hint}>{hint}</Text> : null}
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
          <Text style={S.title}>{title}</Text>
          <Text style={S.body}>{body}</Text>
          <TouchableOpacity style={S.cta} onPress={onClose} activeOpacity={0.85}>
            <Text style={S.ctaText}>{ctaText}</Text>
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
    paddingBottom: 36,
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
    marginBottom: 16,
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
    marginBottom: 10,
    lineHeight: 24,
  },
  body: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: Colors.ink,
    lineHeight: 22,
    marginBottom: 20,
  },
  cta: {
    backgroundColor: Colors.ink,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: '#fff' },
});
