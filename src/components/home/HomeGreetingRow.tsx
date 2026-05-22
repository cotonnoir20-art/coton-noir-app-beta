import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../theme/colors';
import { Fonts, Type } from '../../theme/typography';
import { ProfileAvatar } from '../profile/ProfileAvatar';

type Props = {
  displayName: string;
  /** Emoji entre « Bonjour » et le prénom (ex. 🌸) si pas d’avatar perso. */
  greetingEmoji?: string;
  onAvatarPress?: () => void;
};

export function HomeGreetingRow({ displayName, greetingEmoji = '🌸', onAvatarPress }: Props) {
  return (
    <View style={s.wrap}>
      {onAvatarPress ? (
        <ProfileAvatar size={40} onPress={onAvatarPress} style={s.avatar} />
      ) : null}
      <Text style={s.line} numberOfLines={1}>
        <Text style={s.bonjour}>Bonjour </Text>
        {!onAvatarPress ? <Text style={s.emoji}>{greetingEmoji} </Text> : null}
        <Text style={s.name}>{displayName}</Text>
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10, paddingHorizontal: 12 },
  avatar: { flexShrink: 0 },
  line: { textAlign: 'center' },
  bonjour: {
    ...Type.sectionTitle,
    fontFamily: Fonts.bodyMedium,
    color: Colors.warmGray,
  },
  emoji: { fontSize: 16 },
  name: {
    ...Type.greetingName,
    color: Colors.ink,
  },
});
