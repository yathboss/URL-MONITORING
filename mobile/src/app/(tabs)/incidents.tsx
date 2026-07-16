import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { acknowledgeIncident, getOpenIncidents } from '../../lib/api';
import { timeAgo } from '../../lib/dates';
import { useNotifications } from '../../lib/notifications';
import { theme } from '../../lib/theme';
import { Incident } from '../../lib/types';

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [ackBusy, setAckBusy] = useState<number | null>(null);
  const { refresh: refreshBadge } = useNotifications();

  const load = useCallback(async () => {
    try {
      setIncidents(await getOpenIncidents());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load incidents.');
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 30000);
    return () => clearInterval(interval);
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([load(), refreshBadge()]);
    setRefreshing(false);
  }, [load, refreshBadge]);

  const handleAcknowledge = async (incident: Incident) => {
    setAckBusy(incident.id);
    const optimistic = new Date().toISOString();
    setIncidents((prev) =>
      prev.map((item) => (item.id === incident.id ? { ...item, acknowledged_at: optimistic } : item)),
    );
    try {
      const updated = await acknowledgeIncident(incident.id);
      setIncidents((prev) => prev.map((item) => (item.id === incident.id ? updated : item)));
    } catch {
      setIncidents((prev) =>
        prev.map((item) => (item.id === incident.id ? { ...item, acknowledged_at: null } : item)),
      );
      setError('Could not acknowledge — try again.');
    } finally {
      setAckBusy(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Incidents</Text>
        <Text style={styles.subtitle}>
          {incidents.length === 0 ? 'Nothing on fire.' : `${incidents.length} open — acknowledge to claim them.`}
        </Text>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={incidents}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !error ? (
            <View style={styles.emptyBox}>
              <Ionicons name="shield-checkmark" size={40} color={theme.up} />
              <Text style={styles.empty}>All systems operational.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const isDown = item.severity === 'DOWN';
          const acked = Boolean(item.acknowledged_at);
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={[styles.sevPill, { backgroundColor: isDown ? theme.downBg : theme.warnBg }]}>
                  <Text style={[styles.sevText, { color: isDown ? theme.down : theme.warn }]}>{item.severity}</Text>
                </View>
                <Text style={styles.cardName} numberOfLines={1}>{item.url_name}</Text>
              </View>
              <Text style={styles.cardUrl} numberOfLines={1}>{item.url_address}</Text>
              <Text style={styles.cardMeta}>
                {item.check_type} check failed · started {timeAgo(item.started_at)}
              </Text>
              {acked ? (
                <View style={styles.ackedRow}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.up} />
                  <Text style={styles.ackedText}>
                    Acknowledged {item.acknowledged_at ? timeAgo(item.acknowledged_at) : ''}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.ackButton}
                  onPress={() => handleAcknowledge(item)}
                  disabled={ackBusy === item.id}
                >
                  <Text style={styles.ackButtonText}>
                    {ackBusy === item.id ? 'Acknowledging…' : 'Acknowledge'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: theme.text },
  subtitle: { fontSize: 13.5, color: theme.muted, marginTop: 4 },
  error: { color: theme.down, paddingHorizontal: 20, paddingBottom: 8, fontSize: 13.5 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  emptyBox: { alignItems: 'center', marginTop: 60, gap: 10 },
  empty: { color: theme.muted, fontSize: 14 },
  card: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    padding: 16,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sevPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  sevText: { fontSize: 11.5, fontWeight: '800' },
  cardName: { flex: 1, fontSize: 15.5, fontWeight: '700', color: theme.text },
  cardUrl: { fontSize: 12.5, color: theme.muted, marginTop: 8 },
  cardMeta: { fontSize: 12, color: theme.faint, marginTop: 3 },
  ackButton: {
    marginTop: 14,
    backgroundColor: theme.accent,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  ackButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  ackedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  ackedText: { color: theme.up, fontWeight: '600', fontSize: 13.5 },
});
