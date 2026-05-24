import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Fonts } from '../../theme/typography';
import type { RecoRoutineStep } from '../../lib/onboardingRecommendations';

export type RoutineRecoAccent = 'sage' | 'amber' | 'slate';

const ACCENT = {
  sage: {
    iconBg: Colors.sageLight,
    iconColor: Colors.sageDark,
    badgeBg: '#E8F3EF',
    badgeText: Colors.sageDark,
    kicker: Colors.sageDark,
  },
  amber: {
    iconBg: Colors.amberLight,
    iconColor: Colors.amberDark,
    badgeBg: '#FFF0E0',
    badgeText: Colors.amberDark,
    kicker: Colors.amberDark,
  },
  slate: {
    iconBg: '#E8EEF1',
    iconColor: Colors.inkSoft,
    badgeBg: '#EEF2F4',
    badgeText: Colors.inkSoft,
    kicker: Colors.inkSoft,
  },
} as const;

type RoutineRecoCardProps = {
  kicker: string;
  title: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  accent: RoutineRecoAccent;
  steps: RecoRoutineStep[];
  tip: string;
  /** Numérotation globale (ex. soir commence à 5). */
  stepOffset?: number;
  /** Suite d’étapes sans en-tête (zone paywall). */
  continuation?: boolean;
  /** Dans un conteneur parent (pas de bordure carte). */
  embedded?: boolean;
};

export function RoutineRecoCard({
  kicker,
  title,
  icon,
  accent,
  steps,
  tip,
  stepOffset = 0,
  continuation = false,
  embedded = false,
}: RoutineRecoCardProps) {
  const palette = ACCENT[accent];

  return (
    <View
      style={[
        styles.card,
        continuation && styles.cardContinuation,
        embedded && styles.cardEmbedded,
      ]}
    >
      {!continuation ? (
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrap, { backgroundColor: palette.iconBg }]}>
            <Ionicons name={icon} size={20} color={palette.iconColor} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.kicker, { color: palette.kicker }]}>{kicker}</Text>
            <Text style={styles.cardTitle}>{title}</Text>
          </View>
        </View>
      ) : null}

      <View style={[styles.steps, continuation && styles.stepsContinuation]}>
        {steps.map((step, i) => {
          const n = stepOffset + i + 1;
          return (
            <View key={`${kicker}-${n}`} style={styles.stepRow}>
              <View style={[styles.stepBadge, { backgroundColor: palette.badgeBg }]}>
                <Text style={[styles.stepBadgeText, { color: palette.badgeText }]}>{n}</Text>
              </View>
              <Text style={styles.stepText}>
                {step.desc || step.title}
              </Text>
            </View>
          );
        })}
      </View>

      {tip ? (
        <View style={styles.tipBox}>
          <Ionicons name="bulb-outline" size={16} color={Colors.warmGray} style={styles.tipIcon} />
          <Text style={styles.tipText}>
            <Text style={styles.tipLabel}>Astuce · </Text>
            {tip}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 14,
  },
  cardEmbedded: {
    marginBottom: 0,
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  cardContinuation: {
    marginBottom: 0,
    borderWidth: 0,
    borderRadius: 0,
    paddingTop: 4,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  stepsContinuation: {
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, minWidth: 0 },
  kicker: {
    fontSize: 10,
    fontFamily: Fonts.bodyBold,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: Fonts.display,
    color: Colors.ink,
    lineHeight: 24,
  },
  steps: { gap: 12, marginBottom: 14 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepBadgeText: {
    fontSize: 13,
    fontFamily: Fonts.bodyBold,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.ink,
    lineHeight: 21,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.cream,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  tipIcon: { marginTop: 2 },
  tipText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 17,
  },
  tipLabel: {
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
  },
});
