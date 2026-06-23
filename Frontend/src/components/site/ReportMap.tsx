import { useEffect, useState, useMemo } from "react";
import { MapPin } from "lucide-react";

const CURRENT_LOCATION_ZOOM = 17;

interface ReportMapProps {
  mapCenter: [number, number];
  hasLocation: boolean;
  markerDisplayed: boolean;
  latitude: number | null;
  longitude: number | null;
  address: string;
  locationLoading: boolean;
  onChangeLocation?: (lat: number, lng: number) => void;
}

// Inner component that uses useMap — must be rendered inside MapContainer
function MapViewUpdaterInner({
  center,
  hasLocation,
  useMap,
}: {
  center: [number, number];
  hasLocation: boolean;
  useMap: () => any;
}) {
  const map = useMap();

  useEffect(() => {
    window.setTimeout(() => map.invalidateSize(), 0);

    if (hasLocation) {
      map.flyTo(center, CURRENT_LOCATION_ZOOM, { animate: true, duration: 0.8 });
      return;
    }

    map.setView(center, 13, { animate: true });
  }, [center, hasLocation, map]);

  return null;
}

// Map event handler component using useMapEvents hook from react-leaflet
function MapEventsHandler({
  useMapEvents,
  onChangeLocation,
}: {
  useMapEvents: any;
  onChangeLocation?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e: any) {
      if (onChangeLocation) {
        onChangeLocation(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export function ReportMap({
  mapCenter,
  hasLocation,
  markerDisplayed,
  latitude,
  longitude,
  address,
  locationLoading,
  onChangeLocation,
}: ReportMapProps) {
  // Dynamic import: Leaflet requires `window` at module-load time,
  // so we lazy-load react-leaflet and leaflet only on the client.
  const [modules, setModules] = useState<{
    MapContainer: any;
    TileLayer: any;
    Marker: any;
    Popup: any;
    useMap: () => any;
    useMapEvents: any;
    currentLocationIcon: any;
  } | null>(null);

  const markerEventHandlers = useMemo(
    () => ({
      dragend(e: any) {
        const marker = e.target;
        if (marker != null) {
          const latLng = marker.getLatLng();
          if (onChangeLocation) {
            onChangeLocation(latLng.lat, latLng.lng);
          }
        }
      },
    }),
    [onChangeLocation]
  );

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      import("react-leaflet"),
      import("leaflet"),
    ]).then(([rl, L]) => {
      if (cancelled) return;

      const icon = L.default.divIcon({
        className: "",
        html: `
          <div style="position: relative; width: 32px; height: 42px;">
            <div style="
              position: absolute;
              left: 3px;
              top: 2px;
              width: 26px;
              height: 26px;
              border-radius: 50% 50% 50% 0;
              background: #0b5ed7;
              border: 3px solid #ffffff;
              box-shadow: 0 10px 22px rgba(11, 94, 215, 0.35);
              transform: rotate(-45deg);
              display: grid;
              place-items: center;
            ">
              <div style="
                width: 8px;
                height: 8px;
                border-radius: 9999px;
                background: #111111;
                transform: rotate(45deg);
              "></div>
            </div>
          </div>
        `,
        iconSize: [32, 42] as [number, number],
        iconAnchor: [16, 42] as [number, number],
        popupAnchor: [0, -42] as [number, number],
      });

      setModules({
        MapContainer: rl.MapContainer,
        TileLayer: rl.TileLayer,
        Marker: rl.Marker,
        Popup: rl.Popup,
        useMap: rl.useMap,
        useMapEvents: rl.useMapEvents,
        currentLocationIcon: icon,
      });
    });
    return () => { cancelled = true; };
  }, []);

  if (!modules) {
    return (
      <div className="w-full h-full relative bg-slate-50 flex items-center justify-center rounded-lg border border-slate-200">
        <span className="text-slate-400 text-sm">Đang tải bản đồ...</span>
      </div>
    );
  }

  const {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap,
    useMapEvents,
    currentLocationIcon,
  } = modules;

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={mapCenter}
        zoom={hasLocation ? CURRENT_LOCATION_ZOOM : 13}
        className="w-full h-full"
        scrollWheelZoom={true}
        dragging={true}
        zoomControl={true}
      >
        <MapViewUpdaterInner center={mapCenter} hasLocation={hasLocation} useMap={useMap} />
        <MapEventsHandler useMapEvents={useMapEvents} onChangeLocation={onChangeLocation} />
        <TileLayer
          attribution="&copy; Google Maps"
          url="https://mt1.google.com/vt/lyrs=m&hl=vi&gl=VN&x={x}&y={y}&z={z}"
        />
        {markerDisplayed && latitude !== null && longitude !== null && currentLocationIcon && (
          <Marker
            position={[latitude, longitude]}
            icon={currentLocationIcon}
            draggable={true}
            eventHandlers={markerEventHandlers}
          >
            <Popup>
              <strong>Vị trí hiện tại</strong>
              <p className="text-sm mt-1">{address || "Đã xác định bằng GPS"}</p>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {!markerDisplayed && (
        <div className="absolute inset-x-4 top-4 rounded-lg border border-white/70 bg-white/95 p-4 shadow-sm z-[500]">
          <div className="flex items-start gap-3">
            <MapPin className="text-gov-blue shrink-0 mt-0.5" size={22} />
            <div>
              <p className="font-bold text-ink">Đang chờ vị trí</p>
              <p className="text-sm text-ink-soft">
                {locationLoading
                  ? "Hệ thống đang xin quyền GPS..."
                  : "Bấm Lấy lại vị trí để hiển thị ghim trên bản đồ."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
