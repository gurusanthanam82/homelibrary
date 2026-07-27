import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Modal, Alert, Linking, Share, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, shadow } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../contexts/AppDataContext';
import { getBooks } from '../services/books';
import type { BuddiesStackParamList, Buddy, Book } from '../types';

type Nav = NativeStackNavigationProp<BuddiesStackParamList>;

export default function BuddiesScreen() {
  const navigation = useNavigation<Nav>();
  const { session } = useAuth();
  const { data, addBuddy, toggleBlockBuddy, addNotification } = useAppData();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [shareBuddyId, setShareBuddyId] = useState<string | null>(null);
  const [shareStep, setShareStep] = useState<'menu' | 'book' | 'shelf'>('menu');
  const [books, setBooks] = useState<Book[]>([]);
  const [shelfBuddy, setShelfBuddy] = useState<Buddy | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const inviteInputRef = useRef<TextInput>(null);

  const shareBuddy = data.buddies.find((b) => b.id === shareBuddyId) ?? null;
  const shelves = Array.from(new Set(books.map((b) => b.shelf?.trim() || 'Unsorted')));

  const loadBooks = useCallback(async () => {
    if (!session) return;
    setBooks(await getBooks(session.user.id));
  }, [session]);

  useFocusEffect(useCallback(() => { loadBooks(); }, [loadBooks]));

  function openShare(buddyId: string) {
    setShareBuddyId(buddyId);
    setShareStep('menu');
  }

  function closeShare() {
    setShareBuddyId(null);
    setShareStep('menu');
  }

  function notifyBook(book: Book) {
    if (!shareBuddy) return;
    addNotification(`You shared "${book.title}" with ${shareBuddy.name}.`);
    Alert.alert('Shared', `"${book.title}" shared with ${shareBuddy.name} via a Stacks notification.`);
    closeShare();
  }

  function notifyShelf(shelf: string) {
    if (!shareBuddy) return;
    addNotification(`You shared your "${shelf}" shelf with ${shareBuddy.name}.`);
    Alert.alert('Shared', `Your "${shelf}" shelf was shared with ${shareBuddy.name} via a Stacks notification.`);
    closeShare();
  }

  const q = query.toLowerCase();
  const active = data.buddies.filter((b) => !b.blocked && b.name.toLowerCase().includes(q));
  const blocked = data.buddies.filter((b) => b.blocked);

  function inviteMessage() {
    const who = inviteName.trim() ? `Hey ${inviteName.trim()}! ` : 'Hey! ';
    return `${who}Join me on Stacks to track our reading together and share books: https://stacks.app/invite`;
  }

  function resetInvite() {
    setInviteName('');
    setInviteEmail('');
    setInviteOpen(false);
  }

  function saveInvite() {
    if (inviteName.trim()) addBuddy(inviteName.trim());
    resetInvite();
  }

  function inviteViaWhatsApp() {
    if (inviteName.trim()) addBuddy(inviteName.trim());
    const url = `whatsapp://send?text=${encodeURIComponent(inviteMessage())}`;
    Linking.openURL(url).catch(() => Alert.alert('WhatsApp not installed', 'Install WhatsApp to send this invite.'));
    resetInvite();
  }

  function inviteViaEmail() {
    if (inviteName.trim()) addBuddy(inviteName.trim());
    const subject = encodeURIComponent('Join me on Stacks');
    const body = encodeURIComponent(inviteMessage());
    const to = inviteEmail.trim();
    Linking.openURL(`mailto:${to}?subject=${subject}&body=${body}`).catch(() => Alert.alert('Could not open mail app'));
    resetInvite();
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 16, paddingBottom: 40 }}>
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
                <TouchableOpacity style={styles.shareBtn} onPress={() => openShare(b.id)}>
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

      <Modal
        visible={inviteOpen}
        transparent
        animationType="slide"
        onRequestClose={resetInvite}
        onShow={() => setTimeout(() => inviteInputRef.current?.focus(), 250)}
      >
        <View style={styles.modalScrim}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalSheet}>
              <View style={styles.handle} />
              <View style={styles.inviteHeaderRow}>
                <Text style={styles.sheetTitle}>Invite a buddy</Text>
                <TouchableOpacity style={styles.closeXBtn} onPress={() => { resetInvite(); }}>
                  <Ionicons name="close" size={18} color={colors.text} />
                </TouchableOpacity>
              </View>
              <TextInput ref={inviteInputRef} style={styles.inviteInput} placeholder="Name" placeholderTextColor={colors.textFaint} value={inviteName} onChangeText={setInviteName} />
              <TextInput style={[styles.inviteInput, { marginTop: 10 }]} placeholder="Email (optional, for email invite)" placeholderTextColor={colors.textFaint} value={inviteEmail} onChangeText={setInviteEmail} autoCapitalize="none" keyboardType="email-address" />

              <Text style={styles.inviteViaLabel}>Send invite via</Text>
              <View style={styles.shareRow}>
                <TouchableOpacity style={[styles.shareTile, { backgroundColor: '#25d366' }]} onPress={inviteViaWhatsApp}>
                  <Ionicons name="logo-whatsapp" size={24} color={colors.white} />
                  <Text style={styles.shareTileText}>WhatsApp</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.shareTile, { backgroundColor: colors.teal }]} onPress={inviteViaEmail}>
                  <Ionicons name="mail-outline" size={24} color={colors.white} />
                  <Text style={styles.shareTileText}>Email</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.saveInviteBtn} onPress={saveInvite}>
                <Text style={styles.saveInviteBtnText}>Just add buddy (no invite)</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={!!shareBuddy} transparent animationType="slide" onRequestClose={closeShare}>
        <View style={styles.modalScrim}>
          <TouchableOpacity style={{ flex: 1 }} onPress={closeShare} />
          <View style={styles.modalSheet}>
            <View style={styles.handle} />
            <View style={styles.shareHeaderRow}>
              <Text style={styles.sheetTitle}>
                {shareStep === 'menu' ? `Share with ${shareBuddy?.name}` : shareStep === 'book' ? 'Choose a book' : 'Choose a shelf'}
              </Text>
              {shareStep !== 'menu' ? (
                <TouchableOpacity onPress={() => setShareStep('menu')}><Text style={styles.cancelText}>Back</Text></TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={closeShare}><Ionicons name="close" size={20} color={colors.text} /></TouchableOpacity>
              )}
            </View>

            {shareStep === 'menu' && (
              <>
                <View style={styles.shareRow}>
                  <TouchableOpacity style={[styles.shareTile, { backgroundColor: '#25d366' }]} onPress={() => { Linking.openURL('whatsapp://send?text=Check out my library on Stacks!'); closeShare(); }}>
                    <Ionicons name="logo-whatsapp" size={24} color={colors.white} />
                    <Text style={styles.shareTileText}>WhatsApp</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.shareTile, { backgroundColor: colors.teal }]} onPress={() => { Share.share({ message: 'Check out my library on Stacks!' }); closeShare(); }}>
                    <Ionicons name="link-outline" size={24} color={colors.white} />
                    <Text style={styles.shareTileText}>Copy link</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.inviteViaLabel}>Notify within Stacks</Text>
                <TouchableOpacity style={styles.stacksNotifyRow} onPress={() => setShareStep('book')}>
                  <View style={styles.stacksNotifyIcon}><Ionicons name="book-outline" size={18} color={colors.maroon} /></View>
                  <Text style={styles.stacksNotifyText}>Share a book</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.stacksNotifyRow} onPress={() => setShareStep('shelf')}>
                  <View style={styles.stacksNotifyIcon}><Ionicons name="bookmark-outline" size={18} color={colors.maroon} /></View>
                  <Text style={styles.stacksNotifyText}>Share a shelf</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
                </TouchableOpacity>
              </>
            )}

            {shareStep === 'book' && (
              <ScrollView style={{ maxHeight: 380 }} contentContainerStyle={{ gap: 4 }}>
                {books.length === 0 && <Text style={styles.emptyPickerText}>No books in your library yet.</Text>}
                {books.map((bk) => (
                  <TouchableOpacity key={bk.id} style={styles.shareBuddyRow} onPress={() => notifyBook(bk)}>
                    <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: colors.text }} numberOfLines={1}>{bk.title}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: '600' }} numberOfLines={1}>{bk.author}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {shareStep === 'shelf' && (
              <ScrollView style={{ maxHeight: 380 }} contentContainerStyle={{ gap: 4 }}>
                {shelves.length === 0 && <Text style={styles.emptyPickerText}>No shelves yet.</Text>}
                {shelves.map((s) => (
                  <TouchableOpacity key={s} style={styles.shareBuddyRow} onPress={() => notifyShelf(s)}>
                    <Ionicons name="bookmark" size={14} color={colors.maroon} />
                    <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: colors.text, marginLeft: 10 }}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
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
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, padding: 10, marginTop: 14, ...shadow.chip },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 18 },
  card: { width: '47%', backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.xl, padding: 18, alignItems: 'center', ...shadow.card },
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
  browseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.pinkBg, borderWidth: 1.5, borderColor: colors.pinkBorder, borderRadius: radii.lg, padding: 13, marginTop: 12, ...shadow.chip },
  browseBtnText: { fontSize: 14, fontWeight: '700', color: colors.maroon },
  blockedLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 26, marginBottom: 10 },
  blockedRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.lg, marginBottom: 10, ...shadow.chip },
  blockedName: { fontSize: 15, fontWeight: '700', color: colors.textMuted },
  blockedSub: { fontSize: 12, color: colors.textFaint, fontWeight: '600' },
  unblockBtn: { backgroundColor: colors.chipBg, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.sm },
  unblockBtnText: { fontSize: 13, fontWeight: '700', color: colors.text },
  modalScrim: { flex: 1, backgroundColor: 'rgba(27,23,20,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.bg, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, padding: 20, paddingBottom: 30, ...shadow.dark },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  inviteHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  closeXBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.chipBg, alignItems: 'center', justifyContent: 'center' },
  inviteInput: { marginTop: 16, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, padding: 13, fontSize: 15, color: colors.text, backgroundColor: colors.card },
  inviteViaLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 18, marginBottom: 4 },
  shareHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  stacksNotifyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  stacksNotifyIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.pinkBg, alignItems: 'center', justifyContent: 'center' },
  stacksNotifyText: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  emptyPickerText: { color: colors.textMuted, fontWeight: '600', paddingVertical: 16, textAlign: 'center' },
  saveInviteBtn: { marginTop: 16, backgroundColor: colors.chipBg, padding: 16, borderRadius: radii.lg, alignItems: 'center' },
  saveInviteBtnText: { color: colors.text, fontWeight: '700', fontSize: 15 },
  shareRow: { flexDirection: 'row', gap: 12, marginTop: 18 },
  shareTile: { flex: 1, borderRadius: radii.xl, padding: 16, alignItems: 'center', gap: 6, ...shadow.chip },
  shareTileText: { fontSize: 13, fontWeight: '700', color: colors.white },
  shareBuddyRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
  shelfBookRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  shelfBookCover: { width: 44, height: 64, borderRadius: 9 },
  shelfBookTitle: { fontSize: 15, fontWeight: '700', color: colors.text, lineHeight: 19 },
  shelfBookAuthor: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 3 },
  sendBtn: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.pinkBorder, paddingHorizontal: 14, paddingVertical: 7, borderRadius: radii.md, ...shadow.chip },
  sendBtnText: { fontSize: 13, fontWeight: '700', color: colors.maroon },
});
