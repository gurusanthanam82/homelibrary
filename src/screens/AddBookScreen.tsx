import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, shadow, GENRES as BASE_GENRES, statusLabels, shelves as BASE_SHELVES } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../contexts/AppDataContext';
import { addBook, searchBooksByISBN } from '../services/books';
import type { Book, LibraryStackParamList } from '../types';

type Nav = NativeStackNavigationProp<LibraryStackParamList, 'AddBook'>;
type Route = RouteProp<LibraryStackParamList, 'AddBook'>;

const STATUSES: Book['status'][] = ['unread', 'reading', 'finished'];

export default function AddBookScreen() {
  const { session } = useAuth();
  const { data, addCustomGenre, addCustomShelf } = useAppData();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();

  const GENRES = [...BASE_GENRES, ...data.customGenres];
  const SHELVES = [...BASE_SHELVES, ...data.customShelves];

  const [title, setTitle] = useState(route.params?.prefill?.title ?? '');
  const [author, setAuthor] = useState(route.params?.prefill?.author ?? '');
  const [isbn, setIsbn] = useState(route.params?.isbn ?? route.params?.prefill?.isbn ?? '');
  const [genre, setGenre] = useState(route.params?.prefill?.genre ?? GENRES[0]);
  const [status, setStatus] = useState<Book['status']>('unread');
  const [shelf, setShelf] = useState('');
  const [language, setLanguage] = useState(route.params?.prefill?.language ?? '');
  const [publisher, setPublisher] = useState(route.params?.prefill?.publisher ?? '');
  const [loading, setLoading] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [customGenreOpen, setCustomGenreOpen] = useState(false);
  const [customGenreDraft, setCustomGenreDraft] = useState('');
  const [customShelfOpen, setCustomShelfOpen] = useState(false);
  const [customShelfDraft, setCustomShelfDraft] = useState('');

  function saveCustomGenre() {
    if (!customGenreDraft.trim()) return;
    addCustomGenre(customGenreDraft.trim());
    setGenre(customGenreDraft.trim());
    setCustomGenreDraft('');
    setCustomGenreOpen(false);
  }

  function saveCustomShelf() {
    if (!customShelfDraft.trim()) return;
    addCustomShelf(customShelfDraft.trim());
    setShelf(customShelfDraft.trim());
    setCustomShelfDraft('');
    setCustomShelfOpen(false);
  }

  async function handleISBNLookup() {
    if (!isbn) return;
    setLookingUp(true);
    try {
      const data = await searchBooksByISBN(isbn);
      if (data) {
        if (data.title) setTitle(data.title);
        if (data.author) setAuthor(data.author);
        if (data.language) setLanguage(data.language);
        if (data.publisher) setPublisher(data.publisher);
      } else {
        Alert.alert('Not found', 'No book found for that ISBN.');
      }
    } catch {
      Alert.alert('Error', 'ISBN lookup failed.');
    } finally {
      setLookingUp(false);
    }
  }

  async function handleSave() {
    if (!title || !author) {
      Alert.alert('Required', 'Title and author are required.');
      return;
    }
    setLoading(true);
    try {
      await addBook({
        title, author, isbn: isbn || undefined, genre, status,
        shelf: shelf || undefined, language: language || undefined, publisher: publisher || undefined,
        user_id: session!.user.id,
        cover_url: route.params?.prefill?.cover_url,
        description: route.params?.prefill?.description,
        published_year: route.params?.prefill?.published_year,
      });
      navigation.popToTop();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add book manually</Text>
        <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.saveBtnText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={styles.label}>ISBN</Text>
          <View style={styles.row}>
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="9780…" placeholderTextColor={colors.textFaint} value={isbn} onChangeText={setIsbn} keyboardType="numeric" />
            <TouchableOpacity style={styles.lookupBtn} onPress={handleISBNLookup} disabled={lookingUp}>
              {lookingUp ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.lookupBtnText}>Lookup</Text>}
            </TouchableOpacity>
          </View>
        </View>

        <View>
          <Text style={styles.label}>Title *</Text>
          <TextInput style={styles.input} placeholder="Book title" placeholderTextColor={colors.textFaint} value={title} onChangeText={setTitle} />
        </View>
        <View>
          <Text style={styles.label}>Author</Text>
          <TextInput style={styles.input} placeholder="Author name" placeholderTextColor={colors.textFaint} value={author} onChangeText={setAuthor} />
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Genre</Text>
              <TouchableOpacity onPress={() => setCustomGenreOpen((v) => !v)}>
                <Text style={styles.newGenreLink}>＋ New</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.pickerBox} onPress={() => setGenre(GENRES[(GENRES.indexOf(genre) + 1) % GENRES.length])}>
              <Text style={styles.pickerText}>{genre}</Text>
              <Ionicons name="swap-horizontal" size={14} color={colors.maroon} />
            </TouchableOpacity>
            {customGenreOpen && (
              <View style={[styles.row, { marginTop: 8 }]}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="e.g. Graphic Novel"
                  placeholderTextColor={colors.textFaint}
                  value={customGenreDraft}
                  onChangeText={setCustomGenreDraft}
                />
                <TouchableOpacity style={styles.lookupBtn} onPress={saveCustomGenre}>
                  <Text style={styles.lookupBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Status</Text>
            <TouchableOpacity style={styles.pickerBox} onPress={() => setStatus(STATUSES[(STATUSES.indexOf(status) + 1) % STATUSES.length])}>
              <Text style={styles.pickerText}>{statusLabels[status]}</Text>
              <Ionicons name="swap-horizontal" size={14} color={colors.maroon} />
            </TouchableOpacity>
          </View>
        </View>

        <View>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Shelf</Text>
            <TouchableOpacity onPress={() => setCustomShelfOpen((v) => !v)}>
              <Text style={styles.newGenreLink}>＋ New</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {SHELVES.map((s) => (
              <TouchableOpacity key={s} style={[styles.shelfChip, shelf === s && styles.shelfChipActive]} onPress={() => setShelf(shelf === s ? '' : s)}>
                <Text style={[styles.shelfChipText, shelf === s && styles.shelfChipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {customShelfOpen && (
            <View style={[styles.row, { marginTop: 8 }]}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="e.g. Garage, Office…"
                placeholderTextColor={colors.textFaint}
                value={customShelfDraft}
                onChangeText={setCustomShelfDraft}
              />
              <TouchableOpacity style={styles.lookupBtn} onPress={saveCustomShelf}>
                <Text style={styles.lookupBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Language</Text>
            <TextInput style={styles.input} placeholder="English" placeholderTextColor={colors.textFaint} value={language} onChangeText={setLanguage} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Publisher</Text>
            <TextInput style={styles.input} placeholder="Publisher" placeholderTextColor={colors.textFaint} value={publisher} onChangeText={setPublisher} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerBtn: { width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', ...shadow.chip },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text },
  saveBtn: { backgroundColor: colors.maroon, paddingHorizontal: 16, paddingVertical: 9, borderRadius: radii.md, ...shadow.chip },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  scroll: { flex: 1 },
  label: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  newGenreLink: { fontSize: 11, fontWeight: '700', color: colors.maroon },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, padding: 13, fontSize: 15, color: colors.text, backgroundColor: colors.card },
  row: { flexDirection: 'row', gap: 10 },
  lookupBtn: { backgroundColor: colors.maroon, borderRadius: radii.md, paddingHorizontal: 16, justifyContent: 'center' },
  lookupBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  pickerBox: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, padding: 13, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickerText: { fontSize: 14, fontWeight: '700', color: colors.maroon, textTransform: 'capitalize' },
  shelfChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.md, backgroundColor: colors.chipBg },
  shelfChipActive: { backgroundColor: colors.maroon },
  shelfChipText: { fontSize: 13, fontWeight: '700', color: colors.text },
  shelfChipTextActive: { color: colors.white },
});
