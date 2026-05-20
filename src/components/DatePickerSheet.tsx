import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Colors } from '../theme/colors';
import { MiniDateCalendar } from './MiniDateCalendar';

type Props = {
  visible: boolean;
  value: Date;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  minimumDate?: Date;
};

export function DatePickerSheet({ visible, value, onClose, onConfirm, minimumDate }: Props) {
  const { width } = useWindowDimensions();
  const [draft, setDraft] = useState(value);
  const calendarWidth = width - 40;

  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.root}>
        <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Fermer" />
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.title}>Choisir une date</Text>
          <MiniDateCalendar
            selectedDate={draft}
            onSelect={setDraft}
            minimumDate={minimumDate}
            contentWidth={calendarWidth}
          />
          <TouchableOpacity
            style={s.confirm}
            onPress={() => {
              onConfirm(draft);
              onClose();
            }}
            activeOpacity={0.9}
            accessibilityRole="button"
          >
            <Text style={s.confirmText}>Confirmer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    alignItems: 'stretch',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
    textAlign: 'center',
    marginBottom: 14,
  },
  confirm: {
    marginTop: 16,
    backgroundColor: Colors.ink,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
  },
});
