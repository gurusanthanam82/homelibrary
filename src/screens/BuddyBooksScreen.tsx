import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, shadow } from '../theme';
import { useAppData } from '../contexts/AppDataContext';

export default function BuddyBooksScreen() {
  const navigation = useNavigation();
  const { data } = useAppData();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const q = query.toLowerCase();
    return data.buddies
      .filter((b) => !b.blocked && b.sharedBooks.length > 0)
      .map((b) => ({
        ...b,
        books: b.sharedBooks.filter((bk) => bk.title.toLowerCase().includes(q) || bk.author.toLowerCase().includes(q)),
      }))
      .filter((g) => g.books.length > 0);
  }, [data.buddies, query]);

  const totalBooks = groups.reduce((sum, g) => sum + g.books.length, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 16, paddingBottom: 40 }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Buddies' Books</Text>
          <Text style={styles.subtitle}>{totalBooks} books across all shelves</Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput style={styles.searchInput} placeholder="Search by title or author…" placeholderTextColor={colors.textMuted} value={query} onChangeText={setQuery} />
      </View>

      {groups.length === 0 && (
        <View style={styles.empty}>
          <Ionicons name="albums-outline" size={48} color={colors.textFaint} />
          <Text style={styles.emptyText}>No books match</Text>
        </View>
      )}

      {groups.map((g) => (
        <View key={g.id} style={styles.group}>
          <View style={styles.groupHeader}>
            <View style={[styles.avatar, { backgroundColor: g.color }]}><Text style={styles.avatarText}>{g.name.charAt(0)}</Text></View>
            <Text style={styles.groupName}>{g.name}</Text>
            <View style={styles.countBadge}><Text style={styles.countBadgeText}>{g.books.length}</Text></View>
          </View>
          {g.books.map((bk, i) => (
            <View key={i} style={styles.bookRow}>
              <View style={[styles.cover, { backgroundColor: bk.color }]} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.bookTitle} numberOfLines={1}>{bk.title}</Text>
                <Text style={styles.bookAuthor}>{bk.author}</Text>
              </View>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', ...shadow.chip },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 1 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.chipBg, borderRadius: radii.md, padding: 10, marginTop: 14, ...shadow.chip },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  empty: { alignItems: 'center', paddingTop: 60, gap: 6 },
  emptyText: { fontSize: 16, fontWeight: '700', color: colors.textMuted },
  group: { marginTop: 22 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  groupName: { fontSize: 14, fontWeight: '700', color: colors.text },
  countBadge: { backgroundColor: colors.chipBg, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  countBadgeText: { fontSize: 12, color: colors.textMuted, fontWeight: '700' },
  bookRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  cover: { width: 38, height: 54, borderRadius: 8 },
  bookTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  bookAuthor: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 2 },
});
