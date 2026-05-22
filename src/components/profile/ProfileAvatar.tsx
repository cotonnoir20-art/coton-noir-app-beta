import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from 'react-native';
import { loadUserPrefs } from '../../lib/userPrefs';

type Props = {
  size?: number;
  onPress?: () => void;
  style?: ViewStyle;
};

export function ProfileAvatar({ size = 44, onPress, style }: Props) {
  const [emoji, setEmoji] = useState('👩🏾‍🦱');
  const [bg, setBg] = useState('#3A1A0A');
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    void loadUserPrefs().then(p => {
      if (p.avatarEmoji) setEmoji(p.avatarEmoji);
      if (p.avatarBg) setBg(p.avatarBg);
      if (p.avatarPhoto) setPhoto(p.avatarPhoto);
    });
  }, []);

  const circle = (
    <View
      style={[
        S.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
        },
      ]}
    >
      {photo ? (
        <Image source={{ uri: photo }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <Text style={{ fontSize: size * 0.48 }}>{emoji}</Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={style}>
        {circle}
      </TouchableOpacity>
    );
  }

  return <View style={style}>{circle}</View>;
}

const S = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
  },
});
