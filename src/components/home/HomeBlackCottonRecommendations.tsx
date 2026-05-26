import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BCEmojiAvatar } from '../blackCotton/BCEmojiAvatar';
import { AppIconBox } from '../AppIconBox';
import type { HairProfile } from '../../context/AppContext';
import { Colors } from '../../theme/colors';
import { Type } from '../../theme/typography';
import { buildBlackCottonHomeRecommendations } from '../../lib/blackCottonRecommendations';

type Props = {
  profile: HairProfile;
};

export function HomeBlackCottonRecommendations({ profile }: Props) {
  const router = useRouter();

  const bc = useMemo(() => buildBlackCottonHomeRecommendations(profile), [
    profile.hairType,
    profile.porosity,
    profile.density,
    profile.objective,
    profile.region,
    profile.climate,
    profile.budget,
    profile.careStyle,
  ]);

  if (!bc) return null;

  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Recommandations de Black Cotton</Text>

      <View style={s.card}>
        <View style={s.coachRow}>
          <BCEmojiAvatar size={52} mood={bc.mood} />
          <View style={s.coachBody}>
            <Text style={s.coachName}>Black Cotton</Text>
            <Text style={s.coachRole}>Ta copilote capillaire</Text>
          </View>
        </View>
        <Text style={s.intro}>{bc.intro}</Text>

        <Text style={s.blockLabel}>Priorités pour toi</Text>
        {bc.priorities.map((p, i) => (
          <View key={p.id} style={[s.priorityRow, i < bc.priorities.length - 1 && s.priorityRowBorder]}>
            <AppIconBox
              name={p.ion}
              backgroundColor={p.ionBg}
              color={p.ionColor}
              size={44}
              iconSize={20}
              borderRadius={13}
            />
            <View style={s.priorityBody}>
              <Text style={s.priorityTitle}>{p.title}</Text>
              <Text style={s.priorityDetail}>{p.detail}</Text>
            </View>
          </View>
        ))}

        <View style={s.detailBlock}>
          <View style={s.detailHead}>
            <AppIconBox
              name="sunny-outline"
              backgroundColor={Colors.amberPowder}
              color={Colors.amberDark}
              size={32}
              iconSize={16}
              borderRadius={10}
            />
            <Text style={s.detailTitle}>Routine quotidienne</Text>
          </View>
          <Text style={s.detailText}>{bc.routineParagraph}</Text>
        </View>

        <View style={[s.detailBlock, s.detailBlockLast]}>
          <View style={s.detailHead}>
            <AppIconBox
              name="water-outline"
              backgroundColor={Colors.sageLight}
              color={Colors.sageDark}
              size={32}
              iconSize={16}
              borderRadius={10}
            />
            <Text style={s.detailTitle}>Wash day</Text>
          </View>
          <Text style={s.detailText}>{bc.washdayParagraph}</Text>
        </View>

        {bc.spotlight ? (
          <TouchableOpacity
            style={s.spotlight}
            onPress={() => router.push(bc.spotlight!.route as any)}
            activeOpacity={0.88}
            accessibilityRole="button"
          >
            <View style={s.spotlightHead}>
              <AppIconBox
                name={
                  bc.spotlight.kind === 'product'
                    ? 'bag-handle-outline'
                    : bc.spotlight.kind === 'recipe'
                      ? 'restaurant-outline'
                      : 'book-outline'
                }
                backgroundColor={Colors.amberLight}
                color={Colors.amberDark}
                size={40}
                iconSize={20}
                borderRadius={12}
              />
              <Text style={s.spotlightTitle} numberOfLines={2}>
                {bc.spotlight.title}
              </Text>
            </View>
            <Text style={s.spotlightDetail}>{bc.spotlight.detail}</Text>
            <View style={s.spotlightCta}>
              <Text style={s.spotlightCtaText}>{bc.spotlight.cta}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.amberDark} />
            </View>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={s.analyzeBtn}
          onPress={() => router.push('/(tabs)/analyze' as any)}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel="Lancer une analyse photo Black Cotton"
        >
          <Ionicons name="scan-outline" size={18} color={Colors.white} />
          <Text style={s.analyzeBtnText}>Affiner avec une analyse photo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  section: { marginBottom: 22, paddingHorizontal: 20 },
  sectionTitle: {
    ...Type.cardTitle,
    color: Colors.ink,
    marginBottom: 10,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    shadowColor: Colors.ink,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  coachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  coachBody: { flex: 1 },
  coachName: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  coachRole: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 2 },
  intro: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.ink,
    lineHeight: 21,
    marginBottom: 16,
  },
  blockLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amberDark,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
  },
  priorityRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  priorityBody: { flex: 1 },
  priorityTitle: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
    marginBottom: 4,
    lineHeight: 19,
  },
  priorityDetail: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 19,
  },
  detailBlock: {
    marginTop: 14,
    padding: 12,
    backgroundColor: Colors.bg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailBlockLast: { marginBottom: 0 },
  detailHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  detailTitle: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  detailText: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 19,
  },
  spotlight: {
    marginTop: 14,
    padding: 14,
    backgroundColor: Colors.amberPowder,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.amberLight,
  },
  spotlightHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  spotlightTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
    lineHeight: 19,
  },
  spotlightDetail: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 19,
    marginBottom: 8,
  },
  spotlightCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  spotlightCtaText: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.amberDark,
  },
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    backgroundColor: Colors.ink,
    borderRadius: 14,
    paddingVertical: 14,
  },
  analyzeBtnText: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.white,
  },
});
