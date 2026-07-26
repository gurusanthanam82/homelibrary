import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { getBooks } from '../services/books';
import BookCard from '../components/BookCard';
import type { Book, LibraryStackParamList } from '../types';

type Nav = NativeStackNavigationProp<LibraryStackParamList, 'BookList'>;

const FILTERS = ['All', 'Reading', 'Owned', 'Finished', 'Wishlist'] as const;
type Filter = typeof FILTERS[number];

export default function BookListScreen() {
  const { session } = useAuth();
  const navigation = useNavigation<Nav>();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('All');

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const data = await getBooks(session.user.id);
      setBooks(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'All'
    ? books
    : books.filter(b => b.status === filter.toLowerCase());

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#4f46e5" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filter === f && styles.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <BookCard book={item} onPress={() => navigation.navigate('BookDetail', { bookId: item.id })} />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        contentContainerStyle={filtered.length === 0 ? styles.empty : styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContent}>
            <Ionicons name="library-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No books yet</Text>
            <Text style={styles.emptyHint}>Tap + to add your first book</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddBook', {})}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  filters: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#e5e7eb',
  },
  chipActive: { backgroundColor: '#4f46e5' },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  list: { padding: 12, gap: 10 },
  empty: { flex: 1 },
  emptyContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#999', marginTop: 12 },
  emptyHint: { fontSize: 14, color: '#bbb', marginTop: 4 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 5,
  },
});
