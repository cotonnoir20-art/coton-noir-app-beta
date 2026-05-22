import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { scheduleRoutineReminder } from '../../lib/routineReminder';
import {
  DEFAULT_USER_PREFS,
  loadUserPrefs,
  saveUserPrefs,
  type RappelRoutineKind,
  type UserPrefs,
} from '../../lib/userPrefs';

type Props = {
  /** Affichage intégré (notifications) vs modal profil */
  variant?: 'card' | 'inline';
};

export function RoutineReminderSettings({ variant = 'card' }: Props) {
  const [prefs, setPrefs] = useState<UserPrefs>({ ...DEFAULT_USER_PREFS });
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const p = await loadUserPrefs();
    setPrefs(p);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(next: Partial<UserPrefs>) {
    const merged = await saveUserPrefs(next);
    setPrefs(merged);
    const res = await scheduleRoutineReminder(merged);
    if (res.status === 'denied' && merged.notifEnabled !== false) {
      Alert.alert(
        'Notifications désactivées',
        'Autorise les notifications dans les réglages du téléphone pour recevoir ton rappel routine.',
      );
    }
  }

  const rappelHour = prefs.rappelHour ?? DEFAULT_USER_PREFS.rappelHour;
  const rappelMin = prefs.rappelMin ?? DEFAULT_USER_PREFS.rappelMin;
  const rappelRoutine = prefs.rappelRoutine ?? DEFAULT_USER_PREFS.rappelRoutine;
  const notifEnabled = prefs.notifEnabled !== false;
  const rappelLabel = `${String(rappelHour).padStart(2, '0')}:${String(rappelMin).padStart(2, '0')}`;

  if (!loaded) return null;

  const wrapStyle = variant === 'card' ? S.card : S.inline;

  return (
    <View style={wrapStyle}>
      <View style={S.rowHead}>
        <View style={S.iconBox}>
          <Ionicons name="notifications-outline" size={18} color={Colors.amberDark} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={S.title}>Rappel routine</Text>
          <Text style={S.sub}>
            {notifEnabled
              ? `${rappelRoutine === 'daily' ? 'Matin' : 'Soir'} · ${rappelLabel}`
              : 'Notifications désactivées'}
          </Text>
        </View>
        <Switch
          value={notifEnabled}
          onValueChange={v => void patch({ notifEnabled: v })}
          trackColor={{ false: Colors.border, true: Colors.sage }}
          thumbColor="#fff"
        />
      </View>

      {notifEnabled ? (
        <>
          <View style={S.kindRow}>
            {(['daily', 'night'] as RappelRoutineKind[]).map(kind => {
              const active = rappelRoutine === kind;
              return (
                <TouchableOpacity
                  key={kind}
                  style={[S.kindChip, active && S.kindChipOn]}
                  onPress={() => void patch({ rappelRoutine: kind })}
                >
                  <Text style={[S.kindText, active && S.kindTextOn]}>
                    {kind === 'daily' ? '🌤️ Matin' : '🌙 Soir'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={S.timeRow}>
            <View style={S.timeCol}>
              <TouchableOpacity style={S.timeBtn} onPress={() => void patch({ rappelHour: (rappelHour + 1) % 24 })}>
                <Ionicons name="chevron-up" size={20} color={Colors.ink} />
              </TouchableOpacity>
              <Text style={S.timeVal}>{String(rappelHour).padStart(2, '0')}</Text>
              <TouchableOpacity style={S.timeBtn} onPress={() => void patch({ rappelHour: (rappelHour + 23) % 24 })}>
                <Ionicons name="chevron-down" size={20} color={Colors.ink} />
              </TouchableOpacity>
            </View>
            <Text style={S.timeSep}>:</Text>
            <View style={S.timeCol}>
              <TouchableOpacity style={S.timeBtn} onPress={() => void patch({ rappelMin: (rappelMin + 5) % 60 })}>
                <Ionicons name="chevron-up" size={20} color={Colors.ink} />
              </TouchableOpacity>
              <Text style={S.timeVal}>{String(rappelMin).padStart(2, '0')}</Text>
              <TouchableOpacity style={S.timeBtn} onPress={() => void patch({ rappelMin: (rappelMin + 55) % 60 })}>
                <Ionicons name="chevron-down" size={20} color={Colors.ink} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={S.hint}>Un rappel quotidien pour limiter l&apos;oubli de routine et le churn.</Text>
        </>
      ) : null}
    </View>
  );
}

const S = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 16,
  },
  inline: { paddingVertical: 4 },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.amberLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  sub: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 2 },
  kindRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  kindChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.cream,
  },
  kindChipOn: { borderColor: Colors.amber, backgroundColor: Colors.amberLight },
  kindText: { fontSize: 12, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },
  kindTextOn: { fontFamily: 'DMSans_700Bold', color: Colors.ink },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  timeCol: { alignItems: 'center' },
  timeBtn: { padding: 6 },
  timeVal: { fontSize: 28, fontFamily: 'Poppins_700Bold', color: Colors.ink, minWidth: 56, textAlign: 'center' },
  timeSep: { fontSize: 28, fontFamily: 'Poppins_700Bold', color: Colors.ink },
  hint: {
    marginTop: 10,
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 16,
  },
});
