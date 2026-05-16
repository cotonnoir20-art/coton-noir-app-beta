import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppHeader } from '../src/components/AppHeader';
import { HighlightCard } from '../src/components/home/HighlightCard';
import { Colors } from '../src/theme/colors';
import type { MomentCard } from '../src/data/homeHighlights';
import { FALLBACK_HOME_HIGHLIGHTS } from '../src/data/homeHighlights';
import { fetchHomeHighlights } from '../src/lib/fetchHomeHighlights';
import { HIGHLIGHTS_PTS_LEGEND } from '../src/constants/productPitch';

const TAB_BAR_EXTRA = 56;

export default function HighlightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<MomentCard[]>(() => [...FALLBACK_HOME_HIGHLIGHTS]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchHomeHighlights()
      .then(list => {
        if (cancelled) return;
        if (Array.isArray(list) && list.length > 0) setItems([...list]);
        else setItems([...FALLBACK_HOME_HIGHLIGHTS]);
      })
      .catch(() => {
        if (!cancelled) setItems([...FALLBACK_HOME_HIGHLIGHTS]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const list = await fetchHomeHighlights();
      if (Array.isArray(list) && list.length > 0) setItems([...list]);
      else setItems([...FALLBACK_HOME_HIGHLIGHTS]);
    } catch {
      setItems([...FALLBACK_HOME_HIGHLIGHTS]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: MomentCard }) => (
      <HighlightCard
        moment={item}
        layout="list"
        onPress={item.route ? () => router.push(item.route as any) : undefined}
      />
    ),
    [router],
  );

  const keyExtractor = useCallback((item: MomentCard) => item.id, []);

  const footer = useCallback(
    () => (
      <View>
        <TouchableOpacity style={s.discoverLink} onPress={() => router.push('/discover' as any)} activeOpacity={0.85}>
          <Text style={s.discoverText}>Voir aussi tous les outils et offres</Text>
          <Text style={s.discoverArrow}>→</Text>
        </TouchableOpacity>
        <View style={{ height: 32 }} />
      </View>
    ),
    [router],
  );

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <AppHeader
        title="Moments forts"
        subtitle={`Challenges, offres et actus.\n${HIGHLIGHTS_PTS_LEGEND}`}
        rightAction="none"
      />
      <FlatList
        style={s.list}
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListFooterComponent={footer}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>Aucun moment pour l’instant.</Text>
          </View>
        }
        contentContainerStyle={[
          s.content,
          { paddingBottom: Math.max(insets.bottom, 12) + TAB_BAR_EXTRA },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.amber} colors={[Colors.amber]} />
        }
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  list: { flex: 1 },
  content: { paddingTop: 8 },
  empty: { padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
  discoverLink: {
    marginHorizontal: 20,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cream,
  },
  discoverText: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },
  discoverArrow: { fontSize: 16, fontFamily: 'DMSans_600SemiBold', color: Colors.amberDark },
});
