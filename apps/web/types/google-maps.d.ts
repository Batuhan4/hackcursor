declare namespace google.maps {
  class LatLngBounds {
    constructor();
    extend(point: { lat: number; lng: number }): void;
  }

  class Map {
    constructor(
      element: HTMLElement,
      options?: {
        mapTypeControl?: boolean;
        streetViewControl?: boolean;
        fullscreenControl?: boolean;
        clickableIcons?: boolean;
        gestureHandling?: string;
      },
    );
    setCenter(point: { lat: number; lng: number }): void;
    setZoom(zoom: number): void;
    fitBounds(bounds: LatLngBounds, padding?: number): void;
  }

  class Polyline {
    constructor(options?: {
      path?: Array<{ lat: number; lng: number }>;
      map?: Map | null;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
      zIndex?: number;
      clickable?: boolean;
    });
    setMap(map: Map | null): void;
    addListener(event: string, handler: () => void): void;
  }

  class Marker {
    constructor(options?: {
      map?: Map | null;
      position?: { lat: number; lng: number };
      label?: string;
      title?: string;
    });
    setMap(map: Map | null): void;
  }
}

interface Window {
  google?: {
    maps: typeof google.maps;
  };
}
