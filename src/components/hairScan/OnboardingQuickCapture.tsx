import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScanViewfinder } from './ScanViewfinder';
import { hapticLight, hapticSuccess } from '../../lib/haptics';
import { ScanColors as C } from '../../constants/scanner/cotonNoirColors';
import { Fonts } from '../../theme/typography';
import type { ScanPhoto } from './HairZoneScanner';

type Props = {
  onCapture: (photo: ScanPhoto) => void;
  onClose: () => void;
};

async function processAsset(uri: string, base64?: string | null): Promise<ScanPhoto> {
  const resized = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 800 } }],
    { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );
  return { uri: resized.uri, base64: resized.base64 ?? base64 ?? '', mimeType: 'image/jpeg' };
}

/**
 * Overlay de capture 1 angle pour l'onboarding — caméra plein écran, UI flottante.
 */
export function OnboardingQuickCapture({ onCapture, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const [captured, setCaptured] = useState<ScanPhoto | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [capturedOverlay, setCapturedOverlay] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  // Balayage haut → bas sur le viewfinder (arrêté une fois la photo capturée)
  const sweep = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (captured) { sweep.setValue(0); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, {
          toValue: 1,
          duration: 2200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.delay(400),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [sweep, captured]);
  const sweepTranslateY = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-60, screenH + 60],
  });

  const handleRetake = useCallback(() => {
    setCaptured(null);
  }, []);

  const doProcess = useCallback(async (uri: string, base64?: string | null) => {
    const photo = await processAsset(uri, base64);
    setCaptured(photo);
    hapticSuccess();
    setCapturedOverlay(true);
    setTimeout(() => setCapturedOverlay(false), 900);
    return photo;
  }, []);

  const handleCapture = useCallback(async () => {
    if (Platform.OS === 'web') {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission refusée', "Active l'accès à la galerie dans les réglages.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], base64: true, quality: 0.7 });
      if (result.canceled || !result.assets?.[0]) return;
      setCapturing(true);
      try { await doProcess(result.assets[0].uri, result.assets[0].base64); }
      finally { setCapturing(false); }
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
      const shot = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7, skipProcessing: Platform.OS === 'android' });
      if (!shot?.uri) return;
      await doProcess(shot.uri, shot.base64);
    } catch {
      Alert.alert('Erreur', 'Impossible de prendre la photo. Réessaie ou utilise la galerie.');
    } finally {
      setCapturing(false);
    }
  }, [doProcess, permission?.granted, requestPermission]);

  const pickFromLibrary = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission refusée', "Active l'accès à la galerie dans les réglages.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], base64: true, quality: 0.7 });
    if (result.canceled || !result.assets?.[0]) return;
    setCapturing(true);
    try { await doProcess(result.assets[0].uri, result.assets[0].base64); }
    finally { setCapturing(false); }
  }, [doProcess]);

  return (
    <View style={s.root}>

      {/* ── Fond : caméra live ou photo capturée ── */}
      {captured ? (
        <Image source={{ uri: captured.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : Platform.OS !== 'web' && permission?.granted ? (
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />
      ) : (
        <View style={[StyleSheet.absoluteFill, s.noCamBg]} />
      )}

      {/* Overlay sombre général — très léger pour laisser la caméra respirer */}
      <View style={[StyleSheet.absoluteFill, s.baseOverlay]} />

      {/* ── Coins de visée centrés ── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <ScanViewfinder />
      </View>

      {/* ── Balayage scanner (caméra live uniquement) ── */}
      {!captured && (
        <Animated.View
          style={[s.sweep, { transform: [{ translateY: sweepTranslateY }] }]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={['transparent', 'rgba(200,115,58,0.08)', 'rgba(200,115,58,0.38)', 'rgba(200,115,58,0.08)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          <View style={s.sweepLine} />
        </Animated.View>
      )}

      {/* ── Overlay "Capturé !" ── */}
      {capturedOverlay && (
        <View style={[StyleSheet.absoluteFill, s.capturedOverlay]} pointerEvents="none">
          <View style={s.capturedBadge}>
            <Ionicons name="checkmark-circle" size={24} color={C.status.success} />
            <Text style={s.capturedText}>Capturé !</Text>
          </View>
        </View>
      )}

      {/* ── Dégradé + UI — TOP ── */}
      <LinearGradient
        colors={['rgba(28,18,16,0.88)', 'rgba(28,18,16,0.0)']}
        style={[s.topGrad, { paddingTop: insets.top + 8 }]}
        pointerEvents="box-none"
      >
        <View style={s.topBar}>
          <TouchableOpacity onPress={onClose} style={s.backBtn} hitSlop={12}>
            <Ionicons name="arrow-back" size={20} color={C.text.secondary} />
            <Text style={s.backText}>Retour</Text>
          </TouchableOpacity>

          <View style={s.badge}>
            <Ionicons name="sparkles" size={11} color={C.accent.primary} />
            <Text style={s.badgeText}>1 angle · 30 sec</Text>
          </View>

          {/* Flip caméra */}
          {Platform.OS !== 'web' && permission?.granted && !captured && (
            <TouchableOpacity
              style={s.flipBtn}
              onPress={() => { hapticLight(); setFacing(f => f === 'back' ? 'front' : 'back'); }}
              hitSlop={12}
            >
              <Ionicons name="camera-reverse-outline" size={20} color={C.text.primary} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* ── Instructions — centre écran (pas de photo encore) ── */}
      {!captured && !capturedOverlay && (
        <View style={s.instructions} pointerEvents="box-none">
          {!permission?.granted && Platform.OS !== 'web' ? (
            <TouchableOpacity
              style={s.permBtn}
              onPress={() => requestPermission()}
            >
              <Ionicons name="camera-outline" size={26} color={C.text.primary} />
              <Text style={s.permBtnText}>Autoriser la caméra</Text>
            </TouchableOpacity>
          ) : (
            <>
              <View style={s.dirBox}>
                <Ionicons name="arrow-up-outline" size={28} color={C.text.primary} />
              </View>
              <Text style={s.kicker}>ANGLE FACE</Text>
              <Text style={s.angleTitle}>Face à la caméra</Text>
              <Text style={s.angleHint}>
                Oriente tes cheveux en pleine lumière naturelle{'\n'}et regarde vers l'objectif.
              </Text>
            </>
          )}
        </View>
      )}

      {/* ── Dégradé + UI — BOTTOM ── */}
      <LinearGradient
        colors={['rgba(28,18,16,0.0)', 'rgba(28,18,16,0.92)']}
        style={[s.bottomGrad, { paddingBottom: insets.bottom + 12 }]}
        pointerEvents="box-none"
      >
        <View style={s.footer}>
          {/* Bouton principal : capturer ou reprendre */}
          <TouchableOpacity
            style={[s.captureBtn, capturing && s.captureBtnDisabled, captured && s.captureBtnRetake]}
            onPress={captured ? handleRetake : handleCapture}
            disabled={capturing}
            activeOpacity={0.88}
          >
            {capturing ? (
              <ActivityIndicator color={C.text.primary} size="small" />
            ) : (
              <>
                <Ionicons name={captured ? 'refresh' : 'camera'} size={20} color={C.text.primary} />
                <Text style={s.captureBtnText}>{captured ? 'Reprendre la photo' : 'Capturer'}</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Galerie — lien discret */}
          <TouchableOpacity onPress={pickFromLibrary} style={s.galleryLink}>
            <Text style={s.galleryLinkText}>Importer depuis la galerie</Text>
          </TouchableOpacity>

          {/* CTA analyser — apparaît seulement quand une photo est prête */}
          {captured && (
            <TouchableOpacity
              style={s.analyzeBtn}
              onPress={() => onCapture(captured)}
              activeOpacity={0.88}
            >
              <Ionicons name="sparkles" size={18} color={C.text.primary} />
              <Text style={s.analyzeBtnText}>Analyser mes cheveux →</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

    </View>
  );
}

const s = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.background.primary,
    zIndex: 100,
  },
  noCamBg: {
    backgroundColor: C.background.secondary,
  },
  baseOverlay: {
    backgroundColor: 'rgba(28, 18, 16, 0.18)',
  },

  /* ── Overlay capturé ── */
  capturedOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(28, 18, 16, 0.45)',
  },
  capturedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.status.successBg,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.status.success,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  capturedText: {
    fontSize: 17,
    fontFamily: Fonts.display,
    color: C.status.success,
  },

  /* ── Dégradé haut ── */
  topGrad: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    fontSize: 15,
    fontFamily: Fonts.display,
    color: C.text.secondary,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(61, 42, 34, 0.75)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.accent.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 'auto',
  },
  badgeText: {
    fontSize: 10,
    fontFamily: Fonts.bodyBold,
    color: C.accent.primary,
    letterSpacing: 0.4,
  },
  flipBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(28, 18, 16, 0.55)',
    borderWidth: 1,
    borderColor: C.accent.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Instructions centrage ── */
  instructions: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  dirBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(200, 115, 58, 0.15)',
    borderWidth: 1,
    borderColor: C.accent.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  kicker: {
    fontSize: 10,
    fontFamily: Fonts.bodyBold,
    color: C.accent.primary,
    letterSpacing: 1.4,
    marginBottom: 8,
    textAlign: 'center',
  },
  angleTitle: {
    fontSize: 24,
    fontFamily: Fonts.display,
    color: C.text.primary,
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  angleHint: {
    fontSize: 14,
    fontFamily: Fonts.body,
    color: C.text.secondary,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 260,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
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

  /* ── Dégradé bas + footer ── */
  bottomGrad: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  footer: { gap: 10 },

  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: C.accent.primary,
    borderRadius: 18,
    paddingVertical: 18,
  },
  captureBtnDisabled: { opacity: 0.65 },
  captureBtnRetake: {
    backgroundColor: 'rgba(61, 42, 34, 0.85)',
    borderWidth: 1,
    borderColor: C.accent.borderActive,
  },
  captureBtnText: {
    fontSize: 16,
    fontFamily: Fonts.display,
    color: C.text.primary,
  },

  galleryLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  galleryLinkText: {
    fontSize: 12,
    fontFamily: Fonts.bodyMedium,
    color: C.text.secondary,
  },

  sweep: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 60,
    zIndex: 50,
  },
  sweepLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1.5,
    backgroundColor: 'rgba(200,115,58,0.60)',
  },
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.background.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: C.accent.primary,
    paddingVertical: 16,
  },
  analyzeBtnText: {
    fontSize: 15,
    fontFamily: Fonts.display,
    color: C.text.primary,
  },
});
