import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../src/components/AppHeader';
import { ForYouDiscoverFeed } from '../../src/components/discover/ForYouDiscoverFeed';
import { ShortcutsExplorer } from '../../src/components/shortcuts/ShortcutsExplorer';
import { useApp } from '../../src/context/AppContext';
import { Colors } from '../../src/theme/colors';

type DiscoverTab = 'forYou' | 'browse';

export default function ShortcutsTabScreen() {
  const { state } = useApp();
  const [tab, setTab] = useState<DiscoverTab>('forYou');

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <AppHeader
        title="Explorer"
        subtitle={
          tab === 'forYou'
            ? 'Sélection selon ton objectif et tes problématiques'
            : 'Parcours par objectif — soin, progression, économies, motivation'
        }
        rightAction="none"
      />

      <View style={s.tabBar}>
        <TouchableOpacity
          style={[s.tab, tab === 'forYou' && s.tabActive]}
          onPress={() => setTab('forYou')}
          activeOpacity={0.85}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'forYou' }}
        >
          <Text style={[s.tabText, tab === 'forYou' && s.tabTextActive]}>Pour toi</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, tab === 'browse' && s.tabActive]}
          onPress={() => setTab('browse')}
          activeOpacity={0.85}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'browse' }}
        >
          <Text style={[s.tabText, tab === 'browse' && s.tabTextActive]}>Parcourir</Text>
        </TouchableOpacity>
      </View>

      {tab === 'forYou' ? (
        <ForYouDiscoverFeed profile={state.profile} contentPaddingBottom={32} />
      ) : (
        <ShortcutsExplorer contentPaddingBottom={32} />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: Colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.amber,
  },
  tabText: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
  },
  tabTextActive: {
    color: Colors.ink,
  },
});
