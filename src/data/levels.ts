export const LEVELS = [
  { id: 1,  emoji: '🌱', name: 'Baby Hair',       desc: 'Le tout début, la base migratoire',  min: 0,     max: 99,    color: '#FFB6C1', benefit: 'Badge de bienvenue'                    },
  { id: 2,  emoji: '💜', name: 'Curlie Cutie',     desc: 'Les premières boucles assumées',     min: 100,   max: 299,   color: '#9370DB', benefit: '5% de réduction partenaire'            },
  { id: 3,  emoji: '👑', name: 'Afro Queenie',     desc: 'Petite reine de son afro',           min: 300,   max: 699,   color: '#FFD700', benefit: '1 Ebook capillaire premium'            },
  { id: 4,  emoji: '☀️', name: 'Glow Fro',         desc: 'Afro qui brille',                    min: 700,   max: 1499,  color: '#FF9F43', benefit: '10% de réduction partenaire'           },
  { id: 5,  emoji: '💎', name: 'Crown Vibes',      desc: 'Chevelure couronnée',                min: 1500,  max: 2499,  color: '#FF6B9D', benefit: 'Box digitale exclusive'                },
  { id: 6,  emoji: '🎀', name: 'Slay Braidy',      desc: 'Maîtrise coiffures protectrices',    min: 2500,  max: 3999,  color: '#00BFA5', benefit: '15% de réduction partenaire'           },
  { id: 7,  emoji: '⭐', name: 'Kinky Diva',       desc: 'Personnalité capillaire affirmée',   min: 4000,  max: 5999,  color: '#7B68EE', benefit: 'Produit partenaire offert'             },
  { id: 8,  emoji: '🌀', name: 'Twist & Shine',    desc: "L'art du twist-out",                 min: 6000,  max: 8999,  color: '#FF8A65', benefit: 'Accès premium + 200 CC bonus'          },
  { id: 9,  emoji: '💧', name: 'Wash Day Goddess', desc: 'Maîtrise du rituel',                 min: 9000,  max: 12999, color: '#546E7A', benefit: 'Box physique + 20% partenaire'         },
  { id: 10, emoji: '🏆', name: 'Afrolicious Icon', desc: 'Icône inspirante, afro star',        min: 13000, max: 999999, color: '#8D6E63', benefit: 'Box physique + 50% partenaire + badge' },
];

export function getCurrentLevel(coins: number) {
  return [...LEVELS].reverse().find(l => coins >= l.min) || LEVELS[0];
}

export function getNextLevel(coins: number) {
  return LEVELS.find(l => l.min > coins) || null;
}

export function getLevelProgress(coins: number): number {
  const current = getCurrentLevel(coins);
  const next = getNextLevel(coins);
  if (!next) return 100;
  return Math.min(100, Math.round(((coins - current.min) / (next.min - current.min)) * 100));
}
