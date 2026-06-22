import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors } from '../src/theme/colors';
import { Fonts } from '../src/theme/typography';
import {
  analyzeIngredients,
  buildSummary,
  RATING_CONFIG,
  type AnalyzedIngredient,
} from '../src/lib/ingredientParser';
import type { IngredientRating } from '../src/data/ingredientAnalysis';

// 'scan'       → caméra code-barres
// 'contribute' → produit non trouvé : formulaire pour l'ajouter à Open Beauty Facts
// 'manual'     → saisie INCI sans code-barres
// 'results'    → résultats d'analyse
type Mode = 'scan' | 'contribute' | 'manual' | 'results';

type ProductInfo = { name: string; ingredients: string };

async function fetchByBarcode(barcode: string): Promise<ProductInfo | null> {
  try {
    const res = await fetch(
      `https://world.openbeautyfacts.org/api/v2/product/${barcode}.json`,
      { headers: { 'User-Agent': 'CotonNoir/1.0 (contact@coton-noir.app)' } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;
    const p = data.product;
    const ingText: string = p.ingredients_text_fr || p.ingredients_text || '';
    if (!ingText) return null;
    return {
      name: p.product_name_fr || p.product_name || 'Produit inconnu',
      ingredients: ingText,
    };
  } catch {
    return null;
  }
}

// Contribue le produit à Open Beauty Facts (base communautaire)
async function contributeToOBF(
  barcode: string,
  name: string,
  ingredients: string,
): Promise<boolean> {
  try {
    const body = new URLSearchParams({
      code: barcode,
      product_name: name,
      product_name_fr: name,
      ingredients_text: ingredients,
      ingredients_text_fr: ingredients,
      lang: 'fr',
      lc: 'fr',
      countries: 'France',
      comment: 'Added via Coton Noir app',
    });
    const res = await fetch(
      'https://world.openbeautyfacts.org/cgi/product_jqm2.pl',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'CotonNoir/1.0 (contact@coton-noir.app)',
        },
        body: body.toString(),
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

export default function IngredientScanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ ingredients?: string; productName?: string }>();

  const [permission, requestPermission] = useCameraPermissions();

  const [mode, setMode] = useState<Mode>(() => {
    if (params.ingredients) return 'results';
    if (Platform.OS === 'web') return 'manual';
    return 'scan';
  });

  // Données produit
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [contributeProductName, setContributeProductName] = useState('');
  const [contributeIngredients, setContributeIngredients] = useState('');

  // Analyse manuelle
  const [text, setText] = useState(params.ingredients ?? '');
  const [productName, setProductName] = useState(params.productName ?? '');

  const [results, setResults] = useState<AnalyzedIngredient[] | null>(() => {
    if (params.ingredients) return analyzeIngredients(params.ingredients);
    return null;
  });
  const [detail, setDetail] = useState<AnalyzedIngredient | null>(null);
  const [loading, setLoading] = useState(false);
  const [contributing, setContributing] = useState(false);
  const [contributed, setContributed] = useState(false);
  const scannedRef = useRef(false);

  const summary = results ? buildSummary(results) : null;

  // ── Scan code-barres ──
  const handleBarcode = useCallback(
    async ({ data }: { data: string }) => {
      if (scannedRef.current || loading) return;
      scannedRef.current = true;
      setLoading(true);

      const product = await fetchByBarcode(data);
      setLoading(false);

      if (product) {
        setProductName(product.name);
        setText(product.ingredients);
        setResults(analyzeIngredients(product.ingredients));
        setMode('results');
      } else {
        // Produit absent → passe en mode contribution avec le code-barres pré-rempli
        setScannedBarcode(data);
        setMode('contribute');
      }
    },
    [loading],
  );

  // ── Contribuer + analyser ──
  async function handleContribute() {
    if (!contributeIngredients.trim()) return;
    setContributing(true);

    const ok = await contributeToOBF(
      scannedBarcode,
      contributeProductName.trim() || 'Produit sans nom',
      contributeIngredients,
    );

    setContributing(false);
    setContributed(ok);
    setProductName(contributeProductName.trim() || 'Produit sans nom');
    setText(contributeIngredients);
    setResults(analyzeIngredients(contributeIngredients));
    setMode('results');
  }

  // ── Saisie manuelle classique ──
  function analyze() {
    if (!text.trim()) return;
    setResults(analyzeIngredients(text));
    setMode('results');
  }

  // ── Réinitialiser ──
  function reset() {
    setText('');
    setProductName('');
    setResults(null);
    setScannedBarcode('');
    setContributeProductName('');
    setContributeIngredients('');
    setContributed(false);
    scannedRef.current = false;
    setMode(Platform.OS === 'web' ? 'manual' : 'scan');
  }

  const scoreColor =
    !summary ? Colors.ink
    : summary.score >= 70 ? '#2E7D32'
    : summary.score >= 40 ? '#E65100'
    : '#D32F2F';

  const cameraActive = mode === 'scan' && !!permission?.granted;

  return (
    <SafeAreaView style={[S.safe, cameraActive && { backgroundColor: '#000' }]} edges={['top', 'bottom']}>

      {/* ── Header ── */}
      <View style={[S.header, cameraActive && S.headerCamera]}>
        <TouchableOpacity onPress={() => router.back()} style={S.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={20} color={cameraActive ? '#fff' : Colors.ink} />
        </TouchableOpacity>
        <View style={S.headerCenter}>
          <Text style={[S.headerTitle, cameraActive && { color: '#fff' }]}>
            Analyse ingrédients
          </Text>
          <Text style={[S.headerSub, cameraActive && { color: 'rgba(255,255,255,0.7)' }]}>
            {mode === 'scan'
              ? 'Scanne le code-barres du produit'
              : mode === 'contribute'
              ? 'Ajouter à la base'
              : 'Le Yuka de tes cheveux'}
          </Text>
        </View>
        {mode === 'results' && (
          <TouchableOpacity onPress={reset} hitSlop={12}>
            <Text style={S.resetText}>Nouveau scan</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ══════════════════════════════
          MODE SCAN — caméra
      ══════════════════════════════ */}
      {mode === 'scan' && (
        <View style={[S.scanContainer, permission?.granted && { backgroundColor: '#000' }]}>
          {!permission?.granted ? (
            <View style={S.permBox}>
              <View style={S.permIconCircle}>
                <Ionicons name="barcode-outline" size={40} color={Colors.amber} />
              </View>
              <Text style={S.permTitle}>Accès caméra requis</Text>
              <Text style={S.permBody}>
                Pour scanner le code-barres d'un produit et analyser ses ingrédients automatiquement
              </Text>
              <TouchableOpacity style={S.permBtn} onPress={requestPermission}>
                <Text style={S.permBtnText}>Autoriser la caméra</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode('manual')} style={S.permManualLink}>
                <Text style={S.permManualText}>Saisir manuellement</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <CameraView
                style={StyleSheet.absoluteFill}
                onBarcodeScanned={loading ? undefined : handleBarcode}
                barcodeScannerSettings={{
                  barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'],
                }}
              />

              {/* Overlay */}
              <View style={S.overlay} pointerEvents="box-none">
                <View style={S.viewfinder}>
                  <View style={[S.corner, S.cornerTL]} />
                  <View style={[S.corner, S.cornerTR]} />
                  <View style={[S.corner, S.cornerBL]} />
                  <View style={[S.corner, S.cornerBR]} />
                </View>

                {loading ? (
                  <View style={S.scanPill}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={S.scanPillText}>Recherche du produit…</Text>
                  </View>
                ) : (
                  <View style={S.scanPill}>
                    <Ionicons name="barcode-outline" size={15} color="#fff" />
                    <Text style={S.scanPillText}>Pointe vers le code-barres</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity style={S.manualBtn} onPress={() => setMode('manual')}>
                <Ionicons name="pencil-outline" size={16} color={Colors.ink} />
                <Text style={S.manualBtnText}>Saisir manuellement</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* ══════════════════════════════
          MODES SCROLL (contribute / manual / results)
      ══════════════════════════════ */}
      {mode !== 'scan' && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        <ScrollView contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled">

          {/* ── Contribution : produit absent de la base ── */}
          {mode === 'contribute' && (
            <View style={S.inputSection}>
              {/* Badge info */}
              <View style={S.contributeBanner}>
                <Ionicons name="cloud-upload-outline" size={20} color="#5C6BC0" />
                <View style={{ flex: 1 }}>
                  <Text style={S.contributeBannerTitle}>Produit non trouvé — contribue !</Text>
                  <Text style={S.contributeBannerBody}>
                    Saisis les ingrédients pour analyser ET les ajouter à Open Beauty Facts, la base communautaire utilisée par des milliers d'apps.
                  </Text>
                </View>
              </View>

              {/* Code-barres scanné (lecture seule) */}
              <View style={S.barcodeRow}>
                <Ionicons name="barcode-outline" size={18} color={Colors.warmGray} />
                <Text style={S.barcodeText}>Code-barres : {scannedBarcode}</Text>
              </View>

              {/* Nom du produit */}
              <TextInput
                style={S.textInputLine}
                value={contributeProductName}
                onChangeText={setContributeProductName}
                placeholder="Nom du produit (ex: Masque karité Cantu)"
                placeholderTextColor={Colors.warmGray}
                autoCapitalize="words"
                autoCorrect={false}
              />

              {/* Ingrédients INCI */}
              <TextInput
                style={S.textInput}
                value={contributeIngredients}
                onChangeText={setContributeIngredients}
                multiline
                placeholder={'Aqua, Butyrospermum Parkii Butter, Glycerin,\nDimethicone, Sodium Lauryl Sulfate...'}
                placeholderTextColor={Colors.warmGray}
                textAlignVertical="top"
                autoCorrect={false}
                autoCapitalize="words"
              />

              {/* Bouton principal */}
              <TouchableOpacity
                style={[S.analyzeBtn, !contributeIngredients.trim() && S.analyzeBtnDisabled]}
                onPress={handleContribute}
                disabled={!contributeIngredients.trim() || contributing}
                activeOpacity={0.85}
              >
                {contributing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                )}
                <Text style={S.analyzeBtnText}>
                  {contributing ? 'Contribution en cours…' : 'Analyser et contribuer à la base'}
                </Text>
              </TouchableOpacity>

              {/* Lien : analyser sans contribuer */}
              <TouchableOpacity
                style={S.skipContributeBtn}
                onPress={() => {
                  setText(contributeIngredients);
                  setMode('manual');
                }}
              >
                <Text style={S.skipContributeText}>Analyser sans contribuer</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Saisie manuelle classique ── */}
          {mode === 'manual' && (
            <View style={S.inputSection}>
              {Platform.OS !== 'web' && (
                <TouchableOpacity style={S.backToScanBtn} onPress={() => { scannedRef.current = false; setMode('scan'); }}>
                  <Ionicons name="barcode-outline" size={16} color={Colors.amber} />
                  <Text style={S.backToScanText}>Scanner un code-barres</Text>
                </TouchableOpacity>
              )}

              <View style={S.inputHint}>
                <Ionicons name="information-circle-outline" size={16} color={Colors.amber} />
                <Text style={S.inputHintText}>
                  Copie la liste INCI depuis l'emballage ou le site de la marque
                </Text>
              </View>

              {productName ? <Text style={S.productLabel}>📦 {productName}</Text> : null}

              <TextInput
                style={S.textInput}
                value={text}
                onChangeText={setText}
                multiline
                placeholder={'Aqua, Butyrospermum Parkii Butter, Glycerin,\nDimethicone, Sodium Lauryl Sulfate...'}
                placeholderTextColor={Colors.warmGray}
                textAlignVertical="top"
                autoCorrect={false}
                autoCapitalize="words"
              />

              <TouchableOpacity
                style={[S.analyzeBtn, !text.trim() && S.analyzeBtnDisabled]}
                onPress={analyze}
                disabled={!text.trim()}
                activeOpacity={0.85}
              >
                <Ionicons name="flask-outline" size={18} color="#fff" />
                <Text style={S.analyzeBtnText}>Analyser les ingrédients</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Résultats ── */}
          {mode === 'results' && results && summary && (
            <>
              {/* Badge contribution réussie */}
              {contributed && (
                <View style={S.contributedBadge}>
                  <Ionicons name="checkmark-circle" size={18} color="#388E3C" />
                  <Text style={S.contributedText}>
                    Produit ajouté à Open Beauty Facts — merci pour la communauté !
                  </Text>
                </View>
              )}

              {productName ? (
                <Text style={[S.productLabel, { marginBottom: 16 }]}>📦 {productName}</Text>
              ) : null}

              {/* Score global */}
              <View style={S.scoreCard}>
                <View style={S.scoreLeft}>
                  <Text style={[S.scoreNumber, { color: scoreColor }]}>{summary.score}</Text>
                  <Text style={S.scoreLabel}>/ 100</Text>
                </View>
                <View style={S.scoreRight}>
                  <Text style={S.scoreTitle}>
                    {summary.score >= 70
                      ? '✅ Bon produit pour tes cheveux'
                      : summary.score >= 40
                      ? '⚠️ Produit moyen — quelques points à surveiller'
                      : '🚫 Produit déconseillé pour les cheveux texturés'}
                  </Text>
                  <View style={S.scoreStats}>
                    {summary.rouge.length > 0 && (
                      <View style={[S.scorePill, { backgroundColor: '#FFEBEE' }]}>
                        <Text style={[S.scorePillText, { color: '#D32F2F' }]}>
                          {summary.rouge.length} à éviter
                        </Text>
                      </View>
                    )}
                    {summary.orange.length > 0 && (
                      <View style={[S.scorePill, { backgroundColor: '#FFF3E0' }]}>
                        <Text style={[S.scorePillText, { color: '#E65100' }]}>
                          {summary.orange.length} attention
                        </Text>
                      </View>
                    )}
                    {summary.vert.length > 0 && (
                      <View style={[S.scorePill, { backgroundColor: '#E8F5E9' }]}>
                        <Text style={[S.scorePillText, { color: '#2E7D32' }]}>
                          {summary.vert.length} bénéfiques
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {(['vert', 'orange', 'rouge', 'neutre'] as const).map(rating => {
                const group = summary[rating];
                if (group.length === 0) return null;
                const cfg = RATING_CONFIG[rating];
                return (
                  <View key={rating} style={S.group}>
                    <View style={S.groupHeader}>
                      <Ionicons name={cfg.icon as any} size={16} color={cfg.color} />
                      <Text style={[S.groupTitle, { color: cfg.color }]}>
                        {cfg.label} ({group.length})
                      </Text>
                    </View>
                    {group.map((item, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[S.ingredientRow, { backgroundColor: cfg.bg }]}
                        onPress={() => item.info && setDetail(item)}
                        activeOpacity={item.info ? 0.75 : 1}
                      >
                        <View style={S.ingredientLeft}>
                          <Text style={[S.ingredientName, { color: cfg.color }]}>{item.raw}</Text>
                          {item.info && (
                            <Text style={S.ingredientCategory}>{item.info.category}</Text>
                          )}
                        </View>
                        {item.info && (
                          <Ionicons name="chevron-forward" size={16} color={cfg.color} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })}

              <Text style={S.disclaimer}>
                Analyse basée sur les connaissances capillaires Coton Noir. Pas un avis médical.
              </Text>
            </>
          )}
        </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* ── Modal détail ingrédient ── */}
      <Modal
        visible={!!detail}
        transparent
        animationType="slide"
        onRequestClose={() => setDetail(null)}
      >
        <Pressable style={S.modalBackdrop} onPress={() => setDetail(null)}>
          <Pressable style={S.modalSheet} onPress={e => e.stopPropagation()}>
            {detail?.info && (() => {
              const cfg = RATING_CONFIG[detail.info.rating as IngredientRating];
              return (
                <>
                  <View style={[S.modalBadge, { backgroundColor: cfg.bg }]}>
                    <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
                    <Text style={[S.modalBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>

                  <Text style={S.modalIngName}>{detail.raw}</Text>
                  <Text style={S.modalIngIci}>{detail.info.name}</Text>

                  <View style={[S.modalTag, { backgroundColor: cfg.bg }]}>
                    <Text style={[S.modalTagText, { color: cfg.color }]}>{detail.info.category}</Text>
                  </View>

                  <Text style={S.modalSectionTitle}>Rôle dans le produit</Text>
                  <Text style={S.modalBody}>{detail.info.effect}</Text>

                  <Text style={S.modalSectionTitle}>
                    {detail.info.rating === 'vert' ? "Pourquoi c'est bien" : "Pourquoi c'est problématique"}
                  </Text>
                  <Text style={S.modalBody}>{detail.info.why}</Text>

                  {detail.info.tip && (
                    <>
                      <Text style={S.modalSectionTitle}>Conseil Coton Noir</Text>
                      <View style={S.modalTip}>
                        <Ionicons name="bulb-outline" size={16} color={Colors.amber} />
                        <Text style={S.modalTipText}>{detail.info.tip}</Text>
                      </View>
                    </>
                  )}

                  <TouchableOpacity style={S.modalClose} onPress={() => setDetail(null)}>
                    <Text style={S.modalCloseText}>Fermer</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
    zIndex: 10,
  },
  headerCamera:  { backgroundColor: 'transparent', borderBottomColor: 'transparent' },
  backBtn:       { padding: 4 },
  headerCenter:  { flex: 1 },
  headerTitle:   { fontSize: 16, fontFamily: Fonts.displayBold, color: Colors.ink },
  headerSub:     { fontSize: 12, fontFamily: Fonts.body, color: Colors.warmGray, marginTop: 1 },
  resetText:     { fontSize: 13, fontFamily: Fonts.bodyMedium, color: Colors.amber },

  // ── Scan ──
  scanContainer: { flex: 1 },

  // Permission
  permBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 32,
  },
  permIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.amberPowder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  permTitle:      { fontSize: 18, fontFamily: Fonts.displayBold, color: Colors.ink },
  permBody:       { fontSize: 14, fontFamily: Fonts.body, color: Colors.warmGray, textAlign: 'center', lineHeight: 20 },
  permBtn: {
    backgroundColor: Colors.amber,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginTop: 4,
  },
  permBtnText:    { fontSize: 15, fontFamily: Fonts.displayBold, color: '#fff' },
  permManualLink: { marginTop: 4 },
  permManualText: { fontSize: 14, fontFamily: Fonts.bodyMedium, color: Colors.warmGray },

  // Overlay viewfinder
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  viewfinder: { width: 250, height: 150 },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: Colors.amber,
    borderWidth: 3,
  },
  cornerTL: { top: 0,    left: 0,  borderRightWidth: 0,  borderBottomWidth: 0 },
  cornerTR: { top: 0,    right: 0, borderLeftWidth: 0,   borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0,  borderRightWidth: 0,  borderTopWidth: 0   },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0,   borderTopWidth: 0   },
  scanPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.62)',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    maxWidth: 280,
  },
  scanPillText:  { fontSize: 13, fontFamily: Fonts.body, color: '#fff', flexShrink: 1 },
  manualBtn: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 13,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  manualBtnText: { fontSize: 14, fontFamily: Fonts.bodySemi, color: Colors.ink },

  // ── Scroll commun ──
  scroll:        { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  inputSection:  { gap: 14 },
  productLabel:  { fontSize: 14, fontFamily: Fonts.bodySemi, color: Colors.ink },

  // ── Contribution ──
  contributeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#E8EAF6',
    borderRadius: 12,
    padding: 14,
  },
  contributeBannerTitle: { fontSize: 13, fontFamily: Fonts.bodySemi, color: '#3949AB', marginBottom: 3 },
  contributeBannerBody:  { fontSize: 12, fontFamily: Fonts.body, color: '#3949AB', lineHeight: 17 },

  barcodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  barcodeText: { fontSize: 13, fontFamily: Fonts.body, color: Colors.warmGray },

  textInputLine: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: Fonts.body,
    color: Colors.ink,
  },

  skipContributeBtn: { alignSelf: 'center', paddingVertical: 8 },
  skipContributeText: { fontSize: 13, fontFamily: Fonts.bodyMedium, color: Colors.warmGray },

  // Résultats — badge contribution
  contributedBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  contributedText: { flex: 1, fontSize: 13, fontFamily: Fonts.body, color: '#2E7D32', lineHeight: 18 },

  // ── Manuel ──
  backToScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.amberPowder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  backToScanText: { fontSize: 13, fontFamily: Fonts.bodySemi, color: Colors.amberInk },
  inputHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.amberPowder,
    borderRadius: 10,
    padding: 12,
  },
  inputHintText: { flex: 1, fontSize: 13, fontFamily: Fonts.body, color: Colors.amberInk, lineHeight: 18 },
  textInput: {
    minHeight: 160,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 13,
    fontFamily: Fonts.body,
    color: Colors.ink,
    lineHeight: 20,
  },
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.amber,
    borderRadius: 14,
    paddingVertical: 15,
  },
  analyzeBtnDisabled: { opacity: 0.45 },
  analyzeBtnText:     { fontSize: 15, fontFamily: Fonts.displayBold, color: '#fff' },

  // ── Score ──
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 20,
    gap: 16,
  },
  scoreLeft:   { alignItems: 'center', minWidth: 64 },
  scoreNumber: { fontSize: 48, fontFamily: Fonts.displayBold, lineHeight: 52 },
  scoreLabel:  { fontSize: 12, fontFamily: Fonts.body, color: Colors.warmGray },
  scoreRight:  { flex: 1, gap: 8 },
  scoreTitle:  { fontSize: 13, fontFamily: Fonts.bodyMedium, color: Colors.ink, lineHeight: 18 },
  scoreStats:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  scorePill:   { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  scorePillText: { fontSize: 11, fontFamily: Fonts.bodySemi },

  // ── Groupes ingrédients ──
  group:       { marginBottom: 16 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  groupTitle:  { fontSize: 13, fontFamily: Fonts.bodySemi, letterSpacing: 0.2 },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 4,
    gap: 8,
  },
  ingredientLeft:     { flex: 1 },
  ingredientName:     { fontSize: 13, fontFamily: Fonts.bodyMedium },
  ingredientCategory: { fontSize: 11, fontFamily: Fonts.body, color: Colors.warmGray, marginTop: 1 },

  disclaimer: {
    fontSize: 11,
    fontFamily: Fonts.body,
    color: Colors.warmGray,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },

  // ── Modal détail ──
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 12,
    maxHeight: '85%',
  },
  modalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modalBadgeText:    { fontSize: 13, fontFamily: Fonts.bodySemi },
  modalIngName:      { fontSize: 18, fontFamily: Fonts.displayBold, color: Colors.ink },
  modalIngIci:       { fontSize: 12, fontFamily: Fonts.body, color: Colors.warmGray, marginTop: -4 },
  modalTag: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  modalTagText:      { fontSize: 12, fontFamily: Fonts.bodySemi },
  modalSectionTitle: { fontSize: 13, fontFamily: Fonts.bodySemi, color: Colors.ink, marginTop: 4 },
  modalBody:         { fontSize: 14, fontFamily: Fonts.body, color: Colors.inkSoft, lineHeight: 20 },
  modalTip: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.amberPowder,
    borderRadius: 10,
    padding: 12,
    alignItems: 'flex-start',
  },
  modalTipText: { flex: 1, fontSize: 13, fontFamily: Fonts.body, color: Colors.amberInk, lineHeight: 18 },
  modalClose: {
    backgroundColor: Colors.ink,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCloseText: { fontSize: 15, fontFamily: Fonts.displayBold, color: '#fff' },
});
