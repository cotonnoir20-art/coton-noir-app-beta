import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../theme/colors';
import type { HairProfile } from '../../context/AppContext';
import {
  findSimilarProductRecommendations,
  type SimilarProductReco,
} from '../../lib/similarProfileRecommendations';
import { trackProductEvent } from '../../lib/productAnalytics';

type Props = {
  profile: HairProfile;
  testedProduct?: { brand: string; name: string };
  onDismiss?: () => void;
};

export function SimilarProfilesRecoCard({ profile, testedProduct, onDismiss }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [recos, setRecos] = useState<SimilarProductReco[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void findSimilarProductRecommendations(profile, testedProduct, 3).then(rows => {
      if (!cancelled) {
        setRecos(rows);
        setLoading(false);
        if (rows.length > 0) {
          void trackProductEvent('similar_profiles_reco_viewed', {
            count: rows.length,
            has_tested_product: !!testedProduct,
          });
        }
      }
    });
    return () => { cancelled = true; };
  }, [profile.hairType, profile.porosity, profile.objective, testedProduct?.brand, testedProduct?.name]);

  if (!loading && recos.length === 0) return null;

  return (
    <View style={s.card}>
      <View style={s.header}>
        <Text style={s.title}>Profils similaires</Text>
        {onDismiss ? (
          <TouchableOpacity onPress={onDismiss} hitSlop={8}>
            <Text style={s.dismiss}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <Text style={s.sub}>
        {testedProduct
          ? `D’autres avec ${profile.hairType || 'ton type'} ont aussi testé :`
          : 'Produits plébiscités par des profils proches du tien :'}
      </Text>

      {loading ? (
        <ActivityIndicator color={Colors.amber} style={{ marginVertical: 12 }} />
      ) : (
        recos.map(r => (
          <View key={r.id} style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{r.displayName}</Text>
              <Text style={s.product}>
                {r.productBrand} · {r.productName}
              </Text>
              <Text style={s.outcome}>{r.outcome}</Text>
            </View>
            <TouchableOpacity
              style={s.shopBtn}
              onPress={() =>
                router.push({
                  pathname: '/shop',
                } as any)
              }
            >
              <Text style={s.shopBtnText}>Shop</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <TouchableOpacity style={s.communityLink} onPress={() => router.push('/community')}>
        <Text style={s.communityLinkText}>Voir la communauté →</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
  },
  dismiss: { fontSize: 14, color: Colors.warmGray, padding: 4 },
  sub: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 18,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  name: {
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
    marginBottom: 2,
  },
  product: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.amberDark,
    marginBottom: 2,
  },
  outcome: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 16,
  },
  shopBtn: {
    backgroundColor: Colors.ink,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  shopBtnText: {
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
  },
  communityLink: { marginTop: 8, alignSelf: 'flex-start' },
  communityLinkText: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.sageDark,
  },
});
