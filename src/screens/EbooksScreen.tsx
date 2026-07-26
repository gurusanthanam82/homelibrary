import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radii, buddyColors } from '../theme';
import { useAppData } from '../contexts/AppDataContext';
import type { LibraryStackParamList } from '../types';

type Nav = NativeStackNavigationProp<LibraryStackParamList>;

function fmtSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function EbooksScreen() {
  const navigation = useNavigation<Nav>();
  const { data, addEbook } = useAppData();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [pending, setPending] = useState<{ name: string; size: string; uri: string; format: 'PDF' | 'EPUB' | 'MOBI' } | null>(null);
  const [bookTitle, setBookTitle] = useState('');

  async function handleUpload() {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'application/epub+zip', '*/*'] });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const ext = (asset.name.split('.').pop() ?? 'pdf').toUpperCase();
    const format: 'PDF' | 'EPUB' | 'MOBI' = ext === 'EPUB' ? 'EPUB' : ext === 'MOBI' ? 'MOBI' : 'PDF';
    setPending({ name: asset.name, size: fmtSize(asset.size), uri: asset.uri, format });
    setBookTitle(asset.name.replace(/\.[^.]+$/, ''));
    setConfirmOpen(true);
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
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
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
          <TouchableOpacity style={styles.manualBtn} onPress={() => setManualOpen(true)}>
            <Ionicons name="add" size={14} color={colors.text} />
            <Text style={styles.manualBtnText}>Add manually</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload}>
            <Ionicons name="cloud-upload-outline" size={14} color={colors.white} />
            <Text style={styles.uploadBtnText}>Upload & add</Text>
          </TouchableOpacity>
        </View>

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
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={confirmOpen} transparent animationType="slide" onRequestClose={() => setConfirmOpen(false)}>
        <View style={styles.modalScrim}>
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
        </View>
      </Modal>

      <Modal visible={manualOpen} transparent animationType="slide" onRequestClose={() => setManualOpen(false)}>
        <View style={styles.modalScrim}>
          <View style={styles.modalSheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Add e-book manually</Text>
            <Text style={styles.fieldLabel}>Book title</Text>
            <TextInput style={styles.input} value={bookTitle} onChangeText={setBookTitle} placeholder="Book title" placeholderTextColor={colors.textFaint} />
            <TouchableOpacity
              style={styles.bigBtn}
              onPress={() => {
                if (!bookTitle.trim()) { Alert.alert('Title required'); return; }
                addEbook({ name: `${bookTitle}.pdf`, bookTitle, format: 'PDF', size: '—', color: buddyColors[data.ebooks.length % buddyColors.length], content: '' });
                setBookTitle('');
                setManualOpen(false);
              }}
            >
              <Text style={styles.bigBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
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
  manualBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.chipBg, padding: 12, borderRadius: radii.md },
  manualBtnText: { fontSize: 13, fontWeight: '700', color: colors.text },
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
  modalScrim: { flex: 1, backgroundColor: 'rgba(27,23,20,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.bg, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, padding: 20, paddingBottom: 30 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  saveBtn: { backgroundColor: colors.maroon, paddingHorizontal: 16, paddingVertical: 9, borderRadius: radii.md },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 4 },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, padding: 13, fontSize: 15, color: colors.text, backgroundColor: colors.card },
  bigBtn: { marginTop: 16, backgroundColor: colors.maroon, padding: 16, borderRadius: radii.md, alignItems: 'center' },
  bigBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
