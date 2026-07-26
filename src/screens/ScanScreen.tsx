import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootNavParamList } from '../types';

type Nav = NativeStackNavigationProp<RootNavParamList>;

export default function ScanScreen() {
  const navigation = useNavigation<Nav>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera access is needed to scan barcodes.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function handleBarcode({ data }: { data: string }) {
    if (scanned) return;
    setScanned(true);
    (navigation as any).navigate('Library', {
      screen: 'AddBook',
      params: { isbn: data },
    });
    setTimeout(() => setScanned(false), 3000);
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcode}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a'] }}
      />
      <View style={styles.overlay}>
        <View style={styles.frame} />
        <Text style={styles.hint}>Point at a book's barcode</Text>
      </View>
      {scanned && (
        <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanned(false)}>
          <Text style={styles.rescanText}>Tap to scan again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  text: { color: '#fff', fontSize: 16, textAlign: 'center', margin: 24 },
  button: {
    backgroundColor: '#4f46e5', borderRadius: 10,
    paddingHorizontal: 24, paddingVertical: 14,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  overlay: { position: 'absolute', alignItems: 'center' },
  frame: {
    width: 260, height: 160, borderWidth: 2,
    borderColor: '#4f46e5', borderRadius: 12,
  },
  hint: { color: '#fff', marginTop: 16, fontSize: 14, opacity: 0.85 },
  rescanBtn: {
    position: 'absolute', bottom: 60,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  rescanText: { color: '#fff', fontSize: 14 },
});
