import { createContext, useContext, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAuth } from './AuthContext';
import { getDemoFixture, getDemoNotifs, isDemoEmail } from '../data/demoUsers';
import {
  CC_ROUTINE_WASHDAY,
  CC_STREAK_BONUS_7,
} from '../lib/cotonCoins';

export type NotifType = 'routine' | 'coins' | 'tip' | 'promo' | 'system';

export type Notif = {
  id: number;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  route?: string;
};

export const ICON_MAP: Record<NotifType, { name: React.ComponentProps<typeof Ionicons>['name']; bg: string; color: string }> = {
  routine: { name: 'leaf-outline',               bg: Colors.sageLight,  color: Colors.sage     },
  coins:   { name: 'star-outline',               bg: Colors.amberLight, color: Colors.amber    },
  tip:     { name: 'bulb-outline',               bg: Colors.amberLight, color: Colors.amber    },
  promo:   { name: 'gift-outline',               bg: Colors.blush,      color: Colors.rose     },
  system:  { name: 'information-circle-outline', bg: Colors.cream,      color: Colors.warmGray },
};

const INITIAL_NOTIFS: Notif[] = [
  {
    id: 1, type: 'routine', read: false, time: "À l'instant",
    title: "C'est l'heure de ta routine !",
    body: 'Ton rappel du soir est arrivé. 5 étapes. ~25 min.',
    route: '/(tabs)/routine',
  },
  {
    id: 2, type: 'coins', read: false, time: 'Il y a 2h',
    title: `+${CC_ROUTINE_WASHDAY} CotonCoins gagnés !`,
    body: 'Tu as validé ton Wash Day. Continue comme ça !',
    route: '/rewards',
  },
  {
    id: 3, type: 'tip', read: false, time: 'Hier',
    title: 'Astuce capillaire du jour',
    body: "Termine toujours ton rinçage à l'eau froide pour refermer les cuticules et gagner en brillance.",
  },
  {
    id: 4, type: 'promo', read: true, time: 'Il y a 2 jours',
    title: 'Offre partenaire · -15% chez Shea Moisture',
    body: "Code exclusif disponible jusqu'au 20 mai. Voir les partenaires.",
    route: '/partners',
  },
  {
    id: 5, type: 'routine', read: true, time: 'Il y a 3 jours',
    title: 'Rappel : Wash Day dans 2 jours',
    body: "Pense à préparer ton bain d'huile la veille pour de meilleurs résultats.",
    route: '/(tabs)/routine',
  },
  {
    id: 6, type: 'coins', read: true, time: 'Il y a 5 jours',
    title: `Streak 7 jours · +${CC_STREAK_BONUS_7} CC bonus`,
    body: 'Félicitations ! Tu as complété 7 routines de suite. Bonus débloqué.',
    route: '/rewards',
  },
  {
    id: 7, type: 'tip', read: true, time: 'Il y a 1 semaine',
    title: 'Conseil : Méthode LOC',
    body: "Liquide → Huile → Crème. Applique dans cet ordre pour une hydratation qui dure toute la semaine.",
  },
  {
    id: 8, type: 'system', read: true, time: 'Il y a 2 semaines',
    title: 'Bienvenue sur Coton Noir !',
    body: 'Ton profil capillaire est créé. Explore ta routine personnalisée et commence à gagner des CotonCoins.',
    route: '/(tabs)',
  },
];

type NotificationsContextType = {
  notifs: Notif[];
  unreadCount: number;
  markRead: (id: number) => void;
  markAllRead: () => void;
};

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const email = session?.user?.email ?? null;

  const [notifs, setNotifs] = useState<Notif[]>(INITIAL_NOTIFS);

  // Au login d'un compte démo, on charge la liste personnalisée
  useEffect(() => {
    if (isDemoEmail(email)) {
      const fixture = getDemoFixture(email!);
      const demoNotifs = fixture ? getDemoNotifs(fixture) : null;
      setNotifs(demoNotifs ?? INITIAL_NOTIFS);
    } else if (email) {
      setNotifs(INITIAL_NOTIFS);
    }
  }, [email]);

  const unreadCount = notifs.filter(n => !n.read).length;

  function markRead(id: number) {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  function markAllRead() {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  }

  return (
    <NotificationsContext.Provider value={{ notifs, unreadCount, markRead, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications doit être utilisé dans NotificationsProvider');
  return ctx;
}
