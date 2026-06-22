import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RecipeCategory } from '../data/recipesCatalog';

const KEY = '@coton_noir_personal_recipes';

export type PersonalRecipe = {
  id: string;
  name: string;
  category: RecipeCategory;
  description: string;
  ingredients: string[];
  steps: string[];
  prep_minutes: number;
  pose_minutes: number;
  difficulty: 'Facile' | 'Express' | 'Moyen';
  thumb_emoji: string;
  thumb_bg: string;
  createdAt: string;
};

async function readAll(): Promise<PersonalRecipe[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(items: PersonalRecipe[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

export async function listPersonalRecipes(): Promise<PersonalRecipe[]> {
  return readAll();
}

export async function savePersonalRecipe(
  recipe: Omit<PersonalRecipe, 'id' | 'createdAt'>,
): Promise<PersonalRecipe> {
  const items = await readAll();
  const newRecipe: PersonalRecipe = {
    ...recipe,
    id: `perso_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  await writeAll([newRecipe, ...items]);
  return newRecipe;
}

export async function updatePersonalRecipe(
  id: string,
  updates: Partial<Omit<PersonalRecipe, 'id' | 'createdAt'>>,
): Promise<void> {
  const items = await readAll();
  await writeAll(items.map(r => (r.id === id ? { ...r, ...updates } : r)));
}

export async function deletePersonalRecipe(id: string): Promise<void> {
  const items = await readAll();
  await writeAll(items.filter(r => r.id !== id));
}

export async function getPersonalRecipe(id: string): Promise<PersonalRecipe | null> {
  const items = await readAll();
  return items.find(r => r.id === id) ?? null;
}
