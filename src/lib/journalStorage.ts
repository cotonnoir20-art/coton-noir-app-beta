import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const JOURNAL_KEY = '@coton_noir_journal_entries';

export type StoredJournalEntry = {
  id: number | string;
  entryDate: string;
  title: string;
  notes: string;
  kind: 'soin' | 'routine';
  stars?: number;
  tags?: string[];
};

export type JournalDisplayEntry = {
  id: number | string;
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

type JournalEntryRow = {
  id: string;
  entry_date: string;
  title: string;
  notes: string;
  kind: 'soin' | 'routine';
  stars: number | null;
  tags: string[] | null;
};

function entrySignature(e: Pick<StoredJournalEntry, 'entryDate' | 'title' | 'notes' | 'kind'>): string {
  return [
    e.entryDate,
    e.kind,
    e.title.trim().toLowerCase(),
    e.notes.trim().toLowerCase(),
  ].join('|');
}

function rowToStored(row: JournalEntryRow): StoredJournalEntry {
  return {
    id: row.id,
    entryDate: row.entry_date,
    title: row.title,
    notes: row.notes,
    kind: row.kind,
    stars: row.stars ?? 0,
    tags: Array.isArray(row.tags) ? row.tags : [],
  };
}

async function readLocalEntries(): Promise<StoredJournalEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(JOURNAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredJournalEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mergeEntries(remote: StoredJournalEntry[], local: StoredJournalEntry[]): StoredJournalEntry[] {
  const out = [...remote];
  const seen = new Set(remote.map(entrySignature));
  for (const entry of local) {
    const sig = entrySignature(entry);
    if (!seen.has(sig)) {
      out.push(entry);
      seen.add(sig);
    }
  }
  out.sort((a, b) => b.entryDate.localeCompare(a.entryDate));
  return out;
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
  const local = await readLocalEntries();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return local;

    const { data, error } = await supabase
      .from('journal_entries')
      .select('id, entry_date, title, notes, kind, stars, tags')
      .eq('status', 'active')
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error || !Array.isArray(data)) {
      if (__DEV__ && error) console.warn('[journalStorage] load', error.message);
      return local;
    }

    const remote = (data as JournalEntryRow[]).map(rowToStored);
    return mergeEntries(remote, local);
  } catch {
    return local;
  }
}

export async function appendJournalEntry(
  entry: Omit<StoredJournalEntry, 'id'>,
): Promise<StoredJournalEntry> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          entry_date: entry.entryDate,
          title: entry.title.trim(),
          notes: entry.notes.trim(),
          kind: entry.kind,
          stars: entry.stars ?? 0,
          tags: entry.tags ?? [],
        })
        .select('id, entry_date, title, notes, kind, stars, tags')
        .single();

      if (!error && data) {
        return rowToStored(data as JournalEntryRow);
      }

      if (__DEV__ && error) console.warn('[journalStorage] append', error.message);
    }
  } catch {}

  const list = await readLocalEntries();
  const full: StoredJournalEntry = { ...entry, id: Date.now() };
  list.unshift(full);
  await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(list.slice(0, 200)));
  return full;
}
