import React, { useMemo, useState, useEffect } from "react";
import { Layers } from "lucide-react";

interface Hotspot {
  latitude: number;
  longitude: number;
  weight: number;
  status: string;
  categoryName: string;
}

interface HeatmapMapProps {
  hotspots: Hotspot[];
}

interface GridCell {
  id: string;
  bounds: [[number, number], [number, number]];
  weight: number;
  count: number;
  feedbacks: Hotspot[];
}

// Hàm chia lưới bản đồ (khoảng 500m mỗi ô ~ 0.005 độ)
function generateGrid(hotspots: Hotspot[], size = 0.005): GridCell[] {
  const grid = new Map<string, GridCell>();

  hotspots.forEach((h) => {
    // Làm tròn tọa độ xuống để xếp vào các ô lưới cố định
    const latIdx = Math.floor(h.latitude / size);
    const lngIdx = Math.floor(h.longitude / size);
    const id = `${latIdx},${lngIdx}`;

    if (!grid.has(id)) {
      grid.set(id, {
        id,
        bounds: [
          [latIdx * size, lngIdx * size],
          [(latIdx + 1) * size, (lngIdx + 1) * size],
        ],
        weight: 0,
        count: 0,
        feedbacks: [],
      });
    }

    const cell = grid.get(id)!;
    cell.weight += h.weight;
    cell.count += 1;
    cell.feedbacks.push(h);
  });

  return Array.from(grid.values());
}

export function HeatmapMap({ hotspots }: HeatmapMapProps) {
  // Tọa độ trung tâm Quảng Nam - Đà Nẵng
  const center = [16.0544, 108.2022] as [number, number]; // Trực diện trung tâm Đà Nẵng

  const [showSurge, setShowSurge] = useState(true);

  // Tạo lưới các khu vực điểm nóng
  const gridCells = useMemo(() => generateGrid(hotspots || [], 0.005), [hotspots]);

  const [leafletComponents, setLeafletComponents] = useState<{
    MapContainer: any;
    TileLayer: any;
    Rectangle: any;
    Popup: any;
    useMap: any;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      import("react-leaflet"),
      import("leaflet/dist/leaflet.css"),
    ]).then(([mod]) => {
      if (!cancelled) {
        setLeafletComponents({
          MapContainer: mod.MapContainer,
          TileLayer: mod.TileLayer,
          Rectangle: mod.Rectangle,
          Popup: mod.Popup,
          useMap: mod.useMap,
        });
      }
    });

    // Thêm style animation fade-in
    const style = document.createElement("style");
    style.innerHTML = `
      .surge-rect {
        animation: surgeFadeIn 0.8s ease-out forwards;
        transform-origin: center;
      }
      @keyframes surgeFadeIn {
        from { opacity: 0; transform: scale(0.8); }
        to { opacity: 1; transform: scale(1); }
      }
    `;
    document.head.appendChild(style);

    return () => {
      cancelled = true;
      document.head.removeChild(style);
    };
  }, []);

  if (!leafletComponents) {
    return (
      <div className="h-full w-full rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-50 flex items-center justify-center">
        <span className="text-slate-400 text-sm">Đang tải bản đồ nhu cầu...</span>
      </div>
    );
  }

  const { MapContainer, TileLayer, Rectangle, Popup } = leafletComponents;

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-slate-200 shadow-sm relative z-0 bg-white">
      {/* Nút bật/tắt Layer (như UI Grab) */}
      <div className="absolute top-4 right-4 z-[1000]">
        <button
          onClick={() => setShowSurge(!showSurge)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold shadow-lg transition-all ${
            showSurge ? "bg-slate-800 text-white" : "bg-white text-slate-700 border border-slate-200"
          }`}
        >
          <Layers size={18} />
          {showSurge ? "Đang bật điểm nóng" : "Bật điểm nóng"}
        </button>
      </div>

      {/* Chú thích Mức độ (Legend) */}
      {showSurge && (
        <div className="absolute bottom-6 right-4 z-[1000] bg-white/95 backdrop-blur-sm p-3.5 rounded-xl shadow-lg border border-slate-100 text-xs min-w-[140px] animate-in fade-in slide-in-from-bottom-4">
          <p className="font-extrabold mb-2 text-slate-800 uppercase tracking-wide text-[10px]">Lưu lượng phản ánh</p>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-5 h-5 rounded-md" style={{ background: "#fb923c", opacity: 0.5 }}></div>
            <span className="font-medium text-slate-600">Trung bình</span>
          </div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-5 h-5 rounded-md" style={{ background: "#ef4444", opacity: 0.6 }}></div>
            <span className="font-medium text-slate-600">Cao</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-md" style={{ background: "#991b1b", opacity: 0.75 }}></div>
            <span className="font-medium text-slate-600">Rất cao</span>
          </div>
        </div>
      )}

      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} zoomControl={false}>
        {/* Lớp nền Bản đồ sáng màu (tương tự Grab) để làm nổi bật ô màu */}
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=m&hl=vi&gl=VN&x={x}&y={y}&z={z}"
          attribution="&copy; Google Maps"
          className="map-tiles-light" // Có thể filter CSS nếu muốn nhạt bớt
        />

        {showSurge &&
          gridCells.map((cell) => {
            // Tính toán màu sắc dựa trên weight
            let fillColor = "#fb923c"; // Mặc định: Cam nhạt
            let fillOpacity = 0.5;

            if (cell.weight >= 8) {
              fillColor = "#991b1b"; // Đỏ sậm (Rất cao)
              fillOpacity = 0.75;
            } else if (cell.weight >= 4) {
              fillColor = "#ef4444"; // Đỏ (Cao)
              fillOpacity = 0.6;
            }

            return (
              <Rectangle
                key={cell.id}
                bounds={cell.bounds}
                pathOptions={{
                  fillColor,
                  fillOpacity,
                  stroke: false, // Không viền để giống giao diện vùng Grab
                  className: "surge-rect",
                }}
              >
                <Popup className="surge-popup">
                  <div className="text-sm min-w-[220px] p-1">
                    <strong className="text-base text-slate-800 border-b pb-2 mb-2 block font-bold">
                      Khu vực có {cell.count} phản ánh
                    </strong>
                    <div className="max-h-[160px] overflow-y-auto pr-2 space-y-2.5 mt-2 custom-scrollbar">
                      {cell.feedbacks.map((f, idx) => (
                        <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-150 relative">
                          <div className="font-bold text-slate-700 mb-1">{f.categoryName}</div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">Trạng thái:</span>
                            <span className={`px-2 py-0.5 rounded-full font-semibold ${
                              f.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                              f.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {f.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Popup>
              </Rectangle>
            );
          })}
      </MapContainer>
    </div>
  );
}
