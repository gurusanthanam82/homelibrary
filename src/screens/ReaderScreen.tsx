import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii } from '../theme';
import { useAppData } from '../contexts/AppDataContext';
import type { LibraryStackParamList } from '../types';

type Route = RouteProp<LibraryStackParamList, 'Reader'>;
const PAGE_SIZE = 1200;

export default function ReaderScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { data } = useAppData();
  const insets = useSafeAreaInsets();
  const ebook = data.ebooks.find((e) => e.id === route.params.ebookId);
  const [page, setPage] = useState(0);

  const pages = useMemo(() => {
    const text = ebook?.content || 'No preview available for this file type.';
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += PAGE_SIZE) chunks.push(text.slice(i, i + PAGE_SIZE));
    return chunks.length ? chunks : [text];
  }, [ebook]);

  if (!ebook) return null;
  const progress = Math.round(((page + 1) / pages.length) * 100);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={18} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.title} numberOfLines={1}>{ebook.bookTitle}</Text>
          <Text style={styles.subtitle}>{ebook.format} · p.{page + 1} of {pages.length}</Text>
        </View>
        <View style={styles.progressBadge}><Text style={styles.progressBadgeText}>{progress}%</Text></View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 22 }}>
        <Text style={styles.body}>{pages[page]}</Text>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.prevBtn} disabled={page === 0} onPress={() => setPage((p) => Math.max(0, p - 1))}>
            <Ionicons name="chevron-back" size={16} color={colors.text} />
            <Text style={styles.prevBtnText}>Prev</Text>
          </TouchableOpacity>
          <Text style={styles.pageIndicator}>{page + 1} / {pages.length}</Text>
          <TouchableOpacity style={styles.nextBtn} disabled={page === pages.length - 1} onPress={() => setPage((p) => Math.min(pages.length - 1, p + 1))}>
            <Text style={styles.nextBtnText}>Next</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgAlt },
  header: { paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, borderRadius: radii.md, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 11, color: colors.textMuted, fontWeight: '600', marginTop: 1 },
  progressBadge: { backgroundColor: colors.pinkBg, borderWidth: 1, borderColor: colors.pinkBorder, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  progressBadgeText: { fontSize: 11, fontWeight: '700', color: colors.maroon },
  body: { fontSize: 15, lineHeight: 26, color: colors.textSoft },
  footer: { borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bgAlt },
  progressTrack: { height: 3, backgroundColor: colors.pinkBg },
  progressFill: { height: '100%', backgroundColor: colors.maroon },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  prevBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radii.md, backgroundColor: colors.chipBg },
  prevBtnText: { fontSize: 13, fontWeight: '700', color: colors.text },
  pageIndicator: { fontSize: 12, color: colors.textMuted, fontWeight: '700' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radii.md, backgroundColor: colors.maroon },
  nextBtnText: { fontSize: 13, fontWeight: '700', color: colors.white },
});
