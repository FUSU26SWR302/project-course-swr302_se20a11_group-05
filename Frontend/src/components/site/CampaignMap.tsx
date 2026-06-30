import { useState, useMemo, useEffect } from "react";
import {
  Layers,
  MapPin,
  Flag,
  Users,
  Compass,
  AlertOctagon,
  Eye,
  CheckCircle,
  HelpCircle,
} from "lucide-react";

interface MapMarker {
  id: string;
  position: [number, number];
  title: string;
  category: "environment" | "infrastructure" | "public_safety" | "construction" | "fire_safety";
  status: "pending" | "inProgress" | "resolved";
  type: "report" | "checkpoint" | "coordination" | "meeting" | "hotspot";
  description: string;
}

interface Props {
  height?: string;
}

// Hoa Xuan ward coordinates outline approximation
const hoaXuanBoundary: [number, number][] = [
  [16.0280, 108.2140],
  [16.0250, 108.2290],
  [16.0150, 108.2320],
  [16.0020, 108.2240],
  [16.0050, 108.2100],
  [16.0180, 108.2070],
  [16.0280, 108.2140],
];

// Meeting & checkpoint markers
const staticMarkers: MapMarker[] = [
  {
    id: "meet-1",
    position: [16.0165, 108.2190],
    title: "Điểm tập kết tình nguyện viên",
    category: "environment",
    status: "inProgress",
    type: "meeting",
    description: "Nhà văn hóa Hòa Xuân - Điểm tiếp nhận dụng cụ và phân chia tổ công tác.",
  },
  {
    id: "coord-1",
    position: [16.0135, 108.2215],
    title: "Chốt điều phối của UBND phường",
    category: "infrastructure",
    status: "resolved",
    type: "coordination",
    description: "Văn phòng Chỉ huy chiến dịch - Nơi đỗ các xe thu gom rác chuyên dụng.",
  },
  {
    id: "check-1",
    position: [16.0185, 108.2160],
    title: "Trạm tiếp tế & Check-point số 1",
    category: "public_safety",
    status: "inProgress",
    type: "checkpoint",
    description: "Trạm y tế lưu động, phân phát nước uống, găng tay và túi rác dự phòng.",
  },
  {
    id: "check-2",
    position: [16.0115, 108.2245],
    title: "Trạm tiếp tế & Check-point số 2",
    category: "public_safety",
    status: "inProgress",
    type: "checkpoint",
    description: "Điểm tập kết rác tạm thời phía Nam phường, hỗ trợ thu gom rác từ các hộ dân.",
  },
];

// 18 Citizen reports scattered in the ward
const citizenReports: MapMarker[] = [
  {
    id: "rep-1",
    position: [16.0150, 108.2180],
    title: "Bãi rác thải tự phát dọc đường Trần Nam Trung",
    category: "environment",
    status: "inProgress",
    type: "report",
    description: "Rác sinh hoạt và xà bần đổ trộm gây ô nhiễm nặng.",
  },
  {
    id: "rep-2",
    position: [16.0158, 108.2225],
    title: "Mương thoát nước ùn ứ rác thải nhựa",
    category: "environment",
    status: "pending",
    type: "report",
    description: "Kênh thoát nước bị tắc nghẽn hoàn toàn do túi nilon và chai nhựa.",
  },
  {
    id: "rep-3",
    position: [16.0175, 108.2170],
    title: "Cây xanh đổ gãy chắn lối đi vỉa hè",
    category: "infrastructure",
    status: "resolved",
    type: "report",
    description: "Nhánh cây phượng lớn gãy đè lên đường dây điện dân sinh.",
  },
  {
    id: "rep-4",
    position: [16.0120, 108.2210],
    title: "Vật liệu xây dựng tràn ra lòng đường",
    category: "construction",
    status: "inProgress",
    type: "report",
    description: "Đất cát từ công trình nhà ở riêng lẻ không che chắn gây bụi.",
  },
  {
    id: "rep-5",
    position: [16.0190, 108.2240],
    title: "Điểm có nguy cơ cháy nổ do cỏ khô tích tụ",
    category: "fire_safety",
    status: "pending",
    type: "report",
    description: "Khu đất trống ngập tràn cỏ khô úa, dễ phát hỏa khi trời nắng nóng.",
  },
  {
    id: "rep-6",
    position: [16.0130, 108.2145],
    title: "Nắp cống bị vỡ trên vỉa hè",
    category: "infrastructure",
    status: "resolved",
    type: "report",
    description: "Hố ga mất nắp nguy hiểm cho người đi bộ lúc chiều tối.",
  },
  {
    id: "rep-7",
    position: [16.0105, 108.2230],
    title: "Rác thải hữu cơ bốc mùi quanh hồ điều hòa",
    category: "environment",
    status: "inProgress",
    type: "report",
    description: "Hồ điều hòa Hòa Xuân có lượng rác lớn ứ đọng góc phía Đông.",
  },
  {
    id: "rep-8",
    position: [16.0142, 108.2202],
    title: "Đèn chiếu sáng công cộng bị hỏng",
    category: "public_safety",
    status: "resolved",
    type: "report",
    description: "Cả tuyến phố tối tăm do 3 bóng cao áp liên tiếp bị cháy hỏng.",
  },
  {
    id: "rep-9",
    position: [16.0182, 108.2218],
    title: "Dây cáp viễn thông sà xuống mặt đường",
    category: "public_safety",
    status: "pending",
    type: "report",
    description: "Bó cáp quang sập xệ đe dọa an toàn giao thông của xe tải lớn.",
  },
  {
    id: "rep-10",
    position: [16.0160, 108.2130],
    title: "Phế thải công nghiệp đổ trộm góc đường",
    category: "environment",
    status: "inProgress",
    type: "report",
    description: "Nhiều lốp xe cũ và vỏ bình sơn chồng đống bên lề đường.",
  },
  {
    id: "rep-11",
    position: [16.0118, 108.2178],
    title: "Sụt lún vỉa hè nghiêm trọng",
    category: "infrastructure",
    status: "pending",
    type: "report",
    description: "Gạch lát vỉa hè sụt tạo hố sâu hơn 30cm do mưa lớn xói mòn.",
  },
  {
    id: "rep-12",
    position: [16.0202, 108.2195],
    title: "Xả nước thải sinh hoạt ra kênh hở",
    category: "environment",
    status: "inProgress",
    type: "report",
    description: "Cơ sở rửa xe xả trực tiếp nước xà phòng ra kênh đất công cộng.",
  },
  {
    id: "rep-13",
    position: [16.0152, 108.2255],
    title: "Giàn giáo xây dựng mất an toàn",
    category: "construction",
    status: "resolved",
    type: "report",
    description: "Công trình thi công cao tầng không có lưới chắn bụi rơi.",
  },
  {
    id: "rep-14",
    position: [16.0090, 108.2205],
    title: "Tấm tôn quảng cáo che khuất tầm nhìn góc cua",
    category: "public_safety",
    status: "inProgress",
    type: "report",
    description: "Biển quảng cáo cỡ lớn đặt sai quy định tại nút giao che khuất tầm quan sát.",
  },
  {
    id: "rep-15",
    position: [16.0125, 108.2110],
    title: "Hóa chất thải đổ trực tiếp góc công viên",
    category: "environment",
    status: "pending",
    type: "report",
    description: "Có mùi dầu hỏa nồng nặc và vệt dầu đen tràn trên thảm cỏ.",
  },
  {
    id: "rep-16",
    position: [16.0170, 108.2270],
    title: "Nối điện câu móc trái phép ngoài trời",
    category: "fire_safety",
    status: "pending",
    type: "report",
    description: "Tuyến đường dây tạm dẫn từ trạm hạ thế chằng chịt không có ống bọc cách điện.",
  },
  {
    id: "rep-17",
    position: [16.0145, 108.2240],
    title: "Bia mộ, rác tâm linh vứt bỏ bừa bãi",
    category: "environment",
    status: "resolved",
    type: "report",
    description: "Vụn bát hương và đồ cúng cũ đổ ngay gốc đa cổ thụ đầu làng cũ.",
  },
  {
    id: "rep-18",
    position: [16.0075, 108.2185],
    title: "Hố đào không có rào chắn cảnh báo",
    category: "infrastructure",
    status: "inProgress",
    type: "report",
    description: "Hố lắp đặt ống nước đào dở dang trên hè phố bỏ mặc hơn 3 ngày.",
  },
];

// PROBLEM HOTSPOTS
const hotspots = [
  { position: [16.0155, 108.2220] as [number, number], radius: 150, title: "Điểm nóng A: Ô nhiễm bãi rác tự phát lớn" },
  { position: [16.0175, 108.2175] as [number, number], radius: 100, title: "Điểm nóng B: Tắc nghẽn mương thoát nước chính" },
];

function getCustomIcon(L: any, markerType: string, status?: string) {
  if (typeof window === "undefined" || !L) return null;

  let color = "#1E5EFF"; // Default Primary Blue
  let innerIconSvg = "";

  if (markerType === "meeting") {
    color = "#8B5CF6"; // Purple for meeting
    innerIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
  } else if (markerType === "coordination") {
    color = "#E11D48"; // Crimson Red for coordination
    innerIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>`;
  } else if (markerType === "checkpoint") {
    color = "#F59E0B"; // Amber for check points
    innerIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>`;
  } else {
    // report markers
    const colorMap: Record<string, string> = {
      pending: "#F59E0B",    // Orange
      inProgress: "#1E5EFF", // Blue
      resolved: "#22C55E",   // Green
    };
    color = colorMap[status || "pending"] || "#1E5EFF";
    innerIconSvg = `<circle cx="12" cy="12" r="6" fill="white" />`;
  }

  return L.divIcon({
    className: "custom-campaign-marker",
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          width: 24px;
          height: 24px;
          border-radius: 50% 50% 50% 0;
          background: ${color};
          border: 2px solid #ffffff;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
          transform: rotate(-45deg);
        "></div>
        <div style="
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        ">
          ${innerIconSvg}
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  });
}

export function CampaignMap({ height = "600px" }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [showHotspots, setShowHotspots] = useState(true);
  const [showBoundary, setShowBoundary] = useState(true);

  const [modules, setModules] = useState<{
    MapContainer: any;
    TileLayer: any;
    Marker: any;
    Popup: any;
    Circle: any;
    Polygon: any;
    L: any;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      import("react-leaflet"),
      import("leaflet")
    ]).then(([rl, LMod]) => {
      if (!cancelled) {
        setModules({
          MapContainer: rl.MapContainer,
          TileLayer: rl.TileLayer,
          Marker: rl.Marker,
          Popup: rl.Popup,
          Circle: rl.Circle,
          Polygon: rl.Polygon,
          L: LMod.default || LMod
        });
      }
    });
    return () => { cancelled = true; };
  }, []);

  const center: [number, number] = [16.015, 108.220];

  const allMarkers = useMemo(() => {
    return [...staticMarkers, ...citizenReports];
  }, []);

  const filteredMarkers = useMemo(() => {
    return allMarkers.filter((m) => {
      // Category filter
      if (selectedCategory !== "all" && m.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus !== "all" && m.status !== selectedStatus) {
        return false;
      }
      // Type filter
      if (selectedType !== "all" && m.type !== selectedType) {
        return false;
      }
      return true;
    });
  }, [allMarkers, selectedCategory, selectedStatus, selectedType]);

  const toggleCategory = (cat: string) => {
    setSelectedCategory((prev) => (prev === cat ? "all" : cat));
  };

  if (!modules) {
    return (
      <div className="flex flex-col rounded-[20px] overflow-hidden border border-[#E4EAF2] bg-slate-50 flex items-center justify-center" style={{ height }}>
        <span className="text-slate-400 text-sm font-semibold">Đang tải bản đồ chiến dịch...</span>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, L } = modules;

  return (
    <div className="flex flex-col rounded-[20px] overflow-hidden border border-[#E4EAF2] bg-white shadow-sm">
      {/* Top Filter Bar */}
      <div className="p-4 border-b border-[#E4EAF2] flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-2">
            <Layers size={14} className="text-slate-500" />
            Lọc phản ánh:
          </span>
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
              selectedCategory === "all"
                ? "bg-[#1E5EFF] text-white border-[#1E5EFF]"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => toggleCategory("environment")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
              selectedCategory === "environment"
                ? "bg-[#22C55E] text-white border-[#22C55E]"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            Môi trường
          </button>
          <button
            onClick={() => toggleCategory("infrastructure")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
              selectedCategory === "infrastructure"
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            Hạ tầng đô thị
          </button>
          <button
            onClick={() => toggleCategory("public_safety")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
              selectedCategory === "public_safety"
                ? "bg-[#1E5EFF] text-white border-[#1E5EFF]"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            An toàn công cộng
          </button>
          <button
            onClick={() => toggleCategory("construction")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
              selectedCategory === "construction"
                ? "bg-amber-600 text-white border-amber-600"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            Xây dựng
          </button>
          <button
            onClick={() => toggleCategory("fire_safety")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
              selectedCategory === "fire_safety"
                ? "bg-[#EF4444] text-white border-[#EF4444]"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            Phòng cháy
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-700 outline-none"
          >
            <option value="all">Mọi trạng thái</option>
            <option value="pending">Chờ tiếp nhận</option>
            <option value="inProgress">Đang xử lý</option>
            <option value="resolved">Đã hoàn thành</option>
          </select>

          {/* Toggle Map layers */}
          <button
            onClick={() => setShowHotspots(!showHotspots)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition flex items-center gap-1.5 ${
              showHotspots
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-white text-slate-500 border-slate-200"
            }`}
          >
            <AlertOctagon size={13} />
            Điểm nóng
          </button>
          <button
            onClick={() => setShowBoundary(!showBoundary)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition flex items-center gap-1.5 ${
              showBoundary
                ? "bg-blue-50 text-[#1E5EFF] border-blue-200"
                : "bg-white text-slate-500 border-slate-200"
            }`}
          >
            <Compass size={13} />
            Ranh giới
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div style={{ height }} className="relative z-10">
        <MapContainer
          center={center}
          zoom={15}
          className="w-full h-full"
          zoomControl={true}
          dragging={true}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution="&copy; Google Maps"
            url="https://mt1.google.com/vt/lyrs=m&hl=vi&gl=VN&x={x}&y={y}&z={z}"
          />

          {/* Ward Boundary Outline */}
          {showBoundary && (
            <Polygon
              positions={hoaXuanBoundary}
              pathOptions={{
                color: "#1E5EFF",
                weight: 2,
                fillColor: "#1E5EFF",
                fillOpacity: 0.03,
                dashArray: "8, 8",
              }}
            />
          )}

          {/* Campaign Circular Boundary (750m) */}
          {showBoundary && (
            <Circle
              center={center}
              radius={750}
              pathOptions={{
                color: "#1E5EFF",
                weight: 1.5,
                fillColor: "#1E5EFF",
                fillOpacity: 0.05,
                dashArray: "4, 4",
              }}
            />
          )}

          {/* Problem Hotspots Heatmap representation */}
          {showHotspots &&
            hotspots.map((spot, i) => (
              <Circle
                key={i}
                center={spot.position}
                radius={spot.radius}
                pathOptions={{
                  color: "#EF4444",
                  weight: 1,
                  fillColor: "#EF4444",
                  fillOpacity: 0.15,
                }}
              />
            ))}

          {/* Render markers */}
          {filteredMarkers.map((m) => {
            const icon = getCustomIcon(L, m.type, m.status);
            return (
              <Marker key={m.id} position={m.position} icon={icon || undefined}>
                <Popup>
                  <div className="p-2 max-w-[240px]">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                          m.type === "meeting"
                            ? "bg-purple-100 text-purple-700"
                            : m.type === "coordination"
                              ? "bg-red-100 text-red-700"
                              : m.type === "checkpoint"
                                ? "bg-amber-100 text-amber-700"
                                : m.status === "resolved"
                                  ? "bg-green-100 text-green-700"
                                  : m.status === "inProgress"
                                    ? "bg-blue-100 text-[#1E5EFF]"
                                    : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {m.type === "meeting"
                          ? "Tập kết"
                          : m.type === "coordination"
                            ? "Điều phối"
                            : m.type === "checkpoint"
                              ? "Trạm tiếp tế"
                              : m.status === "resolved"
                                ? "Đã giải quyết"
                                : m.status === "inProgress"
                                  ? "Đang xử lý"
                                  : "Chờ tiếp nhận"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">
                        {m.category.replace("_", " ")}
                      </span>
                    </div>
                    <strong className="text-slate-800 text-sm font-extrabold block leading-snug">
                      {m.title}
                    </strong>
                    <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                      {m.description}
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Map Legend Footer */}
      <div className="p-4 border-t border-[#E4EAF2] bg-slate-50/50 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-[#8B5CF6] border-2 border-white shadow-sm flex items-center justify-center text-[8px] text-white">★</span>
            <span>Điểm tập kết</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-[#E11D48] border-2 border-white shadow-sm" />
            <span>Điểm chỉ huy (UBND)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-[#F59E0B] border-2 border-white shadow-sm" />
            <span>Trạm tiếp tế</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-[#22C55E] border-2 border-white shadow-sm" />
            <span>Phản ánh đã xong</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-[#1E5EFF] border-2 border-white shadow-sm" />
            <span>Phản ánh đang xử lý</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-[#F59E0B] border-2 border-white shadow-sm" />
            <span>Phản ánh chờ xử lý</span>
          </div>
        </div>

        <a
          href="https://maps.google.com/?q=16.015,108.220"
          target="_blank"
          rel="noreferrer"
          className="text-[#1E5EFF] font-bold hover:underline flex items-center gap-1 shrink-0"
        >
          Xem trên Google Maps →
        </a>
      </div>
    </div>
  );
}
