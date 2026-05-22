import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useBlackCotton } from '../context/BlackCottonContext';

/**
 * Relie les jalons AppContext → messages Black Cotton (évite dépendance circulaire).
 */
export function ProductMilestonesBridge() {
  const {
    pendingBc,
    clearPendingBc,
    celebrateOnboardingGift,
    clearCelebrateOnboardingGift,
  } = useApp();
  const { fire, isVisible } = useBlackCotton();
  const wasBcVisible = useRef(false);

  useEffect(() => {
    if (!pendingBc) return;
    void fire(pendingBc.trigger, pendingBc.ctx);
    clearPendingBc();
  }, [pendingBc, fire, clearPendingBc]);

  useEffect(() => {
    if (wasBcVisible.current && !isVisible && celebrateOnboardingGift) {
      clearCelebrateOnboardingGift();
    }
    wasBcVisible.current = isVisible;
  }, [isVisible, celebrateOnboardingGift, clearCelebrateOnboardingGift]);

  return null;
}
