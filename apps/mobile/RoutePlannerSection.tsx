import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import {
  fetchWalkingRoutes,
  type MobileRouteOption,
} from './routePlanner';

const DEFAULT_ORIGIN = 'Güngören Metro İstasyonu, İstanbul';
const DEFAULT_DESTINATION = 'Güngören Belediyesi, İstanbul';
const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? '';

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

  const mapRegion = useMemo(() => {
    const path = selectedRoute?.geoPath ?? [];
    if (path.length === 0) {
      return {
        latitude: 41.0192,
        longitude: 28.8725,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      };
    }

    const lats = path.map((point) => point.latitude);
    const lngs = path.map((point) => point.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(0.01, (maxLat - minLat) * 1.6),
      longitudeDelta: Math.max(0.01, (maxLng - minLng) * 1.6),
    };
  }, [selectedRoute]);

  async function handleFindRoutes() {
    if (!apiBaseUrl) {
      setError('EXPO_PUBLIC_API_BASE_URL is not configured.');
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
          : 'Route request failed.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Live Walking Routes</Text>
      <Text style={styles.dim}>
        Same Render API and Google Routes geometry as the web demo.
      </Text>

      <TextInput
        value={origin}
        onChangeText={setOrigin}
        placeholder="Başlangıç"
        style={styles.input}
      />
      <TextInput
        value={destination}
        onChangeText={setDestination}
        placeholder="Varış"
        style={styles.input}
      />

      <Pressable
        accessibilityRole="button"
        onPress={() => void handleFindRoutes()}
        style={({ pressed }) => [
          styles.button,
          pressed || loading ? styles.buttonPressed : null,
        ]}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Calculating routes...' : 'Find live routes'}
        </Text>
      </Pressable>

      {error && <Text style={styles.error}>{error}</Text>}

      {loading && (
        <View style={styles.inline}>
          <ActivityIndicator color="#1f6f4a" />
          <Text style={styles.body}>Calling live Render API...</Text>
        </View>
      )}

      <MapView
        provider={GOOGLE_MAPS_KEY ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        region={mapRegion}
      >
        {routes.map((route) => {
          const selected = route.id === selectedRoute?.id;
          return (
            <Polyline
              key={route.id}
              coordinates={route.geoPath}
              strokeColor={selected ? '#1f6f4a' : '#6b7c93'}
              strokeWidth={selected ? 5 : 3}
              tappable
              onPress={() => setSelectedRouteId(route.id)}
            />
          );
        })}
        {selectedRoute?.geoPath[0] && (
          <Marker
            coordinate={selectedRoute.geoPath[0]}
            title="Başlangıç"
            pinColor="#1f6f4a"
          />
        )}
        {selectedRoute?.geoPath[selectedRoute.geoPath.length - 1] && (
          <Marker
            coordinate={selectedRoute.geoPath[selectedRoute.geoPath.length - 1]}
            title="Varış"
            pinColor="#0b3d2c"
          />
        )}
      </MapView>

      {!GOOGLE_MAPS_KEY && (
        <Text style={styles.dim}>
          Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY for Google basemap tiles on
          device builds.
        </Text>
      )}

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
            <Text style={styles.body}>
              {route.durationMin} dk · {route.distanceKm.toFixed(1)} km
            </Text>
            <Text style={styles.dim}>
              {route.status === 'analyzed' && route.score !== null
                ? `YolDost skoru ${route.score.toFixed(1)}`
                : 'Skor üretilmedi (kapsam yetersiz)'}
            </Text>
            <Text style={styles.dim}>{route.explanation}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d9e0e6',
    padding: 14,
    gap: 8,
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
  dim: {
    fontSize: 12,
    color: '#5b6b7a',
  },
  error: {
    color: '#9b2c2c',
    fontSize: 12,
  },
  inline: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    backgroundColor: '#f8fafb',
    borderColor: '#d9e0e6',
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: '#1f6f4a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonPressed: {
    opacity: 0.75,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  map: {
    borderRadius: 8,
    height: 220,
    width: '100%',
  },
  routeCard: {
    backgroundColor: '#f8fafb',
    borderColor: '#d9e0e6',
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 10,
  },
  routeCardSelected: {
    borderColor: '#1f6f4a',
  },
});
