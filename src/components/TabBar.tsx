import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { label: string; icon: IoniconName; activeIcon: IoniconName; route: string }[] = [
  { label: 'Accueil', icon: 'home-outline',       activeIcon: 'home',        route: '/'        },
  { label: 'Routine', icon: 'calendar-outline',   activeIcon: 'calendar',    route: '/routine'  },
  { label: 'Analyse', icon: 'search-outline',      activeIcon: 'search',      route: '/analyze'  },
  { label: 'Pousse',  icon: 'trending-up-outline', activeIcon: 'trending-up', route: '/growth'   },
  { label: 'Profil',  icon: 'person-outline',      activeIcon: 'person',      route: '/profile'  },
];

export function TabBar() {
  const router   = useRouter();
  const pathname = usePathname();
  const insets   = useSafeAreaInsets();

  return (
    <View style={[S.bar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      {TABS.map(tab => {
        const active = pathname === tab.route;
        return (
          <TouchableOpacity
            key={tab.route}
            style={S.tab}
            onPress={() => router.push(tab.route as any)}
          >
            <Ionicons
              name={active ? tab.activeIcon : tab.icon}
              size={24}
              color={active ? Colors.amber : Colors.warmGray}
            />
            <Text style={[S.label, active && S.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const S = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label:       { fontSize: 10, fontFamily: 'DMSans_600SemiBold', color: Colors.warmGray },
  labelActive: { color: Colors.amber },
});
