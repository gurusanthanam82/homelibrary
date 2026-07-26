import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Ionicons name="person" size={48} color="#4f46e5" />
      </View>
      <Text style={styles.email}>{session?.user.email}</Text>

      <View style={styles.section}>
        <TouchableOpacity style={styles.row} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.rowTextDanger}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', padding: 24 },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginTop: 20, marginBottom: 12,
  },
  email: { textAlign: 'center', fontSize: 16, color: '#555', marginBottom: 32 },
  section: {
    backgroundColor: '#fff', borderRadius: 12,
    overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  rowText: { fontSize: 15, color: '#111' },
  rowTextDanger: { fontSize: 15, color: '#ef4444' },
});
