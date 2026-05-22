import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../theme/colors';
import { HairLengthLandmarkPicker } from './HairLengthLandmarkPicker';

type Props = {
  length: string;
  targetLength: string;
  onLengthChange: (v: string) => void;
  onTargetChange: (v: string) => void;
  /** Profil capillaire : titres alignés sur les autres sections. */
  variant?: 'profile' | 'measure';
  /** Bouton d’enregistrement (écran mesure sans compte profil ouvert). */
  showSaveButton?: boolean;
  onSave?: () => void;
  saved?: boolean;
  saveDisabled?: boolean;
};

export function ProfileLengthLandmarksForm({
  length,
  targetLength,
  onLengthChange,
  onTargetChange,
  variant = 'measure',
  showSaveButton,
  onSave,
  saved,
  saveDisabled,
}: Props) {
  const canSave = !!length.trim() || !!targetLength.trim();
  const pickerVariant = variant === 'profile' ? 'profile' : 'onboarding';

  return (
    <View style={styles.wrap}>
      {variant === 'measure' ? (
        <Text style={styles.lead}>
          Pas encore de mesure au mètre ? Indique où en sont tes cheveux aujourd&apos;hui et où tu veux aller.
        </Text>
      ) : null}
      <HairLengthLandmarkPicker
        title="Longueur actuelle"
        value={length}
        onChange={onLengthChange}
        variant={pickerVariant}
      />
      <HairLengthLandmarkPicker
        title="Longueur souhaitée"
        value={targetLength}
        onChange={onTargetChange}
        optional
        variant={pickerVariant}
      />
      {showSaveButton && onSave ? (
        <TouchableOpacity
          style={[styles.saveBtn, (!canSave || saveDisabled) && styles.saveBtnDisabled]}
          onPress={onSave}
          disabled={!canSave || saveDisabled}
          accessibilityRole="button"
        >
          <Text style={styles.saveBtnText}>
            {saved ? '✓ Longueur enregistrée' : 'Enregistrer ma longueur'}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8 },
  lead: {
    marginHorizontal: 20,
    marginBottom: 14,
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 19,
  },
  saveBtn: {
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 16,
    backgroundColor: Colors.amber,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: Colors.border },
  saveBtnText: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
  },
});
