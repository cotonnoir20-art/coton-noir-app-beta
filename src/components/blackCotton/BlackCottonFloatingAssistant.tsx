import { useEffect, useMemo } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBlackCotton } from '../../context/BlackCottonContext';
import { useApp } from '../../context/AppContext';
import { Colors } from '../../theme/colors';
import { navigateBcAction } from '../../lib/bcNavigate';
import { BCEmojiAvatar } from './BCEmojiAvatar';
import { MOOD_ACCENT } from './constants';
import type { BCMessage } from './types';

const TAB_BAR_OFFSET = 72;

function CoachActionButton({
  msg,
  onPress,
  compact,
}: {
  msg: BCMessage;
  onPress: () => void;
  compact?: boolean;
}) {
  if (!msg.actionLabel || (!msg.actionRoute && !msg.onAction)) return null;
  return (
    <TouchableOpacity
      style={[s.actionBtn, compact && s.actionBtnCompact]}
      onPress={onPress}
    >
      <Text style={[s.actionBtnText, compact && s.actionBtnTextCompact]}>{msg.actionLabel}</Text>
    </TouchableOpacity>
  );
}

export function BlackCottonFloatingAssistant() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const {
    current,
    isVisible,
    dismiss,
    isFloatingOpen,
    toggleFloating,
    floatingMsg,
    floatingLoading,
  } = useBlackCotton();

  const fabBottom = Math.max(insets.bottom, 8) + TAB_BAR_OFFSET;

  const floatingCopilotAction = useMemo(() => {
    if (!state.growthHistory?.length) {
      return { label: 'Mesurer ma longueur', route: '/hair-length' as const };
    }
    const hasRoutine = Object.values(state.validated).some(Boolean);
    if (!hasRoutine) {
      return { label: 'Voir ma routine', route: '/(tabs)/routine' as const };
    }
    return { label: 'Analyser mes cheveux', route: '/(tabs)/analyze' as const };
  }, [state.growthHistory, state.validated]);

  const runMessageAction = (msg: BCMessage | null) => {
    if (!msg) return;
    if (navigateBcAction(router, msg)) dismiss();
  };

  const isToast = isVisible && current?.displayMode === 'toast';
  const isPopup = isVisible && current?.displayMode === 'popup';

  const toastY = useSharedValue(-160);

  useEffect(() => {
    if (isToast) {
      toastY.value = withSpring(0, { damping: 22, stiffness: 320 });
      if (current!.duration > 0) {
        const t = setTimeout(() => {
          toastY.value = withTiming(-160, { duration: 280 });
          setTimeout(dismiss, 280);
        }, current!.duration);
        return () => clearTimeout(t);
      }
    } else {
      toastY.value = withTiming(-160, { duration: 260 });
    }
  }, [isToast, current?.id]);

  const toastAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: toastY.value }],
  }));

  const popupScale = useSharedValue(0.82);
  const popupOpacity = useSharedValue(0);

  useEffect(() => {
    if (isPopup) {
      popupScale.value = withSpring(1, { damping: 18, stiffness: 240 });
      popupOpacity.value = withTiming(1, { duration: 180 });
    } else {
      popupScale.value = withTiming(0.82, { duration: 200 });
      popupOpacity.value = withTiming(0, { duration: 180 });
    }
  }, [isPopup, current?.id]);

  const popupAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: popupScale.value }],
    opacity: popupOpacity.value,
  }));

  const toastMood = current?.mood ?? 'happy';
  const toastAccent = MOOD_ACCENT[toastMood];

  return (
    <>
      {/* ── Toast ────────────────────────────────────────────────────── */}
      <Animated.View
        style={[s.toast, { top: insets.top + 10 }, toastAnimStyle]}
        pointerEvents={isToast ? 'box-none' : 'none'}
      >
        <BCEmojiAvatar size={44} mood={toastMood} />

        <View style={s.toastBubbleWrap}>
          <View style={s.tailBorder} />
          <View style={[s.tailFill, { borderRightColor: toastAccent }]} />

          <View style={[s.toastBubble, { backgroundColor: toastAccent }]}>
            <Text style={s.toastTitle} numberOfLines={2}>{current?.text ?? ''}</Text>
            {current?.subtext ? (
              <Text style={s.toastSub} numberOfLines={2}>{current.subtext}</Text>
            ) : null}
            {current ? (
              <CoachActionButton
                msg={current}
                compact
                onPress={() => runMessageAction(current)}
              />
            ) : null}
          </View>
        </View>

        <TouchableOpacity style={s.toastClose} onPress={dismiss} hitSlop={8}>
          <Text style={s.toastCloseText}>✕</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Popup Modal ──────────────────────────────────────────────── */}
      <Modal
        visible={isPopup}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={dismiss}
      >
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={dismiss}>
          <Animated.View style={[s.popup, popupAnimStyle]}>
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <View style={s.popupAvatarRow}>
                <BCEmojiAvatar size={120} mood={isPopup ? current!.mood : 'happy'} />
              </View>

              <View style={s.popupBody}>
                <Text style={s.popupName}>Black Cotton</Text>
                <Text style={s.popupTitle}>{current?.text ?? ''}</Text>
                {current?.subtext ? (
                  <Text style={s.popupSub}>{current.subtext}</Text>
                ) : null}
              </View>

              <View style={s.popupActions}>
                {current ? (
                  <CoachActionButton
                    msg={current}
                    onPress={() => runMessageAction(current)}
                  />
                ) : null}
                <TouchableOpacity style={s.closeBtn} onPress={dismiss}>
                  <Text style={s.closeBtnText}>Merci Black Cotton ! 🖤</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* ── Panneau copilote (bulle ouverte) ─────────────────────────── */}
      {isFloatingOpen && (
        <View style={[s.floatingPanel, { bottom: fabBottom + 58, right: 14 }]} pointerEvents="box-none">
          <View style={s.floatingCard}>
            <BCEmojiAvatar size={40} mood={floatingMsg.mood} />
            <View style={s.floatingBody}>
              <Text style={s.floatingName}>Black Cotton</Text>
              <Text style={s.floatingText}>
                {floatingLoading ? 'Un instant…' : floatingMsg.text}
              </Text>
              <TouchableOpacity
                style={s.floatingCta}
                onPress={() => {
                  if (isFloatingOpen) toggleFloating();
                  router.push(floatingCopilotAction.route as any);
                }}
              >
                <Text style={s.floatingCtaText}>{floatingCopilotAction.label} →</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={toggleFloating} hitSlop={8}>
              <Text style={s.floatingClose}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Bouton flottant accueil ──────────────────────────────────── */}
      <TouchableOpacity
        style={[s.fab, { bottom: fabBottom, right: 14 }]}
        onPress={toggleFloating}
        activeOpacity={0.88}
        accessibilityLabel="Ouvrir Black Cotton, coach capillaire"
      >
        <BCEmojiAvatar size={46} mood={floatingMsg.mood} />
      </TouchableOpacity>
    </>
  );
}

const s = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.13,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 5 },
    elevation: 12,
    zIndex: 900,
  },
  toastBubbleWrap: { flex: 1, marginLeft: 6 },
  tailBorder: {
    position: 'absolute',
    left: -9,
    top: 12,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderRightWidth: 9,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: 'rgba(0,0,0,0.07)',
  },
  tailFill: {
    position: 'absolute',
    left: -7,
    top: 13,
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderBottomWidth: 7,
    borderRightWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  toastBubble: {
    borderRadius: 16,
    borderTopLeftRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    gap: 6,
  },
  toastTitle: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
    lineHeight: 18,
  },
  toastSub: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 15,
  },
  toastClose: { padding: 4 },
  toastCloseText: { fontSize: 12, color: Colors.warmGray },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.46)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  popup: {
    backgroundColor: Colors.surface,
    borderRadius: 28,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    elevation: 24,
  },
  popupAvatarRow: { alignItems: 'center', marginBottom: 16 },
  popupBody: { alignItems: 'center', gap: 6, marginBottom: 22 },
  popupName: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  popupTitle: {
    fontSize: 21,
    fontFamily: 'Satoshi_500Medium',
    color: Colors.ink,
    textAlign: 'center',
    lineHeight: 28,
  },
  popupSub: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 21,
  },
  popupActions: { gap: 10 },
  actionBtn: {
    backgroundColor: Colors.ink,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionBtnCompact: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 2,
  },
  actionBtnText: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
  },
  actionBtnTextCompact: { fontSize: 12 },
  closeBtn: {
    backgroundColor: Colors.cream,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  closeBtnText: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
  },

  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    zIndex: 800,
  },
  floatingPanel: {
    position: 'absolute',
    maxWidth: 320,
    zIndex: 801,
  },
  floatingCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
  },
  floatingBody: { flex: 1, gap: 6 },
  floatingName: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    color: Colors.warmGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  floatingText: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.ink,
    lineHeight: 18,
  },
  floatingCta: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.ink,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  floatingCtaText: {
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
  },
  floatingClose: { fontSize: 14, color: Colors.warmGray, padding: 2 },
});
