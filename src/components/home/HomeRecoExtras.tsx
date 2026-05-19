import { useMemo, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppIconBox, type IonName } from '../AppIconBox';
import { Colors } from '../../theme/colors';
import type { HairProfile } from '../../context/AppContext';
import type { RoutineStep } from '../../data/routines';
import {
  buildOnboardingRecommendations,
  diagnosticSnapshotFromProfile,
  type RecoRoutineStep,
} from '../../lib/onboardingRecommendations';
import { getWashdayStepIcon } from '../../lib/routineStepVisual';

type Props = {
  profile: HairProfile;
  washdaySteps: RoutineStep[];
};

type WeeklyRow = RecoRoutineStep & { done?: boolean; index: number };

function parseDurationMin(str: string): number {
  const m = str.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 5;
}

function ExtraCard({
  children,
  onPress,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  if (onPress) {
    return (
      <TouchableOpacity
        style={s.card}
        onPress={onPress}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={s.card}>{children}</View>;
}

function SectionHeader({
  kicker,
  title,
  meta,
  icon,
}: {
  kicker: string;
  title: string;
  meta?: string;
  icon?: { ion: IonName; bg: string; color: string };
}) {
  return (
    <View style={s.sectionHead}>
      <View style={s.sectionHeadLeft}>
        <Text style={s.kicker}>{kicker}</Text>
        <View style={s.titleRow}>
          {icon ? (
            <AppIconBox
              name={icon.ion}
              backgroundColor={icon.bg}
              color={icon.color}
              size={32}
              iconSize={17}
              borderRadius={10}
            />
          ) : null}
          <Text style={s.blockTitle}>{title}</Text>
        </View>
      </View>
      {meta ? <Text style={s.sectionMeta}>{meta}</Text> : null}
    </View>
  );
}

function FooterLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.footerLink} onPress={onPress} accessibilityRole="button">
      <Text style={s.footerLinkText}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.amberDark} />
    </TouchableOpacity>
  );
}

function WashdayCard({
  steps,
  onOpenWashday,
  onOpenRoutine,
}: {
  steps: WeeklyRow[];
  onOpenWashday: () => void;
  onOpenRoutine: () => void;
}) {
  const done = steps.filter(s => s.done).length;
  const total = steps.length;
  const totalMin = steps.reduce((acc, s) => acc + parseDurationMin(s.duration), 0);

  return (
    <ExtraCard onPress={onOpenRoutine} accessibilityLabel="Routine wash day">
      <SectionHeader
        kicker="Routine hebdomadaire"
        title="Wash day"
        icon={{ ion: 'water-outline', bg: Colors.sageLight, color: Colors.sageDark }}
        meta={totalMin > 0 ? `~${totalMin} min` : undefined}
      />
      {total > 0 ? (
        <Text style={s.progressLine}>
          {done}/{total} étape{total > 1 ? 's' : ''} faite{done > 1 ? 's' : ''}
        </Text>
      ) : null}

      <View style={s.timeline}>
        {steps.map((step, i) => {
          const icon = getWashdayStepIcon(step.title);
          return (
          <View key={`wd-${step.index}`} style={s.timelineRow}>
            <View style={s.timelineRail}>
              <View style={[s.timelineDot, step.done && s.timelineDotDone, !step.done && { backgroundColor: icon.ionBg }]}>
                {step.done ? (
                  <Ionicons name="checkmark" size={10} color={Colors.white} />
                ) : (
                  <Ionicons name={icon.ion} size={14} color={icon.ionColor} />
                )}
              </View>
              {i < steps.length - 1 ? (
                <View style={[s.timelineLine, step.done && s.timelineLineDone]} />
              ) : null}
            </View>
            <View style={s.timelineContent}>
              <Text style={[s.stepTitle, step.done && s.stepTitleDone]}>{step.title}</Text>
              <Text style={s.stepMeta}>{step.duration}</Text>
            </View>
          </View>
          );
        })}
      </View>

      <FooterLink label="Planifier mon wash day" onPress={onOpenWashday} />
    </ExtraCard>
  );
}

function ProductsCard({
  products,
  onShop,
}: {
  products: { brand: string; name: string; price: string; emoji: string }[];
  onShop: () => void;
}) {
  return (
    <ExtraCard>
      <SectionHeader kicker="Sélection" title="Produits recommandés" />
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.productScroll}
      >
        {products.map((p, i) => (
          <TouchableOpacity
            key={`${p.brand}-${i}`}
            style={s.productChip}
            onPress={onShop}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={`${p.brand} ${p.name}`}
          >
            <AppIconBox
              name="bag-handle-outline"
              backgroundColor={Colors.amberLight}
              color={Colors.amberDark}
              size={40}
              iconSize={20}
              borderRadius={12}
            />
            <Text style={s.productChipBrand} numberOfLines={1}>
              {p.brand}
            </Text>
            <Text style={s.productChipName} numberOfLines={2}>
              {p.name}
            </Text>
            <Text style={s.productChipPrice}>{p.price}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <FooterLink label="Voir la boutique" onPress={onShop} />
    </ExtraCard>
  );
}

function MediaCard({
  kicker,
  title,
  items,
  linkLabel,
  onLink,
}: {
  kicker: string;
  title: string;
  items: { id: string; name: string; meta: string; icon: IonName; iconBg: string; iconColor: string }[];
  linkLabel: string;
  onLink: () => void;
}) {
  return (
    <ExtraCard>
      <SectionHeader kicker={kicker} title={title} />
      <View style={s.mediaList}>
        {items.map((item, i) => (
          <TouchableOpacity
            key={item.id}
            style={[s.mediaRow, i === items.length - 1 && s.mediaRowLast]}
            onPress={onLink}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={item.name}
          >
            <AppIconBox
              name={item.icon}
              backgroundColor={item.iconBg}
              color={item.iconColor}
              size={48}
              iconSize={22}
              borderRadius={14}
            />
            <View style={s.mediaBody}>
              <Text style={s.mediaName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={s.mediaMeta}>{item.meta}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.warmGray} />
          </TouchableOpacity>
        ))}
      </View>
      <FooterLink label={linkLabel} onPress={onLink} />
    </ExtraCard>
  );
}

export function HomeRecoExtras({ profile, washdaySteps }: Props) {
  const router = useRouter();

  const reco = useMemo(
    () => buildOnboardingRecommendations(diagnosticSnapshotFromProfile(profile)),
    [
      profile.hairType,
      profile.porosity,
      profile.density,
      profile.objective,
      profile.region,
      profile.budget,
      profile.careStyle,
    ],
  );

  const weeklyRows: WeeklyRow[] = useMemo(() => {
    const source =
      washdaySteps.length > 0
        ? washdaySteps.map(s => ({
            title: s.title,
            duration: s.duration,
            desc: s.desc,
            products: s.products ?? [],
            done: s.done,
          }))
        : reco.weekly.map(s => ({ ...s, done: false }));

    return source.map((s, index) => ({
      title: s.title,
      duration: s.duration,
      desc: s.desc,
      products: s.products,
      done: 'done' in s ? s.done : false,
      index,
    }));
  }, [washdaySteps, reco.weekly]);

  if (!profile.careStyle) return null;

  const hasWeekly = weeklyRows.length > 0;
  const hasProducts = reco.showProducts && reco.products.length > 0;
  const hasRecipes = reco.showRecipes && reco.recipes.length > 0;
  const hasArticles = reco.articles.length > 0;

  if (!hasWeekly && !hasProducts && !hasRecipes && !hasArticles) {
    return null;
  }

  return (
    <View style={s.section}>
      {hasWeekly ? (
        <WashdayCard
          steps={weeklyRows}
          onOpenWashday={() => router.push('/washday' as any)}
          onOpenRoutine={() =>
            router.push({ pathname: '/(tabs)/routine', params: { routine: 'washday' } } as any)
          }
        />
      ) : null}

      {hasProducts ? (
        <ProductsCard products={reco.products} onShop={() => router.push('/shop' as any)} />
      ) : null}

      {hasRecipes ? (
        <MediaCard
          kicker="DIY"
          title="Recettes pour toi"
          items={reco.recipes.map(r => ({
            id: r.id,
            name: r.name,
            meta: `${r.category} · ${r.duration} min`,
            icon: 'restaurant-outline' as IonName,
            iconBg: Colors.amberLight,
            iconColor: Colors.amberDark,
          }))}
          linkLabel="Toutes les recettes"
          onLink={() => router.push('/recipes' as any)}
        />
      ) : null}

      {hasArticles ? (
        <MediaCard
          kicker="Lecture"
          title="Articles pour toi"
          items={reco.articles.map(a => ({
            id: a.id,
            name: a.title,
            meta: `${a.read_time} min de lecture`,
            icon: 'book-outline' as IonName,
            iconBg: Colors.growthLight,
            iconColor: Colors.growth,
          }))}
          linkLabel="Tous les articles"
          onLink={() => router.push('/articles' as any)}
        />
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  section: {
    marginBottom: 22,
    paddingHorizontal: 20,
    marginTop: 4,
    gap: 12,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: Colors.ink,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  sectionHeadLeft: { flex: 1 },
  kicker: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amberDark,
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  blockTitle: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
    lineHeight: 22,
    flex: 1,
  },
  sectionMeta: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
    marginTop: 18,
  },
  progressLine: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.amberDark,
    marginBottom: 12,
    marginTop: -4,
  },
  timeline: { marginBottom: 4 },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 52,
  },
  timelineRail: {
    width: 32,
    alignItems: 'center',
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.amberLight,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotDone: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.border,
    marginVertical: 4,
    minHeight: 16,
  },
  timelineLineDone: {
    backgroundColor: Colors.sage,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 14,
    paddingLeft: 4,
  },
  stepTitle: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
    lineHeight: 20,
  },
  stepTitleDone: {
    color: Colors.warmGray,
    textDecorationLine: 'line-through',
  },
  stepMeta: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginTop: 3,
  },
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerLinkText: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.amberDark,
  },
  productScroll: {
    gap: 10,
    paddingBottom: 4,
  },
  productChip: {
    width: 132,
    backgroundColor: Colors.amberPowder,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.amberLight,
    padding: 12,
  },
  productChipBrand: {
    marginTop: 8,
    fontSize: 10,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginBottom: 2,
  },
  productChipName: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
    lineHeight: 17,
    minHeight: 34,
  },
  productChipPrice: {
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amberDark,
    marginTop: 6,
  },
  mediaList: { marginBottom: 2 },
  mediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  mediaRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  mediaBody: { flex: 1, minWidth: 0 },
  mediaName: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
    lineHeight: 19,
  },
  mediaMeta: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginTop: 3,
  },
});
