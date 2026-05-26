import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from './AppContext';
import {
  ACHIEVEMENTS,
  buildAchievementLookup,
  EMPTY_EXTRAS,
  evaluateAchievements,
  loadAchievementCatalog,
  type AchievementDef,
  type AchievementExtras,
  type AchievementStatus,
} from '../data/achievements';
import { hapticSuccess } from '../lib/haptics';
import { getReferralsCount } from '../lib/referral';
import { trackProductEvent } from '../lib/productAnalytics';
import { listRecipeFavorites } from '../lib/contentFavorites';

const DATES_KEY            = '@coton_noir_achievement_dates';
const HAIRSTYLE_LIKES_KEY  = '@coton_noir_hairstyle_likes';
const INVITES_SENT_KEY     = '@coton_noir_invites_sent';

/**
 * AchievementsContext
 * ───────────────────
 * Calcule en live la liste des badges, persiste la date du premier déblocage,
 * et expose une queue de "toCelebrate" → consommée par <AchievementToast />.
 *
 * Sources de vérité :
 *  - `state` (AppContext) → streak, growth, coins, etc.
 *  - Extras AsyncStorage  → recipesLikedCount, hairstylesLikedCount, invites.
 *  - Dates AsyncStorage   → on conserve l'historique des unlocks même au reset.
 *
 * Garde-fou :
 *  - Au tout premier load, on n'annonce **pas** les badges déjà mérités (sinon
 *    spam de toasts au lancement). On les "stamp" silencieusement à la date du
 *    jour s'ils n'ont pas encore de date persistée.
 */

type Ctx = {
  achievements: AchievementStatus[];
  unlockedCount: number;
  totalCount: number;
  /** Prochain badge à célébrer (FIFO), ou null. */
  pending: AchievementDef | null;
  /** Marque le badge courant comme célébré → passe au suivant. */
  dismissCurrent: () => void;
  /** Recharge les extras (utile après un like de recette/coiffure). */
  refreshExtras: () => void;
};

const AchievementsContext = createContext<Ctx | null>(null);

async function countJsonKeys(storageKey: string): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(storageKey);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.length;
    if (parsed && typeof parsed === 'object') {
      return Object.values(parsed).filter(Boolean).length;
    }
    return 0;
  } catch {
    return 0;
  }
}

async function readUnlockedDates(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(DATES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
    return {};
  } catch {
    return {};
  }
}

async function writeUnlockedDates(map: Record<string, string>): Promise<void> {
  try {
    await AsyncStorage.setItem(DATES_KEY, JSON.stringify(map));
  } catch {}
}

export function AchievementsProvider({ children }: { children: React.ReactNode }) {
  const { state } = useApp();

  const [achievementDefs, setAchievementDefs] = useState<readonly AchievementDef[]>(ACHIEVEMENTS);
  const [extras, setExtras]             = useState<AchievementExtras>(EMPTY_EXTRAS);
  const [unlockedDates, setUnlockedDates] = useState<Record<string, string>>({});
  const [pendingIds, setPendingIds]     = useState<string[]>([]);
  const [hydrated, setHydrated]         = useState(false);

  /** True tant qu'on n'a pas finalisé le premier diff post-hydratation. */
  const firstDiffDone = useRef(false);

  // ── Chargement initial : extras + dates persistées ─────────────────────
  const reloadExtras = async () => {
    const [recipes, hairstyles, invitesLocal, referralsServer] = await Promise.all([
      listRecipeFavorites().then(r => r.length),
      countJsonKeys(HAIRSTYLE_LIKES_KEY),
      AsyncStorage.getItem(INVITES_SENT_KEY).then(v => (v ? Number(v) || 0 : 0)),
      getReferralsCount().catch(() => 0),
    ]);
    setExtras({
      recipesLikedCount: recipes,
      hairstylesLikedCount: hairstyles,
      invitesSentCount: Math.max(invitesLocal, referralsServer),
    });
  };

  useEffect(() => {
    (async () => {
      const [dates, defs] = await Promise.all([
        readUnlockedDates(),
        loadAchievementCatalog(),
        reloadExtras(),
      ]);
      setAchievementDefs(defs);
      setUnlockedDates(dates);
      setHydrated(true);
    })();
  }, []);

  // ── Évaluation : diff vs dates persistées → toast pour les nouveaux ────
  const achievements = useMemo<AchievementStatus[]>(() => {
    return evaluateAchievements(state, extras, unlockedDates, achievementDefs);
  }, [state, extras, unlockedDates, achievementDefs]);

  const achievementById = useMemo(
    () => buildAchievementLookup(achievementDefs),
    [achievementDefs],
  );

  useEffect(() => {
    if (!hydrated) return;

    const today = new Date().toISOString().slice(0, 10);
    const newlyUnlocked: string[] = [];
    let datesChanged = false;
    const nextDates = { ...unlockedDates };

    for (const a of achievements) {
      if (!a.unlocked) continue;
      if (!nextDates[a.def.id]) {
        nextDates[a.def.id] = today;
        datesChanged = true;
        // Premier diff = hydratation initiale → on stamp en silence, sans toast.
        if (firstDiffDone.current) {
          newlyUnlocked.push(a.def.id);
        }
      }
    }

    if (datesChanged) {
      setUnlockedDates(nextDates);
      writeUnlockedDates(nextDates);
    }
    if (newlyUnlocked.length > 0) {
      setPendingIds(prev => [...prev, ...newlyUnlocked]);
      hapticSuccess();
      for (const id of newlyUnlocked) {
        const def = achievementById[id];
        if (def) {
          void trackProductEvent('achievement_unlocked', {
            achievement_id: id,
            achievement_name: def.name,
            group: def.group,
          });
        }
      }
    }

    if (!firstDiffDone.current) {
      firstDiffDone.current = true;
    }
    // On ne dépend volontairement pas de `unlockedDates` pour éviter une boucle
    // (on l'a déjà comme valeur fraîche via le calcul ci-dessus).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [achievementById, achievements, hydrated]);

  const pending: AchievementDef | null = pendingIds.length
    ? achievementById[pendingIds[0]] ?? null
    : null;

  const dismissCurrent = () => setPendingIds(prev => prev.slice(1));

  const value = useMemo<Ctx>(() => ({
    achievements,
    unlockedCount: achievements.filter(a => a.unlocked).length,
    totalCount: achievementDefs.length,
    pending,
    dismissCurrent,
    refreshExtras: reloadExtras,
  }), [achievementDefs.length, achievements, pending]);

  return (
    <AchievementsContext.Provider value={value}>
      {children}
    </AchievementsContext.Provider>
  );
}

export function useAchievements(): Ctx {
  const ctx = useContext(AchievementsContext);
  if (!ctx) throw new Error('useAchievements doit être utilisé dans <AchievementsProvider>');
  return ctx;
}
