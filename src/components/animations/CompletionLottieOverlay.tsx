import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';

const SOURCE = require('../../../assets/animations/completion-confetti.json');

export type CompletionLottieVariant = 'light' | 'strong';

type Props = {
  visible: boolean;
  variant: CompletionLottieVariant;
  onClose: () => void;
  caption?: string;
};

/**
 * Confetti Lottie plein écran (ou fallback « Réduire les animations »).
 * `light` = routine matin/soir ; `strong` = wash day ou gros soin.
 */
export function CompletionLottieOverlay({ visible, variant, onClose, caption }: Props) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const lottieRef = useRef<LottieView>(null);
  const closedRef = useRef(false);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    AccessibilityInfo.isReduceMotionEnabled().then(v => setReduceMotion(!!v));
    return () => sub.remove();
  }, []);

  const finish = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    if (safetyTimer.current) {
      clearTimeout(safetyTimer.current);
      safetyTimer.current = null;
    }
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!visible) {
      closedRef.current = false;
      if (safetyTimer.current) {
        clearTimeout(safetyTimer.current);
        safetyTimer.current = null;
      }
      return undefined;
    }

    if (reduceMotion) {
      safetyTimer.current = setTimeout(finish, 1100);
      return () => {
        if (safetyTimer.current) clearTimeout(safetyTimer.current);
      };
    }

    const t = requestAnimationFrame(() => {
      lottieRef.current?.reset();
      lottieRef.current?.play();
    });
    safetyTimer.current = setTimeout(finish, 5200);
    return () => {
      cancelAnimationFrame(t);
      if (safetyTimer.current) clearTimeout(safetyTimer.current);
    };
  }, [visible, reduceMotion, finish]);

  const onLottieFinish = useCallback(() => {
    if (reduceMotion) return;
    finish();
  }, [reduceMotion, finish]);

  const size = variant === 'strong' ? 220 : 140;
  const speed = variant === 'strong' ? 1.15 : 1.45;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={finish}>
      <Pressable style={styles.backdrop} onPress={finish} accessibilityViewIsModal>
        <Pressable style={styles.center} onPress={e => e.stopPropagation()}>
          {reduceMotion ? (
            <>
              <View style={styles.reduceCircle}>
                <Ionicons name="checkmark-circle" size={56} color={Colors.sage} />
              </View>
              <Text style={styles.reduceTitle}>Bravo !</Text>
              {caption ? <Text style={styles.caption}>{caption}</Text> : null}
            </>
          ) : (
            <>
              <LottieView
                ref={lottieRef}
                source={SOURCE}
                style={{ width: size, height: size }}
                speed={speed}
                loop={false}
                onAnimationFinish={onLottieFinish}
              />
              {caption ? <Text style={styles.caption}>{caption}</Text> : null}
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 18, 9, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  center: {
    alignItems: 'center',
    maxWidth: 320,
  },
  reduceCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  reduceTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: Colors.surface,
    marginBottom: 4,
  },
  caption: {
    marginTop: 8,
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    lineHeight: 22,
  },
});
