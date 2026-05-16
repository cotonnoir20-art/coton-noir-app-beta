import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { shouldShowWebBetaBanner } from '../lib/webStaging';

/**
 * Bandeau discret sur la PWA beta hébergée (pas en dev local).
 */
export function WebBetaBanner() {
  const insets = useSafeAreaInsets();
  if (!shouldShowWebBetaBanner()) return null;

  return (
    <View style={[S.wrap, { paddingTop: Math.max(insets.top, 8) }]}>
      <Text style={S.text}>
        Version beta web · Teste ici, puis l’app iOS / Android arrivera sur les stores
      </Text>
    </View>
  );
}

const S = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.amberLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.amber,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  text: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.amberDark,
    textAlign: 'center',
    lineHeight: 16,
  },
});
