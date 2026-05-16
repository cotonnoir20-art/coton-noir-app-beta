import type { IonName } from '../components/AppIconBox';
import { Colors } from '../theme/colors';

export type PantryItem = { id: string; label: string; name: IonName; bg: string; color: string };

export const PANTRY_ITEMS: PantryItem[] = [
  { id: 'coco',      label: 'Huile de coco',       name: 'nutrition-outline',   bg: Colors.cream, color: Colors.ink },
  { id: 'karite',    label: 'Beurre de karité',    name: 'cube-outline',        bg: Colors.amberLight, color: Colors.amberDark },
  { id: 'aloe',      label: 'Aloe vera (gel)',     name: 'leaf-outline',        bg: Colors.sageLight, color: Colors.sage },
  { id: 'olive',     label: "Huile d'olive",      name: 'water-outline',       bg: Colors.cream, color: Colors.ink },
  { id: 'ricin',     label: 'Huile de ricin',     name: 'flash-outline',       bg: Colors.amberLight, color: Colors.amberDark },
  { id: 'argan',     label: "Huile d'argan",      name: 'sunny-outline',       bg: Colors.amberLight, color: Colors.amberDark },
  { id: 'glycerin',  label: 'Glycérine végétale', name: 'flask-outline',       bg: Colors.cream, color: Colors.ink },
  { id: 'riz',       label: 'Eau / protéines riz', name: 'fitness-outline',    bg: Colors.sageLight, color: Colors.sage },
  { id: 'vinaigre',  label: 'Vinaigre de cidre',  name: 'wine-outline',        bg: Colors.cream, color: Colors.ink },
  { id: 'leavein',   label: 'Leave-in crème',     name: 'color-filter-outline', bg: '#DBEAFE', color: '#2563EB' },
  { id: 'cowash',    label: 'Co-wash',            name: 'repeat-outline',      bg: Colors.cream, color: Colors.ink },
  { id: 'masque',    label: 'Masque hydratant',   name: 'bandage-outline',     bg: Colors.blush, color: Colors.rose },
  { id: 'gel',       label: 'Gel coiffant',       name: 'color-wand-outline',  bg: Colors.amberLight, color: Colors.amberDark },
  { id: 'shampoing', label: 'Shampoing doux',     name: 'sparkles-outline',    bg: Colors.cream, color: Colors.ink },
];
