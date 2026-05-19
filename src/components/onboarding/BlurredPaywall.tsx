import type { ReactNode } from 'react';
import { Platform, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';

export const PAYWALL_MSG = 'Créer un compte pour voir tes recommandations complètes';

/**
 * Dégradé dans la zone verrouillée : le haut correspond déjà au 2ᵉ item du soir
 * (étape 1 visible au-dessus) — opacité minimale élevée dès 0 %.
 */
const FADE_STOPS = {
  colors: [
    'rgba(253, 248, 244, 0.52)',
    'rgba(253, 248, 244, 0.72)',
    'rgba(253, 248, 244, 0.9)',
    'rgba(253, 248, 244, 0.99)',
  ] as const,
  locations: [0, 0.22, 0.5, 1] as const,
};

const BLUR_MASK_WEB =
  'linear-gradient(to bottom, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.8) 18%, rgba(0,0,0,0.95) 42%, black 78%)';

type Props = {
  locked: boolean;
  children: ReactNode;
  style?: ViewStyle;
  progressive?: boolean;
  /** Hauteur max. de l’aperçu (évite l’effet « scroll infini »). */
  progressiveMaxHeight?: number;
  /** Couleur de fin du dégradé bas (ex. fond de la carte). */
  fadeBottomColor?: string;
  homeTeaser?: string;
};

function NativeProgressiveBlur() {
  return (
    <MaskedView
      style={s.blurMaskHost}
      maskElement={
        <LinearGradient
          colors={['rgba(0,0,0,0.58)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.96)', 'black']}
          locations={[0, 0.2, 0.48, 0.82]}
          style={StyleSheet.absoluteFill}
        />
      }
    >
      <BlurView intensity={96} tint="light" style={s.blurLayer} />
    </MaskedView>
  );
}

function ProgressiveVeil({ fadeBottomColor }: { fadeBottomColor?: string }) {
  return (
    <>
      {Platform.OS === 'web' ? (
        <View style={s.webBlurProgressive} pointerEvents="none" />
      ) : (
        <NativeProgressiveBlur />
      )}
      <LinearGradient
        colors={[...FADE_STOPS.colors]}
        locations={[...FADE_STOPS.locations]}
        style={s.creamFade}
        pointerEvents="none"
      />
      {fadeBottomColor ? (
        <LinearGradient
          colors={['transparent', fadeBottomColor]}
          locations={[0.4, 1]}
          style={s.bottomCap}
          pointerEvents="none"
        />
      ) : null}
    </>
  );
}

export function BlurredPaywall({
  locked,
  children,
  style,
  progressive = false,
  progressiveMaxHeight,
  fadeBottomColor,
  homeTeaser,
}: Props) {
  if (!locked) {
    return <View style={style}>{children}</View>;
  }

  const a11yLabel = homeTeaser ? `${PAYWALL_MSG} ${homeTeaser}` : PAYWALL_MSG;

  return (
    <View
      style={[
        s.wrap,
        progressive && s.wrapProgressive,
        progressive && progressiveMaxHeight != null && { maxHeight: progressiveMaxHeight },
        style,
      ]}
    >
      <View style={[s.content, progressive && s.contentProgressive]} pointerEvents="none">
        {children}
      </View>

      {progressive ? (
        <ProgressiveVeil fadeBottomColor={fadeBottomColor} />
      ) : Platform.OS === 'web' ? (
        <View style={s.webBlurLayer} pointerEvents="none" />
      ) : (
        <BlurView intensity={55} tint="light" style={s.blurLayer} pointerEvents="none" />
      )}

      <View
        style={[s.overlay, progressive && s.overlayProgressive]}
        accessibilityRole="text"
        accessibilityLabel={a11yLabel}
      >
        <View style={s.callout}>
          <View style={s.lockBadge}>
            <Ionicons name="lock-closed" size={20} color={Colors.amberDark} />
          </View>
          <Text style={s.overlayTitle}>{PAYWALL_MSG}</Text>
          {homeTeaser ? (
            <Text style={s.overlayTeaser}>({homeTeaser} — sur ton accueil)</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 16,
  },
  wrapProgressive: {
    marginBottom: 0,
    borderRadius: 0,
    marginTop: 4,
  },
  content: {
    opacity: 1,
  },
  contentProgressive: {
    opacity: 0.82,
  },
  blurMaskHost: {
    ...StyleSheet.absoluteFillObject,
  },
  blurLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  webBlurLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    // @ts-expect-error backdrop-filter
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  },
  webBlurProgressive: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
    // @ts-expect-error backdrop-filter
    backdropFilter: 'blur(18px) saturate(1.2)',
    WebkitBackdropFilter: 'blur(18px) saturate(1.2)',
    maskImage: BLUR_MASK_WEB,
    WebkitMaskImage: BLUR_MASK_WEB,
  },
  creamFade: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomCap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 72,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    minHeight: 200,
    backgroundColor: 'transparent',
  },
  overlayProgressive: {
    justifyContent: 'center',
    paddingTop: 16,
    paddingBottom: 16,
  },
  callout: {
    alignItems: 'center',
    maxWidth: 300,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(253, 248, 244, 0.98)',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#1D1D1B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 14,
      },
      android: { elevation: 5 },
      default: {},
    }),
  },
  lockBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.amberLight,
    borderWidth: 1,
    borderColor: Colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  overlayTitle: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
    textAlign: 'center',
    lineHeight: 21,
  },
  overlayTeaser: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 18,
  },
});
