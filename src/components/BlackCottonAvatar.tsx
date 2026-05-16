import { View, Text } from 'react-native';
import { Colors } from '../theme/colors';

export type AvatarExpression = 'happy' | 'thinking' | 'celebrating' | 'tip' | 'neutral';

type Props = {
  size?: number;
  expression?: AvatarExpression;
  message?: string;
  bubblePosition?: 'right' | 'bottom';
};

const SKIN = '#8B5A3A';
const HAIR = '#1A0800';

export function BlackCottonAvatar({
  size = 80,
  expression = 'happy',
  message,
  bubblePosition = 'right',
}: Props) {
  // ── Dimensions proportionnelles ──
  const afroW   = size * 0.90;
  const afroH   = size * 0.68;
  const faceD   = size * 0.54;
  const faceTop = afroH * 0.46;
  const eyeW    = size * 0.082;
  const eyeH    = size * 0.066;
  const earD    = size * 0.072;
  const cx      = size / 2;

  const afroLeft = (size - afroW) / 2;
  const faceLeft = (size - faceD) / 2;

  const eyeY  = faceTop + faceD * 0.36;
  const eyeLX = cx - faceD * 0.22 - eyeW / 2;
  const eyeRX = cx + faceD * 0.22 - eyeW / 2;

  const smileW = faceD * 0.44;
  const smileH = faceD * 0.19;
  const mouthY = faceTop + faceD * 0.62;
  const mouthX = cx - smileW / 2;

  const totalH = faceTop + faceD + earD * 0.6;
  const squinting = expression === 'celebrating';

  // Bosses autour de l'afro pour l'effet "coils naturels"
  const bumps = [
    { cx: cx - afroW * 0.30, cy: afroH * 0.10, r: afroW * 0.145 },
    { cx: cx - afroW * 0.10, cy: afroH * 0.00, r: afroW * 0.155 },
    { cx: cx + afroW * 0.10, cy: -afroH * 0.01, r: afroW * 0.145 },
    { cx: cx + afroW * 0.30, cy: afroH * 0.09,  r: afroW * 0.135 },
    { cx: afroLeft - afroW * 0.01, cy: afroH * 0.42, r: afroW * 0.10 },
    { cx: size - afroLeft + afroW * 0.01, cy: afroH * 0.42, r: afroW * 0.10 },
  ];

  // Style de la bouche selon expression
  const mouthMap: Record<AvatarExpression, object> = {
    happy: {
      width: smileW, height: smileH,
      borderBottomLeftRadius: smileH, borderBottomRightRadius: smileH,
      borderColor: '#3D1A0A', borderWidth: 2, borderTopWidth: 0,
    },
    celebrating: {
      width: smileW * 1.2, height: smileH * 1.2,
      borderBottomLeftRadius: smileH, borderBottomRightRadius: smileH,
      borderColor: '#3D1A0A', borderWidth: 2.5, borderTopWidth: 0,
    },
    thinking: {
      width: smileW * 0.38, height: smileH * 0.38,
      borderRadius: smileH, backgroundColor: '#3D1A0A',
    },
    tip: {
      width: smileW * 0.78, height: smileH * 0.78,
      borderBottomLeftRadius: smileH, borderBottomRightRadius: smileH,
      borderColor: '#3D1A0A', borderWidth: 2, borderTopWidth: 0,
    },
    neutral: { width: smileW, height: 2.5, backgroundColor: '#3D1A0A' },
  };

  const mouthLeft = expression === 'thinking'
    ? cx - smileW * 0.19
    : expression === 'celebrating'
      ? mouthX - smileW * 0.10
      : mouthX;

  // ── Rendu de l'avatar ──
  const avatar = (
    <View style={{ width: size, height: totalH }}>

      {/* Bosses afro (derrière) */}
      {bumps.map((b, i) => (
        <View key={i} style={{
          position: 'absolute',
          width: b.r * 2, height: b.r * 2, borderRadius: b.r,
          backgroundColor: HAIR,
          left: b.cx - b.r, top: b.cy - b.r,
        }} />
      ))}

      {/* Afro principal */}
      <View style={{
        position: 'absolute',
        width: afroW, height: afroH, borderRadius: afroW / 2,
        backgroundColor: HAIR,
        left: afroLeft, top: 0,
      }} />

      {/* Points texture "coton" sur l'afro */}
      {[
        { dx: 0.20, dy: 0.18 }, { dx: 0.48, dy: 0.10 },
        { dx: 0.72, dy: 0.20 }, { dx: 0.35, dy: 0.07 },
        { dx: 0.60, dy: 0.32 }, { dx: 0.15, dy: 0.38 },
      ].map((dot, i) => (
        <View key={i} style={{
          position: 'absolute',
          width: size * 0.038, height: size * 0.038,
          borderRadius: size * 0.019,
          backgroundColor: 'rgba(255,255,255,0.07)',
          left: afroLeft + afroW * dot.dx,
          top: afroH * dot.dy,
        }} />
      ))}

      {/* Visage */}
      <View style={{
        position: 'absolute',
        width: faceD, height: faceD, borderRadius: faceD / 2,
        backgroundColor: SKIN,
        left: faceLeft, top: faceTop,
      }} />

      {/* Yeux */}
      <View style={{
        position: 'absolute',
        width: eyeW, height: squinting ? eyeH * 0.38 : eyeH,
        borderRadius: eyeW / 2, backgroundColor: '#1A0800',
        left: eyeLX, top: squinting ? eyeY + eyeH * 0.31 : eyeY,
      }} />
      <View style={{
        position: 'absolute',
        width: eyeW, height: squinting ? eyeH * 0.38 : eyeH,
        borderRadius: eyeW / 2, backgroundColor: '#1A0800',
        left: eyeRX, top: squinting ? eyeY + eyeH * 0.31 : eyeY,
      }} />

      {/* Reflets yeux */}
      {!squinting && <>
        <View style={{
          position: 'absolute',
          width: eyeW * 0.32, height: eyeW * 0.32, borderRadius: eyeW,
          backgroundColor: 'rgba(255,255,255,0.75)',
          left: eyeLX + eyeW * 0.54, top: eyeY + eyeH * 0.08,
        }} />
        <View style={{
          position: 'absolute',
          width: eyeW * 0.32, height: eyeW * 0.32, borderRadius: eyeW,
          backgroundColor: 'rgba(255,255,255,0.75)',
          left: eyeRX + eyeW * 0.54, top: eyeY + eyeH * 0.08,
        }} />
      </>}

      {/* Bouche */}
      <View style={{
        position: 'absolute',
        left: mouthLeft, top: mouthY,
        ...mouthMap[expression],
      }} />

      {/* Boucles d'oreilles ambré */}
      <View style={{
        position: 'absolute',
        width: earD, height: earD, borderRadius: earD / 2,
        backgroundColor: Colors.amber,
        left: faceLeft - earD * 0.28, top: faceTop + faceD * 0.44,
      }} />
      <View style={{
        position: 'absolute',
        width: earD, height: earD, borderRadius: earD / 2,
        backgroundColor: Colors.amber,
        left: faceLeft + faceD - earD * 0.72, top: faceTop + faceD * 0.44,
      }} />

      {/* Badge expression */}
      {expression === 'thinking' && (
        <View style={{
          position: 'absolute', top: 0, right: 0,
          width: size * 0.24, height: size * 0.24, borderRadius: size * 0.12,
          backgroundColor: Colors.amberLight,
          borderWidth: 1.5, borderColor: Colors.amber,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: size * 0.13 }}>?</Text>
        </View>
      )}
      {expression === 'tip' && (
        <View style={{
          position: 'absolute', top: -size * 0.04, right: size * 0.02,
          width: size * 0.27, height: size * 0.27, borderRadius: size * 0.135,
          backgroundColor: Colors.amberLight,
          borderWidth: 1.5, borderColor: Colors.amber,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: size * 0.15 }}>💡</Text>
        </View>
      )}
      {expression === 'celebrating' && (
        <>
          <Text style={{ position: 'absolute', top: -size * 0.12, right: size * 0.04, fontSize: size * 0.24 }}>✨</Text>
          <Text style={{ position: 'absolute', top: size * 0.04, left: -size * 0.04, fontSize: size * 0.18 }}>⭐</Text>
        </>
      )}
    </View>
  );

  if (!message) return avatar;

  // ── Avec bulle de dialogue ──
  const isRight  = bubblePosition === 'right';
  const isBottom = bubblePosition === 'bottom';

  return (
    <View style={{
      flexDirection: isRight ? 'row' : 'column',
      alignItems: isRight ? 'flex-start' : 'center',
      gap: 10,
    }}>
      {avatar}

      <View style={{
        flex: isRight ? 1 : undefined,
        backgroundColor: Colors.surface,
        borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
        padding: 12,
        marginTop: isRight ? size * 0.12 : 0,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
      }}>
        <Text style={{ fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.ink, lineHeight: 19 }}>
          {message}
        </Text>

        {/* Triangle pointeur → droite */}
        {isRight && <>
          <View style={{
            position: 'absolute', left: -8, top: 16,
            borderTopWidth: 7, borderBottomWidth: 7, borderRightWidth: 8,
            borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: Colors.border,
          }} />
          <View style={{
            position: 'absolute', left: -6, top: 17,
            borderTopWidth: 6, borderBottomWidth: 6, borderRightWidth: 7,
            borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: Colors.surface,
          }} />
        </>}

        {/* Triangle pointeur → bas */}
        {isBottom && <>
          <View style={{
            position: 'absolute', top: -8, left: size * 0.32,
            borderLeftWidth: 7, borderRightWidth: 7, borderBottomWidth: 8,
            borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: Colors.border,
          }} />
          <View style={{
            position: 'absolute', top: -6, left: size * 0.32 + 1,
            borderLeftWidth: 6, borderRightWidth: 6, borderBottomWidth: 7,
            borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: Colors.surface,
          }} />
        </>}
      </View>
    </View>
  );
}
