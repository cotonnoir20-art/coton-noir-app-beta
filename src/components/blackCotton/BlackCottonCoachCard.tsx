import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../theme/colors';
import { MOOD_ACCENT } from './constants';
import { BCEmojiAvatar } from './BCEmojiAvatar';
import type { BlackCottonMood } from './types';

interface Props {
  text: string;
  subtext?: string;
  mood?: BlackCottonMood;
  label?: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  size?: 'small' | 'normal';
  variant?: 'default' | 'featured';
}

export function BlackCottonCoachCard({
  text,
  subtext,
  mood = 'coaching',
  label,
  actionLabel,
  onAction,
  onDismiss,
  size = 'normal',
  variant = 'default',
}: Props) {
  const small      = size === 'small';
  const avatarSize = small ? 36 : 52;
  const featured   = variant === 'featured';

  return (
    <View style={[
      s.card,
      featured ? s.cardFeatured : { backgroundColor: MOOD_ACCENT[mood] },
      small && s.cardSm,
    ]}>

      {onDismiss ? (
        <TouchableOpacity style={s.dismissBtn} onPress={onDismiss} hitSlop={10}>
          <Text style={[s.dismissText, featured && { color: 'rgba(255,255,255,0.5)' }]}>✕</Text>
        </TouchableOpacity>
      ) : null}

      <View style={[s.row, small && s.rowSm]}>

        {/* Avatar — illustration entière sur halo accent */}
        <BCEmojiAvatar
          size={avatarSize}
          mood={mood}
        />

        {/* Bulle de langage */}
        <View style={s.bubbleWrap}>
          <View style={[s.tailBorder, featured && s.tailBorderFeatured, small && s.tailBorderSm]} />
          <View style={[s.tailFill,   featured && s.tailFillFeatured,   small && s.tailFillSm]}   />

          <View style={[s.bubble, featured && s.bubbleFeatured, small && s.bubbleSm]}>
            {label ? (
              <View style={[s.pill, featured && s.pillFeatured, small && s.pillSm]}>
                <Text style={[s.pillText, featured && s.pillTextFeatured, small && s.pillTextSm]}>{label}</Text>
              </View>
            ) : null}
            {/* L'ordre est important : `textSm` doit passer APRÈS `textFeatured`
                pour pouvoir override la taille même en mode featured. */}
            <Text style={[s.text, featured && s.textFeatured, small && s.textSm]}>{text}</Text>
            {subtext ? (
              <Text style={[s.sub, featured && s.subFeatured, small && s.subSm]}>{subtext}</Text>
            ) : null}
          </View>
        </View>

      </View>

      {actionLabel && onAction ? (
        <TouchableOpacity
          style={[s.actionBtn, featured && s.actionBtnFeatured, small && s.actionBtnSm]}
          onPress={onAction}
          activeOpacity={0.8}
        >
          <Text style={[s.actionBtnText, featured && s.actionBtnTextFeatured, small && s.actionBtnTextSm]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      ) : null}

    </View>
  );
}

const BUBBLE_BG = Colors.cream; // '#FAF3EC'

const s = StyleSheet.create({
  card: {
    borderRadius:  20,
    padding:       14,
    paddingBottom: 16,
    borderWidth:   1,
    borderColor:   'rgba(0,0,0,0.06)',
    gap:           12,
  },
  row: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    gap:             10,
  },

  // ── Bulle ──────────────────────────────────────────────────────────────
  bubbleWrap: {
    flex:           1,
    marginLeft:     6, // espace pour la queue
  },
  tailBorder: {
    position:           'absolute',
    left:               -9,
    top:                14,
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
    top:                15,
    width:              0,
    height:             0,
    borderTopWidth:     7,
    borderBottomWidth:  7,
    borderRightWidth:   8,
    borderTopColor:     'transparent',
    borderBottomColor:  'transparent',
    borderRightColor:   BUBBLE_BG,
  },
  bubble: {
    backgroundColor:     '#fff',
    borderRadius:        16,
    borderTopLeftRadius: 4,
    paddingVertical:     10,
    paddingHorizontal:   14,
    borderWidth:         1,
    borderColor:         'rgba(0,0,0,0.08)',
    gap:                 4,
    shadowColor:         '#000',
    shadowOpacity:       0.06,
    shadowRadius:        6,
    shadowOffset:        { width: 0, height: 2 },
    elevation:           2,
  },
  bubbleSm: {
    paddingVertical:   6,
    paddingHorizontal: 10,
    borderRadius:      12,
    borderTopLeftRadius: 4,
  },
  cardSm: {
    padding:       9,
    paddingBottom: 10,
    borderRadius:  14,
    gap:           6,
  },
  rowSm: {
    gap: 8,
  },
  tailBorderSm: {
    top: 10, left: -7,
    borderTopWidth: 5, borderBottomWidth: 5, borderRightWidth: 6,
  },
  tailFillSm: {
    top: 11, left: -5,
    borderTopWidth: 4, borderBottomWidth: 4, borderRightWidth: 5,
  },
  pillSm: {
    paddingHorizontal: 6,
    paddingVertical:   1,
    marginBottom:      1,
  },
  pillTextSm: {
    fontSize: 8,
    letterSpacing: 0.3,
  },
  subSm: {
    fontSize: 10,
    lineHeight: 14,
  },
  actionBtnSm: {
    marginTop: 4,
    paddingVertical: 7,
    borderRadius: 8,
  },
  actionBtnTextSm: {
    fontSize: 11,
  },

  // ── Contenu ────────────────────────────────────────────────────────────
  pill: {
    alignSelf:          'flex-start',
    backgroundColor:    Colors.blush,
    borderRadius:       999,
    paddingHorizontal:  8,
    paddingVertical:    2,
    marginBottom:       2,
  },
  pillText: {
    fontSize:   10,
    fontFamily: 'DMSans_700Bold',
    color:      Colors.rose,
    textTransform: 'uppercase',
    letterSpacing:  0.4,
  },
  text: {
    fontSize:   14,
    fontFamily: 'DMSans_400Regular',
    color:      Colors.ink,
    lineHeight:  20,
  },
  textSm: { fontSize: 11, lineHeight: 15 },
  sub: {
    fontSize:   12,
    fontFamily: 'DMSans_400Regular',
    color:      Colors.warmGray,
    lineHeight:  17,
  },
  actionBtn: {
    marginTop:        8,
    backgroundColor:  Colors.ink,
    borderRadius:     10,
    paddingVertical:  10,
    alignItems:       'center',
  },
  actionBtnText: {
    fontSize:   13,
    fontFamily: 'DMSans_700Bold',
    color:      '#fff',
  },
  dismissBtn: {
    position: 'absolute',
    top:      6,
    right:    8,
  },
  dismissText: {
    fontSize: 12,
    color:    Colors.warmGray,
  },

  // ── Variant featured ──────────────────────────────────────────────────
  cardFeatured: {
    backgroundColor: Colors.cream,
    borderColor:     Colors.amber,
  },
  tailBorderFeatured: { borderRightColor: Colors.amber },
  tailFillFeatured:   { borderRightColor: Colors.cream },
  bubbleFeatured: {
    backgroundColor: '#fff',
    borderColor:     'rgba(0,0,0,0.08)',
  },
  pillFeatured: {
    backgroundColor: Colors.amberLight,
  },
  pillTextFeatured: {
    color: Colors.amber,
  },
  textFeatured: {
    fontSize: 15,
    color:    Colors.ink,
  },
  subFeatured: {
    fontSize: 13,
    color:    Colors.warmGray,
  },
  actionBtnFeatured: {
    backgroundColor: Colors.ink,
  },
  actionBtnTextFeatured: {
    color: '#fff',
  },

  // ── Icône ─────────────────────────────────────────────────────────────
  iconCircle: {
    width:           32,
    height:          32,
    borderRadius:    16,
    backgroundColor: '#fff',
    borderWidth:     1,
    borderColor:     Colors.border,
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       8,
  },
  iconText: { fontSize: 15 },
});
