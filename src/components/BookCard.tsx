import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Book } from '../types';

const STATUS_COLORS: Record<Book['status'], string> = {
  owned: '#6366f1',
  wishlist: '#f59e0b',
  reading: '#10b981',
  finished: '#3b82f6',
};

type Props = { book: Book; onPress: () => void };

export default function BookCard({ book, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {book.cover_url ? (
        <Image source={{ uri: book.cover_url }} style={styles.cover} resizeMode="cover" />
      ) : (
        <View style={styles.coverPlaceholder}>
          <Ionicons name="book" size={28} color="#ccc" />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
        <Text style={styles.author} numberOfLines={1}>{book.author}</Text>
        {book.genre ? <Text style={styles.genre}>{book.genre}</Text> : null}
        <View style={styles.footer}>
          <View style={[styles.badge, { backgroundColor: STATUS_COLORS[book.status] }]}>
            <Text style={styles.badgeText}>{book.status}</Text>
          </View>
          {book.rating ? (
            <Text style={styles.rating}>{'★'.repeat(book.rating)}</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12,
    overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  cover: { width: 70, height: 100 },
  coverPlaceholder: {
    width: 70, height: 100, backgroundColor: '#f3f4f6',
    alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1, padding: 12, justifyContent: 'space-between' },
  title: { fontSize: 15, fontWeight: '600', color: '#111' },
  author: { fontSize: 13, color: '#666', marginTop: 2 },
  genre: { fontSize: 12, color: '#aaa', marginTop: 2 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  rating: { fontSize: 13, color: '#f59e0b' },
});
