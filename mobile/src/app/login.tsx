import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useApp } from '../lib/AppContext';
import { theme } from '../lib/theme';

export default function Login() {
  const { baseUrl, setServerUrl, signIn } = useApp();
  const [serverUrl, setServerUrlInput] = useState('');
  const [showServer, setShowServer] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setServerUrlInput(baseUrl ?? '');
    if (!baseUrl) setShowServer(true);
  }, [baseUrl]);

  const handleLogin = async () => {
    setError(null);
    setBusy(true);
    try {
      if (serverUrl.trim()) await setServerUrl(serverUrl.trim());
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.container}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>U</Text>
            </View>
            <Text style={styles.brandName}>Uptime Monitor</Text>
          </View>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to get alerted the moment a monitor goes down.</Text>

          {showServer && (
            <TextInput
              style={styles.input}
              value={serverUrl}
              onChangeText={setServerUrlInput}
              placeholder="Server URL, e.g. http://192.168.1.42:8000"
              placeholderTextColor={theme.faint}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          )}
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={theme.faint}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={theme.faint}
            secureTextEntry
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Sign in</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowServer((v) => !v)}>
            <Text style={styles.linkMuted}>{showServer ? 'Hide server settings' : 'Change server URL'}</Text>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.mutedText}>New here? </Text>
            <Link href="/signup" style={styles.link}>
              Create an account
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  flex: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28 },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  brandName: { fontSize: 18, fontWeight: '700', color: theme.text },
  title: { fontSize: 28, fontWeight: '800', color: theme.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: theme.muted, marginBottom: 24, lineHeight: 20 },
  input: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.text,
    marginBottom: 12,
  },
  error: { color: theme.down, marginBottom: 12, fontSize: 13.5 },
  primaryButton: {
    backgroundColor: theme.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkMuted: { color: theme.muted, textAlign: 'center', marginTop: 16, fontSize: 13.5 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  mutedText: { color: theme.muted, fontSize: 14 },
  link: { color: theme.accent, fontWeight: '700', fontSize: 14 },
});
