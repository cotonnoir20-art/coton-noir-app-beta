import { Alert, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { AppState } from '../context/AppContext';
import { buildQuarterlyBilan } from './quarterlyBilan';
import { resolveBlackCottonBilanSynthesis } from './monthlyBilanSynthesis';
import { countRoutineValidations } from './premiumAccess';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function buildBilanPdfHtml(
  state: AppState,
  opts?: { title?: string; periodDays?: number },
): Promise<string> {
  const title = opts?.title ?? 'Bilan capillaire Coton Noir';
  const days = opts?.periodDays ?? 90;
  const bilan = buildQuarterlyBilan(state);
  const bc = await resolveBlackCottonBilanSynthesis(state);
  const monthLabel = new Date().toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });
  const routines = countRoutineValidations(
    state.coinHistory.filter(e => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      return e.date >= cutoff.toISOString().slice(0, 10);
    }),
  );

  const scoreLine =
    bc.score != null ? `<p><strong>Score diagnostic :</strong> ${bc.score}/100</p>` : '';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1a1410; padding: 28px; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .sub { color: #6b5e54; font-size: 13px; margin-bottom: 20px; }
  .box { background: #faf6f2; border: 1px solid #e8ddd4; border-radius: 12px; padding: 14px; margin: 12px 0; }
  .stats { display: flex; flex-wrap: wrap; gap: 10px; }
  .stat { flex: 1 1 40%; min-width: 120px; background: #fff; border-radius: 10px; padding: 10px; border: 1px solid #e8ddd4; }
  .stat b { font-size: 18px; display: block; }
  .stat span { font-size: 11px; color: #6b5e54; }
  .bc { border-left: 4px solid #c9a227; }
  footer { margin-top: 24px; font-size: 10px; color: #9a8f85; }
</style></head><body>
  <h1>${esc(title)}</h1>
  <p class="sub">${esc(bilan.periodLabel)} · généré le ${esc(monthLabel)}</p>
  <div class="stats">
    <div class="stat"><b>${routines}</b><span>Routines validées</span></div>
    <div class="stat"><b>${bilan.washdaysCount}</b><span>Wash days</span></div>
    <div class="stat"><b>${bilan.measurementsCount}</b><span>Mesures</span></div>
    <div class="stat"><b>${bilan.growthDeltaCm != null ? `${bilan.growthDeltaCm} cm` : '—'}</b><span>Progression</span></div>
    <div class="stat"><b>${bilan.streakCurrent} j</b><span>Streak</span></div>
  </div>
  ${scoreLine}
  <div class="box bc">
    <h2 style="font-size:14px;margin:0 0 8px;">Synthèse Black Cotton</h2>
    <p style="font-size:13px;line-height:1.5;margin:0;">${esc(bc.text)}</p>
  </div>
  <footer>Coton Noir · Document personnel — à partager avec ta coiffeuse ou trichologue.</footer>
</body></html>`;
}

export async function exportBilanPdf(
  state: AppState,
  opts?: { title?: string; periodDays?: number },
): Promise<boolean> {
  try {
    const html = await buildBilanPdfHtml(state, opts);
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.open(uri, '_blank');
      }
      return true;
    }
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: 'Exporter mon bilan',
      });
      return true;
    }
    Alert.alert('PDF créé', `Fichier enregistré :\n${uri}`);
    return true;
  } catch (e) {
    Alert.alert('Export impossible', e instanceof Error ? e.message : 'Réessaie plus tard.');
    return false;
  }
}
