import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../theme/colors';
import {
  isHairLengthLandmark,
  landmarkCmRangeHint,
  parseProfileLength,
  serializeProfileLength,
  type HairLengthLandmark,
} from '../../constants/hairLengthLandmarks';
import { HairLengthLandmarkPicker } from './HairLengthLandmarkPicker';

type Props = {
  length: string;
  targetLength: string;
  onLengthChange: (v: string) => void;
  onTargetChange: (v: string) => void;
  variant?: 'profile' | 'measure';
  showSaveButton?: boolean;
  onSave?: () => void;
  saved?: boolean;
  saveDisabled?: boolean;
};

function LengthSection({
  title,
  value,
  onChange,
  optional,
  variant,
}: {
  title: string;
  value: string;
  onChange: (v: string) => void;
  optional?: boolean;
  variant: 'profile' | 'onboarding';
}) {
  const parsed = parseProfileLength(value);
  const [cmDraft, setCmDraft] = useState(
    parsed.cm != null ? String(parsed.cm).replace('.', ',') : '',
  );

  useEffect(() => {
    const p = parseProfileLength(value);
    setCmDraft(p.cm != null ? String(p.cm).replace('.', ',') : '');
  }, [value]);

  function onLandmarkChange(landmark: string) {
    const p = parseProfileLength(value);
    if (!landmark) {
      onChange(serializeProfileLength({ landmark: null, cm: p.cm }));
      return;
    }
    if (!isHairLengthLandmark(landmark)) return;
    onChange(
      serializeProfileLength({
        landmark,
        cm: p.cm,
      }),
    );
  }

  function commitCm(text: string) {
    const p = parseProfileLength(value);
    const m = text.replace(',', '.').trim();
    if (!m) {
      onChange(serializeProfileLength({ landmark: p.landmark, cm: null }));
      return;
    }
    const n = parseFloat(m);
    if (!Number.isFinite(n) || n < 0.1 || n > 250) return;
    onChange(
      serializeProfileLength({
        landmark: p.landmark,
        cm: Math.round(n * 10) / 10,
      }),
    );
  }

  const pickerVariant = variant === 'profile' ? 'profile' : 'onboarding';
  const showCmField = !!parsed.landmark;

  return (
    <View>
      <HairLengthLandmarkPicker
        title={title}
        value={parsed.landmark ?? ''}
        onChange={onLandmarkChange}
        optional={optional}
        variant={pickerVariant}
      />
      {parsed.landmark ? (
        <Text style={styles.rangeHint}>
          Fourchette indicative : {landmarkCmRangeHint(parsed.landmark as HairLengthLandmark)}
        </Text>
      ) : null}
      {showCmField ? (
        <View style={styles.cmBlock}>
          <Text style={styles.cmLabel}>Préciser en cm (optionnel)</Text>
          <Text style={styles.cmSub}>
            Sans mètre ruban, garde le repère. Ajoute les cm si tu les connais — le calculateur
            sera plus fiable.
          </Text>
          <View style={styles.cmRow}>
            <TextInput
              style={styles.cmInput}
              value={cmDraft}
              onChangeText={setCmDraft}
              onBlur={() => commitCm(cmDraft)}
              keyboardType="decimal-pad"
              placeholder="ex. 38"
              placeholderTextColor={Colors.warmGray}
            />
            <Text style={styles.cmUnit}>cm</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

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
  const uiVariant = variant === 'profile' ? 'profile' : 'onboarding';

  return (
    <View style={styles.wrap}>
      {variant === 'measure' ? (
        <Text style={styles.lead}>
          Repère où en sont tes cheveux, puis précise en cm si tu peux. Les mesures au mètre
          ruban restent la référence la plus fiable.
        </Text>
      ) : null}
      <LengthSection
        title="Longueur actuelle"
        value={length}
        onChange={onLengthChange}
        variant={uiVariant}
      />
      <LengthSection
        title="Longueur souhaitée"
        value={targetLength}
        onChange={onTargetChange}
        optional
        variant={uiVariant}
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
  rangeHint: {
    marginHorizontal: 20,
    marginTop: -4,
    marginBottom: 10,
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
  },
  cmBlock: {
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 12,
    backgroundColor: Colors.cream,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cmLabel: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
    marginBottom: 4,
  },
  cmSub: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 16,
    marginBottom: 10,
  },
  cmRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cmInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
  },
  cmUnit: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
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
