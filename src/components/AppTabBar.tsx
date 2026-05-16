import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';

// Haptics ne sont pas dispo sur web et peuvent throw sur certains émulateurs.
// On encapsule pour éviter de casser la navigation si jamais.
function triggerHaptic(style: Haptics.ImpactFeedbackStyle) {
  if (Platform.OS === 'web') return;
  try {
    Haptics.impactAsync(style);
  } catch {
    // no-op : haptique indisponible sur ce device
  }
}

function triggerSelectionHaptic() {
  if (Platform.OS === 'web') return;
  try {
    Haptics.selectionAsync();
  } catch {
    // no-op
  }
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type TabDef = {
  name: string;
  label: string;
  icon: IoniconName;
  iconFocused: IoniconName;
  href: string;
};

const LEFT_TABS: TabDef[] = [
  { name: 'index',  label: 'Accueil', icon: 'home-outline',       iconFocused: 'home',        href: '/(tabs)/'       },
  { name: 'growth', label: 'Progrès', icon: 'trending-up-outline', iconFocused: 'trending-up', href: '/(tabs)/growth' },
];

const RIGHT_TABS: TabDef[] = [
  { name: 'routine', label: 'Routine', icon: 'calendar-outline', iconFocused: 'calendar', href: '/(tabs)/routine' },
  { name: 'profile', label: 'Profil',  icon: 'person-outline',   iconFocused: 'person',   href: '/(tabs)/profile' },
];

export function AppTabBar() {
  const router   = useRouter();
  const segments = useSegments();
  const insets   = useSafeAreaInsets();

  const isInTabs  = segments[0] === '(tabs)';
  const activeTab = isInTabs ? (segments[1] || 'index') : null;

  function renderTab(tab: TabDef) {
    const focused = activeTab === tab.name;
    return (
      <TouchableOpacity
        key={tab.name}
        style={s.tabItem}
        onPress={() => {
          // Léger "tick" si on reste sur l'onglet courant, impact léger sinon
          if (focused) {
            triggerSelectionHaptic();
          } else {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
          }
          router.push(tab.href as any);
        }}
        activeOpacity={0.7}
      >
        <View style={[s.iconCircle, focused && s.iconCircleActive]}>
          <Ionicons
            name={focused ? tab.iconFocused : tab.icon}
            size={focused ? 22 : 20}
            color={focused ? '#fff' : Colors.warmGray}
          />
        </View>
        <Text
          style={[s.label, focused && s.labelActive]}
          numberOfLines={1}
        >
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[s.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={s.inner}>
        {LEFT_TABS.map(renderTab)}

        {/* Centre "+" */}
        <TouchableOpacity
          style={s.plusWrap}
          onPress={() => {
            // Action principale : feedback un peu plus marqué
            triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/add-entry' as any);
          }}
          activeOpacity={0.85}
        >
          <View style={s.plusBtn}>
            <Ionicons name="add" size={30} color="#fff" />
          </View>
        </TouchableOpacity>

        {RIGHT_TABS.map(renderTab)}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 12,
        // Bouton « + » qui dépasse (marginTop négatif) — évite la découpe sous Android
        overflow: 'visible',
      },
    }),
  },
  inner: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleActive: {
    backgroundColor: Colors.ink,
  },
  label: {
    fontSize: 10,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    letterSpacing: 0.2,
  },
  labelActive: {
    // Label conservé sur l'onglet actif, mais réduit pour laisser respirer
    // la pastille foncée et garder le repère textuel.
    fontSize: 9,
    color: Colors.ink,
    fontFamily: 'DMSans_500Medium',
    letterSpacing: 0.3,
  },

  /* Centre "+" */
  plusWrap: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
  },
  plusBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.ink,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
  },
});
