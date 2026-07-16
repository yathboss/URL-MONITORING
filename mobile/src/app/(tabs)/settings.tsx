import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getUrls } from '../../lib/api';
import { useApp } from '../../lib/AppContext';
import { theme } from '../../lib/theme';

export default function Settings() {
  const { baseUrl, setServerUrl, user, signOut } = useApp();
  const [urlInput, setUrlInput] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setUrlInput(baseUrl ?? '');
  }, [baseUrl]);

  const saveAndTest = async () => {
    setStatus('Testing…');
    try {
      await setServerUrl(urlInput.trim());
      const urls = await getUrls();
      setStatus(`✓ Connected — ${urls.length} monitors visible.`);
    } catch (err) {
      setStatus(`✗ ${err instanceof Error ? err.message : 'Connection failed.'}`);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Settings</Text>

        <Text style={styles.sectionLabel}>SERVER</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Server URL</Text>
          <TextInput
            style={styles.input}
            value={urlInput}
            onChangeText={setUrlInput}
            placeholder="http://192.168.1.42:8000"
            placeholderTextColor={theme.faint}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <TouchableOpacity style={styles.primaryButton} onPress={saveAndTest}>
            <Text style={styles.primaryButtonText}>Save &amp; test connection</Text>
          </TouchableOpacity>
          {status && <Text style={styles.status}>{status}</Text>}
        </View>

        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.card}>
          <Text style={styles.identityName}>{user?.full_name}</Text>
          <Text style={styles.identityMeta}>{user?.email} · {user?.role}</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={() => void signOut()}>
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          Alerts arrive while the app is open or in the background. Keep the app running during on-call.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  container: { padding: 20, gap: 12 },
  title: { fontSize: 26, fontWeight: '800', color: theme.text, marginBottom: 6 },
  sectionLabel: { fontSize: 11.5, fontWeight: '800', color: theme.faint, letterSpacing: 1.2, marginTop: 8 },
  card: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    padding: 16,
  },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: theme.muted, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14.5,
    color: theme.text,
    marginBottom: 12,
  },
  primaryButton: { backgroundColor: theme.accent, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  status: { marginTop: 10, fontSize: 13, color: theme.muted },
  identityName: { fontSize: 16, fontWeight: '700', color: theme.text },
  identityMeta: { fontSize: 13, color: theme.muted, marginTop: 2, marginBottom: 14 },
  logoutButton: {
    borderWidth: 1,
    borderColor: theme.down,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  logoutText: { color: theme.down, fontWeight: '700', fontSize: 14 },
  hint: { fontSize: 12.5, color: theme.faint, lineHeight: 18, marginTop: 6 },
});
