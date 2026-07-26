import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { getBook, deleteBook, updateBook } from '../services/books';
import type { Book, LibraryStackParamList } from '../types';

type Nav = NativeStackNavigationProp<LibraryStackParamList, 'BookDetail'>;
type Route = RouteProp<LibraryStackParamList, 'BookDetail'>;

const STATUS_LABELS: Record<Book['status'], string> = {
  owned: 'Owned',
  wishlist: 'Wishlist',
  reading: 'Reading',
  finished: 'Finished',
};

const STATUS_COLORS: Record<Book['status'], string> = {
  owned: '#6366f1',
  wishlist: '#f59e0b',
  reading: '#10b981',
  finished: '#3b82f6',
};

export default function BookDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBook(route.params.bookId)
      .then(setBook)
      .finally(() => setLoading(false));
  }, [route.params.bookId]);

  useEffect(() => {
    if (!book) return;
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('EditBook', { book })}>
          <Ionicons name="pencil" size={20} color="#4f46e5" />
        </TouchableOpacity>
      ),
    });
  }, [book, navigation]);

  async function handleDelete() {
    Alert.alert('Delete Book', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteBook(book!.id);
          navigation.goBack();
        },
      },
    ]);
  }

  async function cycleStatus() {
    if (!book) return;
    const statuses: Book['status'][] = ['owned', 'reading', 'finished', 'wishlist'];
    const next = statuses[(statuses.indexOf(book.status) + 1) % statuses.length];
    const updated = await updateBook(book.id, { status: next });
    setBook(updated);
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#4f46e5" />;
  if (!book) return <Text style={{ padding: 24 }}>Book not found.</Text>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {book.cover_url ? (
        <Image source={{ uri: book.cover_url }} style={styles.cover} resizeMode="contain" />
      ) : (
        <View style={styles.coverPlaceholder}>
          <Ionicons name="book" size={64} color="#ccc" />
        </View>
      )}

      <Text style={styles.title}>{book.title}</Text>
      <Text style={styles.author}>{book.author}</Text>

      <TouchableOpacity
        style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[book.status] }]}
        onPress={cycleStatus}
      >
        <Text style={styles.statusText}>{STATUS_LABELS[book.status]}</Text>
      </TouchableOpacity>

      {book.description ? (
        <Text style={styles.description}>{book.description}</Text>
      ) : null}

      {book.isbn ? <Text style={styles.meta}>ISBN: {book.isbn}</Text> : null}
      {book.genre ? <Text style={styles.meta}>Genre: {book.genre}</Text> : null}
      {book.published_year ? <Text style={styles.meta}>Published: {book.published_year}</Text> : null}
      {book.rating ? (
        <Text style={styles.meta}>{'★'.repeat(book.rating)}{'☆'.repeat(5 - book.rating)}</Text>
      ) : null}

      {book.notes ? (
        <View style={styles.notesBox}>
          <Text style={styles.notesLabel}>Notes</Text>
          <Text style={styles.notesText}>{book.notes}</Text>
        </View>
      ) : null}

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Ionicons name="trash-outline" size={18} color="#ef4444" />
        <Text style={styles.deleteText}>Remove from library</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, alignItems: 'center' },
  cover: { width: 140, height: 200, borderRadius: 8, marginBottom: 20 },
  coverPlaceholder: {
    width: 140, height: 200, borderRadius: 8, backgroundColor: '#f3f4f6',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', color: '#111' },
  author: { fontSize: 16, color: '#666', marginTop: 4, marginBottom: 16 },
  statusBadge: {
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 20,
  },
  statusText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  description: { fontSize: 14, color: '#555', lineHeight: 22, marginBottom: 16, textAlign: 'center' },
  meta: { fontSize: 13, color: '#888', marginBottom: 6 },
  notesBox: {
    width: '100%', backgroundColor: '#f9fafb', borderRadius: 10,
    padding: 14, marginTop: 16,
  },
  notesLabel: { fontSize: 12, fontWeight: '700', color: '#999', marginBottom: 6, textTransform: 'uppercase' },
  notesText: { fontSize: 14, color: '#444', lineHeight: 20 },
  deleteButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 32, padding: 12,
  },
  deleteText: { color: '#ef4444', fontSize: 14 },
});
