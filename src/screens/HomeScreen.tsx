import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Image, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../contexts/AppDataContext';
import { getBooks } from '../services/books';
import { HOURS_READ } from '../sampleData';
import type { Book, HomeStackParamList } from '../types';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

export default function HomeScreen() {
  const { session, signOut } = useAuth();
  const { data } = useAppData();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const b = await getBooks(session.user.id);
      setBooks(b);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const stats = useMemo(() => {
    const total = books.length;
    const reading = books.filter((b) => b.status === 'reading').length;
    const read = books.filter((b) => b.status === 'finished').length;
    const unread = total - reading - read;
    return {
      total, reading, read, unread,
      readPct: total ? Math.round((read / total) * 100) : 0,
      readingPct: total ? Math.round((reading / total) * 100) : 0,
    };
  }, [books]);

  const shelves = useMemo(() => {
    const map = new Map<string, number>();
    books.forEach((b) => {
      const key = b.shelf?.trim() || 'Unsorted';
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [books]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return books.filter(
      (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || (b.genre ?? '').toLowerCase().includes(q)
    ).slice(0, 6);
  }, [search, books]);

  const upNext = books.filter((b) => b.status === 'reading').slice(0, 5);

  const displayName = data.profile.name || session?.user.email?.split('@')[0] || 'Reader';
  const initial = displayName.charAt(0).toUpperCase();

  function goTab(tab: string) {
    (navigation as any).getParent()?.navigate(tab);
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: colors.bg }} size="large" color={colors.maroon} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 16, paddingBottom: 40 }}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.profileRow} onPress={() => (navigation as any).getParent()?.getParent()?.navigate('Profile')}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View>
            <Text style={styles.welcome}>Welcome back</Text>
            <Text style={styles.name}>{displayName}</Text>
            <View style={styles.profileLink}>
              <Text style={styles.profileLinkText}>My profile</Text>
              <Ionicons name="chevron-forward" size={12} color={colors.maroon} />
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={22} color={colors.maroon} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search title, author, genre, shelf…"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {search.length > 0 && (
        <View style={styles.searchResults}>
          {searchResults.length === 0 ? (
            <Text style={styles.emptySearch}>No books match that search.</Text>
          ) : (
            searchResults.map((b) => (
              <TouchableOpacity key={b.id} style={styles.searchRow} onPress={() => { setSearch(''); navigation.navigate('BookDetail', { bookId: b.id }); }}>
                <View style={styles.searchCover}>
                  {b.cover_url ? <Image source={{ uri: b.cover_url }} style={styles.searchCoverImg} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.searchTitle} numberOfLines={1}>{b.title}</Text>
                  <Text style={styles.searchMeta} numberOfLines={1}>{b.author}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {shelves.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ gap: 8 }}>
          {shelves.map((s) => (
            <View key={s.name} style={styles.shelfChip}>
              <Ionicons name="bookmark" size={13} color={colors.maroon} />
              <Text style={styles.shelfChipText}>{s.name}</Text>
              <View style={styles.shelfChipCount}><Text style={styles.shelfChipCountText}>{s.count}</Text></View>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.streakCard}>
        <View>
          <Text style={styles.streakLabel}>Reading streak</Text>
          <Text style={styles.streakValue}>12 days</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.streakLabel}>This year</Text>
          <Text style={[styles.streakValue, { color: colors.coral }]}>{stats.read} read</Text>
        </View>
      </View>

      <View style={styles.trackerCard}>
        <View style={styles.trackerHeader}>
          <Text style={styles.trackerTitle}>Reading tracker</Text>
          <Text style={styles.trackerPct}>{stats.readPct}% read</Text>
        </View>
        <View style={styles.trackerStats}>
          <View><Text style={styles.trackerNum}>{stats.total}</Text><Text style={styles.trackerLabel}>Total</Text></View>
          <View><Text style={[styles.trackerNum, { color: colors.maroon }]}>{stats.reading}</Text><Text style={styles.trackerLabel}>Reading</Text></View>
          <View><Text style={[styles.trackerNum, { color: colors.teal }]}>{stats.read}</Text><Text style={styles.trackerLabel}>Read</Text></View>
          <View><Text style={[styles.trackerNum, { color: colors.textFaint }]}>{stats.unread}</Text><Text style={styles.trackerLabel}>Unread</Text></View>
        </View>
        <View style={styles.trackerBar}>
          <View style={{ width: `${stats.readPct}%`, backgroundColor: colors.teal }} />
          <View style={{ width: `${stats.readingPct}%`, backgroundColor: colors.maroon }} />
        </View>
      </View>

      <View style={styles.hoursCard}>
        <View style={styles.hoursIcon}>
          <Ionicons name="time-outline" size={20} color={colors.coral} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.hoursLabel}>Hours read all-time</Text>
          <Text style={styles.hoursSub}>Across your whole library</Text>
        </View>
        <Text style={styles.hoursValue}>{HOURS_READ.all}</Text>
      </View>
      <View style={styles.hoursGrid}>
        <View style={styles.hoursGridItem}><Text style={styles.hoursGridNum}>{HOURS_READ.today}</Text><Text style={styles.hoursGridLabel}>Today</Text></View>
        <View style={styles.hoursGridItem}><Text style={styles.hoursGridNum}>{HOURS_READ.week}</Text><Text style={styles.hoursGridLabel}>Week</Text></View>
        <View style={styles.hoursGridItem}><Text style={styles.hoursGridNum}>{HOURS_READ.month}</Text><Text style={styles.hoursGridLabel}>Month</Text></View>
        <View style={styles.hoursGridItem}><Text style={styles.hoursGridNum}>{HOURS_READ.year}</Text><Text style={styles.hoursGridLabel}>Year</Text></View>
      </View>

      <View style={styles.actionsGrid}>
        <TouchableOpacity style={[styles.actionTile, { backgroundColor: colors.maroon }]} onPress={() => goTab('Scan')}>
          <Ionicons name="scan-outline" size={26} color={colors.white} />
          <View>
            <Text style={styles.actionTitle}>Scan a book</Text>
            <Text style={styles.actionSub}>Add by ISBN</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionTile, { backgroundColor: colors.teal }]} onPress={() => goTab('Library')}>
          <Ionicons name="library-outline" size={26} color={colors.white} />
          <View>
            <Text style={styles.actionTitle}>Browse</Text>
            <Text style={styles.actionSub}>{stats.total} books</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionTile, { backgroundColor: colors.yellow }]} onPress={() => goTab('Buddies')}>
          <Ionicons name="people-outline" size={26} color={colors.text} />
          <View>
            <Text style={[styles.actionTitle, { color: colors.text }]}>Buddies</Text>
            <Text style={[styles.actionSub, { color: colors.text, opacity: 0.7 }]}>{data.buddies.length} sharing</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionTile, { backgroundColor: colors.purple }]} onPress={() => goTab('Notes')}>
          <Ionicons name="document-text-outline" size={26} color={colors.white} />
          <View>
            <Text style={styles.actionTitle}>Notes</Text>
            <Text style={styles.actionSub}>{data.notes.length} saved</Text>
          </View>
        </TouchableOpacity>
      </View>

      {upNext.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Up next</Text>
          {upNext.map((b) => (
            <TouchableOpacity key={b.id} style={styles.upNextRow} onPress={() => navigation.navigate('BookDetail', { bookId: b.id })}>
              <View style={styles.upNextCover}>
                {b.cover_url ? <Image source={{ uri: b.cover_url }} style={styles.upNextCoverImg} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.upNextTitle}>{b.title}</Text>
                <Text style={styles.upNextAuthor}>{b.author}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
            </TouchableOpacity>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  profileRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  logoutBtn: {
    width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.card,
    borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.maroon, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontWeight: '700', fontSize: 20 },
  welcome: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  name: { fontSize: 24, fontWeight: '700', color: colors.text, letterSpacing: -0.5, lineHeight: 26 },
  profileLink: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  profileLinkText: { fontSize: 12, color: colors.maroon, fontWeight: '700' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card,
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.lg, padding: 12, marginTop: 16,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  searchResults: {
    backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radii.xl, marginTop: 4, overflow: 'hidden',
  },
  emptySearch: { padding: 18, textAlign: 'center', fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  searchCover: { width: 36, height: 52, borderRadius: 6, backgroundColor: colors.chipBg, overflow: 'hidden' },
  searchCoverImg: { width: '100%', height: '100%' },
  searchTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  searchMeta: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  shelfChip: {
    flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.pinkBg,
    paddingHorizontal: 13, paddingVertical: 8, borderRadius: radii.md,
  },
  shelfChipText: { fontSize: 13, fontWeight: '700', color: colors.maroon },
  shelfChipCount: { backgroundColor: colors.white, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 1 },
  shelfChipCountText: { fontSize: 11, color: colors.maroon },
  streakCard: {
    marginTop: 18, backgroundColor: colors.dark, borderRadius: radii.xxl, padding: 18,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  streakLabel: { fontSize: 13, color: colors.textFaint, fontWeight: '500' },
  streakValue: { fontSize: 26, fontWeight: '700', color: colors.white, marginTop: 2 },
  trackerCard: {
    marginTop: 14, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radii.xxl, padding: 18,
  },
  trackerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  trackerTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  trackerPct: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  trackerStats: { flexDirection: 'row', gap: 18, marginTop: 14 },
  trackerNum: { fontSize: 26, fontWeight: '700', color: colors.text, lineHeight: 28 },
  trackerLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600', marginTop: 4 },
  trackerBar: { flexDirection: 'row', height: 7, borderRadius: 4, overflow: 'hidden', marginTop: 14, backgroundColor: colors.chipBg },
  hoursCard: {
    marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 11,
    backgroundColor: colors.dark, borderRadius: radii.xl, padding: 16,
  },
  hoursIcon: { width: 40, height: 40, borderRadius: radii.md, backgroundColor: 'rgba(255,122,92,0.22)', alignItems: 'center', justifyContent: 'center' },
  hoursLabel: { fontSize: 12, color: colors.textFaint, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  hoursSub: { fontSize: 12, color: '#8c8378', fontWeight: '600', marginTop: 2 },
  hoursValue: { fontSize: 24, fontWeight: '700', color: colors.white },
  hoursGrid: { flexDirection: 'row', gap: 8, marginTop: 10 },
  hoursGridItem: { flex: 1, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: 13, paddingVertical: 12, alignItems: 'center' },
  hoursGridNum: { fontSize: 15, fontWeight: '700', color: colors.text },
  hoursGridLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '700', marginTop: 5, textTransform: 'uppercase', letterSpacing: 0.4 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 18 },
  actionTile: { width: '47%', borderRadius: radii.xl, padding: 18, minHeight: 120, justifyContent: 'space-between' },
  actionTitle: { fontSize: 17, fontWeight: '700', color: colors.white },
  actionSub: { fontSize: 12, color: colors.white, opacity: 0.85, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 24, marginBottom: 12 },
  upNextRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card,
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.lg, padding: 12, marginBottom: 12,
  },
  upNextCover: { width: 46, height: 66, borderRadius: 7, backgroundColor: colors.chipBg, overflow: 'hidden' },
  upNextCoverImg: { width: '100%', height: '100%' },
  upNextTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  upNextAuthor: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
});
