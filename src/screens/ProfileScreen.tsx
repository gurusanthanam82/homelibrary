import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors, radii } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../contexts/AppDataContext';
import { deleteAllBooks } from '../services/books';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { session, signOut } = useAuth();
  const { data, updateProfile, toggleShelfSharing, resetAllData } = useAppData();
  const [resetting, setResetting] = useState(false);
  const insets = useSafeAreaInsets();
  const [shareAll, setShareAll] = useState(false);
  const [name, setName] = useState(data.profile.name);
  const [email, setEmail] = useState(data.profile.email || session?.user.email || '');
  const [phone, setPhone] = useState(data.profile.phone);
  const [location, setLocation] = useState(data.profile.location);
  const [favGenre, setFavGenre] = useState(data.profile.favGenre);
  const [goal, setGoal] = useState(data.profile.goal);
  const [bio, setBio] = useState(data.profile.bio);
  const [photoUrl, setPhotoUrl] = useState(data.profile.photoUrl);

  function save() {
    updateProfile({ name, email, phone, location, favGenre, goal, bio });
    navigation.goBack();
  }

  async function pickFromLibrary() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photo access needed', 'Enable photo library access to choose a profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled && result.assets[0]) {
      setPhotoUrl(result.assets[0].uri);
      updateProfile({ photoUrl: result.assets[0].uri });
    }
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera access needed', 'Enable camera access to take a profile photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled && result.assets[0]) {
      setPhotoUrl(result.assets[0].uri);
      updateProfile({ photoUrl: result.assets[0].uri });
    }
  }

  function handlePickPhoto() {
    Alert.alert('Profile photo', 'Choose a photo', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Library', onPress: pickFromLibrary },
    ]);
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }

  function handleClearSampleData() {
    Alert.alert(
      'Clear all data',
      'This permanently deletes every book, buddy, note, podcast, and e-book so you can start testing from a clean slate. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: async () => {
            if (!session) return;
            setResetting(true);
            try {
              await deleteAllBooks(session.user.id);
              resetAllData();
              Alert.alert('Done', 'All sample data has been removed.');
            } catch (e: any) {
              Alert.alert('Error', e.message);
            } finally {
              setResetting(false);
            }
          },
        },
      ]
    );
  }

  const initial = (name || session?.user.email || 'R').charAt(0).toUpperCase();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
    <ScrollView style={styles.container} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.avatarCol}>
        <TouchableOpacity style={styles.avatar} onPress={handlePickPhoto}>
          {photoUrl ? <Image source={{ uri: photoUrl }} style={styles.avatarImg} /> : <Text style={styles.avatarText}>{initial}</Text>}
          <View style={styles.avatarEditBadge}>
            <Ionicons name="camera" size={13} color={colors.white} />
          </View>
        </TouchableOpacity>
        <Text style={styles.title}>My profile</Text>
        <Text style={styles.subtitle}>Reader since {data.profile.since}</Text>
      </View>

      <View style={{ gap: 14, marginTop: 22 }}>
        <View><Text style={styles.label}>Name</Text><TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.textFaint} /></View>
        <View><Text style={styles.label}>Email</Text><TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@email.com" placeholderTextColor={colors.textFaint} autoCapitalize="none" /></View>
        <View style={styles.row}>
          <View style={{ flex: 1 }}><Text style={styles.label}>Phone</Text><TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Optional" placeholderTextColor={colors.textFaint} /></View>
          <View style={{ flex: 1 }}><Text style={styles.label}>Location</Text><TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="City" placeholderTextColor={colors.textFaint} /></View>
        </View>
        <View style={styles.row}>
          <View style={{ flex: 1 }}><Text style={styles.label}>Favorite genre</Text><TextInput style={styles.input} value={favGenre} onChangeText={setFavGenre} placeholder="Fiction" placeholderTextColor={colors.textFaint} /></View>
          <View style={{ flex: 1 }}><Text style={styles.label}>Books/year goal</Text><TextInput style={styles.input} value={goal} onChangeText={setGoal} placeholder="24" placeholderTextColor={colors.textFaint} keyboardType="numeric" /></View>
        </View>
        <View>
          <Text style={styles.label}>About me</Text>
          <TextInput style={[styles.input, styles.textarea]} value={bio} onChangeText={setBio} placeholder="A line about your reading taste…" placeholderTextColor={colors.textFaint} multiline />
        </View>
      </View>

      <View style={styles.sharingSection}>
        <Text style={styles.sharingTitle}>Shelf sharing</Text>
        <Text style={styles.sharingSub}>Choose who can browse your shelves</Text>
        <View style={styles.sharingRow}>
          <View style={styles.sharingAvatar}><Ionicons name="people-outline" size={16} color={colors.white} /></View>
          <Text style={styles.sharingName}>All buddies</Text>
          <TouchableOpacity style={[styles.toggle, shareAll && styles.toggleOn]} onPress={() => setShareAll((v) => !v)}>
            <View style={[styles.toggleDot, shareAll && styles.toggleDotOn]} />
          </TouchableOpacity>
        </View>
        {data.buddies.filter((b) => !b.blocked).map((b) => (
          <View key={b.id} style={styles.sharingRowThin}>
            <View style={[styles.sharingAvatar, { backgroundColor: b.color }]}><Text style={styles.sharingAvatarText}>{b.name.charAt(0)}</Text></View>
            <Text style={styles.sharingName}>{b.name}</Text>
            <TouchableOpacity style={[styles.toggle, b.hasSharedShelf && styles.toggleOn]} onPress={() => toggleShelfSharing(b.id)}>
              <View style={[styles.toggleDot, b.hasSharedShelf && styles.toggleDotOn]} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={save}>
        <Text style={styles.saveBtnText}>Save profile</Text>
      </TouchableOpacity>

      <View style={styles.dangerSection}>
        <Text style={styles.dangerTitle}>Danger zone</Text>
        <Text style={styles.dangerSub}>Remove every book, buddy, note, podcast and e-book to start testing fresh.</Text>
        <TouchableOpacity style={styles.dangerBtn} onPress={handleClearSampleData} disabled={resetting}>
          {resetting ? <ActivityIndicator size="small" color={colors.maroon} /> : (
            <>
              <Ionicons name="trash-outline" size={16} color={colors.maroon} />
              <Text style={styles.dangerBtnText}>Clear all data</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={18} color={colors.maroon} />
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerRow: { flexDirection: 'row' },
  backBtn: { width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  avatarCol: { alignItems: 'center', marginTop: 8, gap: 4 },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.maroon, alignItems: 'center', justifyContent: 'center', marginBottom: 6, overflow: 'visible' },
  avatarImg: { width: 84, height: 84, borderRadius: 42 },
  avatarText: { color: colors.white, fontWeight: '700', fontSize: 34 },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: -2, width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.bg,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  label: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, padding: 12, fontSize: 15, color: colors.text, backgroundColor: colors.card },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  sharingSection: { marginTop: 22, borderTopWidth: 1.5, borderTopColor: colors.border, paddingTop: 18 },
  sharingTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  sharingSub: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 2, marginBottom: 12 },
  sharingRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 9, borderBottomWidth: 2, borderBottomColor: colors.divider, marginBottom: 4 },
  sharingRowThin: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  sharingAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.maroon, alignItems: 'center', justifyContent: 'center' },
  sharingAvatarText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  sharingName: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: colors.chipBg, padding: 3, justifyContent: 'center' },
  toggleOn: { backgroundColor: colors.maroon },
  toggleDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.white, alignSelf: 'flex-start' },
  toggleDotOn: { alignSelf: 'flex-end' },
  saveBtn: { marginTop: 22, backgroundColor: colors.maroon, padding: 15, borderRadius: radii.lg, alignItems: 'center' },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, padding: 12 },
  signOutText: { color: colors.maroon, fontWeight: '700', fontSize: 14 },
  dangerSection: { marginTop: 24, borderWidth: 1.5, borderColor: colors.pinkBorder, backgroundColor: colors.pinkBg, borderRadius: radii.lg, padding: 16 },
  dangerTitle: { fontSize: 13, fontWeight: '700', color: colors.maroon, textTransform: 'uppercase', letterSpacing: 0.5 },
  dangerSub: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 4, lineHeight: 17 },
  dangerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.maroon, borderRadius: radii.md, padding: 12, marginTop: 12 },
  dangerBtnText: { color: colors.maroon, fontWeight: '700', fontSize: 14 },
});
