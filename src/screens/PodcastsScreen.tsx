import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Modal, Linking, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, radii } from '../theme';
import { useAppData } from '../contexts/AppDataContext';

export default function PodcastsScreen() {
  const navigation = useNavigation();
  const { data, addPodcast, removePodcast } = useAppData();
  const [query, setQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [channel, setChannel] = useState('');
  const [genre, setGenre] = useState('');
  const [topic, setTopic] = useState('');
  const [host, setHost] = useState('');
  const [guest, setGuest] = useState('');
  const [url, setUrl] = useState('');

  const q = query.toLowerCase();
  const filtered = data.podcasts.filter((p) => p.title.toLowerCase().includes(q) || p.channel.toLowerCase().includes(q));

  const groups = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    filtered.forEach((p) => {
      const key = p.genre || 'Other';
      map.set(key, [...(map.get(key) ?? []), p]);
    });
    return Array.from(map.entries());
  }, [filtered]);

  function save() {
    if (!title.trim()) return;
    addPodcast({ title, channel, genre: genre || 'Other', topic, interviewer: host, interviewee: guest, url });
    setTitle(''); setChannel(''); setGenre(''); setTopic(''); setHost(''); setGuest(''); setUrl('');
    setAddOpen(false);
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Podcasts</Text>
            <Text style={styles.subtitle}>Grouped by genre</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setAddOpen(true)}>
            <Ionicons name="add" size={14} color={colors.white} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput style={styles.searchInput} placeholder="Search podcasts…" placeholderTextColor={colors.textMuted} value={query} onChangeText={setQuery} />
        </View>

        {groups.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="mic-outline" size={48} color={colors.textFaint} />
            <Text style={styles.emptyText}>No podcasts yet</Text>
          </View>
        )}

        {groups.map(([genreName, items]) => (
          <View key={genreName} style={{ marginTop: 22 }}>
            <Text style={styles.groupLabel}>{genreName}</Text>
            {items.map((pod) => (
              <View key={pod.id} style={styles.podCard}>
                <View style={styles.podHeader}>
                  <View style={styles.podIcon}><Ionicons name="mic-outline" size={20} color={colors.maroon} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.podTitle}>{pod.title}</Text>
                    <Text style={styles.podChannel}>{pod.channel}</Text>
                  </View>
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removePodcast(pod.id)}>
                    <Ionicons name="close" size={13} color={colors.maroon} />
                  </TouchableOpacity>
                </View>
                {(pod.topic || pod.interviewer || pod.interviewee) && (
                  <View style={styles.podMetaGrid}>
                    {pod.topic ? <Text style={styles.podMeta}><Text style={styles.podMetaKey}>Topic</Text> · {pod.topic}</Text> : null}
                    {pod.interviewer ? <Text style={styles.podMeta}><Text style={styles.podMetaKey}>Host</Text> · {pod.interviewer}</Text> : null}
                    {pod.interviewee ? <Text style={styles.podMeta}><Text style={styles.podMetaKey}>Guest</Text> · {pod.interviewee}</Text> : null}
                  </View>
                )}
                {pod.url ? (
                  <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL(pod.url)}>
                    <Ionicons name="link-outline" size={12} color={colors.maroon} />
                    <Text style={styles.linkText} numberOfLines={1}>{pod.url}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      <Modal visible={addOpen} transparent animationType="slide" onRequestClose={() => setAddOpen(false)}>
        <View style={styles.modalScrim}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalSheet}>
              <View style={styles.handle} />
              <View style={styles.modalHeader}>
                <Text style={styles.sheetTitle}>Add podcast</Text>
                <TouchableOpacity style={styles.saveBtn} onPress={save}><Text style={styles.saveBtnText}>Save</Text></TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={{ gap: 12 }}>
                <TextInput style={styles.input} placeholder="Episode title" placeholderTextColor={colors.textFaint} value={title} onChangeText={setTitle} />
                <TextInput style={styles.input} placeholder="Channel" placeholderTextColor={colors.textFaint} value={channel} onChangeText={setChannel} />
                <TextInput style={styles.input} placeholder="Genre" placeholderTextColor={colors.textFaint} value={genre} onChangeText={setGenre} />
                <TextInput style={styles.input} placeholder="Topic" placeholderTextColor={colors.textFaint} value={topic} onChangeText={setTopic} />
                <TextInput style={styles.input} placeholder="Host" placeholderTextColor={colors.textFaint} value={host} onChangeText={setHost} />
                <TextInput style={styles.input} placeholder="Guest" placeholderTextColor={colors.textFaint} value={guest} onChangeText={setGuest} />
                <TextInput style={styles.input} placeholder="Episode URL" placeholderTextColor={colors.textFaint} value={url} onChangeText={setUrl} autoCapitalize="none" />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.maroon, paddingHorizontal: 13, paddingVertical: 9, borderRadius: radii.md },
  addBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, padding: 10, marginTop: 12 },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  empty: { alignItems: 'center', paddingTop: 60, gap: 6 },
  emptyText: { fontSize: 16, fontWeight: '700', color: colors.textMuted },
  groupLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  podCard: { backgroundColor: colors.bgAlt, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.lg, padding: 14, marginBottom: 10 },
  podHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  podIcon: { width: 40, height: 40, borderRadius: radii.md, backgroundColor: colors.pinkBg, borderWidth: 1, borderColor: colors.pinkBorder, alignItems: 'center', justifyContent: 'center' },
  podTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  podChannel: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 2 },
  removeBtn: { width: 28, height: 28, borderRadius: radii.sm, backgroundColor: '#fff0ee', alignItems: 'center', justifyContent: 'center' },
  podMetaGrid: { marginTop: 10, gap: 4 },
  podMeta: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  podMetaKey: { color: colors.textFaint },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: colors.pinkBg, borderWidth: 1, borderColor: colors.pinkBorder, paddingHorizontal: 11, paddingVertical: 8, borderRadius: radii.sm },
  linkText: { fontSize: 12, fontWeight: '700', color: colors.maroon, flex: 1 },
  modalScrim: { flex: 1, backgroundColor: 'rgba(27,23,20,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.bg, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, padding: 20, paddingBottom: 30, maxHeight: '85%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  saveBtn: { backgroundColor: colors.maroon, paddingHorizontal: 16, paddingVertical: 9, borderRadius: radii.md },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, padding: 13, fontSize: 14, color: colors.text, backgroundColor: colors.card },
});
