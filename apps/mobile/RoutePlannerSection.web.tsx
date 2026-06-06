import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  fetchWalkingRoutes,
  type MobileRouteOption,
} from './routePlanner';
import { colors, radius, shared, spacing } from './theme';

const DEFAULT_ORIGIN = 'Güngören Metro İstasyonu, İstanbul';
const DEFAULT_DESTINATION = 'Güngören Belediyesi, İstanbul';

interface RoutePlannerSectionProps {
  apiBaseUrl: string;
}

export default function RoutePlannerSection({
  apiBaseUrl,
}: RoutePlannerSectionProps) {
  const [origin, setOrigin] = useState(DEFAULT_ORIGIN);
  const [destination, setDestination] = useState(DEFAULT_DESTINATION);
  const [routes, setRoutes] = useState<MobileRouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedRoute =
    routes.find((route) => route.id === selectedRouteId) ?? routes[0] ?? null;

  async function handleFindRoutes() {
    if (!apiBaseUrl) {
      setError('EXPO_PUBLIC_API_BASE_URL yapılandırılmadı.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const nextRoutes = await fetchWalkingRoutes(
        apiBaseUrl,
        origin.trim(),
        destination.trim(),
      );
      setRoutes(nextRoutes);
      setSelectedRouteId(nextRoutes[0]?.id ?? null);
    } catch (routeError) {
      setRoutes([]);
      setSelectedRouteId(null);
      setError(
        routeError instanceof Error
          ? routeError.message
          : 'Rota isteği başarısız oldu.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={shared.card}>
      <Text style={shared.cardTitle}>Canlı Yürüyüş Rotaları</Text>
      <Text style={shared.dim}>
        Web demosuyla aynı Render API ve Google Routes geometrisi.
      </Text>

      <TextInput
        value={origin}
        onChangeText={setOrigin}
        placeholder="Başlangıç"
        placeholderTextColor={colors.inkDim}
        style={styles.input}
      />
      <TextInput
        value={destination}
        onChangeText={setDestination}
        placeholder="Varış"
        placeholderTextColor={colors.inkDim}
        style={styles.input}
      />

      <Pressable
        accessibilityRole="button"
        onPress={() => void handleFindRoutes()}
        style={({ pressed }) => [
          shared.button,
          pressed || loading ? shared.buttonPressed : null,
        ]}
        disabled={loading}
      >
        <Text style={shared.buttonText}>
          {loading ? 'Rotalar hesaplanıyor...' : 'Rotaları Bul'}
        </Text>
      </Pressable>

      {error && <Text style={shared.error}>{error}</Text>}

      {loading && (
        <View style={shared.inline}>
          <ActivityIndicator color={colors.brand} />
          <Text style={shared.body}>Canlı Render API çağrılıyor...</Text>
        </View>
      )}

      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapPlaceholderText}>
          Harita yalnızca cihazda görüntülenir.
        </Text>
      </View>

      {routes.map((route) => {
        const selected = route.id === selectedRoute?.id;
        return (
          <Pressable
            key={route.id}
            accessibilityRole="button"
            onPress={() => setSelectedRouteId(route.id)}
            style={[
              styles.routeCard,
              selected ? styles.routeCardSelected : null,
            ]}
          >
            <Text style={styles.routeMetric}>
              {route.durationMin} dk · {route.distanceKm.toFixed(1)} km
            </Text>
            <Text style={shared.dim}>
              {route.status === 'analyzed' && route.score !== null
                ? `YolDost skoru ${route.score.toFixed(1)}`
                : 'Skor üretilmedi (kapsam yetersiz)'}
            </Text>
            <Text style={shared.dim}>{route.explanation}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
  },
  mapPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 120,
    justifyContent: 'center',
    width: '100%',
  },
  mapPlaceholderText: {
    color: colors.inkDim,
    fontSize: 13,
  },
  routeCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  routeCardSelected: {
    borderColor: colors.brand,
    borderWidth: 1.5,
  },
  routeMetric: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
});
