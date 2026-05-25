import { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { clearSensitiveAppStorage } from '../lib/appOfflineStorage';
import { supabase } from '../lib/supabase';

type SignOutResult =
  | { ok: true }
  | { ok: false; error: string };

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<SignOutResult>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  signOut: async () => ({ ok: true }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut(): Promise<SignOutResult> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return {
          ok: false,
          error: error.message || 'Impossible de fermer la session pour le moment.',
        };
      }
      try {
        await clearSensitiveAppStorage();
      } catch (storageError) {
        if (__DEV__) {
          console.warn('[auth] signOut local cleanup', storageError);
        }
      }
      return { ok: true };
    } catch (error) {
      if (__DEV__) {
        console.warn('[auth] signOut unexpected error', error);
      }
      return {
        ok: false,
        error: 'Impossible de te déconnecter pour le moment. Réessaie dans quelques secondes.',
      };
    }
  }

  return (
    <AuthContext.Provider value={{ session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
