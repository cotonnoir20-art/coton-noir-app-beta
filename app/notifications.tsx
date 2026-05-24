import { useState } from 'react';
import {
  Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/theme/colors';
import { useNotifications, ICON_MAP, type Notif } from '../src/context/NotificationsContext';
import { AppHeader } from '../src/components/AppHeader';
import { EmptyAnimation } from '../src/components/animations/EmptyAnimation';
import { BCEmojiAvatar } from '../src/components/blackCotton/BCEmojiAvatar';
import { RoutineReminderSettings } from '../src/components/profile/RoutineReminderSettings';

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifs, unreadCount, markRead, markAllRead } = useNotifications();
  const [tipModal, setTipModal] = useState<Notif | null>(null);

  function handlePress(n: Notif) {
    markRead(n.id);
    if (n.route) {
      router.push(n.route as any);
      return;
    }
    if (n.type === 'tip') {
      setTipModal(n);
    }
  }

  const unread = notifs.filter(n => !n.read);
  const read   = notifs.filter(n => n.read);

  return (
    <SafeAreaView style={S.safe} edges={['top']}>

      <AppHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : undefined}
        rightAction={unreadCount > 0 ? 'custom' : 'none'}
        rightSlot={
          unreadCount > 0 ? (
            <TouchableOpacity
              onPress={markAllRead}
              accessibilityRole="button"
              accessibilityLabel="Marquer tout comme lu"
            >
              <Text style={S.markAllText}>Tout lire</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.content}>

        <RoutineReminderSettings variant="card" />
        <Text style={S.prefsHint}>
          Centre de notifications — historique des alertes CotonCoins, routines et offres.
        </Text>

        {notifs.length === 0 && (
          <View style={S.emptyBox}>
            <EmptyAnimation emoji="🔔" size={96} style={{ marginBottom: 16 }} />
            <Text style={S.emptyTitle}>Aucune notification</Text>
            <Text style={S.emptyBody}>
              Tu seras notifiée ici pour tes routines, tes CotonCoins et les offres partenaires.
            </Text>
          </View>
        )}

        {unread.length > 0 && (
          <>
            <Text style={S.sectionLabel}>Nouvelles</Text>
            {unread.map((n, i) => (
              <NotifRow key={n.id} n={n} last={i === unread.length - 1} onPress={() => handlePress(n)} />
            ))}
          </>
        )}

        {read.length > 0 && (
          <>
            <Text style={[S.sectionLabel, { marginTop: unread.length > 0 ? 24 : 0 }]}>
              Précédentes
            </Text>
            {read.map((n, i) => (
              <NotifRow key={n.id} n={n} last={i === read.length - 1} onPress={() => handlePress(n)} />
            ))}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Popin astuce */}
      <Modal
        visible={tipModal != null}
        transparent
        animationType="fade"
        onRequestClose={() => setTipModal(null)}
      >
        <Pressable style={S.tipOverlay} onPress={() => setTipModal(null)}>
          <Pressable style={S.tipSheet} onPress={e => e.stopPropagation()}>
            <View style={S.tipHandle} />
            <View style={S.tipHeader}>
              <BCEmojiAvatar size={48} mood="coaching" />
              <View style={S.tipHeaderText}>
                <Text style={S.tipLabel}>ASTUCE BLACK COTTON</Text>
                <Text style={S.tipTime}>{tipModal?.time}</Text>
              </View>
              <TouchableOpacity
                style={S.tipCloseBtn}
                onPress={() => setTipModal(null)}
                accessibilityLabel="Fermer"
              >
                <Ionicons name="close" size={20} color={Colors.warmGray} />
              </TouchableOpacity>
            </View>
            <Text style={S.tipTitle}>{tipModal?.title}</Text>
            <Text style={S.tipBody}>{tipModal?.body}</Text>
            <TouchableOpacity style={S.tipCta} onPress={() => setTipModal(null)}>
              <Text style={S.tipCtaText}>Compris, merci ✓</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function NotifRow({ n, last, onPress }: { n: Notif; last: boolean; onPress: () => void }) {
  const cfg = ICON_MAP[n.type];
  return (
    <TouchableOpacity
      style={[S.row, !n.read && S.rowUnread, !last && S.rowBorder]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {!n.read && <View style={S.unreadDot} />}

      <View style={[S.iconBox, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.name} size={20} color={cfg.color} />
      </View>

      <View style={S.rowBody}>
        <View style={S.rowTop}>
          <Text style={[S.rowTitle, !n.read && S.rowTitleBold]} numberOfLines={1}>
            {n.title}
          </Text>
          <Text style={S.rowTime}>{n.time}</Text>
        </View>
        <Text style={S.rowBodyText} numberOfLines={2}>{n.body}</Text>
      </View>

      {(n.route || n.type === 'tip') && (
        <Ionicons name="chevron-forward" size={15} color={Colors.border} style={{ marginLeft: 4 }} />
      )}
    </TouchableOpacity>
  );
}

const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle:     { fontSize: 18, fontFamily: 'Satoshi_500Medium', color: Colors.ink },
  headerBadge:     { backgroundColor: Colors.alert, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  headerBadgeText: { fontSize: 11, fontFamily: 'DMSans_700Bold', color: '#fff' },
  markAllText:     { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.amber, width: 60, textAlign: 'right' },

  emptyBox:  { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyTitle:{ fontSize: 18, fontFamily: 'Satoshi_500Medium', color: Colors.ink, marginBottom: 8 },
  emptyBody: { fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, textAlign: 'center', lineHeight: 21 },

  prefsHint: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 17,
    marginBottom: 8,
  },

  sectionLabel: {
    fontSize: 12, fontFamily: 'DMSans_700Bold', color: Colors.warmGray,
    letterSpacing: 0.6, textTransform: 'uppercase',
    marginTop: 20, marginBottom: 8,
  },

  row:       { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.surface, paddingVertical: 14, paddingHorizontal: 14, gap: 12, position: 'relative' },
  rowUnread: { backgroundColor: '#FEFAF6' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },

  unreadDot: {
    position: 'absolute', left: 4, top: 20,
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: Colors.amber,
  },

  iconBox: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  rowBody:      { flex: 1 },
  rowTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 },
  rowTitle:     { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.ink, flex: 1, marginRight: 8 },
  rowTitleBold: { fontFamily: 'DMSans_700Bold' },
  rowTime:      { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, flexShrink: 0 },
  rowBodyText:  { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 18 },

  tipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  tipSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
  },
  tipHandle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  tipHeaderText: { flex: 1 },
  tipLabel: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amber,
    letterSpacing: 1,
  },
  tipTime: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginTop: 2,
  },
  tipCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTitle: {
    fontSize: 18,
    fontFamily: 'Satoshi_500Medium',
    color: Colors.ink,
    marginBottom: 10,
    lineHeight: 24,
  },
  tipBody: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: Colors.ink,
    lineHeight: 22,
    marginBottom: 20,
  },
  tipCta: {
    backgroundColor: Colors.ink,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tipCtaText: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: '#fff' },
});
