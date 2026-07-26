import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Modal, Alert, Linking, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radii } from '../theme';
import { useAppData } from '../contexts/AppDataContext';
import type { BuddiesStackParamList, Buddy } from '../types';

type Nav = NativeStackNavigationProp<BuddiesStackParamList>;

export default function BuddiesScreen() {
  const navigation = useNavigation<Nav>();
  const { data, addBuddy, toggleBlockBuddy } = useAppData();
  const [query, setQuery] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [shelfBuddy, setShelfBuddy] = useState<Buddy | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');

  const q = query.toLowerCase();
  const active = data.buddies.filter((b) => !b.blocked && b.name.toLowerCase().includes(q));
  const blocked = data.buddies.filter((b) => b.blocked);

  function saveInvite() {
    if (inviteName.trim()) addBuddy(inviteName.trim());
    setInviteName('');
    setInviteOpen(false);
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={styles.title}>Book buddies</Text>
        <Text style={styles.subtitle}>Tap a buddy to share what you're reading</Text>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput style={styles.searchInput} placeholder="Search buddies…" placeholderTextColor={colors.textMuted} value={query} onChangeText={setQuery} />
        </View>

        <View style={styles.grid}>
          {active.map((b) => (
            <View key={b.id} style={styles.card}>
              <View style={[styles.avatar, { backgroundColor: b.color }]}><Text style={styles.avatarText}>{b.name.charAt(0)}</Text></View>
              <Text style={styles.cardName}>{b.name}</Text>
              <Text style={styles.cardMeta}>{b.shared} shared</Text>
              <Text style={styles.cardHours}>{b.hoursLabel} read</Text>
              <View style={styles.cardBtns}>
                {b.hasSharedShelf && (
                  <TouchableOpacity style={styles.shelfBtn} onPress={() => setShelfBuddy(b)}>
                    <Text style={styles.shelfBtnText}>Shelf</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.shareBtn} onPress={() => setShareOpen(true)}>
                  <Text style={styles.shareBtnText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.blockBtn} onPress={() => toggleBlockBuddy(b.id)}>
                  <Ionicons name="close-circle-outline" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.inviteCard} onPress={() => setInviteOpen(true)}>
            <View style={styles.inviteCircle}><Text style={{ fontSize: 26, color: colors.maroon }}>+</Text></View>
            <Text style={styles.inviteText}>Invite</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('BuddyBooks')}>
          <Ionicons name="albums-outline" size={16} color={colors.maroon} />
          <Text style={styles.browseBtnText}>Browse buddies' books</Text>
        </TouchableOpacity>

        {blocked.length > 0 && (
          <>
            <Text style={styles.blockedLabel}>Blocked</Text>
            {blocked.map((b) => (
              <View key={b.id} style={styles.blockedRow}>
                <View style={[styles.avatarSm, { backgroundColor: colors.textFaint }]}><Text style={styles.avatarText}>{b.name.charAt(0)}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.blockedName}>{b.name}</Text>
                  <Text style={styles.blockedSub}>Blocked · can't see your shares</Text>
                </View>
                <TouchableOpacity style={styles.unblockBtn} onPress={() => toggleBlockBuddy(b.id)}>
                  <Text style={styles.unblockBtnText}>Unblock</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <Modal visible={inviteOpen} transparent animationType="slide" onRequestClose={() => setInviteOpen(false)}>
        <View style={styles.modalScrim}>
          <View style={styles.modalSheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Invite a buddy</Text>
            <TextInput style={styles.inviteInput} placeholder="Name" placeholderTextColor={colors.textFaint} value={inviteName} onChangeText={setInviteName} autoFocus />
            <TouchableOpacity style={styles.saveInviteBtn} onPress={saveInvite}>
              <Text style={styles.saveInviteBtnText}>Add buddy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={shareOpen} transparent animationType="slide" onRequestClose={() => setShareOpen(false)}>
        <View style={styles.modalScrim}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShareOpen(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Share with a buddy</Text>
            <View style={styles.shareRow}>
              <TouchableOpacity style={[styles.shareTile, { backgroundColor: '#25d366' }]} onPress={() => { Linking.openURL('whatsapp://send?text=Check out my library on Stacks!'); setShareOpen(false); }}>
                <Ionicons name="logo-whatsapp" size={24} color={colors.white} />
                <Text style={styles.shareTileText}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.shareTile, { backgroundColor: colors.teal }]} onPress={() => { Share.share({ message: 'Check out my library on Stacks!' }); setShareOpen(false); }}>
                <Ionicons name="link-outline" size={24} color={colors.white} />
                <Text style={styles.shareTileText}>Copy link</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.shareTile, { backgroundColor: colors.dark }]} onPress={() => setShareOpen(false)}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: colors.white }}>S</Text>
                <Text style={styles.shareTileText}>In Stacks</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.blockedLabel}>Your buddies</Text>
            {data.buddies.filter((b) => !b.blocked).map((b) => (
              <TouchableOpacity key={b.id} style={styles.shareBuddyRow} onPress={() => { Alert.alert('Sent', `Shared with ${b.name}.`); setShareOpen(false); }}>
                <View style={[styles.avatarSm, { backgroundColor: b.color }]}><Text style={styles.avatarText}>{b.name.charAt(0)}</Text></View>
                <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: colors.text }}>{b.name}</Text>
                <View style={styles.sendBtn}><Text style={styles.sendBtnText}>Send</Text></View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal visible={!!shelfBuddy} transparent animationType="slide" onRequestClose={() => setShelfBuddy(null)}>
        <View style={styles.modalScrim}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShelfBuddy(null)} />
          <View style={styles.modalSheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{shelfBuddy?.name}'s Shelf</Text>
            <Text style={styles.subtitle}>{shelfBuddy?.sharedBooks.length ?? 0} books visible</Text>
            <ScrollView style={{ maxHeight: 380, marginTop: 14 }} contentContainerStyle={{ gap: 14 }}>
              {shelfBuddy?.sharedBooks.map((bk, i) => (
                <View key={i} style={styles.shelfBookRow}>
                  <View style={[styles.shelfBookCover, { backgroundColor: bk.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.shelfBookTitle}>{bk.title}</Text>
                    <Text style={styles.shelfBookAuthor}>{bk.author}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 30, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4, fontWeight: '500' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, padding: 10, marginTop: 14 },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 18 },
  card: { width: '47%', backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.xl, padding: 18, alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarSm: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontWeight: '700', fontSize: 20 },
  cardName: { fontSize: 15, fontWeight: '700', color: colors.text },
  cardMeta: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  cardHours: { fontSize: 12, color: colors.maroon, fontWeight: '700', marginTop: 1 },
  cardBtns: { flexDirection: 'row', gap: 8, marginTop: 12 },
  shelfBtn: { flex: 1, backgroundColor: '#e7f6ee', paddingVertical: 8, borderRadius: radii.sm, alignItems: 'center' },
  shelfBtnText: { fontSize: 12, fontWeight: '700', color: '#1f8a6e' },
  shareBtn: { flex: 1, backgroundColor: colors.maroon, paddingVertical: 8, borderRadius: radii.sm, alignItems: 'center' },
  shareBtnText: { fontSize: 12, fontWeight: '700', color: colors.white },
  blockBtn: { width: 34, backgroundColor: colors.chipBg, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center' },
  inviteCard: { width: '47%', backgroundColor: colors.pinkBg, borderWidth: 1.5, borderColor: colors.coral, borderStyle: 'dashed', borderRadius: radii.xl, padding: 18, alignItems: 'center', justifyContent: 'center' },
  inviteCircle: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: colors.coral, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  inviteText: { fontSize: 14, fontWeight: '700', color: colors.maroon },
  browseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.pinkBg, borderWidth: 1.5, borderColor: colors.pinkBorder, borderRadius: radii.lg, padding: 13, marginTop: 12 },
  browseBtnText: { fontSize: 14, fontWeight: '700', color: colors.maroon },
  blockedLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 26, marginBottom: 10 },
  blockedRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.lg, marginBottom: 10 },
  blockedName: { fontSize: 15, fontWeight: '700', color: colors.textMuted },
  blockedSub: { fontSize: 12, color: colors.textFaint, fontWeight: '600' },
  unblockBtn: { backgroundColor: colors.chipBg, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.sm },
  unblockBtnText: { fontSize: 13, fontWeight: '700', color: colors.text },
  modalScrim: { flex: 1, backgroundColor: 'rgba(27,23,20,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.bg, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, padding: 20, paddingBottom: 30 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  inviteInput: { marginTop: 16, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, padding: 13, fontSize: 15, color: colors.text, backgroundColor: colors.card },
  saveInviteBtn: { marginTop: 16, backgroundColor: colors.maroon, padding: 16, borderRadius: radii.lg, alignItems: 'center' },
  saveInviteBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  shareRow: { flexDirection: 'row', gap: 12, marginTop: 18 },
  shareTile: { flex: 1, borderRadius: radii.xl, padding: 16, alignItems: 'center', gap: 6 },
  shareTileText: { fontSize: 13, fontWeight: '700', color: colors.white },
  shareBuddyRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
  shelfBookRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  shelfBookCover: { width: 44, height: 64, borderRadius: 9 },
  shelfBookTitle: { fontSize: 15, fontWeight: '700', color: colors.text, lineHeight: 19 },
  shelfBookAuthor: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 3 },
  sendBtn: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.pinkBorder, paddingHorizontal: 14, paddingVertical: 7, borderRadius: radii.md },
  sendBtnText: { fontSize: 13, fontWeight: '700', color: colors.maroon },
});
