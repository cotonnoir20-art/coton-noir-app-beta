import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { COACH_FALLBACK_ADVICE } from '../lib/coachFallbacks';
import { CoachApiError, getDailyAdvice } from '../services/coachApi';

export function useDailyAdvice() {
  const { state } = useApp();
  const [advice,  setAdvice]  = useState<string>(COACH_FALLBACK_ADVICE);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    getDailyAdvice(state.profile as any)
      .then(text => { if (!cancelled) setAdvice(text); })
      .catch((e) => {
        if (!cancelled) {
          setError(true);
          if (e instanceof CoachApiError && e.code === 'rate_limit') {
            setAdvice(COACH_FALLBACK_ADVICE);
          }
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  return { advice, loading, error };
}
