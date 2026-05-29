import { Colors } from '../theme/colors';

export type DemoBrandOffer = {
  id: string;
  brand: string;
  title: string;
  description: string;
  discount: string;
  icon_name: string;
  color_theme: 'amber' | 'rose' | 'sage';
  code_type: 'generic';
  code_value: string;
  partner_url: string | null;
  eligibility_min_level: number;
  eligibility_min_coins: number;
  stock_remaining: number | null;
  expires_at: string | null;
  active: true;
  sort_order: number;
};

export const DEMO_BRAND_OFFERS: DemoBrandOffer[] = [
  {
    id: 'demo-1',
    brand: 'NaturalLab',
    title: '-10% sur toute ta commande',
    description: 'Valable sur tout le site, sans minimum d\'achat.',
    discount: '-10%',
    icon_name: 'flask-outline',
    color_theme: 'amber',
    code_type: 'generic',
    code_value: 'COTON10',
    partner_url: null,
    eligibility_min_level: 1,
    eligibility_min_coins: 0,
    stock_remaining: null,
    expires_at: null,
    active: true,
    sort_order: 1,
  },
  {
    id: 'demo-2',
    brand: 'Afro Kosher',
    title: 'Livraison offerte dès 30€',
    description: 'Sans minimum de gamme, applicable sur toutes les commandes.',
    discount: 'Livraison',
    icon_name: 'bicycle-outline',
    color_theme: 'sage',
    code_type: 'generic',
    code_value: 'LIVRAISON',
    partner_url: null,
    eligibility_min_level: 1,
    eligibility_min_coins: 0,
    stock_remaining: null,
    expires_at: null,
    active: true,
    sort_order: 2,
  },
  {
    id: 'demo-3',
    brand: 'KinkyCurls',
    title: '-20% · Offre exclusive Glow Fro',
    description: 'Réservé aux membres niveau 4 et plus. Offre Coton Noir exclusive.',
    discount: '-20%',
    icon_name: 'sparkles-outline',
    color_theme: 'rose',
    code_type: 'generic',
    code_value: 'KINKY20',
    partner_url: null,
    eligibility_min_level: 4,
    eligibility_min_coins: 0,
    stock_remaining: 50,
    expires_at: null,
    active: true,
    sort_order: 3,
  },
  {
    id: 'demo-4',
    brand: 'Shea Tribe',
    title: '-15% sur les soins crème',
    description: 'Gamme hydratation et scellage, toute l\'année.',
    discount: '-15%',
    icon_name: 'leaf-outline',
    color_theme: 'sage',
    code_type: 'generic',
    code_value: 'SHEA15',
    partner_url: null,
    eligibility_min_level: 2,
    eligibility_min_coins: 0,
    stock_remaining: null,
    expires_at: null,
    active: true,
    sort_order: 4,
  },
  {
    id: 'demo-5',
    brand: 'CurlsLab',
    title: 'Kit découverte -25%',
    description: 'Formules clean pour curls et coils. Offre découverte limitée.',
    discount: '-25%',
    icon_name: 'bag-handle-outline',
    color_theme: 'rose',
    code_type: 'generic',
    code_value: 'CURLS25',
    partner_url: null,
    eligibility_min_level: 3,
    eligibility_min_coins: 0,
    stock_remaining: 30,
    expires_at: null,
    active: true,
    sort_order: 5,
  },
];

export const DEMO_OFFER_THEMES: Record<string, { bg: string; text: string; border: string }> = {
  amber: { bg: Colors.amberLight,  text: Colors.amberDark, border: Colors.amberLight },
  rose:  { bg: Colors.blush,       text: Colors.rose,      border: Colors.blush },
  sage:  { bg: Colors.sageLight,   text: Colors.sage,      border: Colors.sageLight },
};
