import { useState, useEffect, useRef } from "react";
import type L from "leaflet";
import { WARD_BOUNDARIES } from "@/lib/geojson";
import { useMap } from "react-leaflet";
import { getGroupedFeedbackStatus } from "@/lib/status";

interface MapMarker {
  id?: number | string;
  position: [number, number];
  title: string;
  description?: string;
  status?: string;
  address?: string;
  category?: string;
  date?: string;
}

interface Props {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  height?: string;
  interactive?: boolean;
  showBoundary?: boolean;
  boundaryRadius?: number;
  activeMarkerId?: number | string;
  onMarkerClick?: (id: number | string) => void;
  wardName?: string;
  onViewportChange?: (center: [number, number], zoom: number) => void;
  layerType?: "osm" | "satellite";
  onLayerTypeChange?: (layer: "osm" | "satellite") => void;
  onShowBoundaryChange?: (show: boolean) => void;
}

// Custom Leaflet circular marker generator passed L dynamically
function getMarkerIcon(L: any, status: string | undefined, zoom: number) {
  if (typeof window === "undefined" || !L) return null;

  let size = 12;
  if (zoom <= 10) size = 8;
  else if (zoom <= 12) size = 10;
  else if (zoom <= 14) size = 14;
  else if (zoom <= 16) size = 18;
  else size = 22;

  let color = "#94a3b8"; // Default Gray
  const grp = getGroupedFeedbackStatus(status);
  switch (grp) {
    case "PENDING":
      color = "#3b82f6"; // Blue
      break;
    case "IN_PROGRESS":
      color = "#facc15"; // Yellow
      break;
    case "RESOLVED":
      color = "#22c55e"; // Green
      break;
    case "REJECTED":
      color = "#ef4444"; // Red
      break;
  }
  return L.divIcon({
    className: "custom-circular-marker",
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background-color: ${color};
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      transition: all 0.2s ease-in-out;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function MapController({
  activeMarkerId,
  markerRefs,
  wardName,
  layerType,
  setZoom,
  onViewportChange,
  L,
}: {
  activeMarkerId?: number | string;
  markerRefs: React.MutableRefObject<Record<string | number, L.Marker>>;
  wardName?: string;
  layerType: "osm" | "satellite";
  setZoom: (z: number) => void;
  onViewportChange?: (center: [number, number], zoom: number) => void;
  L: any;
}) {
  const map = useMap();

  useEffect(() => {
    const handleMoveEnd = () => {
      const center = map.getCenter();
      onViewportChange?.([center.lat, center.lng], map.getZoom());
    };
    map.on("moveend", handleMoveEnd);
    map.on("zoomend", () => setZoom(map.getZoom()));
    return () => {
      map.off("moveend", handleMoveEnd);
      map.off("zoomend");
    };
  }, [map, onViewportChange]);

  useEffect(() => {
    if (activeMarkerId) {
      const marker = markerRefs.current[activeMarkerId];
      if (marker) {
        map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 15), { animate: true });
        marker.openPopup();
      }
    }
  }, [activeMarkerId, markerRefs, map]);

  useEffect(() => {
    if (wardName && WARD_BOUNDARIES[wardName] && L) {
      const geojson = WARD_BOUNDARIES[wardName];
      try {
        const tempLayer = L.geoJSON(geojson as any);
        const bounds = tempLayer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [30, 30] });
        }
      } catch (err) {
        console.error("Error fitting bounds:", err);
      }
    }
  }, [wardName, map, L]);

  return null;
}

export function CivicMap({
  center = [16.044, 108.220],
  zoom = 13,
  markers = [],
  height = "h-72 md:h-96",
  interactive = true,
  showBoundary = false,
  activeMarkerId,
  onMarkerClick,
  wardName,
  onViewportChange,
  layerType: propLayerType,
  onLayerTypeChange,
  onShowBoundaryChange,
}: Props) {
  // Dynamic import: Leaflet requires `window` at module-load time,
  // so we lazy-load react-leaflet and leaflet only on the client.
  const [leafletComponents, setLeafletComponents] = useState<{
    MapContainer: any;
    TileLayer: any;
    Marker: any;
    Popup: any;
    Circle: any;
    GeoJSON: any;
    L: any;
  } | null>(null);

  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [localLayerType, setLocalLayerType] = useState<"osm" | "satellite">("osm");
  const [localShowBoundary, setLocalShowBoundary] = useState(showBoundary);
  const [isLayersOpen, setIsLayersOpen] = useState(false);

  const markerRefs = useRef<Record<string | number, L.Marker>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsLayersOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      import("react-leaflet"),
      import("leaflet")
    ]).then(([mod, LMod]) => {
      if (!cancelled) {
        setLeafletComponents({
          MapContainer: mod.MapContainer,
          TileLayer: mod.TileLayer,
          Marker: mod.Marker,
          Popup: mod.Popup,
          Circle: mod.Circle,
          GeoJSON: mod.GeoJSON,
          L: LMod.default || LMod,
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeLayer = propLayerType !== undefined ? propLayerType : localLayerType;
  const activeShowBoundary = onShowBoundaryChange !== undefined ? showBoundary : localShowBoundary;

  const setLayerType = (type: "osm" | "satellite") => {
    if (onLayerTypeChange) {
      onLayerTypeChange(type);
    } else {
      setLocalLayerType(type);
    }
  };

  const setShowBoundaryState = (show: boolean) => {
    if (onShowBoundaryChange) {
      onShowBoundaryChange(show);
    } else {
      setLocalShowBoundary(show);
    }
  };

  if (!leafletComponents) {
    return (
      <div
        className="rounded-xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50 flex items-center justify-center"
        style={{ height }}
      >
        <span className="text-slate-400 text-sm">Đang tải bản đồ...</span>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, Circle, GeoJSON, L } = leafletComponents;

  // Layer details
  const layers = {
    osm: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    },
  };

  const wardGeoJson = wardName && WARD_BOUNDARIES[wardName] ? WARD_BOUNDARIES[wardName] : null;

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-slate-100 shadow-sm"
      style={{ height }}
    >
      {/* Dynamic Floating Controls Overlay */}
      <div
        ref={dropdownRef}
        className="absolute top-3 right-3 flex flex-col items-end gap-2 text-xs"
        style={{ zIndex: 1000 }}
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsLayersOpen(!isLayersOpen)}
            className="w-10 h-10 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-md flex items-center justify-center cursor-pointer transition text-[#0b2545] font-bold"
            title="Lớp bản đồ"
          >
            {/* Custom SVG icon for map layers */}
            <svg
              className="w-5 h-5 text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </button>

          {isLayersOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-[1100] animate-fade-in">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Loại bản đồ
              </div>
              <button
                type="button"
                onClick={() => {
                  setLayerType("osm");
                  setIsLayersOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-xs transition flex items-center gap-2 ${
                  activeLayer === "osm"
                    ? "bg-blue-50 text-blue-600 font-extrabold"
                    : "text-slate-700 hover:bg-slate-50 font-semibold"
                }`}
              >
                <span>🗺️</span> Bản đồ đường phố (OSM)
              </button>
              <button
                type="button"
                onClick={() => {
                  setLayerType("satellite");
                  setIsLayersOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-xs transition flex items-center gap-2 ${
                  activeLayer === "satellite"
                    ? "bg-blue-50 text-blue-600 font-extrabold"
                    : "text-slate-700 hover:bg-slate-50 font-semibold"
                }`}
              >
                <span>🛰️</span> Bản đồ vệ tinh
              </button>
            </div>
          )}
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full"
        zoomControl={interactive}
        dragging={interactive}
        scrollWheelZoom={interactive}
        attributionControl={false}
      >
        <TileLayer
          key={activeLayer}
          attribution={layers[activeLayer].attribution}
          url={layers[activeLayer].url}
        />

        <MapController
          activeMarkerId={activeMarkerId}
          markerRefs={markerRefs}
          wardName={wardName}
          layerType={activeLayer}
          setZoom={setCurrentZoom}
          onViewportChange={onViewportChange}
          L={L}
        />

        {activeShowBoundary && wardGeoJson && (
          <GeoJSON
            key={wardName}
            data={wardGeoJson}
            style={{
              color: "#ef4444",      // Red thin outline
              weight: 2,
              fillColor: "#ef4444",  // Semi-transparent red fill
              fillOpacity: 0.15,
            }}
          />
        )}
        {markers.map((m, idx) => {
          const markerId = m.id !== undefined ? m.id : idx;
          const icon = getMarkerIcon(L, m.status, currentZoom);
          return (
            <Marker
              key={markerId}
              position={m.position}
              icon={icon || undefined}
              ref={(ref: any) => {
                if (ref) {
                  markerRefs.current[markerId] = ref;
                } else {
                  delete markerRefs.current[markerId];
                }
              }}
              eventHandlers={{
                click: () => {
                  if (onMarkerClick) {
                    onMarkerClick(markerId);
                  }
                },
              }}
            >
              <Popup>
                <div className="p-1 max-w-[240px] text-xs">
                  <div className="flex justify-between items-start gap-2 border-b pb-1 mb-1 border-slate-100">
                    <strong className="text-slate-800 text-sm font-bold truncate block">
                      {m.title}
                    </strong>
                  </div>
                  <div className="space-y-1 text-slate-600">
                    {m.category && (
                      <div>
                        <span className="font-semibold text-slate-700">Danh mục: </span>
                        {m.category}
                      </div>
                    )}
                    {m.address && (
                      <div>
                        <span className="font-semibold text-slate-700">Địa chỉ: </span>
                        {m.address}
                      </div>
                    )}
                    {m.date && (
                      <div>
                        <span className="font-semibold text-slate-700">Ngày gửi: </span>
                        {m.date}
                      </div>
                    )}
                    {m.status && (() => {
                      const grp = getGroupedFeedbackStatus(m.status);
                      return (
                        <div className="mt-1">
                          <span className="font-semibold text-slate-700">Trạng thái: </span>
                          <span
                            className={`font-semibold px-1.5 py-0.5 rounded text-[10px] ${
                              grp === "RESOLVED"
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : grp === "REJECTED"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : grp === "IN_PROGRESS"
                                ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {grp === "RESOLVED"
                              ? "Đã xử lý"
                              : grp === "REJECTED"
                              ? "Đã từ chối"
                              : grp === "IN_PROGRESS"
                              ? "Đang xử lý"
                              : "Chờ xử lý"}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="mt-2.5 pt-1.5 border-t border-slate-100 flex justify-end">
                    <a
                      href={`/my-reports/${m.id}`}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-semibold text-center no-underline transition-colors block"
                      style={{ color: 'white' }}
                    >
                      Xem chi tiết
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export type { MapMarker };
