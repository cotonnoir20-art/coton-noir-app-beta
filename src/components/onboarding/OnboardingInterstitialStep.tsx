import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../theme/colors';
import { ONBOARDING_TESTIMONIALS } from '../../constants/onboardingTestimonials';
import type {
  OnboardingInterstitialConfig,
  OnboardingInterstitialId,
} from '../../constants/onboardingInterstitials';
import { BCEmojiAvatar } from '../blackCotton/BCEmojiAvatar';
import type { BlackCottonMood } from '../blackCotton/types';

const INTERSTITIAL_MOOD: Record<OnboardingInterstitialId, BlackCottonMood> = {
  regularity: 'encouraging',
  testimonials: 'happy',
  consistency: 'coaching',
};

const BAR_TONES = {
  muted: { bar: Colors.border, text: Colors.warmGray },
  mid: { bar: '#E8C4A8', text: Colors.amberDark },
  brand: { bar: Colors.amber, text: Colors.amberDark },
} as const;

function StatBarsCard({ rows }: { rows: NonNullable<OnboardingInterstitialConfig['statBars']> }) {
  return (
    <View style={s.card}>
      {rows.map(row => {
        const tone = BAR_TONES[row.tone];
        return (
          <View key={row.label} style={s.barRow}>
            <View style={s.barLabelRow}>
              <Text style={s.barLabel}>{row.label}</Text>
              <Text style={[s.barPct, { color: tone.text }]}>{row.percent}%</Text>
            </View>
            <View style={s.barTrack}>
              <View
                style={[
                  s.barFill,
                  { width: `${row.percent}%`, backgroundColor: tone.bar },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function ConsistencyChartCard({
  weeks,
  withValues,
  withoutValues,
}: {
  weeks: string[];
  withValues: number[];
  withoutValues: number[];
}) {
  const max = 100;
  return (
    <View style={s.card}>
      <View style={s.chartArea}>
        {withValues.map((v, i) => (
          <View key={weeks[i]} style={s.chartCol}>
            <View style={s.chartBars}>
              <View style={[s.chartBarMuted, { height: `${(withoutValues[i] / max) * 100}%` }]} />
              <View style={[s.chartBarBrand, { height: `${(v / max) * 100}%` }]} />
            </View>
            <Text style={s.chartWeek}>{weeks[i]}</Text>
          </View>
        ))}
      </View>
      <View style={s.legendRow}>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: Colors.amber }]} />
          <Text style={s.legendText}>Avec Coton Noir</Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: Colors.border }]} />
          <Text style={s.legendText}>Sans</Text>
        </View>
      </View>
    </View>
  );
}

function TestimonialsCard() {
  return (
    <View style={s.testimonialList}>
      {ONBOARDING_TESTIMONIALS.map(t => (
        <View key={`${t.name}-${t.city}`} style={s.testimonialCard}>
          {/* Étoiles */}
          <View style={s.starsRow}>
            {[1,2,3,4,5].map(i => (
              <Text key={i} style={s.star}>★</Text>
            ))}
          </View>
          <Text style={s.testimonialQuote}>« {t.quote} »</Text>
          <View style={s.testimonialFooter}>
            <Text style={s.testimonialMeta}>{t.name}, {t.city}</Text>
            <View style={s.resultBadge}>
              <Text style={s.resultBadgeText}>{t.result}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

type Props = {
  config: OnboardingInterstitialConfig;
  hairType?: string;
};

export function OnboardingInterstitialStep({ config, hairType }: Props) {
  const personalizedBody =
    config.id === 'testimonials' && hairType
      ? `Des femmes avec des cheveux ${hairType} comme les tiens ont commencé au même point — voici ce qui a changé avec Coton Noir.`
      : config.body;
  const showStatCard = config.id === 'regularity' && config.statBars;
  const showChart =
    config.id === 'consistency' &&
    config.chartWeeks &&
    config.chartWithValues &&
    config.chartWithoutValues;
  const showTestimonials = config.id === 'testimonials';

  return (
    <View style={s.wrap}>
      <View style={s.avatarWrap}>
        <BCEmojiAvatar size={80} mood={INTERSTITIAL_MOOD[config.id]} />
      </View>

      {showTestimonials ? (
        <>
          <Text style={s.title}>{config.title}</Text>
          <Text style={[s.body, s.bodySpaced]}>{personalizedBody}</Text>
          <TestimonialsCard />
        </>
      ) : (
        <>
          {showStatCard ? (
            <>
              <Text style={s.cardEyebrow}>{config.cardEyebrow}</Text>
              <StatBarsCard rows={config.statBars!} />
            </>
          ) : null}

          {showChart ? (
            <>
              <Text style={s.cardEyebrow}>{config.cardEyebrow}</Text>
              <ConsistencyChartCard
                weeks={config.chartWeeks!}
                withValues={config.chartWithValues!}
                withoutValues={config.chartWithoutValues!}
              />
            </>
          ) : null}

          <Text style={s.title}>{config.title}</Text>
          <Text style={s.body}>{config.body}</Text>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingTop: 4,
    paddingBottom: 12,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  cardEyebrow: {
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
    color: Colors.warmGray,
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 14,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    marginBottom: 28,
  },
  barRow: { marginBottom: 16 },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    color: Colors.ink,
  },
  barPct: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
  },
  barTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.cream,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: 110,
    marginBottom: 10,
  },
  chartBarMuted: {
    width: 14,
    minHeight: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  chartBarBrand: {
    width: 14,
    minHeight: 8,
    borderRadius: 4,
    backgroundColor: Colors.amber,
  },
  chartWeek: {
    fontSize: 10,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
    textAlign: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Satoshi_500Medium',
    color: Colors.ink,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 4,
  },
  bodySpaced: { marginBottom: 20 },
  testimonialList: { gap: 10 },
  testimonialCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 8,
  },
  star: {
    fontSize: 13,
    color: Colors.amber,
  },
  testimonialQuote: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    fontStyle: 'italic',
    color: Colors.ink,
    lineHeight: 22,
    marginBottom: 10,
  },
  testimonialFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  testimonialMeta: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
  },
  resultBadge: {
    backgroundColor: Colors.amber,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  resultBadgeText: {
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amberDark,
  },
});
