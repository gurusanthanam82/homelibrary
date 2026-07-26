import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, fonts } from '../theme';
import { useAuth } from '../contexts/AuthContext';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [emailFlow, setEmailFlow] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email || !password) return;
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
        Alert.alert('Check your email', 'We sent you a confirmation link.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  if (emailFlow) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ height: 52, justifyContent: 'center' }}>
          <TouchableOpacity onPress={() => setEmailFlow(false)} style={styles.backRow}>
            <Ionicons name="chevron-back" size={20} color={colors.maroon} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.emailTitle}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</Text>
        <Text style={styles.emailSub}>
          {mode === 'login' ? 'Sign in to keep tracking your reads' : 'Start tracking your reading in seconds'}
        </Text>

        <View style={{ gap: 14, flex: 1 }}>
          {mode === 'signup' && (
            <View>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput style={styles.input} placeholder="Your name" placeholderTextColor={colors.textFaint} value={name} onChangeText={setName} />
            </View>
          )}
          <View>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.textFaint}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <View>
            <Text style={styles.fieldLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textFaint}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
        </View>

        <View style={{ paddingBottom: 30, gap: 14 }}>
          <TouchableOpacity style={[styles.primaryBtn, loading && styles.disabled]} onPress={handleSubmit} disabled={loading}>
            <Text style={styles.primaryBtnText}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create account'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
            <Text style={styles.toggleText}>
              {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ height: 46 }} />
      <View style={styles.hero}>
        <View style={styles.iconBadge}>
          <Ionicons name="library" size={38} color={colors.white} />
        </View>
        <Text style={styles.title}>Stacks</Text>
        <Text style={styles.subtitle}>Track every read, scan new books and share notes with your circle.</Text>
      </View>
      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.appleBtn}
          onPress={() => Alert.alert('Not available', 'Apple sign-in requires native configuration. Use email instead.')}
        >
          <Ionicons name="logo-apple" size={18} color={colors.white} />
          <Text style={styles.appleBtnText}>Continue with Apple</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.googleBtn}
          onPress={() => Alert.alert('Not available', 'Google sign-in requires native configuration. Use email instead.')}
        >
          <Ionicons name="logo-google" size={18} color={colors.text} />
          <Text style={styles.googleBtnText}>Continue with Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.emailBtn} onPress={() => setEmailFlow(true)}>
          <Ionicons name="mail-outline" size={18} color={colors.text} />
          <Text style={styles.googleBtnText}>Continue with Email</Text>
        </TouchableOpacity>
        <Text style={styles.terms}>By continuing you agree to the Terms & Privacy Policy.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 26 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconBadge: {
    width: 76, height: 76, borderRadius: 24, backgroundColor: colors.maroon,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  title: { fontSize: 30, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: colors.textMuted, fontWeight: '600', marginTop: 8, textAlign: 'center', maxWidth: 248, lineHeight: 21 },
  buttons: { paddingBottom: 30, gap: 12 },
  appleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.dark, padding: 16, borderRadius: radii.lg,
  },
  appleBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border,
    padding: 16, borderRadius: radii.lg,
  },
  googleBtnText: { color: colors.text, fontWeight: '700', fontSize: 16 },
  emailBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.pinkBorder,
    padding: 16, borderRadius: radii.lg,
  },
  terms: { fontSize: 11, color: colors.textFaint, textAlign: 'center', fontWeight: '600', lineHeight: 16, marginTop: 6 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { color: colors.maroon, fontSize: 14, fontWeight: '700' },
  emailTitle: { fontSize: 24, fontWeight: '700', color: colors.text, letterSpacing: -0.3, marginBottom: 4 },
  emailSub: { fontSize: 14, color: colors.textMuted, fontWeight: '600', marginBottom: 26 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' },
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md,
    padding: 13, fontSize: 15, color: colors.text, backgroundColor: colors.white,
  },
  primaryBtn: { backgroundColor: colors.maroon, padding: 16, borderRadius: radii.lg, alignItems: 'center' },
  primaryBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.6 },
  toggleText: { textAlign: 'center', fontSize: 13, color: colors.textMuted, fontWeight: '700' },
});
