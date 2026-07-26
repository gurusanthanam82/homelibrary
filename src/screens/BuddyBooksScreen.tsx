import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, radii } from '../theme';
import { useAppData } from '../contexts/AppDataContext';

export default function BuddyBooksScreen() {
  const navigation = useNavigation();
  const { data } = useAppData();
  const sharing = data.buddies.filter((b) => !b.blocked && b.hasSharedShelf);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Buddies' Books</Text>
          <Text style={styles.subtitle}>{sharing.length} buddies sharing their shelf</Text>
        </View>
      </View>

      {sharing.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="albums-outline" size={48} color={colors.textFaint} />
          <Text style={styles.emptyText}>No shared shelves yet</Text>
          <Text style={styles.emptySub}>Ask a buddy to turn on shelf sharing from their profile</Text>
        </View>
      ) : (
        sharing.map((b) => (
          <View key={b.id} style={styles.group}>
            <View style={styles.groupHeader}>
              <View style={[styles.avatar, { backgroundColor: b.color }]}><Text style={styles.avatarText}>{b.name.charAt(0)}</Text></View>
              <Text style={styles.groupName}>{b.name}</Text>
              <View style={styles.countBadge}><Text style={styles.countBadgeText}>{b.shared}</Text></View>
            </View>
            <Text style={styles.emptySub}>Their book list will appear here once shelf sync is connected.</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 1 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 6 },
  emptyText: { fontSize: 16, fontWeight: '700', color: colors.textMuted },
  emptySub: { fontSize: 12, color: colors.textFaint, fontWeight: '600', textAlign: 'center', maxWidth: 240 },
  group: { marginTop: 22 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  groupName: { fontSize: 14, fontWeight: '700', color: colors.text },
  countBadge: { backgroundColor: colors.chipBg, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  countBadgeText: { fontSize: 12, color: colors.textMuted, fontWeight: '700' },
});
