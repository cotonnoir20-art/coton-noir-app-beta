import AsyncStorage from '@react-native-async-storage/async-storage';

const JOURNAL_KEY = '@coton_noir_journal_entries';

export type StoredJournalEntry = {
  id: number;
  entryDate: string;
  title: string;
  notes: string;
  kind: 'soin' | 'routine';
  stars?: number;
  tags?: string[];
};

export type JournalDisplayEntry = {
  id: number;
  day: string;
  month: string;
  year: string;
  type: string;
  tags: string[];
  note: string;
  dur: string;
  stars: number;
};

function formatDisplayParts(iso: string): { day: string; month: string; year: string } {
  const d = new Date(`${iso}T12:00:00`);
  const months = ['jan.', 'fév.', 'mar.', 'avr.', 'mai', 'jun.',
    'jul.', 'aoû.', 'sep.', 'oct.', 'nov.', 'déc.'];
  return {
    day: String(d.getDate()),
    month: months[d.getMonth()],
    year: String(d.getFullYear()),
  };
}

export function storedToDisplay(e: StoredJournalEntry): JournalDisplayEntry {
  const { day, month, year } = formatDisplayParts(e.entryDate);
  return {
    id: e.id,
    day,
    month,
    year,
    type: e.title,
    tags: e.tags ?? [],
    note: e.notes,
    dur: '—',
    stars: e.stars ?? 0,
  };
}

export async function loadJournalEntries(): Promise<StoredJournalEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(JOURNAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredJournalEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function appendJournalEntry(
  entry: Omit<StoredJournalEntry, 'id'>,
): Promise<StoredJournalEntry> {
  const list = await loadJournalEntries();
  const full: StoredJournalEntry = { ...entry, id: Date.now() };
  list.unshift(full);
  await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(list.slice(0, 200)));
  return full;
}
