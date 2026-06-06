import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

/**
 * Field shell for the Urban Object Inventory demo.
 * Minimal by design (hackathon scope): one screen showing the project,
 * the configured API target and the planned Field Review flow.
 */

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

export default function App() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Urban Object Inventory</Text>
        <Text style={styles.tagline}>
          KVKK-safe urban asset detection · field companion
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>API</Text>
          <Text style={styles.mono}>{API_BASE_URL}</Text>
          <Text style={styles.dim}>
            Configured via EXPO_PUBLIC_API_BASE_URL (.env)
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Demo Run Status</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>placeholder</Text>
          </View>
          <Text style={styles.body}>
            Güngören fixture run · completed · 3 images · 7 detections · 5
            regions anonymized
          </Text>
          <Text style={styles.dim}>
            Live status will load from GET /api/v1/demo-runs
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Field Review</Text>
          <Text style={styles.body}>
            Saha ekibi, anonimleştirilmiş tespit kanıtlarını burada inceleyip
            onaylayacak (approve / flag).
          </Text>
          <Text style={styles.dim}>
            Planned: detections list → anonymized evidence → review action
          </Text>
        </View>
      </ScrollView>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  scroll: {
    padding: 20,
    paddingTop: 64,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1b2733',
  },
  tagline: {
    fontSize: 13,
    color: '#5b6b7a',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d9e0e6',
    padding: 14,
    gap: 6,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#5b6b7a',
  },
  body: {
    fontSize: 14,
    color: '#1b2733',
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#1b2733',
  },
  dim: {
    fontSize: 12,
    color: '#5b6b7a',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eef1f4',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5b6b7a',
  },
});
