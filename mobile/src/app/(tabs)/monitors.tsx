import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getUrls } from '../../lib/api';
import { timeAgo } from '../../lib/dates';
import { statusColors, theme } from '../../lib/theme';
import { URLItem, URLStatus } from '../../lib/types';

const STATUS_ORDER: Record<URLStatus, number> = { DOWN: 0, WARN: 1, PENDING: 2, UP: 3 };

export default function Monitors() {
  const [monitors, setMonitors] = useState<URLItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getUrls();
      data.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.name.localeCompare(b.name));
      setMonitors(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load monitors.');
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 30000);
    return () => clearInterval(interval);
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const counts = monitors.reduce<Record<string, number>>((acc, m) => {
    acc[m.status] = (acc[m.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Monitors</Text>
        <View style={styles.chipsRow}>
          {(['UP', 'WARN', 'DOWN'] as URLStatus[]).map((status) => (
            <View key={status} style={[styles.chip, { backgroundColor: statusColors[status].bg }]}>
              <Text style={[styles.chipText, { color: statusColors[status].color }]}>
                {counts[status] ?? 0} {status}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={monitors}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !error ? <Text style={styles.empty}>No monitors yet — add one from the web dashboard.</Text> : null
        }
        renderItem={({ item }) => {
          const sc = statusColors[item.status];
          return (
            <View style={styles.card}>
              <View style={[styles.dot, { backgroundColor: sc.color }]} />
              <View style={styles.cardBody}>
                <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.cardUrl} numberOfLines={1}>{item.web_address}</Text>
                <Text style={styles.cardMeta}>
                  {item.last_pinged_at ? `checked ${timeAgo(item.last_pinged_at)}` : 'not checked yet'}
                </Text>
              </View>
              <View style={[styles.pill, { backgroundColor: sc.bg }]}>
                <Text style={[styles.pillText, { color: sc.color }]}>{item.status}</Text>
              </View>
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
  title: { fontSize: 26, fontWeight: '800', color: theme.text, marginBottom: 10 },
  chipsRow: { flexDirection: 'row', gap: 8 },
  chip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  chipText: { fontSize: 12.5, fontWeight: '700' },
  error: { color: theme.down, paddingHorizontal: 20, paddingBottom: 8, fontSize: 13.5 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  empty: { color: theme.muted, textAlign: 'center', marginTop: 48, fontSize: 14 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    padding: 14,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  cardBody: { flex: 1, minWidth: 0 },
  cardName: { fontSize: 15, fontWeight: '700', color: theme.text },
  cardUrl: { fontSize: 12.5, color: theme.muted, marginTop: 1 },
  cardMeta: { fontSize: 11.5, color: theme.faint, marginTop: 3 },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 11.5, fontWeight: '800' },
});
