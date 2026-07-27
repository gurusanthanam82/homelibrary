import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, buddyColors } from '../theme';
import { useAppData } from '../contexts/AppDataContext';
import type { LibraryStackParamList } from '../types';

type Nav = NativeStackNavigationProp<LibraryStackParamList>;

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function fmtSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function EbooksScreen() {
  const navigation = useNavigation<Nav>();
  const { data, addEbook, removeEbook } = useAppData();
  const insets = useSafeAreaInsets();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState<{ name: string; size: string; uri: string; format: 'PDF' | 'EPUB' | 'MOBI' } | null>(null);
  const [bookTitle, setBookTitle] = useState('');

  async function handleUpload() {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'application/epub+zip', '*/*'] });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    if (asset.size && asset.size > MAX_UPLOAD_BYTES) {
      Alert.alert('File too large', `"${asset.name}" is ${fmtSize(asset.size)}. Please choose a file under 5 MB.`);
      return;
    }
    const ext = (asset.name.split('.').pop() ?? 'pdf').toUpperCase();
    const format: 'PDF' | 'EPUB' | 'MOBI' = ext === 'EPUB' ? 'EPUB' : ext === 'MOBI' ? 'MOBI' : 'PDF';
    setPending({ name: asset.name, size: fmtSize(asset.size), uri: asset.uri, format });
    setBookTitle(asset.name.replace(/\.[^.]+$/, ''));
    setConfirmOpen(true);
  }

  function confirmDelete(id: string, name: string) {
    Alert.alert('Remove e-book', `Remove "${name}" from your library?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeEbook(id) },
    ]);
  }

  async function saveEbook() {
    if (!pending) return;
    let content = '';
    try {
      content = await FileSystem.readAsStringAsync(pending.uri, { encoding: 'utf8' as any });
    } catch {
      content = '(Binary file — preview not available in the built-in reader.)';
    }
    addEbook({
      name: pending.name,
      bookTitle: bookTitle || pending.name,
      format: pending.format,
      size: pending.size,
      color: buddyColors[data.ebooks.length % buddyColors.length],
      content: content.slice(0, 20000),
    });
    setConfirmOpen(false);
    setPending(null);
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 16, paddingBottom: 40 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>E-Book Library</Text>
            <Text style={styles.subtitle}>PDF & ePub files from your device</Text>
          </View>
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity style={[styles.uploadBtn, { flex: 1 }]} onPress={handleUpload}>
            <Ionicons name="cloud-upload-outline" size={14} color={colors.white} />
            <Text style={styles.uploadBtnText}>Upload & add</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sizeLimitText}>Max file size: 5 MB</Text>

        {data.ebooks.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><Ionicons name="document-outline" size={32} color={colors.maroon} /></View>
            <Text style={styles.emptyTitle}>No e-books yet</Text>
            <Text style={styles.emptySub}>Upload a PDF or ePub from your device</Text>
          </View>
        ) : (
          data.ebooks.map((ef) => (
            <TouchableOpacity key={ef.id} style={styles.row} onPress={() => (navigation as any).navigate('Reader', { ebookId: ef.id })}>
              <View style={[styles.fileIcon, { backgroundColor: ef.color }]}><Text style={styles.fileIconText}>{ef.format}</Text></View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.fileName} numberOfLines={1}>{ef.name}</Text>
                <Text style={styles.fileMeta}>{ef.bookTitle} · {ef.size}</Text>
              </View>
              <View style={styles.readBtn}><Text style={styles.readBtnText}>Read</Text></View>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmDelete(ef.id, ef.name)}>
                <Ionicons name="trash-outline" size={16} color={colors.maroon} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={confirmOpen} transparent animationType="slide" onRequestClose={() => setConfirmOpen(false)}>
        <View style={styles.modalScrim}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalSheet}>
              <View style={styles.handle} />
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetTitle}>Add E-Book</Text>
                  <Text style={styles.subtitle} numberOfLines={1}>{pending?.name} · {pending?.size}</Text>
                </View>
                <TouchableOpacity style={styles.saveBtn} onPress={saveEbook}><Text style={styles.saveBtnText}>Save</Text></TouchableOpacity>
              </View>
              <Text style={styles.fieldLabel}>Book title</Text>
              <TextInput style={styles.input} value={bookTitle} onChangeText={setBookTitle} placeholder="Book title" placeholderTextColor={colors.textFaint} />
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
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  uploadBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.maroon, padding: 12, borderRadius: radii.md },
  uploadBtnText: { fontSize: 13, fontWeight: '700', color: colors.white },
  empty: { alignItems: 'center', paddingTop: 60, gap: 6 },
  emptyIcon: { width: 72, height: 72, borderRadius: radii.xl, backgroundColor: colors.pinkBg, borderWidth: 1.5, borderColor: colors.pinkBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: 13, color: colors.textMuted, fontWeight: '600', textAlign: 'center', maxWidth: 220 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  fileIcon: { width: 42, height: 52, borderRadius: 9, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 5 },
  fileIconText: { fontSize: 8, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  fileName: { fontSize: 14, fontWeight: '700', color: colors.text },
  fileMeta: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 2 },
  readBtn: { backgroundColor: colors.pinkBg, borderWidth: 1, borderColor: colors.pinkBorder, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9 },
  readBtnText: { fontSize: 11, fontWeight: '700', color: colors.maroon },
  deleteBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#fff0ee', alignItems: 'center', justifyContent: 'center' },
  sizeLimitText: { fontSize: 11, color: colors.textFaint, fontWeight: '600', marginTop: 8, textAlign: 'center' },
  modalScrim: { flex: 1, backgroundColor: 'rgba(27,23,20,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.bg, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, padding: 20, paddingBottom: 30 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  saveBtn: { backgroundColor: colors.maroon, paddingHorizontal: 16, paddingVertical: 9, borderRadius: radii.md },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 4 },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, padding: 13, fontSize: 15, color: colors.text, backgroundColor: colors.card },
});
