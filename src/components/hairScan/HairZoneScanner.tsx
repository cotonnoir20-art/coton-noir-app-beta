import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';
import { Fonts } from '../../theme/typography';
import { HAIR_SCAN_ZONES } from '../../constants/hairScanZones';
import { ScanViewfinder } from './ScanViewfinder';
import { hapticLight, hapticSuccess } from '../../lib/haptics';

export type ScanPhoto = { uri: string; base64: string; mimeType: string };

type HairZoneScannerProps = {
  photos: (ScanPhoto | null)[];
  onPhoto: (index: number, photo: ScanPhoto) => void;
  onClose: () => void;
  onComplete: (capturedCount: number) => void;
  minPhotos?: number;
};

async function processAsset(uri: string, base64?: string | null): Promise<ScanPhoto> {
  const resized = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 800 } }],
    { compress: 0.4, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );
  return {
    uri: resized.uri,
    base64: resized.base64 ?? base64 ?? '',
    mimeType: 'image/jpeg',
  };
}

export function HairZoneScanner({
  photos,
  onPhoto,
  onClose,
  onComplete,
  minPhotos = 2,
}: HairZoneScannerProps) {
  const [step, setStep] = useState(0);
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const zone = HAIR_SCAN_ZONES[step];
  const capturedCount = photos.filter(Boolean).length;
  const isLastStep = step === HAIR_SCAN_ZONES.length - 1;
  const canFinish = capturedCount >= minPhotos;
  const allZonesCaptured = capturedCount >= HAIR_SCAN_ZONES.length;
  const currentZoneCaptured = Boolean(photos[step]);

  const pickFromLibrary = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission refusée', 'Active l’accès à la galerie dans les réglages.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setCapturing(true);
    try {
      const photo = await processAsset(asset.uri, asset.base64);
      onPhoto(step, photo);
      hapticSuccess();
      if (!isLastStep) setStep(s => s + 1);
    } finally {
      setCapturing(false);
    }
  }, [isLastStep, onPhoto, step]);

  const capturePhoto = useCallback(async () => {
    if (Platform.OS === 'web') {
      await pickFromLibrary();
      return;
    }
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert('Caméra', 'Autorise l’accès à la caméra pour scanner tes cheveux.');
        return;
      }
    }
    if (!cameraRef.current) return;

    setCapturing(true);
    hapticLight();
    try {
      const shot = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
        skipProcessing: Platform.OS === 'android',
      });
      if (!shot?.uri) return;
      const photo = await processAsset(shot.uri, shot.base64);
      onPhoto(step, photo);
      hapticSuccess();
      if (!isLastStep) setStep(s => s + 1);
    } catch {
      Alert.alert('Erreur', 'Impossible de prendre la photo. Réessaie ou utilise la galerie.');
    } finally {
      setCapturing(false);
    }
  }, [isLastStep, onPhoto, permission?.granted, pickFromLibrary, requestPermission, step]);

  const handleFinish = () => {
    if (!canFinish) {
      Alert.alert(
        'Encore une zone',
        `Ajoute au moins ${minPhotos} zones pour continuer (${capturedCount}/${minPhotos}).`,
      );
      return;
    }
    onComplete(capturedCount);
  };

  return (
    <View style={styles.root}>
      {Platform.OS !== 'web' && permission?.granted ? (
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
      ) : (
        <View style={styles.cameraPlaceholder}>
          <Ionicons name="camera-outline" size={48} color="rgba(255,255,255,0.35)" />
          <Text style={styles.placeholderText}>
            {Platform.OS === 'web'
              ? 'Sur le web, choisis une photo depuis ta galerie.'
              : 'Autorise la caméra pour lancer le scan.'}
          </Text>
          {Platform.OS !== 'web' && !permission?.granted ? (
            <TouchableOpacity style={styles.permBtn} onPress={() => requestPermission()}>
              <Text style={styles.permBtnText}>Autoriser la caméra</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      <View style={styles.overlay}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.topRow}>
            <TouchableOpacity onPress={onClose} style={styles.backHit} hitSlop={12}>
              <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.75)" />
              <Text style={styles.backText}>Retour</Text>
            </TouchableOpacity>
            <View style={styles.progressRow}>
              {HAIR_SCAN_ZONES.map((z, i) => (
                <View
                  key={z.id}
                  style={[
                    styles.progressSeg,
                    i < step && styles.progressDone,
                    i === step && styles.progressActive,
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.viewfinderBlock}>
            <ScanViewfinder />
            <View style={styles.instructionCenter}>
              <View style={styles.guideIconWrap}>
                <Ionicons name={zone.guideIcon} size={28} color="rgba(255,255,255,0.9)" />
              </View>
              <Text style={styles.zoneKicker}>{zone.kicker}</Text>
              <Text style={styles.zoneTitle}>{zone.title}</Text>
              <Text style={styles.zoneInstruction}>{zone.instruction}</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.captureCount}>
              {capturedCount} sur {HAIR_SCAN_ZONES.length} zones capturées
            </Text>

            {allZonesCaptured ? (
              <TouchableOpacity style={styles.captureBtn} onPress={handleFinish} activeOpacity={0.88}>
                <Ionicons name="arrow-forward-circle" size={22} color={Colors.ink} />
                <Text style={styles.captureBtnText}>Continuer vers le questionnaire →</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.captureBtn, capturing && styles.captureBtnDisabled]}
                  onPress={capturePhoto}
                  disabled={capturing}
                  activeOpacity={0.88}
                >
                  {capturing ? (
                    <ActivityIndicator color={Colors.ink} />
                  ) : (
                    <>
                      <Ionicons name="camera" size={20} color={Colors.ink} />
                      <Text style={styles.captureBtnText}>
                        {currentZoneCaptured ? `Reprendre ${zone.label.toLowerCase()}` : zone.captureLabel}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={pickFromLibrary} style={styles.galleryLink}>
                  <Text style={styles.galleryLinkText}>Importer depuis la galerie</Text>
                </TouchableOpacity>

                {canFinish && (isLastStep || currentZoneCaptured) ? (
                  <TouchableOpacity style={styles.doneBtn} onPress={handleFinish}>
                    <Text style={styles.doneBtnText}>
                      {capturedCount < HAIR_SCAN_ZONES.length
                        ? `Passer au questionnaire (${capturedCount}/${HAIR_SCAN_ZONES.length}) →`
                        : 'Continuer vers le questionnaire →'}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </>
            )}
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1410',
    zIndex: 100,
  },
  cameraPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1410',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  placeholderText: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 20,
  },
  permBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Colors.amber,
  },
  permBtnText: {
    fontSize: 14,
    fontFamily: Fonts.display,
    color: Colors.ink,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  safe: { flex: 1 },
  topRow: {
    paddingHorizontal: 20,
    paddingTop: 4,
    gap: 14,
  },
  backHit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 16,
    fontFamily: Fonts.display,
    color: 'rgba(255,255,255,0.75)',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
  },
  progressSeg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  progressDone: {
    backgroundColor: Colors.sage,
  },
  progressActive: {
    backgroundColor: Colors.amber,
  },
  viewfinderBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  instructionCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '38%',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  guideIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  zoneKicker: {
    fontSize: 10,
    fontFamily: Fonts.bodyBold,
    color: Colors.amber,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  zoneTitle: {
    fontSize: 22,
    fontFamily: Fonts.display,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  zoneInstruction: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 8,
    gap: 10,
  },
  captureCount: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.amber,
    borderRadius: 999,
    paddingVertical: 16,
  },
  captureBtnDisabled: { opacity: 0.7 },
  captureBtnText: {
    fontSize: 16,
    fontFamily: Fonts.display,
    color: Colors.ink,
  },
  galleryLink: { alignItems: 'center', paddingVertical: 6 },
  galleryLinkText: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: 'rgba(255,255,255,0.55)',
  },
  doneBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  doneBtnText: {
    fontSize: 14,
    fontFamily: Fonts.display,
    color: Colors.amber,
  },
});
