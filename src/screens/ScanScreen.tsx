import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, radii } from '../theme';
import { searchBooksByISBN } from '../services/books';
import type { Book } from '../types';

export default function ScanScreen() {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [found, setFound] = useState<Partial<Book> | null>(null);
  const [notFoundIsbn, setNotFoundIsbn] = useState<string | null>(null);

  function goHome() {
    (navigation as any).navigate('Home');
  }

  async function handleBarcode({ data }: { data: string }) {
    if (scanned) return;
    setScanned(true);
    setLoading(true);
    try {
      const result = await searchBooksByISBN(data);
      if (result) {
        setFound({ ...result, isbn: data });
      } else {
        setNotFoundIsbn(data);
      }
    } catch {
      setNotFoundIsbn(data);
    } finally {
      setLoading(false);
    }
  }

  function rescan() {
    setScanned(false);
    setFound(null);
    setNotFoundIsbn(null);
  }

  function addConfirm() {
    (navigation as any).navigate('Library', {
      screen: 'AddBook',
      params: found ? { isbn: found.isbn, prefill: found } : { isbn: notFoundIsbn ?? undefined },
    });
    rescan();
  }

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permText}>Camera access is needed to scan barcodes.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goHome} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.textFaint, fontWeight: '600' }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcode}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a'] }}
      />
      <View style={styles.scrim} />

      <TouchableOpacity style={styles.closeBtn} onPress={goHome}>
        <Ionicons name="close" size={20} color={colors.white} />
      </TouchableOpacity>

      {!found && !notFoundIsbn && (
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Scan the barcode</Text>
          <View style={styles.scanBox}>
            <View style={styles.scanLine} />
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <Text style={styles.hint}>{loading ? 'Looking up ISBN…' : 'Detecting ISBN…'}</Text>
          {loading && <ActivityIndicator style={{ marginTop: 10 }} color={colors.maroon} />}
        </View>
      )}

      {found && (
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.foundHeader}>
            <Ionicons name="checkmark-circle" size={18} color={colors.teal} />
            <Text style={styles.foundHeaderText}>Found it</Text>
          </View>
          <View style={styles.foundRow}>
            <View style={styles.foundCover}>
              {found.cover_url ? <Image source={{ uri: found.cover_url }} style={{ width: '100%', height: '100%' }} /> : (
                <Text style={styles.foundCoverText} numberOfLines={3}>{found.title}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.foundTitle}>{found.title}</Text>
              <Text style={styles.foundAuthor}>{found.author}</Text>
              {found.published_year ? <Text style={styles.foundMeta}>{found.published_year} · ISBN {found.isbn}</Text> : <Text style={styles.foundMeta}>ISBN {found.isbn}</Text>}
            </View>
          </View>
          <View style={styles.foundBtns}>
            <TouchableOpacity style={styles.rescanBtn} onPress={rescan}>
              <Text style={styles.rescanBtnText}>Rescan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={addConfirm}>
              <Text style={styles.addBtnText}>Add book</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {notFoundIsbn && (
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>No match found</Text>
          <Text style={styles.hint}>ISBN {notFoundIsbn} — add it manually instead.</Text>
          <View style={styles.foundBtns}>
            <TouchableOpacity style={styles.rescanBtn} onPress={rescan}>
              <Text style={styles.rescanBtnText}>Rescan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={addConfirm}>
              <Text style={styles.addBtnText}>Add manually</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(27,23,20,0.35)' },
  closeBtn: {
    position: 'absolute', top: 54, right: 20, width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center',
  },
  permText: { color: colors.white, fontSize: 16, textAlign: 'center', margin: 24 },
  permBtn: { backgroundColor: colors.maroon, borderRadius: radii.md, paddingHorizontal: 24, paddingVertical: 14 },
  permBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.bg,
    borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, padding: 20, paddingBottom: 30,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
  scanBox: {
    marginTop: 18, width: '100%', height: 200, borderRadius: 20, backgroundColor: colors.dark,
    overflow: 'hidden', justifyContent: 'center',
  },
  scanLine: { position: 'absolute', left: 30, right: 30, height: 2, top: '50%', backgroundColor: colors.maroon },
  corner: { position: 'absolute', width: 26, height: 26, borderColor: colors.coral },
  cornerTL: { top: 14, left: 14, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 },
  cornerTR: { top: 14, right: 14, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 },
  cornerBL: { bottom: 14, left: 14, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 14, right: 14, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 },
  hint: { textAlign: 'center', fontSize: 14, color: colors.textMuted, fontWeight: '600', marginTop: 16 },
  foundHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 14 },
  foundHeaderText: { color: colors.teal, fontSize: 14, fontWeight: '700' },
  foundRow: { flexDirection: 'row', gap: 16 },
  foundCover: {
    width: 84, height: 124, borderRadius: 9, backgroundColor: colors.maroon, padding: 8,
    justifyContent: 'flex-end', overflow: 'hidden',
  },
  foundCoverText: { color: colors.white, fontWeight: '700', fontSize: 12 },
  foundTitle: { fontSize: 19, fontWeight: '700', color: colors.text },
  foundAuthor: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  foundMeta: { marginTop: 10, fontSize: 12, color: colors.textMuted, fontWeight: '600', lineHeight: 18 },
  foundBtns: { flexDirection: 'row', gap: 12, marginTop: 22 },
  rescanBtn: { width: 120, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, padding: 16, borderRadius: radii.lg, alignItems: 'center' },
  rescanBtnText: { color: colors.text, fontWeight: '700', fontSize: 14 },
  addBtn: { flex: 1, backgroundColor: colors.maroon, padding: 16, borderRadius: radii.lg, alignItems: 'center' },
  addBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
