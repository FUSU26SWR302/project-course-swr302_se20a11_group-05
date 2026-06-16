import { lazy, Suspense } from "react";
import { useI18n } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { useFeedbacks } from "@/hooks";
import { useFeedbackNotification } from "@/hooks/use-notification";
import { analyticsApi } from "@/lib/api";
import type {
  KpiData,
  WardPerformance,
  MonthlyTrend,
  DispatchAgency,
} from "@/types/api";
import { kpis as mockKpis, wardPerformance as mockWardPerf, reports as mockReports } from "@/lib/mock-data";
import { DemoBanner } from "@/components/site/DemoBanner";
import { Skeleton } from "@/components/ui/skeleton";
import { StaffShell } from "@/components/site/StaffShell";
import { mapStatus } from "@/lib/status";
import { DonutChart, HorizontalBarChart, Sparkline, textClassToHex } from "@/components/site/KpiChart";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import {
  Download,
  Settings,
  Users,
  TrendingUp,
} from "lucide-react";
import { WeatherForecastPanel } from "./WeatherForecastPanel";

const CivicMap = lazy(() => import("@/components/site/CivicMap").then(m => ({ default: m.CivicMap })));

export function CityAdminDashboard() {
  const { t, locale } = useI18n();
  useFeedbackNotification(); // WebSocket real-time updates

  const { data: feedbacksPage, isLoading } = useFeedbacks(0, 200);
  const { data: analyticsKpi, isLoading: kpiLoading } = useQuery<KpiData>({
    queryKey: ["analytics", "kpi"],
    queryFn: () => analyticsApi.kpi(),
    staleTime: 60_000,
  });
  const { data: wardPerf, isLoading: wardLoading } = useQuery<WardPerformance[]>({
    queryKey: ["analytics", "ward-performance"],
    queryFn: () => analyticsApi.wardPerformance(),
    staleTime: 60_000,
  });
  const { data: monthlyTrend } = useQuery<MonthlyTrend[]>({
    queryKey: ["analytics", "monthly-trend"],
    queryFn: () => analyticsApi.monthlyTrend(12),
    staleTime: 60_000,
  });
  const { data: dispatchAgencies } = useQuery<DispatchAgency[]>({
    queryKey: ["analytics", "dispatch"],
    queryFn: () => analyticsApi.dispatch(),
    staleTime: 60_000,
  });

  const hasApiData = !!feedbacksPage && feedbacksPage.content.length > 0;
  const apiFeedbacks = feedbacksPage?.content ?? [];

  // Resolve KPI: analytics API → feedback-based fallback → mock
  const currentKpis: { total: number; resolved: number; pending: number; satisfactionRate: string } =
    analyticsKpi ?? (hasApiData ? {
      total: apiFeedbacks.length,
      resolved: apiFeedbacks.filter(d => d.status === "RESOLVED").length,
      pending: apiFeedbacks.filter(d => d.status !== "RESOLVED").length,
      satisfactionRate: "Đang tính...",
    } : { total: mockKpis.total, resolved: mockKpis.resolved, pending: mockKpis.pending, satisfactionRate: "94%" });

  const wardData = (wardPerf ?? mockWardPerf) as WardPerformance[];
  const maxResolved = Math.max(0, ...wardData.map((w: WardPerformance) => w.resolved || 0));

  return (
    <StaffShell
      accent="gold"
      eyebrow={locale === "vi" ? "Lãnh đạo thành phố" : "City leadership"}
      title={t("city.title")}
      org="UBND Thành phố Đà Nẵng · Trung tâm IOC"
    >
      <div className="flex flex-wrap justify-end gap-2 mb-6">
        <button className="btn-civic btn-civic-ghost">
          <Users size={18} /> Quản lý tài khoản
        </button>
        <button className="btn-civic btn-civic-ghost">
          <Settings size={18} /> Cấu hình
        </button>
        <button className="btn-civic btn-civic-primary">
          <Download size={18} /> {t("city.export")}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: t("home.kpi.total"), val: currentKpis.total.toLocaleString(), border: "border-gov-blue", color: "text-gov-blue", spark: [42, 56, 48, 72, 65, 80, 78, 92, 88, 95, 102, 98] },
          { label: t("home.kpi.resolved"), val: currentKpis.resolved.toLocaleString(), border: "border-[var(--status-success)]", color: "text-[var(--status-success)]", spark: [30, 45, 38, 52, 48, 60, 58, 70, 68, 75, 82, 78] },
          { label: t("home.kpi.pending"), val: currentKpis.pending.toLocaleString(), border: "border-[var(--status-pending)]", color: "text-[var(--status-pending)]", spark: [18, 22, 15, 25, 20, 18, 28, 22, 16, 20, 18, 12] },
          { label: "Tỷ lệ hài lòng", val: analyticsKpi ? analyticsKpi.satisfactionRate : "Đang tính...", border: "border-gov-gold", color: "text-gov-blue", spark: [88, 90, 85, 92, 91, 94, 93, 95, 92, 94, 93, 94] },
        ].map((k, idx) => (
          <div
            key={k.label}
            className={`card-civic p-5 border-l-4 ${k.border} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up stagger-${(idx % 4) + 1}`}
          >
            <div className="text-xs uppercase font-bold text-ink-soft tracking-wider mb-2">{k.label}</div>
            <div className={`text-3xl font-bold ${k.color}`}>
              {kpiLoading && !analyticsKpi ? <Skeleton className="h-9 w-20 rounded" /> : k.val}
            </div>
            <Sparkline data={k.spark} color={textClassToHex(k.color)} height={36} />
          </div>
        ))}
      </div>

      {/* Donut + Ward Performance */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <DonutChart resolved={currentKpis.resolved} pending={currentKpis.pending} />
        <HorizontalBarChart
          data={wardData.map((w: WardPerformance) => ({ name: w.name || w.ward || "", value: w.resolved }))}
          title={t("city.kpi.wardPerf")}
          color="#2563eb"
          unit=""
        />
      </div>

      {/* Monthly trend */}
      <div className="card-civic p-6 mb-8 animate-fade-in">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={20} className="text-gov-blue" />
          <h2 className="text-xl font-bold text-ink">Tổng quan / Overview</h2>
        </div>
        <p className="text-sm text-ink-soft mb-5">Xu hướng phản ánh 12 tháng gần đây</p>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={monthlyTrend ?? [
                { month: "T6", total: 82, resolved: 58 },
                { month: "T7", total: 95, resolved: 62 },
                { month: "T8", total: 88, resolved: 60 },
                { month: "T9", total: 110, resolved: 75 },
                { month: "T10", total: 104, resolved: 70 },
                { month: "T11", total: 120, resolved: 82 },
                { month: "T12", total: 98, resolved: 68 },
                { month: "T1", total: 76, resolved: 54 },
                { month: "T2", total: 92, resolved: 66 },
                { month: "T3", total: 108, resolved: 78 },
                { month: "T4", total: 115, resolved: 85 },
                { month: "T5", total: 102, resolved: 72 },
              ]}
              margin={{ top: 8, right: 16, bottom: 0, left: -16 }}
            >
              <defs>
                <linearGradient id="trendTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="trendResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 13 }} />
              <Area type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} fill="url(#trendTotal)" name="Tổng số" />
              <Area type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} fill="url(#trendResolved)" name="Đã xử lý" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Map */}
        <div className="lg:col-span-7 card-civic p-0 overflow-hidden animate-fade-in">
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
            <h2 className="text-white font-heading text-xl">Bản đồ nhiệt toàn thành phố</h2>
            <span className="text-xs font-mono uppercase tracking-widest bg-[var(--status-danger)]/20 text-[var(--status-danger)] px-3 py-1 rounded">
              {apiFeedbacks.filter(f => f.latitude && f.longitude).length} điểm
            </span>
          </div>
          <Suspense fallback={<div className="w-full h-[420px] bg-slate-800 animate-pulse" />}>
            <CivicMap
              center={[16.0544, 108.2022]}
              zoom={12}
              markers={apiFeedbacks.length > 0
                ? apiFeedbacks.filter(f => f.latitude && f.longitude).slice(0, 50).map(f => ({
                    position: [f.latitude!, f.longitude!] as [number, number],
                    title: f.title,
                    description: f.description,
                    status: mapStatus(f.status) as any,
                  }))
                : [
                    { position: [16.062, 108.222], title: mockReports[0].title.vi, status: mockReports[0].status },
                    { position: [16.080, 108.155], title: mockReports[1].title.vi, status: mockReports[1].status },
                    { position: [16.078, 108.158], title: mockReports[2].title.vi, status: mockReports[2].status },
                    { position: [16.060, 108.228], title: mockReports[3].title.vi, status: mockReports[3].status },
                    { position: [16.070, 108.210], title: "Phản ánh hạ tầng Hải Châu", status: "inProgress" },
                    { position: [16.048, 108.215], title: "Phản ánh môi trường Sơn Trà", status: "pending" },
                    { position: [16.065, 108.240], title: "Phản ánh an toàn Ngũ Hành Sơn", status: "urgent" },
                    { position: [16.092, 108.175], title: "Phản ánh giao thông Thanh Khê", status: "resolved" },
                    { position: [16.040, 108.180], title: "Phản ánh vệ sinh Cẩm Lệ", status: "pending" },
                  ]
              }
              height="420px"
            />
          </Suspense>
        </div>

        {/* Ward leaderboard — now from API */}
        <div className="lg:col-span-5 card-civic p-6">
          <h2 className="text-xl mb-5">{t("city.kpi.wardPerf")}</h2>
          {wardLoading && !wardPerf ? (
            <div className="space-y-4">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 rounded" />)}
            </div>
          ) : (
          <ul className="space-y-4">
            {wardData.map((w: WardPerformance, idx: number) => (
              <li key={w.name || w.ward} className={`animate-fade-in-up stagger-${(idx % 4) + 1}`}>
                <div className="flex justify-between mb-1.5">
                  <span className="font-semibold text-ink">{w.name || w.ward}</span>
                  <span className="text-sm text-ink-soft">{w.resolved} · {w.satisfactionPct ?? 0}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-gov-blue" style={{ width: `${(w.resolved / (maxResolved || 1)) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          )}
        </div>
      </div>

      {/* Inter-agency dispatch — now from API */}
      <div className="mt-8 card-civic p-6 animate-slide-in-right">
        <h2 className="text-xl mb-4">Điều phối liên ngành / Inter-agency dispatch</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {(dispatchAgencies ?? [
            { name: "Điện lực EVN", pendingCount: 23, status: "ok" },
            { name: "Viễn thông VNPT", pendingCount: 8, status: "ok" },
            { name: "Cấp thoát nước DAWACO", pendingCount: 14, status: "warn" },
          ]).map((p: DispatchAgency) => (
            <div key={p.name} className="border border-slate-200 rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="font-bold text-ink mb-1">{p.name}</div>
              <div className="text-sm text-ink-soft mb-3">Đơn chờ xử lý: {p.pendingCount}</div>
              <button className="btn-civic btn-civic-ghost w-full text-sm">Chuyển đơn mới</button>
            </div>
          ))}
        </div>
      </div>

      {!hasApiData && !isLoading && <DemoBanner />}

      {/* Weather Forecast Panel (extracted) */}
      <WeatherForecastPanel />
    </StaffShell>
  );
}
