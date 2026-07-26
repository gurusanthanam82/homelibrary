import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { colors, radii, genreColor, statusColors, genreColors } from '../theme';
import { getBook, deleteBook, updateBook } from '../services/books';
import type { Book, LibraryStackParamList } from '../types';

type Nav = NativeStackNavigationProp<LibraryStackParamList, 'BookDetail'>;
type Route = RouteProp<LibraryStackParamList, 'BookDetail'>;

const GENRES = Object.keys(genreColors);
const STATUSES: Book['status'][] = ['owned', 'reading', 'finished', 'wishlist'];

export default function BookDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBook(route.params.bookId).then(setBook).finally(() => setLoading(false));
  }, [route.params.bookId]);

  async function patch(updates: Partial<Book>) {
    if (!book) return;
    const updated = await updateBook(book.id, updates);
    setBook(updated);
  }

  async function captureCover() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera permission needed', 'Enable camera access to take a cover photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true });
    if (!result.canceled && result.assets[0]) {
      patch({ cover_url: result.assets[0].uri });
    }
  }

  function cycleGenre() {
    if (!book) return;
    const idx = GENRES.indexOf(book.genre ?? '');
    patch({ genre: GENRES[(idx + 1) % GENRES.length] });
  }

  function cycleStatus() {
    if (!book) return;
    const idx = STATUSES.indexOf(book.status);
    patch({ status: STATUSES[(idx + 1) % STATUSES.length] });
  }

  function handleDelete() {
    Alert.alert('Remove book', 'Are you sure you want to remove this from your library?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await deleteBook(book!.id); navigation.goBack(); } },
    ]);
  }

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: colors.bg }} size="large" color={colors.maroon} />;
  if (!book) return <Text style={{ padding: 24 }}>Book not found.</Text>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{ padding: 20 }}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        <View style={styles.coverRow}>
          <View style={styles.coverCol}>
            <View style={styles.coverBox}>
              {book.cover_url ? <Image source={{ uri: book.cover_url }} style={styles.coverImg} /> : <Ionicons name="book" size={32} color={colors.textFaint} />}
            </View>
            <Text style={styles.coverLabel}>Front</Text>
            <TouchableOpacity style={styles.cameraBtn} onPress={captureCover}>
              <Ionicons name="camera-outline" size={14} color={colors.white} />
              <Text style={styles.cameraBtnText}>Camera</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.title}>{book.title}</Text>
        <View style={styles.authorRow}>
          <View style={styles.authorChip}><Text style={styles.authorChipText}>{book.author}</Text></View>
        </View>
        <TouchableOpacity style={[styles.genrePill, { backgroundColor: genreColor(book.genre) }]} onPress={cycleGenre}>
          <Text style={styles.genrePillText}>{book.genre || 'Other'}</Text>
          <Ionicons name="swap-horizontal" size={12} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        <View style={styles.infoCard}>
          <TouchableOpacity style={styles.infoRow} onPress={cycleStatus}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.infoValue, { color: statusColors[book.status] }]}>{book.status}</Text>
              <Ionicons name="swap-horizontal" size={12} color={statusColors[book.status]} />
            </View>
          </TouchableOpacity>
          {book.isbn ? <View style={styles.infoRow}><Text style={styles.infoLabel}>ISBN</Text><Text style={styles.infoValue}>{book.isbn}</Text></View> : null}
          {book.language ? <View style={styles.infoRow}><Text style={styles.infoLabel}>Language</Text><Text style={styles.infoValue}>{book.language}</Text></View> : null}
          {book.publisher ? <View style={styles.infoRow}><Text style={styles.infoLabel}>Publisher</Text><Text style={styles.infoValue}>{book.publisher}</Text></View> : null}
          {book.shelf ? <View style={styles.infoRow}><Text style={styles.infoLabel}>Shelf</Text><Text style={styles.infoValue}>{book.shelf}</Text></View> : null}
          {book.published_year ? <View style={[styles.infoRow, { borderBottomWidth: 0 }]}><Text style={styles.infoLabel}>Published</Text><Text style={styles.infoValue}>{book.published_year}</Text></View> : null}
        </View>

        {book.description ? (
          <View style={styles.descCard}>
            <Text style={styles.descLabel}>Description</Text>
            <Text style={styles.descText}>{book.description}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={16} color={colors.maroon} />
          <Text style={styles.deleteBtnText}>Remove from library</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  backBtn: {
    width: 40, height: 40, borderRadius: radii.md, backgroundColor: colors.card,
    borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  coverRow: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  coverCol: { alignItems: 'center', gap: 6 },
  coverBox: {
    width: 114, height: 160, borderRadius: 9, backgroundColor: colors.chipBg,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  coverImg: { width: '100%', height: '100%' },
  coverLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 14 },
  cameraBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.dark, paddingHorizontal: 11, paddingVertical: 7, borderRadius: radii.sm },
  cameraBtnText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.3, marginTop: 14 },
  authorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  authorChip: { backgroundColor: colors.chipBg, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  authorChipText: { fontSize: 13, fontWeight: '700', color: colors.textSoft },
  genrePill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  genrePillText: { fontSize: 12, fontWeight: '700', color: colors.white },
  infoCard: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.xl, paddingHorizontal: 18, marginTop: 18 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  infoLabel: { color: colors.textMuted, fontWeight: '600', fontSize: 14 },
  infoValue: { color: colors.text, fontWeight: '700', fontSize: 14, textTransform: 'capitalize' },
  descCard: { marginTop: 14, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.xl, padding: 16 },
  descLabel: { fontSize: 11, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  descText: { fontSize: 14, color: colors.textSoft, lineHeight: 21 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 26, padding: 12 },
  deleteBtnText: { color: colors.maroon, fontSize: 14, fontWeight: '700' },
});
