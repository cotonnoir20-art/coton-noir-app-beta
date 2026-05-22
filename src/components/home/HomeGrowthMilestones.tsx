import { Ionicons } from '@expo/vector-icons';
import { Fragment } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { GROWTH_MILESTONES_LEGEND } from '../../constants/productPitch';
import { Colors } from '../../theme/colors';
import { Type } from '../../theme/typography';
import type { MilestoneItem } from '../../lib/homeGrowth';

type Props = {
  items: MilestoneItem[];
  currentCm: number;
  targetCm: number;
};

export function HomeGrowthMilestones({ items, currentCm, targetCm }: Props) {
  const remaining = Math.max(0, Math.round((targetCm - currentCm) * 10) / 10);

  return (
    <View style={s.section}>
      <View style={s.head}>
        <Text style={s.title}>Paliers de pousse</Text>
        <Text style={s.meta}>
          {remaining > 0 ? `Encore ${remaining} cm · objectif ${targetCm} cm` : `Objectif ${targetCm} cm`}
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.track}>
          {items.map((m, i) => (
            <Fragment key={`${m.cm}-${i}`}>
              {i > 0 ? (
                <View
                  style={[
                    s.connector,
                    items[i - 1].status === 'done' && m.status !== 'future' ? s.connectorFill : null,
                  ]}
                />
              ) : null}
              <View style={s.col}>
                <View
                  style={[
                    s.node,
                    m.status === 'done' && s.nodeDone,
                    m.status === 'current' && s.nodeCurrent,
                    m.status === 'goal' && s.nodeGoal,
                    m.status === 'future' && s.nodeFuture,
                  ]}
                >
                  {m.status === 'done' && <Ionicons name="checkmark" size={14} color="#fff" />}
                  {m.status === 'current' && <Text style={s.nodeNum}>{m.cm}</Text>}
                  {m.status === 'goal' && <Ionicons name="trophy" size={14} color={Colors.amberDark} />}
                  {m.status === 'future' && <View style={s.dotInner} />}
                </View>
                <Text style={[s.cmLab, m.status === 'current' && s.cmLabBold]}>{m.cm} cm</Text>
                {m.status === 'current' ? (
                  <Text style={s.here}>Tu es ici</Text>
                ) : (
                  <Text style={s.hereSpacer}> </Text>
                )}
              </View>
            </Fragment>
          ))}
        </View>
      </ScrollView>
      <Text style={s.footLegend}>{GROWTH_MILESTONES_LEGEND}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  section: { marginTop: 8, marginBottom: 20 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 20, marginBottom: 14, gap: 12 },
  title: { ...Type.cardTitle, color: Colors.ink, flexShrink: 0 },
  meta: { fontSize: 11, fontFamily: 'DMSans_500Medium', color: Colors.warmGray, flex: 1, textAlign: 'right' },
  scroll: { paddingHorizontal: 16 },
  track: { flexDirection: 'row', alignItems: 'flex-start' },
  col: { alignItems: 'center', width: 56 },
  connector: {
    width: 20,
    height: 2,
    marginTop: 15,
    backgroundColor: Colors.border,
    borderRadius: 1,
  },
  connectorFill: { backgroundColor: Colors.amber },
  node: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  nodeDone: { backgroundColor: Colors.amber, borderColor: Colors.amber },
  nodeCurrent: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  nodeGoal: { backgroundColor: Colors.cream, borderColor: Colors.amber },
  nodeFuture: { backgroundColor: '#fff' },
  dotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  nodeNum: { fontSize: 11, fontFamily: 'DMSans_700Bold', color: '#fff' },
  cmLab: { fontSize: 10, fontFamily: 'DMSans_500Medium', color: Colors.warmGray, marginTop: 6 },
  cmLabBold: { color: Colors.ink, fontFamily: 'DMSans_700Bold' },
  here: { fontSize: 9, fontFamily: 'DMSans_500Medium', color: Colors.rose, marginTop: 2 },
  hereSpacer: { fontSize: 9, marginTop: 2, opacity: 0 },
  footLegend: {
    fontSize: 10,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    paddingHorizontal: 20,
    marginTop: 10,
    lineHeight: 14,
  },
});
