import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { addBook, searchBooksByISBN } from '../services/books';
import type { Book, LibraryStackParamList } from '../types';

type Nav = NativeStackNavigationProp<LibraryStackParamList, 'AddBook'>;
type Route = RouteProp<LibraryStackParamList, 'AddBook'>;

const STATUS_OPTIONS: Book['status'][] = ['owned', 'reading', 'finished', 'wishlist'];

export default function AddBookScreen() {
  const { session } = useAuth();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

  const [title, setTitle] = useState(route.params?.prefill?.title ?? '');
  const [author, setAuthor] = useState(route.params?.prefill?.author ?? '');
  const [isbn, setIsbn] = useState(route.params?.isbn ?? route.params?.prefill?.isbn ?? '');
  const [genre, setGenre] = useState(route.params?.prefill?.genre ?? '');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Book['status']>('owned');
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);

  async function handleISBNLookup() {
    if (!isbn) return;
    setLookingUp(true);
    try {
      const data = await searchBooksByISBN(isbn);
      if (data) {
        if (data.title) setTitle(data.title);
        if (data.author) setAuthor(data.author);
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
        title, author, isbn: isbn || undefined,
        genre: genre || undefined, notes: notes || undefined,
        status, rating: rating || undefined,
        user_id: session!.user.id,
        cover_url: route.params?.prefill?.cover_url,
        description: route.params?.prefill?.description,
        published_year: route.params?.prefill?.published_year,
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>ISBN</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="9780..."
          value={isbn}
          onChangeText={setIsbn}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.lookupBtn} onPress={handleISBNLookup} disabled={lookingUp}>
          {lookingUp
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.lookupText}>Lookup</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Title *</Text>
      <TextInput style={styles.input} placeholder="Book title" value={title} onChangeText={setTitle} />

      <Text style={styles.label}>Author *</Text>
      <TextInput style={styles.input} placeholder="Author name" value={author} onChangeText={setAuthor} />

      <Text style={styles.label}>Genre</Text>
      <TextInput style={styles.input} placeholder="Fiction, History…" value={genre} onChangeText={setGenre} />

      <Text style={styles.label}>Status</Text>
      <View style={styles.statusRow}>
        {STATUS_OPTIONS.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.statusChip, status === s && styles.statusChipActive]}
            onPress={() => setStatus(s)}
          >
            <Text style={[styles.statusChipText, status === s && styles.statusChipTextActive]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Rating</Text>
      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map(n => (
          <TouchableOpacity key={n} onPress={() => setRating(rating === n ? 0 : n)}>
            <Text style={styles.star}>{n <= rating ? '★' : '☆'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        placeholder="Personal notes…"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity
        style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator size="small" color="#fff" />
          : <Text style={styles.saveBtnText}>Add to Library</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10,
    padding: 12, fontSize: 15, backgroundColor: '#fafafa',
  },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  lookupBtn: {
    backgroundColor: '#4f46e5', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  lookupText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb',
  },
  statusChipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  statusChipText: { fontSize: 13, color: '#555' },
  statusChipTextActive: { color: '#fff' },
  ratingRow: { flexDirection: 'row', gap: 8 },
  star: { fontSize: 28, color: '#f59e0b' },
  notesInput: { minHeight: 100, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: '#4f46e5', borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 24,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
