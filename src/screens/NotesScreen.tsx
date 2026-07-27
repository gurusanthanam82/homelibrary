import React, { useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Modal, Alert, Linking, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, buddyColors } from '../theme';
import { useAppData } from '../contexts/AppDataContext';
import type { Note } from '../types';

const NOTE_COLORS = [colors.maroon, colors.teal, colors.purple, '#c98a2b', '#3b6ea5'];

export default function NotesScreen() {
  const { data, addNote, updateNote, deleteNote } = useAppData();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [shareNoteId, setShareNoteId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState('');
  const [draftBook, setDraftBook] = useState('');
  const [draftPage, setDraftPage] = useState('');
  const noteInputRef = useRef<TextInput>(null);

  const q = query.toLowerCase();
  const filtered = data.notes.filter((n) => n.text.toLowerCase().includes(q) || n.book.toLowerCase().includes(q));

  function openComposer(note?: Note) {
    if (note) {
      setEditingId(note.id);
      setDraftText(note.text);
      setDraftBook(note.book);
      setDraftPage(note.page?.toString() ?? '');
    } else {
      setEditingId(null);
      setDraftText('');
      setDraftBook('');
      setDraftPage('');
    }
    setComposerOpen(true);
  }

  function saveNote() {
    if (!draftText.trim()) return;
    if (editingId) {
      updateNote(editingId, { text: draftText, book: draftBook, page: draftPage ? parseInt(draftPage) : undefined });
    } else {
      addNote({
        text: draftText,
        book: draftBook || 'Untitled',
        page: draftPage ? parseInt(draftPage) : undefined,
        color: NOTE_COLORS[data.notes.length % NOTE_COLORS.length],
        urls: [],
        sharedBuddyIds: [],
      });
    }
    setComposerOpen(false);
  }

  function shareMessage(note: Note) {
    const meta = [note.book, note.page ? `p.${note.page}` : null].filter(Boolean).join(' · ');
    return meta ? `"${note.text}"\n\n📖 ${meta}` : `"${note.text}"`;
  }

  function shareWith(buddyId: string) {
    if (!shareNoteId) return;
    const note = data.notes.find((n) => n.id === shareNoteId);
    if (note) updateNote(shareNoteId, { sharedBuddyIds: Array.from(new Set([...note.sharedBuddyIds, buddyId])) });
    setShareNoteId(null);
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 16, paddingBottom: 40 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Notes</Text>
          <TouchableOpacity style={styles.newBtn} onPress={() => openComposer()}>
            <Ionicons name="add" size={14} color={colors.white} />
            <Text style={styles.newBtnText}>New</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput style={styles.searchInput} placeholder="Search notes…" placeholderTextColor={colors.textMuted} value={query} onChangeText={setQuery} />
        </View>

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={48} color={colors.textFaint} />
            <Text style={styles.emptyText}>No notes yet</Text>
            <Text style={styles.emptySub}>Tap New to capture a highlight worth keeping</Text>
          </View>
        )}

        {filtered.map((n) => (
          <View key={n.id} style={[styles.noteCard, { backgroundColor: n.color }]}>
            <Text style={styles.noteText}>{n.text}</Text>
            <Text style={styles.noteMeta}>
              {n.chapter ? `${n.chapter} · ` : ''}{n.book}{n.page ? ` · p.${n.page}` : ''}
            </Text>
            {n.sharedBuddyIds.length > 0 && (
              <View style={styles.sharedRow}>
                <Text style={styles.sharedLabel}>Shared with</Text>
                <View style={{ flexDirection: 'row', marginLeft: 6 }}>
                  {n.sharedBuddyIds.map((id, i) => {
                    const b = data.buddies.find((x) => x.id === id);
                    if (!b) return null;
                    return (
                      <View key={id} style={[styles.sharedAvatar, { backgroundColor: b.color, marginLeft: i > 0 ? -6 : 0 }]}>
                        <Text style={styles.sharedAvatarText}>{b.name.charAt(0)}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
            <View style={styles.noteBtns}>
              <TouchableOpacity style={styles.noteBtn} onPress={() => setShareNoteId(n.id)}>
                <Text style={styles.noteBtnText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.noteBtn} onPress={() => openComposer(n)}>
                <Text style={styles.noteBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.noteDeleteBtn}
                onPress={() => Alert.alert('Delete note', 'Remove this note?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deleteNote(n.id) }])}
              >
                <Ionicons name="trash-outline" size={16} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={composerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setComposerOpen(false)}
        onShow={() => setTimeout(() => noteInputRef.current?.focus(), 250)}
      >
        <View style={styles.modalScrim}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalSheet}>
              <View style={styles.handle} />
              <Text style={styles.sheetTitle}>{editingId ? 'Edit note' : 'New note'}</Text>
              <TextInput
                ref={noteInputRef}
                style={styles.noteInput}
                placeholder="What's worth remembering?"
                placeholderTextColor={colors.textFaint}
                value={draftText}
                onChangeText={setDraftText}
                multiline
              />
              <View style={styles.row}>
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="Book title" placeholderTextColor={colors.textFaint} value={draftBook} onChangeText={setDraftBook} />
                <TextInput style={[styles.input, { width: 90 }]} placeholder="Page" placeholderTextColor={colors.textFaint} value={draftPage} onChangeText={setDraftPage} keyboardType="numeric" />
              </View>
              <TouchableOpacity style={styles.saveBtn} onPress={saveNote}>
                <Text style={styles.saveBtnText}>Save note</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={!!shareNoteId} transparent animationType="slide" onRequestClose={() => setShareNoteId(null)}>
        <View style={styles.modalScrim}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShareNoteId(null)} />
          <View style={styles.modalSheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Share this note</Text>
            <TouchableOpacity
              style={styles.whatsappBtn}
              onPress={() => {
                const note = data.notes.find((n) => n.id === shareNoteId);
                if (note) Linking.openURL(`whatsapp://send?text=${encodeURIComponent(shareMessage(note))}`);
                setShareNoteId(null);
              }}
            >
              <Ionicons name="logo-whatsapp" size={18} color={colors.white} />
              <Text style={{ color: colors.white, fontWeight: '700' }}>Share via WhatsApp</Text>
            </TouchableOpacity>
            {data.buddies.filter((b) => !b.blocked).map((b) => (
              <TouchableOpacity key={b.id} style={styles.shareBuddyRow} onPress={() => shareWith(b.id)}>
                <View style={[styles.sharedAvatar, { backgroundColor: b.color, width: 36, height: 36 }]}><Text style={styles.sharedAvatarText}>{b.name.charAt(0)}</Text></View>
                <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: colors.text }}>{b.name}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 30, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.maroon, paddingHorizontal: 14, paddingVertical: 9, borderRadius: radii.md },
  newBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, padding: 10, marginTop: 14 },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  empty: { alignItems: 'center', paddingTop: 60, gap: 6 },
  emptyText: { fontSize: 16, fontWeight: '700', color: colors.textMuted },
  emptySub: { fontSize: 12, color: colors.textFaint, fontWeight: '600' },
  noteCard: { marginTop: 14, borderRadius: radii.xl, padding: 18 },
  noteText: { fontSize: 15, lineHeight: 21, fontWeight: '500', color: colors.white },
  noteMeta: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.85)', marginTop: 14 },
  sharedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  sharedLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  sharedAvatar: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  sharedAvatarText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  noteBtns: { flexDirection: 'row', gap: 8, marginTop: 13 },
  noteBtn: { flex: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.22)', paddingVertical: 9, borderRadius: radii.md },
  noteBtnText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  noteDeleteBtn: { width: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: radii.md },
  modalScrim: { flex: 1, backgroundColor: 'rgba(27,23,20,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.bg, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, padding: 20, paddingBottom: 30 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 14 },
  noteInput: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, padding: 13, fontSize: 15, color: colors.text, backgroundColor: colors.card, minHeight: 90, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10, marginTop: 12 },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, padding: 13, fontSize: 14, color: colors.text, backgroundColor: colors.card },
  saveBtn: { marginTop: 16, backgroundColor: colors.maroon, padding: 16, borderRadius: radii.lg, alignItems: 'center' },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  whatsappBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#25d366', padding: 14, borderRadius: radii.lg, marginBottom: 16 },
  shareBuddyRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
});
