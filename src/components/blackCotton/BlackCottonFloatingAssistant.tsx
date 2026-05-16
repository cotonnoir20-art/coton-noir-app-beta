import { useEffect } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBlackCotton } from '../../context/BlackCottonContext';
import { Colors } from '../../theme/colors';
import { BCEmojiAvatar } from './BCEmojiAvatar';
import { MOOD_ACCENT } from './constants';

export function BlackCottonFloatingAssistant() {
  const { current, isVisible, dismiss } = useBlackCotton();

  const insets  = useSafeAreaInsets();
  const isToast = isVisible && current?.displayMode === 'toast';
  const isPopup = isVisible && current?.displayMode === 'popup';

  // ── Toast: slide in from top ──────────────────────────────────────────
  const toastY = useSharedValue(-140);

  useEffect(() => {
    if (isToast) {
      toastY.value = withSpring(0, { damping: 22, stiffness: 320 });
      if (current!.duration > 0) {
        const t = setTimeout(() => {
          toastY.value = withTiming(-140, { duration: 280 });
          setTimeout(dismiss, 280);
        }, current!.duration);
        return () => clearTimeout(t);
      }
    } else {
      toastY.value = withTiming(-140, { duration: 260 });
    }
  }, [isToast, current?.id]);

  const toastAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: toastY.value }],
  }));

  // ── Popup: scale + fade ───────────────────────────────────────────────
  const popupScale   = useSharedValue(0.82);
  const popupOpacity = useSharedValue(0);

  useEffect(() => {
    if (isPopup) {
      popupScale.value   = withSpring(1, { damping: 18, stiffness: 240 });
      popupOpacity.value = withTiming(1, { duration: 180 });
    } else {
      popupScale.value   = withTiming(0.82, { duration: 200 });
      popupOpacity.value = withTiming(0,    { duration: 180 });
    }
  }, [isPopup, current?.id]);

  const popupAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: popupScale.value }],
    opacity:   popupOpacity.value,
  }));

  const toastMood   = current?.mood ?? 'happy';
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
                <BCEmojiAvatar
                  size={120}
                  mood={isPopup ? current!.mood : 'happy'}
                />
              </View>

              <View style={s.popupBody}>
                <Text style={s.popupName}>Black Cotton</Text>
                <Text style={s.popupTitle}>{current?.text ?? ''}</Text>
                {current?.subtext ? (
                  <Text style={s.popupSub}>{current.subtext}</Text>
                ) : null}
              </View>

              <View style={s.popupActions}>
                {current?.actionLabel && current.onAction ? (
                  <TouchableOpacity
                    style={s.actionBtn}
                    onPress={() => { current.onAction!(); dismiss(); }}
                  >
                    <Text style={s.actionBtnText}>{current.actionLabel}</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity style={s.closeBtn} onPress={dismiss}>
                  <Text style={s.closeBtnText}>Merci Black Cotton ! 🖤</Text>
                </TouchableOpacity>
              </View>

            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({

  // ── Toast ──────────────────────────────────────────────────────────────
  toast: {
    position:      'absolute',
    left:           14,
    right:          14,
    flexDirection:  'row',
    alignItems:     'center',
    gap:            8,
    shadowColor:    '#000',
    shadowOpacity:  0.13,
    shadowRadius:   18,
    shadowOffset:   { width: 0, height: 5 },
    elevation:      12,
    zIndex:         900,
  },
  toastBubbleWrap: {
    flex:     1,
    marginLeft: 6,
  },
  tailBorder: {
    position:           'absolute',
    left:               -9,
    top:                12,
    width:              0,
    height:             0,
    borderTopWidth:     8,
    borderBottomWidth:  8,
    borderRightWidth:   9,
    borderTopColor:     'transparent',
    borderBottomColor:  'transparent',
    borderRightColor:   'rgba(0,0,0,0.07)',
  },
  tailFill: {
    position:           'absolute',
    left:               -7,
    top:                13,
    width:              0,
    height:             0,
    borderTopWidth:     7,
    borderBottomWidth:  7,
    borderRightWidth:   8,
    borderTopColor:     'transparent',
    borderBottomColor:  'transparent',
    borderRightColor:   Colors.cream,
  },
  toastBubble: {
    borderRadius:        16,
    borderTopLeftRadius: 4,
    paddingVertical:     10,
    paddingHorizontal:   13,
    borderWidth:         1,
    borderColor:         'rgba(0,0,0,0.06)',
    gap:                 2,
  },
  toastTitle: {
    fontSize:   13,
    fontFamily: 'DMSans_600SemiBold',
    color:      Colors.ink,
    lineHeight: 18,
  },
  toastSub: {
    fontSize:   11,
    fontFamily: 'DMSans_400Regular',
    color:      Colors.warmGray,
    lineHeight: 15,
  },
  toastClose:     { padding: 4 },
  toastCloseText: { fontSize: 12, color: Colors.warmGray },

  // ── Popup modal ────────────────────────────────────────────────────────
  overlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.46)',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         24,
  },
  popup: {
    backgroundColor: Colors.surface,
    borderRadius:    28,
    padding:         24,
    width:           '100%',
    maxWidth:        360,
    shadowColor:     '#000',
    shadowOpacity:   0.20,
    shadowRadius:    30,
    shadowOffset:    { width: 0, height: 10 },
    elevation:       24,
  },
  popupAvatarRow: { alignItems: 'center', marginBottom: 16 },
  popupBody: {
    alignItems:   'center',
    gap:           6,
    marginBottom:  22,
  },
  popupName: {
    fontSize:      11,
    fontFamily:    'DMSans_600SemiBold',
    color:         Colors.warmGray,
    textTransform: 'uppercase',
    letterSpacing:  0.6,
  },
  popupTitle: {
    fontSize:   21,
    fontFamily: 'Poppins_700Bold',
    color:      Colors.ink,
    textAlign:  'center',
    lineHeight:  28,
  },
  popupSub: {
    fontSize:   14,
    fontFamily: 'DMSans_400Regular',
    color:      Colors.warmGray,
    textAlign:  'center',
    lineHeight:  21,
  },
  popupActions: { gap: 10 },
  actionBtn: {
    backgroundColor: Colors.ink,
    borderRadius:    14,
    paddingVertical:  14,
    alignItems:      'center',
  },
  actionBtnText: {
    fontSize:   15,
    fontFamily: 'DMSans_700Bold',
    color:      '#fff',
  },
  closeBtn: {
    backgroundColor: Colors.cream,
    borderRadius:    14,
    paddingVertical:  12,
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  closeBtnText: {
    fontSize:   14,
    fontFamily: 'DMSans_600SemiBold',
    color:      Colors.ink,
  },
});
