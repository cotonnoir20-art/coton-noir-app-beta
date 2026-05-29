import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BCEmojiAvatar } from '../blackCotton/BCEmojiAvatar';
import type { GrowthEntry, HairProfile } from '../../context/AppContext';
import { Colors } from '../../theme/colors';
import { Type } from '../../theme/typography';
import { buildBlackCottonHomeRecommendations } from '../../lib/blackCottonRecommendations';
import { formatProfileLengthDisplay } from '../../constants/hairLengthLandmarks';
import { buildHomeMeasureSessions } from '../../lib/homeGrowth';

type Props = {
  profile: HairProfile;
  growthHistory: GrowthEntry[];
};

type HistoryRowProps = {
  dateLabel: string;
  avgCm: number;
  deltaCm: number | null;
  showDivider: boolean;
  onPress: () => void;
};

function HistoryRow({ dateLabel, avgCm, deltaCm, showDivider, onPress }: HistoryRowProps) {
  const deltaBadge =
    deltaCm != null
      ? {
          text: `${deltaCm >= 0 ? '+' : ''}${deltaCm} cm`,
          tone: (deltaCm >= 0 ? 'sage' : 'amber') as 'sage' | 'amber',
        }
      : undefined;

  return (
    <>
      <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.88} accessibilityRole="button">
        <Text style={s.rowLabel}>{dateLabel}</Text>
        <View style={s.rowBottom}>
          <Text style={s.rowValue}>{avgCm} cm</Text>
          {deltaBadge ? (
            <View
              style={[
                s.badge,
                deltaBadge.tone === 'sage' && s.badgeSage,
                deltaBadge.tone === 'amber' && s.badgeAmber,
              ]}
            >
              <Text
                style={[
                  s.badgeText,
                  deltaBadge.tone === 'sage' && s.badgeTextSage,
                  deltaBadge.tone === 'amber' && s.badgeTextAmber,
                ]}
              >
                {deltaBadge.text}
              </Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
      {showDivider ? <View style={s.rowDivider} /> : null}
    </>
  );
}

export function HomeMesuresCard({ profile, growthHistory }: Props) {
  const router = useRouter();

  const sessions = useMemo(
    () => buildHomeMeasureSessions(growthHistory, 5),
    [growthHistory],
  );

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

  const bcMessage =
    bc?.intro ??
    'Je peux t’aider à suivre ta pousse et affiner tes routines selon ton profil capillaire.';

  const openGrowth = () => router.push('/growth' as any);
  const openMeasure = () => router.push('/hair-length' as any);
  const profileLengthLabel = formatProfileLengthDisplay(profile.length);
  const hasProfileLength = profileLengthLabel !== '—';

  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Mes mesures</Text>

      <View style={s.card}>
        {sessions.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>Aucune mesure enregistrée</Text>
            {hasProfileLength ? (
              <Text style={s.emptyHint}>
                Longueur indiquée :{' '}
                <Text style={s.emptyHintBold}>{profileLengthLabel}</Text>
                {formatProfileLengthDisplay(profile.targetLength) !== '—'
                  ? ` → objectif ${formatProfileLengthDisplay(profile.targetLength)}`
                  : ''}
              </Text>
            ) : (
              <Text style={s.emptyHint}>
                Indique où en sont tes cheveux (Oreilles, Épaules, Taille…) ou mesure au mètre ruban.
              </Text>
            )}
            <TouchableOpacity
              style={s.emptyPrimaryBtn}
              onPress={openMeasure}
              activeOpacity={0.88}
              accessibilityRole="button"
            >
              <Text style={s.emptyPrimaryBtnText}>
                {hasProfileLength ? 'Modifier ma longueur' : 'Indiquer ma longueur'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          sessions.map((session, i) => (
            <HistoryRow
              key={session.date}
              dateLabel={session.dateLabel}
              avgCm={session.avgCm}
              deltaCm={session.deltaCm}
              showDivider={i < sessions.length - 1}
              onPress={openGrowth}
            />
          ))
        )}

        {sessions.length > 0 ? (
          <TouchableOpacity
            style={s.historyLink}
            onPress={openGrowth}
            activeOpacity={0.88}
            accessibilityRole="button"
          >
            <Text style={s.historyLinkText}>Voir tout l&apos;historique</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.amberDark} />
          </TouchableOpacity>
        ) : null}

        <View style={s.bcBlock}>
          <Text style={s.bcTitle}>Black Cotton</Text>
          <View style={s.bcRow}>
            <BCEmojiAvatar size={44} mood={bc?.mood ?? 'coaching'} />
            <View style={s.bcBubble}>
              <Text style={s.bcBubbleText} numberOfLines={4}>
                {bcMessage}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={s.bcBtn}
            onPress={() => router.push('/(tabs)/shortcuts' as any)}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Ouvrir Explorer"
          >
            <Text style={s.bcBtnText}>Découvrir</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.disclaimer}>
          NOTE : Coton Noir n&apos;est pas un outil médical, en cas de doute voir un professionnel
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  section: { marginBottom: 22, paddingHorizontal: 14 },
  sectionTitle: {
    ...Type.cardTitle,
    fontFamily: 'Satoshi_700Bold',
    color: Colors.ink,
    marginBottom: 10,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: Colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  empty: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
    marginBottom: 6,
  },
  emptyHint: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 19,
    marginBottom: 12,
  },
  emptyHintBold: {
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
  },
  emptyPrimaryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.amber,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  emptyPrimaryBtnText: {
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  rowLabel: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginBottom: 6,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowValue: {
    fontSize: 22,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.cream,
  },
  badgeSage: { backgroundColor: Colors.sageLight },
  badgeAmber: { backgroundColor: Colors.amberPowder },
  badgeText: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    color: Colors.warmGray,
    letterSpacing: 0.3,
  },
  badgeTextSage: { color: Colors.sageDark },
  badgeTextAmber: { color: Colors.amberDark },
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  historyLinkText: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.amberDark,
  },
  bcBlock: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: Colors.cream,
  },
  bcTitle: {
    ...Type.cardTitle,
    fontSize: 15,
    color: Colors.ink,
    marginBottom: 12,
  },
  bcRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },
  bcBubble: {
    flex: 1,
    backgroundColor: Colors.bgShell,
    borderRadius: 14,
    borderTopLeftRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bcBubbleText: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.ink,
    lineHeight: 19,
  },
  bcBtn: {
    backgroundColor: Colors.amber,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bcBtnText: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
  },
  disclaimer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    fontSize: 10,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 14,
    letterSpacing: 0.2,
    backgroundColor: Colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
});
