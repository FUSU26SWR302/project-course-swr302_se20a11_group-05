import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi, feedbackApi, type WardPerformance, type MonthlyTrend } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  Award,
  Download,
  FileText,
  Calendar,
  Filter,
  RefreshCw,
  PieChart,
  Activity,
  Users,
  MapPin,
  Target,
  AlertCircle,
  ChevronDown,
  TrendingDown,
  Minus
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  LineChart, 
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { toast } from "sonner";

export function ReportsPage() {
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [selectedWard, setSelectedWard] = useState<string>("all");
  const [reportType, setReportType] = useState<"overview" | "detailed">("overview");
  const [chartType, setChartType] = useState<"bar" | "line" | "area">("line");
  
  const { data: feedbacksPage, isLoading: fbLoading, refetch: refetchFeedbacks } = useQuery({
    queryKey: ["admin", "feedbacks", "all"],
    queryFn: () => feedbackApi.adminGetAll(0, 500),
    staleTime: 30_000,
  });
  const { data: wardPerf, isLoading: wardLoading } = useQuery<WardPerformance[]>({
    queryKey: ["analytics", "ward-performance"],
    queryFn: () => analyticsApi.wardPerformance(),
    staleTime: 30_000,
  });
  const { data: monthlyTrend, isLoading: trendLoading } = useQuery<MonthlyTrend[]>({
    queryKey: ["analytics", "monthly-trend"],
    queryFn: () => analyticsApi.monthlyTrend(12),
    staleTime: 30_000,
  });

  const feedbacks = feedbacksPage?.content ?? [];

  const categorySummary = useMemo(() => {
    const map: Record<string, { total: number; resolved: number }> = {};
    feedbacks.forEach(fb => {
      const cat = fb.categoryName || "Khác";
      if (!map[cat]) map[cat] = { total: 0, resolved: 0 };
      map[cat].total++;
      if (fb.status === "RESOLVED") map[cat].resolved++;
    });
    return Object.entries(map)
      .map(([name, d]) => ({ name, total: d.total, resolved: d.resolved, rate: d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [feedbacks]);

  const totalResolved = feedbacks.filter(f => f.status === "RESOLVED").length;
  const totalPending = feedbacks.filter(f => f.status === "PENDING").length;
  const totalInProgress = feedbacks.filter(f => f.status === "IN_PROGRESS").length;
  const resolutionRate = feedbacks.length > 0 ? Math.round((totalResolved / feedbacks.length) * 100) : 0;
  const avgResponseTime = "2.5 giờ"; // Mock data
  
  // Status distribution for pie chart
  const statusDistribution = useMemo(() => {
    const stats = [
      { name: "Đã giải quyết", value: totalResolved, color: "#22C55E" },
      { name: "Đang xử lý", value: totalInProgress, color: "#F59E0B" },
      { name: "Chờ xử lý", value: totalPending, color: "#EF4444" },
    ];
    return stats.filter(s => s.value > 0);
  }, [totalResolved, totalInProgress, totalPending]);

  // Priority distribution
  const priorityStats = useMemo(() => {
    const high = feedbacks.filter(f => f.priority === "HIGH" || f.priority === "URGENT").length;
    const medium = feedbacks.filter(f => f.priority === "MEDIUM").length;
    const low = feedbacks.filter(f => f.priority === "LOW").length;
    return [
      { name: "Cao", value: high, color: "#EF4444" },
      { name: "Trung bình", value: medium, color: "#F59E0B" },
      { name: "Thấp", value: low, color: "#22C55E" },
    ];
  }, [feedbacks]);

  // Response time trend (mock data)
  const responseTimeTrend = [
    { month: "T1", avgHours: 3.2 },
    { month: "T2", avgHours: 2.8 },
    { month: "T3", avgHours: 2.5 },
    { month: "T4", avgHours: 2.3 },
    { month: "T5", avgHours: 2.1 },
    { month: "T6", avgHours: 2.5 },
  ];

  // Export functions
  const exportToCSV = () => {
    toast.success("Đang xuất báo cáo CSV...");
    // Implementation for CSV export
  };

  const exportToPDF = () => {
    toast.success("Đang xuất báo cáo PDF...");
    // Implementation for PDF export
  };

  const exportToExcel = () => {
    toast.success("Đang xuất báo cáo Excel...");
    // Implementation for Excel export
  };

  const handleRefresh = () => {
    refetchFeedbacks();
    toast.success("Đã làm mới dữ liệu báo cáo");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#1D2939]">Báo cáo & Thống kê</h2>
        <p className="text-sm text-slate-500 mt-0.5">Phân tích hiệu suất xử lý phản ánh toàn thành phố</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tổng phản ánh", value: feedbacks.length, icon: BarChart3, color: "text-[#0B4FC4]", bg: "bg-blue-50" },
          { label: "Đã giải quyết", value: totalResolved, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
          { label: "Tỷ lệ giải quyết", value: `${resolutionRate}%`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Phường hoạt động", value: wardPerf?.length ?? 0, icon: Award, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.color} flex items-center justify-center shrink-0`}>
                <Icon size={18} />
              </div>
              <div>
                <div className={`text-xl font-extrabold ${s.color}`}>{fbLoading ? "—" : s.value}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-base font-bold text-[#0B4FC4] mb-4">Xu hướng phản ánh theo tháng</h3>
          {trendLoading
            ? <Skeleton className="h-48 w-full rounded-xl" />
            : !monthlyTrend || monthlyTrend.length === 0
              ? <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Chưa có dữ liệu</div>
              : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="total" stroke="#0B4FC4" strokeWidth={2} name="Tổng phản ánh" dot={false} />
                    <Line type="monotone" dataKey="resolved" stroke="#22C55E" strokeWidth={2} name="Đã giải quyết" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )
          }
        </div>

        {/* Category Bar Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-base font-bold text-[#0B4FC4] mb-4">Phản ánh theo lĩnh vực</h3>
          {fbLoading
            ? <Skeleton className="h-48 w-full rounded-xl" />
            : categorySummary.length === 0
              ? <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Chưa có dữ liệu</div>
              : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={categorySummary.slice(0, 6)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94A3B8" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="total" fill="#0B4FC4" name="Tổng" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="resolved" fill="#22C55E" name="Đã giải quyết" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )
          }
        </div>
      </div>

      {/* Ward Performance Table */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="text-base font-bold text-[#0B4FC4] border-b border-slate-100 pb-3 mb-4">Hiệu suất xử lý theo phường</h3>
        {wardLoading
          ? <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
          : !wardPerf || wardPerf.length === 0
            ? <div className="py-12 text-center text-sm text-slate-400">Chưa có dữ liệu phường.</div>
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-[10px] uppercase font-bold text-slate-500">
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Phường / Xã</th>
                      <th className="px-4 py-3 text-center">Đã giải quyết</th>
                      <th className="px-4 py-3 text-center">Tỷ lệ hài lòng</th>
                      <th className="px-4 py-3">Hiệu suất</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[...wardPerf].sort((a, b) => b.satisfactionPct - a.satisfactionPct).map((ward, idx) => (
                      <tr key={ward.name} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3.5">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? "bg-yellow-100 text-yellow-700" : idx === 1 ? "bg-slate-200 text-slate-700" : idx === 2 ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500"}`}>{idx + 1}</span>
                        </td>
                        <td className="px-4 py-3.5 text-sm font-bold text-slate-800">{ward.name}</td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="px-2.5 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-bold">{ward.resolved}</span>
                        </td>
                        <td className="px-4 py-3.5 text-center text-sm font-bold text-slate-700">{ward.satisfactionPct}%</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-[#0B4FC4] rounded-full transition-all" style={{ width: `${ward.satisfactionPct}%` }} />
                            </div>
                            <span className="text-xs font-semibold text-slate-500 w-8 text-right">{ward.satisfactionPct}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        }
      </div>

      {/* Category detail table */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="text-base font-bold text-[#0B4FC4] border-b border-slate-100 pb-3 mb-4">Chi tiết theo lĩnh vực</h3>
        {fbLoading
          ? <Skeleton className="h-32 w-full rounded-xl" />
          : (
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr className="text-[10px] uppercase font-bold text-slate-500">
                  <th className="px-4 py-3">Lĩnh vực</th>
                  <th className="px-4 py-3 text-center">Tổng</th>
                  <th className="px-4 py-3 text-center">Đã xử lý</th>
                  <th className="px-4 py-3 text-center">Tỷ lệ</th>
                  <th className="px-4 py-3">Tiến độ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categorySummary.map(cat => (
                  <tr key={cat.name} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">{cat.name}</td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-slate-700">{cat.total}</td>
                    <td className="px-4 py-3 text-center"><span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-bold">{cat.resolved}</span></td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-slate-700">{cat.rate}%</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${cat.rate >= 70 ? "bg-green-500" : cat.rate >= 40 ? "bg-amber-500" : "bg-red-400"}`}
                            style={{ width: `${cat.rate}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 w-8 text-right">{cat.rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>
    </div>
  );
}
