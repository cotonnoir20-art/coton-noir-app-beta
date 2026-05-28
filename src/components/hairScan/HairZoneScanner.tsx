import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { HAIR_SCAN_ZONES } from '../../constants/hairScanZones';
import { ScanViewfinder } from './ScanViewfinder';
import { hapticLight, hapticSuccess } from '../../lib/haptics';
import { ScanColors as C } from '../../constants/scanner/cotonNoirColors';
import { Fonts } from '../../theme/typography';

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
  const [capturedOverlay, setCapturedOverlay] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const zone = HAIR_SCAN_ZONES[step];
  const capturedCount = photos.filter(Boolean).length;
  const allCaptured = capturedCount >= HAIR_SCAN_ZONES.length;
  const currentCaptured = Boolean(photos[step]);
  const canAnalyze = capturedCount >= minPhotos;

  const advanceToNextUncaptured = useCallback((currentStep: number, currentPhotos: (ScanPhoto | null)[]) => {
    // First uncaptured after current step
    for (let i = currentStep + 1; i < HAIR_SCAN_ZONES.length; i++) {
      if (!currentPhotos[i]) { setStep(i); return; }
    }
    // Wrap: first uncaptured before current step
    for (let i = 0; i < currentStep; i++) {
      if (!currentPhotos[i]) { setStep(i); return; }
    }
    // All captured — stay
  }, []);

  const afterCapture = useCallback((capturedStep: number, updatedPhotos: (ScanPhoto | null)[]) => {
    hapticSuccess();
    setCapturedOverlay(true);
    setTimeout(() => {
      setCapturedOverlay(false);
      advanceToNextUncaptured(capturedStep, updatedPhotos);
    }, 900);
  }, [advanceToNextUncaptured]);

  const pickFromLibrary = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission refusée', "Active l'accès à la galerie dans les réglages.");
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
      const next = [...photos];
      next[step] = photo;
      afterCapture(step, next);
    } finally {
      setCapturing(false);
    }
  }, [afterCapture, onPhoto, photos, step]);

  const capturePhoto = useCallback(async () => {
    if (Platform.OS === 'web') {
      await pickFromLibrary();
      return;
    }
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert('Caméra', "Autorise l'accès à la caméra pour scanner tes cheveux.");
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
      const next = [...photos];
      next[step] = photo;
      afterCapture(step, next);
    } catch {
      Alert.alert('Erreur', 'Impossible de prendre la photo. Réessaie ou utilise la galerie.');
    } finally {
      setCapturing(false);
    }
  }, [afterCapture, onPhoto, permission?.granted, photos, pickFromLibrary, requestPermission, step]);

  const skipAngle = () => {
    hapticLight();
    advanceToNextUncaptured(step, photos);
  };

  return (
    <View style={styles.root}>
      {/* Caméra live (natif uniquement, quand pas de photo pour cet angle) */}
      {Platform.OS !== 'web' && permission?.granted && !currentCaptured && (
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />
      )}

      {/* Fond sombre */}
      <View style={[StyleSheet.absoluteFill, styles.darkBase]} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

        {/* ── Barre supérieure ── */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="arrow-back" size={20} color={C.text.secondary} />
            <Text style={styles.backText}>Retour</Text>
          </TouchableOpacity>
          <View style={styles.progressRow}>
            {HAIR_SCAN_ZONES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressSeg,
                  photos[i] ? styles.progressDone : null,
                  i === step && !photos[i] ? styles.progressActive : null,
                ]}
              />
            ))}
          </View>
        </View>

        {/* ── Zone viewfinder ── */}
        <View style={styles.viewfinderBlock}>
          {/* Photo capturée en fond */}
          {currentCaptured && (
            <Image
              source={{ uri: photos[step]!.uri }}
              style={styles.capturedBg}
              resizeMode="cover"
            />
          )}

          {/* Coins décoratifs */}
          <ScanViewfinder />

          {/* Bouton flip caméra (natif, pas de photo en cours) */}
          {Platform.OS !== 'web' && permission?.granted && !currentCaptured && (
            <TouchableOpacity
              style={styles.flipBtn}
              onPress={() => {
                hapticLight();
                setFacing(f => f === 'back' ? 'front' : 'back');
              }}
              hitSlop={12}
            >
              <Ionicons name="camera-reverse-outline" size={24} color={C.text.primary} />
            </TouchableOpacity>
          )}

          {/* Overlay "Capturé !" */}
          {capturedOverlay && (
            <View style={styles.capturedOverlay}>
              <View style={styles.capturedBadge}>
                <Ionicons name="checkmark-circle" size={22} color={C.status.success} />
                <Text style={styles.capturedText}>Capturé !</Text>
              </View>
            </View>
          )}

          {/* Instructions (aucune photo sur cet angle) */}
          {!currentCaptured && !capturedOverlay && (
            <View style={styles.instructionBlock}>
              {!permission?.granted && Platform.OS !== 'web' ? (
                <TouchableOpacity style={styles.permBtn} onPress={() => requestPermission()}>
                  <Ionicons name="camera-outline" size={26} color={C.text.primary} />
                  <Text style={styles.permBtnText}>Autoriser la caméra</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <View style={styles.directionIconBox}>
                    <Ionicons name={zone.guideIcon} size={30} color={C.text.primary} />
                  </View>
                  <Text style={styles.angleKicker}>{zone.kicker}</Text>
                  <Text style={styles.angleTitle}>{zone.title}</Text>
                  <Text style={styles.angleHint}>{zone.instruction}</Text>
                </>
              )}
            </View>
          )}
        </View>

        {/* ── Vignettes des 4 angles ── */}
        <View style={styles.thumbsRow}>
          {HAIR_SCAN_ZONES.map((z, i) => (
            <TouchableOpacity
              key={z.id}
              style={[
                styles.thumb,
                i === step && styles.thumbActive,
              ]}
              onPress={() => setStep(i)}
              activeOpacity={0.8}
            >
              {photos[i] ? (
                <>
                  <Image
                    source={{ uri: photos[i]!.uri }}
                    style={StyleSheet.absoluteFill as any}
                    resizeMode="cover"
                  />
                  <View style={styles.thumbCheckBadge}>
                    <Ionicons name="checkmark" size={9} color="#fff" />
                  </View>
                  <View style={styles.thumbLabelOverlay}>
                    <Text style={styles.thumbLabelCaptured} numberOfLines={1}>{z.label}</Text>
                  </View>
                </>
              ) : (
                <>
                  <Ionicons
                    name={z.guideIcon}
                    size={16}
                    color={i === step ? C.accent.primary : C.text.tertiary}
                  />
                  <Text
                    style={[styles.thumbLabel, i === step && styles.thumbLabelActive]}
                    numberOfLines={1}
                  >
                    {z.label}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Boutons footer ── */}
        <View style={styles.footer}>

          {/* Bouton capture — toujours visible pour permettre de reprendre */}
          <TouchableOpacity
            style={[
              styles.captureBtn,
              capturing && styles.captureBtnDisabled,
              currentCaptured && styles.captureBtnRetake,
            ]}
            onPress={capturePhoto}
            disabled={capturing}
            activeOpacity={0.88}
          >
            {capturing ? (
              <ActivityIndicator color={C.text.primary} size="small" />
            ) : (
              <>
                <Ionicons
                  name={currentCaptured ? 'refresh' : 'camera'}
                  size={20}
                  color={C.text.primary}
                />
                <Text style={styles.captureBtnText}>
                  {currentCaptured
                    ? `Reprendre — ${zone.label}`
                    : `Capturer — ${zone.label}`}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Import galerie */}
          <TouchableOpacity onPress={pickFromLibrary} style={styles.galleryLink}>
            <Text style={styles.galleryLinkText}>Importer depuis la galerie</Text>
          </TouchableOpacity>

          {/* Passer cet angle */}
          {!currentCaptured && !allCaptured && (
            <TouchableOpacity style={styles.skipBtn} onPress={skipAngle}>
              <Text style={styles.skipBtnText}>Passer cet angle</Text>
            </TouchableOpacity>
          )}

          {/* Analyser — apparaît dès minPhotos capturées */}
          {canAnalyze && (
            <TouchableOpacity
              style={[styles.analyzeBtn, allCaptured && styles.analyzeBtnFull]}
              onPress={() => onComplete(capturedCount)}
              activeOpacity={0.88}
            >
              <Ionicons
                name="sparkles"
                size={18}
                color={allCaptured ? C.text.primary : C.accent.light}
              />
              <Text style={[styles.analyzeBtnText, allCaptured && styles.analyzeBtnTextFull]}>
                {allCaptured
                  ? `Analyser les ${HAIR_SCAN_ZONES.length} angles`
                  : 'Analyser mes cheveux'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.background.primary,
    zIndex: 100,
  },
  darkBase: {
    backgroundColor: C.overlay,
  },
  safe: {
    flex: 1,
  },

  /* Barre supérieure */
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 15,
    fontFamily: Fonts.display,
    color: C.text.secondary,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
  },
  progressSeg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.background.surface,
    borderWidth: 1,
    borderColor: C.accent.border,
  },
  progressDone: {
    backgroundColor: C.accent.primary,
    borderColor: C.accent.primary,
  },
  progressActive: {
    backgroundColor: 'rgba(200, 115, 58, 0.5)',
    borderColor: C.accent.borderActive,
  },

  /* Viewfinder */
  viewfinderBlock: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(28, 18, 16, 0.4)',
  },
  capturedBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.75,
  },

  /* Overlay "Capturé !" */
  capturedOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(28, 18, 16, 0.5)',
  },
  capturedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.status.successBg,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.status.success,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  capturedText: {
    fontSize: 16,
    fontFamily: Fonts.display,
    color: C.status.success,
  },

  /* Instructions */
  instructionBlock: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 20,
  },
  directionIconBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: 'rgba(200, 115, 58, 0.15)',
    borderWidth: 1,
    borderColor: C.accent.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  angleKicker: {
    fontSize: 10,
    fontFamily: Fonts.bodyBold,
    color: C.accent.primary,
    letterSpacing: 1.2,
    marginBottom: 6,
    textAlign: 'center',
  },
  angleTitle: {
    fontSize: 22,
    fontFamily: Fonts.display,
    color: C.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  angleHint: {
    fontSize: 13,
    fontFamily: Fonts.body,
    color: C.text.secondary,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 260,
  },

  /* Permission */
  permBtn: {
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.background.surface,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: C.accent.border,
  },
  permBtnText: {
    fontSize: 14,
    fontFamily: Fonts.display,
    color: C.text.primary,
  },

  /* Vignettes */
  thumbsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  thumb: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: C.background.secondary,
    borderWidth: 1,
    borderColor: 'rgba(200, 115, 58, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    gap: 4,
    padding: 4,
  },
  thumbActive: {
    borderColor: C.accent.primary,
    borderWidth: 2,
    shadowColor: C.accent.primary,
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  thumbCheckBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.status.success,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  thumbLabelOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(28, 18, 16, 0.65)',
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  thumbLabel: {
    fontSize: 9,
    fontFamily: Fonts.bodyBold,
    color: C.text.tertiary,
    textAlign: 'center',
  },
  thumbLabelActive: {
    color: C.accent.primary,
  },
  thumbLabelCaptured: {
    fontSize: 9,
    fontFamily: Fonts.bodyBold,
    color: C.text.primary,
    textAlign: 'center',
  },

  /* Footer */
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },

  /* Bouton flip caméra */
  flipBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(28, 18, 16, 0.55)',
    borderWidth: 1,
    borderColor: C.accent.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  /* Bouton capture */
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: C.accent.primary,
    borderRadius: 16,
    paddingVertical: 16,
    height: 56,
  },
  captureBtnDisabled: {
    opacity: 0.65,
  },
  captureBtnRetake: {
    backgroundColor: C.background.surface,
    borderWidth: 1,
    borderColor: C.accent.borderActive,
  },
  captureBtnText: {
    fontSize: 15,
    fontFamily: Fonts.display,
    color: C.text.primary,
  },

  /* Galerie */
  galleryLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  galleryLinkText: {
    fontSize: 12,
    fontFamily: Fonts.bodyMedium,
    color: C.text.secondary,
  },

  /* Passer */
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.accent.border,
  },
  skipBtnText: {
    fontSize: 13,
    fontFamily: Fonts.bodyMedium,
    color: C.text.secondary,
  },

  /* Analyser */
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.background.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.accent.borderActive,
    paddingVertical: 14,
  },
  analyzeBtnFull: {
    backgroundColor: C.background.secondary,
    borderColor: C.accent.primary,
  },
  analyzeBtnText: {
    fontSize: 14,
    fontFamily: Fonts.display,
    color: C.text.primary,
  },
  analyzeBtnTextFull: {
    color: C.text.primary,
  },
});
