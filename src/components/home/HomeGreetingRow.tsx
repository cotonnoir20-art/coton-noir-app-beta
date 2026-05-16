import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../theme/colors';
import { FontDisplay } from '../../theme/typography';

type Props = {
  displayName: string;
  /** Emoji entre « Bonjour » et le prénom (ex. 🌸). */
  greetingEmoji?: string;
};

export function HomeGreetingRow({ displayName, greetingEmoji = '🌸' }: Props) {
  return (
    <View style={s.wrap}>
      <Text style={s.line} numberOfLines={1}>
        <Text style={s.bonjour}>Bonjour </Text>
        <Text style={s.emoji}>{greetingEmoji} </Text>
        <Text style={s.name}>{displayName}</Text>
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', marginBottom: 10, paddingHorizontal: 12 },
  line: { textAlign: 'center' },
  bonjour: {
    fontSize: 16,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
  },
  emoji: { fontSize: 16 },
  name: {
    fontSize: 20,
    fontFamily: FontDisplay,
    color: Colors.ink,
    letterSpacing: -0.3,
  },
});
