import { Image } from 'expo-image';
import { View, type ViewStyle } from 'react-native';
import type { BlackCottonMood } from './types';

// ── Illustrations Black Cotton (PNG, fond transparent) ─────────────────────
// Le nom "BCEmojiAvatar" est legacy : on rend en réalité les vraies
// illustrations du personnage. Conservé pour ne pas casser les imports
// existants, mais on exporte aussi `BCIllustration` qui est plus juste.
const MOOD_IMAGES: Record<BlackCottonMood, any> = {
  happy:       require('../../../assets/images/black-cotton/bc-happy.png'),
  proud:       require('../../../assets/images/black-cotton/bc-proud.png'),
  celebrating: require('../../../assets/images/black-cotton/bc-celebrating.png'),
  thinking:    require('../../../assets/images/black-cotton/bc-thinking.png'),
  encouraging: require('../../../assets/images/black-cotton/bc-encouraging.png'),
  surprised:   require('../../../assets/images/black-cotton/bc-surprised.png'),
  playful:     require('../../../assets/images/black-cotton/bc-playful.png'),
  coaching:    require('../../../assets/images/black-cotton/bc-coaching.png'),
};

interface Props {
  size?: number;
  mood?: BlackCottonMood;
  /**
   * Si `true`, on rogne l'illustration dans un disque avec un fond pastel
   * (ancien look). Par défaut on affiche l'illustration entière sur fond
   * transparent — c'est le rendu attendu de la mascotte.
   */
  circle?: boolean;
  style?: ViewStyle;
}

export function BCEmojiAvatar({
  size = 48,
  mood = 'happy',
  circle = false,
  style,
}: Props) {
  // Hauteur visuelle légèrement réduite quand on est en mode "illustration"
  // pour compenser le fait que les PNG ont souvent un peu d'air autour
  // (sinon le perso semble plus petit que les anciens cercles).
  const imageSize = circle ? size : size * 1.08;

  if (circle) {
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: 'hidden',
            backgroundColor: '#E8D0B8',
            alignItems: 'center',
            justifyContent: 'center',
          },
          style,
        ]}
      >
        <Image
          source={MOOD_IMAGES[mood]}
          style={{ width: size, height: size }}
          contentFit="cover"
          transition={0}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
        },
        style,
      ]}
    >
      <Image
        source={MOOD_IMAGES[mood]}
        style={{ width: imageSize, height: imageSize }}
        contentFit="contain"
        transition={0}
      />
    </View>
  );
}

// Alias plus explicite pour le nouveau code.
export const BCIllustration = BCEmojiAvatar;
