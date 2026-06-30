import { lazy, Suspense, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi, feedbackApi, type KpiData, type WardPerformance, type MonthlyTrend } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText, Clock, RefreshCw, AlertCircle,
  Building2, Leaf, Flame, Shield, Car,
} from "lucide-react";
// @ts-ignore
import { Construction } from "lucide-react";
import { FeedbackDetailModal } from "./FeedbackDetailModal";

const SuperAdminMap = lazy(() =>
  import("../SuperAdminMap").then((m) => ({ default: m.SuperAdminMap })),
);

const mapCategoryName = (name: string | null | undefined): string => {
  if (!name) return "Hạ tầng đô thị";
  const n = name.toLowerCase();
  if (n.includes("giao thông") || n.includes("traffic")) return "Giao thông";
  if (n.includes("môi trường") || n.includes("environment") || n.includes("rác")) return "Môi trường";
  if (n.includes("an ninh") || n.includes("security") || n.includes("trật tự")) return "An ninh trật tự";
  if (n.includes("xây dựng") || n.includes("construction")) return "Xây dựng";
  if (n.includes("phòng cháy") || n.includes("fire")) return "Phòng cháy chữa cháy";
  return "Hạ tầng đô thị";
};

const getCategoryIcon = (catName: string) => {
  switch (catName) {
    case "Giao thông": return <Car className="w-5 h-5" />;
    case "Hạ tầng đô thị": return <Building2 className="w-5 h-5" />;
    case "Môi trường": return <Leaf className="w-5 h-5" />;
    case "An ninh trật tự": return <Shield className="w-5 h-5" />;
    case "Xây dựng": return <Building2 className="w-5 h-5" />;
    case "Phòng cháy chữa cháy": return <Flame className="w-5 h-5" />;
    default: return <Building2 className="w-5 h-5" />;
  }
};

function getOverdueTime(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHrs < 24) return `${diffHrs} giờ`;
  return `${Math.floor(diffHrs / 24)} ngày`;
}

const DEFAULT_WARDS = ["Hải Châu", "Thanh Khê", "Liên Chiểu", "Sơn Trà", "Ngũ Hành Sơn", "Cẩm Lệ", "Hòa Vang"];
const WARD_COORDS: Record<string, [number, number]> = {
  "Hải Châu": [16.047, 108.218], "Thanh Khê": [16.062, 108.182],
  "Liên Chiểu": [16.079, 108.152], "Sơn Trà": [16.085, 108.244],
  "Ngũ Hành Sơn": [16.023, 108.258], "Cẩm Lệ": [16.014, 108.173],
  "Hòa Vang": [15.992, 108.115],
};

export function OverviewPage() {
  const [selectedWard, setSelectedWard] = useState<string | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<number | null>(null);

  const { data: feedbacksPage, isLoading: feedbacksLoading } = useQuery({
    queryKey: ["admin", "feedbacks", "all"],
    queryFn: () => feedbackApi.adminGetAll(0, 500),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const { data: analyticsKpi, isLoading: kpiLoading } = useQuery<KpiData>({
    queryKey: ["analytics", "kpi"],
    queryFn: () => analyticsApi.kpi(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const { data: monthlyTrend } = useQuery<MonthlyTrend[]>({
    queryKey: ["analytics", "monthly-trend"],
    queryFn: () => analyticsApi.monthlyTrend(12),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const feedbacks = feedbacksPage?.content ?? [];

  const totalCount = feedbacks.length || analyticsKpi?.total || 0;
  const unresolvedCount = feedbacks.filter(f => f.status !== "RESOLVED" && f.status !== "REJECTED").length;
  const inProgressCount = feedbacks.filter(f => ["IN_PROGRESS","ASSIGNED","WAITING_INFO"].includes(f.status)).length;
  const overdueCount = feedbacks.filter(f => {
    if (f.status === "RESOLVED" || f.status === "REJECTED") return false;
    return (Date.now() - new Date(f.createdAt).getTime()) > 3 * 86400000;
  }).length;

  const getTrend = (key: "total" | "resolved") => {
    if (!monthlyTrend || monthlyTrend.length < 2) return null;
    const cur = monthlyTrend[monthlyTrend.length - 1];
    const prev = monthlyTrend[monthlyTrend.length - 2];
    if (!prev || prev[key] === 0) return null;
    const diff = cur[key] - prev[key];
    return { pct: Math.abs((diff / prev[key]) * 100).toFixed(1) + "%", isUp: diff >= 0 };
  };
  const totalTrend = getTrend("total");
  const resolvedTrend = getTrend("resolved");

  const areaHotspots = useMemo(() => {
    const map: Record<string, { total: number; unresolved: number; overdue: number; cats: Record<string, number> }> = {};
    DEFAULT_WARDS.forEach(w => { map[w] = { total: 0, unresolved: 0, overdue: 0, cats: {} }; });
    feedbacks.forEach(fb => {
      const w = DEFAULT_WARDS.find(w => fb.wardName?.toLowerCase().includes(w.toLowerCase()) || fb.addressDetails?.toLowerCase().includes(w.toLowerCase()));
      if (!w) return;
      map[w].total++;
      if (fb.status !== "RESOLVED" && fb.status !== "REJECTED") {
        map[w].unresolved++;
        if ((Date.now() - new Date(fb.createdAt).getTime()) > 3 * 86400000) map[w].overdue++;
        const cat = mapCategoryName(fb.categoryName);
        map[w].cats[cat] = (map[w].cats[cat] || 0) + 1;
      }
    });
    return DEFAULT_WARDS.map(name => {
      const d = map[name];
      const topCategory = Object.entries(d.cats).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
      const coords = WARD_COORDS[name] || [16.0544, 108.2022];
      return { name, lat: coords[0], lng: coords[1], total: d.total, unresolved: d.unresolved, overdue: d.overdue, unresolvedPct: d.total > 0 ? (d.unresolved / d.total) * 100 : 0, topCategory };
    });
  }, [feedbacks]);

  const rankedAreas = useMemo(() => [...areaHotspots].sort((a, b) => b.unresolved - a.unresolved).slice(0, 5), [areaHotspots]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { "Giao thông": 0, "Hạ tầng đô thị": 0, "Môi trường": 0, "An ninh trật tự": 0, "Xây dựng": 0, "Phòng cháy chữa cháy": 0 };
    feedbacks.forEach(fb => {
      if (fb.status !== "RESOLVED" && fb.status !== "REJECTED") {
        const cat = mapCategoryName(fb.categoryName);
        if (cat in counts) counts[cat]++;
      }
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [feedbacks]);
  const maxCat = Math.max(1, ...categoryCounts.map(c => c.count));

  const priorityReports = useMemo(() => {
    return feedbacks
      .filter(fb => fb.status !== "RESOLVED" && fb.status !== "REJECTED")
      .map(fb => {
        const diffDays = Math.ceil((Date.now() - new Date(fb.createdAt).getTime()) / 86400000);
        const ward = DEFAULT_WARDS.find(w => fb.wardName?.toLowerCase().includes(w.toLowerCase())) || "Đà Nẵng";
        const status = diffDays > 3 ? "Quá hạn" : diffDays >= 1 ? "Sắp quá hạn" : "Đang xử lý";
        const color = diffDays > 3 ? "bg-red-50 text-red-600 border-red-100" : diffDays >= 1 ? "bg-orange-50 text-orange-600 border-orange-100" : "bg-blue-50 text-blue-600 border-blue-100";
        return { id: fb.id, trackingCode: fb.trackingCode || `PA-${fb.id}`, ward, category: mapCategoryName(fb.categoryName), status, color, overdueTime: getOverdueTime(fb.createdAt), diffDays };
      })
      .sort((a, b) => b.diffDays - a.diffDays)
      .slice(0, 8);
  }, [feedbacks]);

  const kpiCards = [
    { label: "Tổng phản ánh", value: totalCount, color: "border-[#0B4FC4]", icon: FileText, iconBg: "bg-blue-50 text-[#0B4FC4]", textColor: "text-[#1D2939]", trend: totalTrend, loading: kpiLoading },
    { label: "Chưa xử lý", value: unresolvedCount, color: "border-orange-500", icon: Clock, iconBg: "bg-orange-50 text-orange-500", textColor: "text-orange-600", trend: totalTrend, loading: feedbacksLoading },
    { label: "Đang xử lý", value: inProgressCount, color: "border-blue-500", icon: RefreshCw, iconBg: "bg-blue-50 text-blue-500", textColor: "text-blue-600", trend: resolvedTrend, loading: feedbacksLoading },
    { label: "Quá hạn", value: overdueCount, color: "border-red-500", icon: AlertCircle, iconBg: "bg-red-50 text-red-500", textColor: "text-red-600", trend: resolvedTrend, loading: feedbacksLoading },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className={`bg-white rounded-2xl p-5 border-l-4 ${kpi.color} shadow-sm flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all`}>
              <div className={`w-12 h-12 rounded-full ${kpi.iconBg} flex items-center justify-center shrink-0`}>
                <Icon size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</span>
                <h3 className={`text-2xl font-extrabold mt-0.5 font-sans ${kpi.textColor}`}>
                  {kpi.loading ? <Skeleton className="h-8 w-20" /> : kpi.value.toLocaleString("vi-VN")}
                </h3>
                {kpi.trend && (
                  <span className={`text-[10px] font-bold flex items-center gap-0.5 mt-1 ${kpi.trend.isUp ? "text-green-600" : "text-red-600"}`}>
                    {kpi.trend.isUp ? "↗" : "↘"} {kpi.trend.pct} so với tháng trước
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Map + Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[440px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-[#0B4FC4]">Bản đồ điểm nóng theo khu vực</h3>
          </div>
          <div className="flex-1 relative min-h-[300px]">
            <Suspense fallback={<div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm">Đang tải bản đồ...</div>}>
              {feedbacksLoading
                ? (
                  <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center gap-3 min-h-[300px]">
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-4 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-36 rounded" />
                    <div className="w-full px-8 space-y-2 mt-2">
                      <Skeleton className="h-24 w-full rounded-xl" />
                      <div className="grid grid-cols-3 gap-2">
                        <Skeleton className="h-16 rounded-lg" />
                        <Skeleton className="h-16 rounded-lg" />
                        <Skeleton className="h-16 rounded-lg" />
                      </div>
                    </div>
                  </div>
                )
                : <SuperAdminMap hotspots={areaHotspots} onSelectWard={w => setSelectedWard(w === selectedWard ? undefined : w)} selectedWard={selectedWard} />
              }
            </Suspense>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Mức độ điểm nóng (chưa xử lý)</span>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-600">Thấp</span>
              <div className="flex-1 h-3 rounded-full bg-gradient-to-r from-[#FCD34D] via-[#F97316] to-[#EF4444]" />
              <span className="text-xs font-semibold text-slate-600">Cao</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm p-5 flex flex-col">
          <h3 className="text-lg font-bold text-[#0B4FC4] border-b border-slate-100 pb-3 mb-4">Khu vực cần ưu tiên</h3>
          {feedbacksLoading
            ? <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            : rankedAreas.length === 0
              ? <div className="py-12 text-center text-xs text-slate-400">Chưa có khu vực cần ưu tiên.</div>
              : (
                <table className="w-full text-left">
                  <thead><tr className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                    <th className="pb-3 w-8">#</th><th className="pb-3">Khu vực</th><th className="pb-3 text-center">Tổng</th><th className="pb-3 text-center">Chưa xử lý</th><th className="pb-3 text-right">%</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {rankedAreas.map((area, idx) => {
                      const rankColor = idx === 0 ? "bg-red-100 text-red-600" : idx === 1 ? "bg-orange-100 text-orange-600" : idx === 2 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-600";
                      return (
                        <tr key={area.name} onClick={() => setSelectedWard(area.name === selectedWard ? undefined : area.name)}
                          className={`cursor-pointer hover:bg-slate-50 transition-colors ${selectedWard === area.name ? "bg-blue-50" : ""}`}>
                          <td className="py-3"><span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${rankColor}`}>{idx + 1}</span></td>
                          <td className="py-3 text-xs font-bold text-slate-800">{area.name}</td>
                          <td className="py-3 text-center text-xs text-slate-600">{area.total}</td>
                          <td className="py-3 text-center"><span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-bold">{area.unresolved}</span></td>
                          <td className="py-3 text-right text-xs font-bold text-slate-700">{area.unresolvedPct.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )
          }
        </div>
      </div>

      {/* Category + Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-lg font-bold text-[#0B4FC4] border-b border-slate-100 pb-3 mb-4">Phản ánh chưa xử lý theo lĩnh vực</h3>
          <div className="space-y-3">
            {categoryCounts.map(cat => {
              const pct = (cat.count / maxCat) * 100;
              const isSelected = selectedCategory === cat.name;
              return (
                <button key={cat.name} onClick={() => setSelectedCategory(isSelected ? undefined : cat.name)}
                  className={`w-full text-left flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors ${isSelected ? "bg-blue-50" : ""}`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all ${isSelected ? "bg-[#0B4FC4] text-white" : "bg-blue-50 text-[#0B4FC4]"}`}>
                    {getCategoryIcon(cat.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-slate-700">{cat.name}</span>
                      <span className="text-xs font-extrabold text-red-600">{cat.count}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-lg font-bold text-[#0B4FC4] border-b border-slate-100 pb-3 mb-4">Phản ánh ưu tiên cao</h3>
          {feedbacksLoading
            ? <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            : priorityReports.length === 0
              ? <div className="py-12 text-center text-xs text-slate-400">Chưa có phản ánh ưu tiên cao.</div>
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead><tr className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                      <th className="pb-3">Mã PA</th><th className="pb-3">Khu vực</th><th className="pb-3">Lĩnh vực</th><th className="pb-3 text-center">Trạng thái</th><th className="pb-3 text-right">Thời gian</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {priorityReports.map(r => (
                        <tr key={r.id} onClick={() => setSelectedFeedbackId(r.id)}
                          className="cursor-pointer hover:bg-slate-50 transition-colors group">
                          <td className="py-3 font-mono text-[11px] font-bold text-slate-700 group-hover:text-[#0B4FC4]">{r.trackingCode}</td>
                          <td className="py-3 text-xs font-semibold text-slate-800">{r.ward}</td>
                          <td className="py-3 text-xs text-slate-600">{r.category}</td>
                          <td className="py-3 text-center"><span className={`px-2 py-0.5 rounded border text-[10px] font-extrabold uppercase ${r.color}`}>{r.status}</span></td>
                          <td className="py-3 text-right text-xs font-semibold text-red-600">{r.overdueTime}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
          }
        </div>
      </div>
      <FeedbackDetailModal feedbackId={selectedFeedbackId} onClose={() => setSelectedFeedbackId(null)} />
    </div>
  );
}
