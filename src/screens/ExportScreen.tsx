import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, radii } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../contexts/AppDataContext';
import { getBooks } from '../services/books';
import type { Book } from '../types';

const COLUMNS = ['Title', 'Author', 'Genre', 'Language', 'Publisher', 'ISBN', 'Status', 'Shelf'];
const FREQS: Array<'Daily' | 'Weekly' | 'Monthly'> = ['Daily', 'Weekly', 'Monthly'];

function toCSV(books: Book[]) {
  const header = COLUMNS.join(',');
  const rows = books.map((b) =>
    [b.title, b.author, b.genre ?? '', b.language ?? '', b.publisher ?? '', b.isbn ?? '', b.status, b.shelf ?? '']
      .map((v) => `"${(v ?? '').toString().replace(/"/g, '""')}"`)
      .join(',')
  );
  return [header, ...rows].join('\n');
}

export default function ExportScreen() {
  const navigation = useNavigation();
  const { session } = useAuth();
  const { data, setDriveFolderUrl, setDriveFreq, backupNow, setEmailBackupEmail, setEmailBackupFreq, toggleEmailBackup, sendEmailBackupNow } = useAppData();
  const [books, setBooks] = useState<Book[]>([]);
  const [driveOpen, setDriveOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  useFocusEffect(useCallback(() => {
    if (session) getBooks(session.user.id).then(setBooks);
  }, [session]));

  async function exportCSV() {
    const csv = toCSV(books);
    const uri = FileSystem.cacheDirectory + 'home-library-export.csv';
    await FileSystem.writeAsStringAsync(uri, csv);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: 'Export library' });
    } else {
      Alert.alert('Saved', `CSV saved to ${uri}`);
    }
  }

  async function exportPDFPreview() {
    Alert.alert('PDF export', 'PDF export uses the same data as CSV — sharing as CSV for now since PDF generation needs a native print module.');
    exportCSV();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Export library</Text>
      </View>
      <Text style={styles.subtitle}>{books.length} books · every tag & attribute included</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Columns exported</Text>
        <View style={styles.chipRow}>
          {COLUMNS.map((c) => <View key={c} style={styles.colChip}><Text style={styles.colChipText}>{c}</Text></View>)}
        </View>
      </View>

      <TouchableOpacity style={styles.exportBtn} onPress={exportCSV}>
        <Ionicons name="grid-outline" size={24} color={colors.white} />
        <View style={{ flex: 1 }}>
          <Text style={styles.exportBtnTitle}>Export to Excel</Text>
          <Text style={styles.exportBtnSub}>.csv — opens in Excel or Google Sheets</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.white} />
      </TouchableOpacity>

      <TouchableOpacity style={[styles.exportBtn, { backgroundColor: colors.maroon, marginTop: 12 }]} onPress={exportPDFPreview}>
        <Ionicons name="document-text-outline" size={24} color={colors.white} />
        <View style={{ flex: 1 }}>
          <Text style={styles.exportBtnTitle}>Export to PDF</Text>
          <Text style={styles.exportBtnSub}>Printable table — all books, all columns</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.white} />
      </TouchableOpacity>

      <View style={styles.backupCard}>
        <View style={styles.backupRow}>
          <View style={styles.backupIcon}><Ionicons name="cloud-outline" size={20} color={colors.maroon} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.backupTitle}>Google Drive Backup</Text>
            <Text style={styles.backupSub}>Last: {data.driveLastBackup}</Text>
          </View>
          <TouchableOpacity style={styles.setupBtn} onPress={() => setDriveOpen(true)}><Text style={styles.setupBtnText}>Setup</Text></TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.backupNowBtn} onPress={() => { backupNow(); Alert.alert('Backed up', 'Books exported — save the file to Drive from the share sheet.'); exportCSV(); }}>
          <Text style={styles.backupNowBtnText}>Backup Now</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.backupCard}>
        <View style={styles.backupRow}>
          <View style={styles.backupIcon}><Ionicons name="mail-outline" size={20} color={colors.maroon} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.backupTitle}>Email Backup</Text>
            <Text style={styles.backupSub}>Last sent: {data.emailBackupLastSent}</Text>
          </View>
          <TouchableOpacity style={styles.setupBtn} onPress={() => setEmailOpen(true)}><Text style={styles.setupBtnText}>Setup</Text></TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.backupNowBtn} onPress={() => { sendEmailBackupNow(); exportCSV(); }}>
          <Text style={styles.backupNowBtnText}>Send Now</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={driveOpen} transparent animationType="slide" onRequestClose={() => setDriveOpen(false)}>
        <View style={styles.modalScrim}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setDriveOpen(false)} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalSheet}>
              <View style={styles.handle} />
              <Text style={styles.sheetTitle}>Google Drive Backup</Text>
              <Text style={styles.fieldLabel}>Google Drive Folder URL</Text>
              <TextInput style={styles.input} placeholder="https://drive.google.com/drive/folders/…" placeholderTextColor={colors.textFaint} value={data.driveFolderUrl} onChangeText={setDriveFolderUrl} />
              <Text style={styles.fieldLabel}>Auto-backup Frequency</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {FREQS.map((f) => (
                  <TouchableOpacity key={f} style={[styles.freqChip, data.driveFreq === f && styles.freqChipActive]} onPress={() => setDriveFreq(f)}>
                    <Text style={[styles.freqChipText, data.driveFreq === f && styles.freqChipTextActive]}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.bigBtn} onPress={() => { backupNow(); setDriveOpen(false); exportCSV(); }}>
                <Ionicons name="cloud-upload-outline" size={18} color={colors.white} />
                <Text style={styles.bigBtnText}>Backup All Books Now</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={emailOpen} transparent animationType="slide" onRequestClose={() => setEmailOpen(false)}>
        <View style={styles.modalScrim}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setEmailOpen(false)} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalSheet}>
              <View style={styles.handle} />
              <Text style={styles.sheetTitle}>Email Backup</Text>
              <Text style={styles.fieldLabel}>Delivery Email</Text>
              <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor={colors.textFaint} value={data.emailBackupEmail} onChangeText={setEmailBackupEmail} keyboardType="email-address" autoCapitalize="none" />
              <Text style={styles.fieldLabel}>Schedule</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                {FREQS.map((f) => (
                  <TouchableOpacity key={f} style={[styles.freqChip, data.emailBackupFreq === f && styles.freqChipActive]} onPress={() => setEmailBackupFreq(f)}>
                    <Text style={[styles.freqChipText, data.emailBackupFreq === f && styles.freqChipTextActive]}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.toggleRow}>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>Auto-send enabled</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600' }}>Send backup on schedule automatically</Text>
                </View>
                <TouchableOpacity style={[styles.toggle, data.emailBackupEnabled && styles.toggleOn]} onPress={toggleEmailBackup}>
                  <View style={[styles.toggleDot, data.emailBackupEnabled && styles.toggleDotOn]} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.bigBtn} onPress={() => { sendEmailBackupNow(); setEmailOpen(false); exportCSV(); }}>
                <Ionicons name="send-outline" size={18} color={colors.white} />
                <Text style={styles.bigBtnText}>Send Backup Now</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: colors.textMuted, fontWeight: '500', marginTop: 6 },
  card: { marginTop: 18, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.xl, padding: 18 },
  cardLabel: { fontSize: 11, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colChip: { backgroundColor: colors.pinkBg, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 11 },
  colChipText: { fontSize: 13, fontWeight: '700', color: colors.maroonDark },
  exportBtn: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.teal, borderRadius: radii.xl, padding: 16 },
  exportBtnTitle: { fontSize: 15, fontWeight: '700', color: colors.white },
  exportBtnSub: { fontSize: 12, color: colors.white, opacity: 0.85 },
  backupCard: { marginTop: 20, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.xl, padding: 16 },
  backupRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backupIcon: { width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.pinkBg, borderWidth: 1, borderColor: colors.pinkBorder, alignItems: 'center', justifyContent: 'center' },
  backupTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  backupSub: { fontSize: 11, color: colors.textMuted, fontWeight: '600', marginTop: 1 },
  setupBtn: { backgroundColor: colors.maroon, paddingHorizontal: 13, paddingVertical: 8, borderRadius: radii.sm },
  setupBtnText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  backupNowBtn: { marginTop: 10, backgroundColor: colors.dark, padding: 12, borderRadius: radii.md, alignItems: 'center' },
  backupNowBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  modalScrim: { flex: 1, backgroundColor: 'rgba(27,23,20,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.bg, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, padding: 20, paddingBottom: 30 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 16 },
  fieldLabel: { fontSize: 11, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, padding: 13, fontSize: 13, color: colors.text, backgroundColor: colors.card, marginBottom: 14 },
  freqChip: { flex: 1, alignItems: 'center', padding: 11, borderRadius: radii.md, backgroundColor: colors.chipBg },
  freqChipActive: { backgroundColor: colors.maroon },
  freqChipText: { fontSize: 13, fontWeight: '800', color: colors.text },
  freqChipTextActive: { color: colors.white },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.lg, padding: 14, marginTop: 14 },
  toggle: { width: 46, height: 26, borderRadius: 13, backgroundColor: colors.chipBg, padding: 3, justifyContent: 'center' },
  toggleOn: { backgroundColor: colors.maroon },
  toggleDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.white, alignSelf: 'flex-start' },
  toggleDotOn: { alignSelf: 'flex-end' },
  bigBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: colors.maroon, padding: 16, borderRadius: radii.md, marginTop: 18 },
  bigBtnText: { color: colors.white, fontWeight: '800', fontSize: 15 },
});
