import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radii, genreColor, statusColors, statusLabels } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { getBooks, addBook } from '../services/books';
import { SAMPLE_BOOKS } from '../sampleData';
import type { Book, LibraryStackParamList } from '../types';

type Nav = NativeStackNavigationProp<LibraryStackParamList>;

const FILTERS: Array<{ key: string; label: string }> = [
  { key: 'All', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'reading', label: 'Reading' },
  { key: 'finished', label: 'Read' },
];

export default function LibraryScreen() {
  const { session } = useAuth();
  const navigation = useNavigation<Nav>();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    if (!session) return;
    try {
      setBooks(await getBooks(session.user.id));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(() => {
    let list = books;
    if (filter !== 'All') list = list.filter((b) => b.status === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || (b.genre ?? '').toLowerCase().includes(q));
    }
    return list;
  }, [books, filter, query]);

  async function loadSampleLibrary() {
    if (!session) return;
    setSeeding(true);
    try {
      for (const b of SAMPLE_BOOKS) {
        await addBook({ ...b, user_id: session.user.id });
      }
      await load();
    } finally {
      setSeeding(false);
    }
  }

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: colors.bg }} size="large" color={colors.maroon} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
        <View style={styles.headerBtns}>
          <TouchableOpacity style={styles.primaryChip} onPress={() => navigation.navigate('AddBook', {})}>
            <Ionicons name="add" size={14} color={colors.white} />
            <Text style={styles.primaryChipText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.secondaryBtns}>
        <TouchableOpacity style={styles.secondaryChip} onPress={() => navigation.navigate('Podcasts')}>
          <Ionicons name="mic-outline" size={14} color={colors.maroon} />
          <Text style={styles.secondaryChipText}>Podcasts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryChip} onPress={() => navigation.navigate('Ebooks')}>
          <Ionicons name="document-outline" size={14} color={colors.maroon} />
          <Text style={styles.secondaryChipText}>E-Books</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryChip} onPress={() => navigation.navigate('Export')}>
          <Ionicons name="download-outline" size={14} color={colors.white} />
          <Text style={styles.primaryChipText}>Export</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search title, author, genre…"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={FILTERS}
        keyExtractor={(f) => f.key}
        style={{ flexGrow: 0, marginVertical: 12 }}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}
        renderItem={({ item: f }) => (
          <TouchableOpacity
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filtered}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        renderItem={({ item: b }) => (
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('BookDetail', { bookId: b.id })}>
            <View style={styles.cover}>
              {b.cover_url ? <Image source={{ uri: b.cover_url }} style={styles.coverImg} /> : (
                <Text style={styles.coverFallback} numberOfLines={2}>{b.title}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{b.title}</Text>
              <Text style={styles.rowAuthor}>{b.author}</Text>
              <View style={styles.pillRow}>
                <View style={[styles.genrePill, { backgroundColor: genreColor(b.genre) }]}>
                  <Text style={styles.genrePillText}>{b.genre || 'Fiction'}</Text>
                </View>
                <View style={[styles.statusPill, { borderColor: statusColors[b.status] }]}>
                  <Text style={[styles.statusPillText, { color: statusColors[b.status] }]}>{statusLabels[b.status]}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          books.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Ionicons name="library-outline" size={56} color={colors.textFaint} />
              <Text style={{ marginTop: 12, color: colors.textMuted, fontWeight: '700', fontSize: 16 }}>No books yet</Text>
              <TouchableOpacity style={styles.sampleBtn} onPress={loadSampleLibrary} disabled={seeding}>
                {seeding ? <ActivityIndicator size="small" color={colors.white} /> : (
                  <>
                    <Ionicons name="sparkles-outline" size={14} color={colors.white} />
                    <Text style={styles.sampleBtnText}>Load sample library</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Text style={{ color: colors.textMuted, fontWeight: '600', fontSize: 13 }}>No books match this filter.</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 18 },
  title: { fontSize: 30, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  headerBtns: { flexDirection: 'row', gap: 8 },
  secondaryBtns: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginTop: 10 },
  primaryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.maroon, paddingHorizontal: 13, paddingVertical: 9, borderRadius: radii.md },
  primaryChipText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  secondaryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.pinkBg, borderWidth: 1, borderColor: colors.pinkBorder, paddingHorizontal: 13, paddingVertical: 9, borderRadius: radii.md },
  secondaryChipText: { color: colors.maroon, fontSize: 13, fontWeight: '700' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card,
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, padding: 10,
    marginHorizontal: 20, marginTop: 14,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.pill, backgroundColor: colors.chipBg },
  filterChipActive: { backgroundColor: colors.maroon },
  filterChipText: { fontSize: 13, fontWeight: '700', color: colors.text },
  filterChipTextActive: { color: colors.white },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  cover: {
    width: 54, height: 80, borderRadius: 8, backgroundColor: colors.maroon, padding: 7,
    justifyContent: 'flex-end', overflow: 'hidden',
  },
  coverImg: { width: '100%', height: '100%', position: 'absolute' },
  coverFallback: { fontSize: 9, fontWeight: '700', color: colors.white },
  rowTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  rowAuthor: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  pillRow: { flexDirection: 'row', gap: 7, marginTop: 7 },
  genrePill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 12 },
  genrePillText: { fontSize: 11, fontWeight: '700', color: colors.white },
  statusPill: { paddingHorizontal: 9, paddingVertical: 2, borderRadius: 12, borderWidth: 1.5 },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  sampleBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.maroon, paddingHorizontal: 18, paddingVertical: 12, borderRadius: radii.lg, marginTop: 16 },
  sampleBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
});
