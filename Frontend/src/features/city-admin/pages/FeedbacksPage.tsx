import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { feedbackApi, type FeedbackResponse } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  X, 
  Eye, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Filter,
  FileText,
  MapPin,
  User,
  Calendar,
  Tag,
  TrendingUp,
  TrendingDown,
  Activity,
  Settings,
  Download,
  Upload,
  RefreshCw,
  MoreVertical,
  Edit2,
  MessageSquare,
  Phone,
  Mail,
  CheckSquare,
  Square,
  ArrowUpDown,
  Zap,
  Target,
  BarChart3
} from "lucide-react";
import { mapStatus } from "@/lib/status";
import { FeedbackDetailModal } from "./FeedbackDetailModal";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "bg-slate-100 text-slate-700 border-slate-200",
  PENDING_RECEIVE: "bg-yellow-100 text-yellow-800 border-yellow-200",
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  NEED_LOCATION_REVIEW: "bg-orange-100 text-orange-800 border-orange-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
  ASSIGNED: "bg-purple-100 text-purple-800 border-purple-200",
  WAITING_INFO: "bg-indigo-100 text-indigo-800 border-indigo-200",
  RESOLVED: "bg-green-100 text-green-800 border-green-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
};

const PRIORITY_LEVELS = {
  HIGH: { label: "Khẩn cấp", color: "text-red-600", bg: "bg-red-100", icon: AlertCircle },
  MEDIUM: { label: "Quan trọng", color: "text-orange-600", bg: "bg-orange-100", icon: Clock },
  LOW: { label: "Thông thường", color: "text-blue-600", bg: "bg-blue-100", icon: CheckCircle },
};

const WARD_LIST = [
  "Hải Châu", "Thanh Khê", "Liên Chiểu", "Sơn Trà", 
  "Ngũ Hành Sơn", "Cẩm Lệ", "Hòa Vang"
];

export function FeedbacksPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [wardFilter, setWardFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid" | "kanban">("table");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const PAGE_SIZE = 15;

  const { data: feedbacksPage, isLoading, refetch } = useQuery({
    queryKey: ["admin", "feedbacks", "all"],
    queryFn: () => feedbackApi.adminGetAll(0, 500),
    staleTime: 30_000,
    refetchInterval: 60_000, // Auto-refresh every minute
  });

  const allFeedbacks = feedbacksPage?.content ?? [];

  // Auto-refresh effect
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refetch();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [refetch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success("Đã cập nhật dữ liệu mới nhất");
    } catch (error) {
      toast.error("Không thể cập nhật dữ liệu");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Enhanced filtering and sorting
  const getPriority = (feedback: any): keyof typeof PRIORITY_LEVELS => {
    const daysSinceCreated = (Date.now() - new Date(feedback.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const isUrgent = ["EMERGENCY", "SAFETY"].some(keyword => 
      feedback.title?.toUpperCase().includes(keyword) || 
      feedback.categoryName?.toUpperCase().includes(keyword)
    );
    
    if (isUrgent || daysSinceCreated > 7) return "HIGH";
    if (daysSinceCreated > 3) return "MEDIUM";
    return "LOW";
  };

  const categories = useMemo(() => {
    const cats = new Set(allFeedbacks.map(f => f.categoryName).filter(Boolean));
    return Array.from(cats) as string[];
  }, [allFeedbacks]);

  const filtered = useMemo(() => {
    let data = [...allFeedbacks];
    
    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(f =>
        f.trackingCode?.toLowerCase().includes(q) ||
        f.title?.toLowerCase().includes(q) ||
        f.wardName?.toLowerCase().includes(q) ||
        f.citizenName?.toLowerCase().includes(q) ||
        f.categoryName?.toLowerCase().includes(q)
      );
    }
    
    // Status filter
    if (statusFilter) data = data.filter(f => f.status === statusFilter);
    
    // Category filter
    if (categoryFilter) data = data.filter(f => f.categoryName === categoryFilter);
    
    // Ward filter
    if (wardFilter) data = data.filter(f => f.wardName === wardFilter);
    
    // Priority filter
    if (priorityFilter) {
      data = data.filter(f => getPriority(f) === priorityFilter);
    }
    
    // Date filter
    if (dateFilter) {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          data = data.filter(f => new Date(f.createdAt) >= filterDate);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          data = data.filter(f => new Date(f.createdAt) >= filterDate);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          data = data.filter(f => new Date(f.createdAt) >= filterDate);
          break;
      }
    }
    
    // Sorting
    data.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "priority":
          const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          aValue = priorityOrder[getPriority(a)];
          bValue = priorityOrder[getPriority(b)];
          break;
        case "title":
          aValue = a.title?.toLowerCase() || "";
          bValue = b.title?.toLowerCase() || "";
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    
    return data;
  }, [allFeedbacks, search, statusFilter, categoryFilter, wardFilter, priorityFilter, dateFilter, sortBy, sortOrder]);

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const stats = useMemo(() => {
    const total = allFeedbacks.length;
    const pending = allFeedbacks.filter(f => !["RESOLVED", "REJECTED"].includes(f.status)).length;
    const resolved = allFeedbacks.filter(f => f.status === "RESOLVED").length;
    const overdue = allFeedbacks.filter(f => !["RESOLVED", "REJECTED"].includes(f.status) && (Date.now() - new Date(f.createdAt).getTime()) > 3 * 86400000).length;
    const inProgress = allFeedbacks.filter(f => f.status === "IN_PROGRESS").length;
    const highPriority = allFeedbacks.filter(f => getPriority(f) === "HIGH").length;
    
    // Calculate trends (mock data for demo)
    const trends = {
      total: { value: "+12%", isUp: true },
      pending: { value: "-5%", isUp: false },
      resolved: { value: "+18%", isUp: true },
      overdue: { value: "-8%", isUp: false },
    };
    
    return { total, pending, resolved, overdue, inProgress, highPriority, trends };
  }, [allFeedbacks]);

  // Selection handlers
  const handleSelectFeedback = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(paginated.map(f => f.id));
      setSelectedIds(allIds);
      setShowBulkActions(true);
    } else {
      setSelectedIds(new Set());
      setShowBulkActions(false);
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedIds.size === 0) return;
    
    try {
      // Mock bulk update - replace with actual API call
      await Promise.all(
        Array.from(selectedIds).map(id => 
          feedbackApi.updateStatus(id, newStatus)
        )
      );
      
      await queryClient.invalidateQueries({ queryKey: ["admin", "feedbacks", "all"] });
      setSelectedIds(new Set());
      setShowBulkActions(false);
      toast.success(`Đã cập nhật trạng thái cho ${selectedIds.size} phản ánh`);
    } catch (error) {
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const exportFeedbacks = () => {
    // Mock export functionality
    const csv = "trackingCode,title,status,categoryName,wardName,citizenName,createdAt\n" + 
                filtered.map(f => `${f.trackingCode},${f.title},${f.status},${f.categoryName},${f.wardName},${f.citizenName},${f.createdAt}`).join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "feedbacks-export.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Đã xuất dữ liệu phản ánh");
  };

  const clearFilters = () => { 
    setSearch(""); 
    setStatusFilter(""); 
    setCategoryFilter(""); 
    setWardFilter("");
    setPriorityFilter("");
    setDateFilter("");
    setPage(0); 
  };

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1D2939] flex items-center gap-2">
            <FileText className="text-[#0B4FC4]" size={24} />
            Quản lý phản ánh
            <div className="flex items-center gap-1 ml-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-500 font-medium">Realtime</span>
            </div>
          </h2>
          <p className="text-slate-500 mt-1">Quản lý và xử lý phản ánh từ người dân thành phố Đà Nẵng</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-800 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            <span className="hidden sm:block">Làm mới</span>
          </button>
          <button
            onClick={exportFeedbacks}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all hover:scale-105"
          >
            <Download size={16} />
            Xuất Excel
          </button>
          <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                viewMode === "table" ? "bg-white text-slate-800 shadow-sm" : "text-slate-600"
              }`}
            >
              Bảng
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                viewMode === "grid" ? "bg-white text-slate-800 shadow-sm" : "text-slate-600"
              }`}
            >
              Lưới
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                viewMode === "kanban" ? "bg-white text-slate-800 shadow-sm" : "text-slate-600"
              }`}
            >
              Kanban
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { 
            label: "Tổng phản ánh", 
            value: stats.total, 
            icon: FileText, 
            color: "text-[#0B4FC4]", 
            bg: "bg-blue-50",
            trend: stats.trends.total
          },
          { 
            label: "Chưa xử lý", 
            value: stats.pending, 
            icon: Clock, 
            color: "text-orange-600", 
            bg: "bg-orange-50",
            trend: stats.trends.pending
          },
          { 
            label: "Đang xử lý", 
            value: stats.inProgress, 
            icon: Activity, 
            color: "text-blue-600", 
            bg: "bg-blue-50",
            trend: { value: "+3%", isUp: true }
          },
          { 
            label: "Đã giải quyết", 
            value: stats.resolved, 
            icon: CheckCircle, 
            color: "text-green-600", 
            bg: "bg-green-50",
            trend: stats.trends.resolved
          },
          { 
            label: "Ưu tiên cao", 
            value: stats.highPriority, 
            icon: AlertCircle, 
            color: "text-red-600", 
            bg: "bg-red-50",
            trend: { value: "-2", isUp: false }
          },
          { 
            label: "Quá hạn", 
            value: stats.overdue, 
            icon: Target, 
            color: "text-red-600", 
            bg: "bg-red-50",
            trend: stats.trends.overdue
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <Icon size={20} />
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-black ${stat.color}`}>
                    {isLoading ? "—" : stat.value.toLocaleString("vi-VN")}
                  </div>
                  {stat.trend && (
                    <div className={`text-xs font-bold flex items-center gap-1 mt-1 ${
                      stat.trend.isUp ? "text-green-600" : "text-red-600"
                    }`}>
                      {stat.trend.isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {stat.trend.value}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Advanced Filters & Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="text-slate-500" size={18} />
          <h3 className="font-bold text-slate-700">Bộ lọc nâng cao</h3>
          {filtered.length !== allFeedbacks.length && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
              {filtered.length}/{allFeedbacks.length} kết quả
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm mã, tiêu đề, địa điểm..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0B4FC4]/20 focus:border-[#0B4FC4] transition-all"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
            className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0B4FC4]/20 cursor-pointer"
          >
            <option value="">🔄 Mọi trạng thái</option>
            <option value="SUBMITTED">📝 Vừa gửi</option>
            <option value="PENDING">⏳ Đang chờ</option>
            <option value="IN_PROGRESS">⚙️ Đang xử lý</option>
            <option value="WAITING_INFO">❓ Chờ bổ sung</option>
            <option value="RESOLVED">✅ Đã giải quyết</option>
            <option value="REJECTED">❌ Từ chối</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={e => { setPriorityFilter(e.target.value); setPage(0); }}
            className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0B4FC4]/20 cursor-pointer"
          >
            <option value="">🎯 Mọi mức độ</option>
            <option value="HIGH">🔴 Khẩn cấp</option>
            <option value="MEDIUM">🟡 Quan trọng</option>
            <option value="LOW">🔵 Thông thường</option>
          </select>

          {/* Ward Filter */}
          <select
            value={wardFilter}
            onChange={e => { setWardFilter(e.target.value); setPage(0); }}
            className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0B4FC4]/20 cursor-pointer"
          >
            <option value="">📍 Mọi khu vực</option>
            {WARD_LIST.map(ward => (
              <option key={ward} value={ward}>📍 {ward}</option>
            ))}
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={e => { setDateFilter(e.target.value); setPage(0); }}
            className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0B4FC4]/20 cursor-pointer"
          >
            <option value="">📅 Mọi thời gian</option>
            <option value="today">📅 Hôm nay</option>
            <option value="week">📅 Tuần này</option>
            <option value="month">📅 Tháng này</option>
          </select>
        </div>

        {/* Sort & Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <ArrowUpDown size={14} className="text-slate-500" />
              <span className="text-sm font-medium text-slate-600">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white cursor-pointer"
              >
                <option value="createdAt">Ngày tạo</option>
                <option value="priority">Mức độ ưu tiên</option>
                <option value="status">Trạng thái</option>
                <option value="title">Tiêu đề</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="p-1.5 text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>
            
            {(search || statusFilter || priorityFilter || wardFilter || dateFilter) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition"
              >
                <X size={12} />
                Xóa tất cả bộ lọc
              </button>
            )}
          </div>
          
          <div className="text-sm text-slate-500 font-medium">
            <span className="font-bold text-[#0B4FC4]">{filtered.length}</span> / {allFeedbacks.length} phản ánh
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] uppercase font-bold text-slate-500">
                <th className="px-5 py-3.5">Mã phản ánh</th>
                <th className="px-4 py-3.5">Tiêu đề</th>
                <th className="px-4 py-3.5">Người gửi</th>
                <th className="px-4 py-3.5">Khu vực</th>
                <th className="px-4 py-3.5">Lĩnh vực</th>
                <th className="px-4 py-3.5 text-center">Trạng thái</th>
                <th className="px-4 py-3.5 text-right">Ngày gửi</th>
                <th className="px-4 py-3.5 text-center">Xem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}><td colSpan={8} className="px-5 py-3"><Skeleton className="h-10 w-full rounded" /></td></tr>
                  ))
                : paginated.length === 0
                  ? <tr><td colSpan={8} className="py-16 text-center text-sm text-slate-400">Không có phản ánh nào phù hợp.</td></tr>
                  : paginated.map(fb => (
                      <tr key={fb.id} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-700 group-hover:text-[#0B4FC4]">{fb.trackingCode || `#${fb.id}`}</td>
                        <td className="px-4 py-3.5 text-sm text-slate-800 max-w-[200px] truncate font-medium">{fb.title}</td>
                        <td className="px-4 py-3.5 text-xs text-slate-600">{fb.citizenName || "—"}</td>
                        <td className="px-4 py-3.5 text-xs text-slate-600">{fb.wardName || "—"}</td>
                        <td className="px-4 py-3.5 text-xs text-slate-600">{fb.categoryName || "—"}</td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${STATUS_COLORS[fb.status] || "bg-slate-100 text-slate-600"}`}>
                            {mapStatus(fb.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right text-xs text-slate-500">
                          {fb.createdAt ? new Date(fb.createdAt).toLocaleDateString("vi-VN") : "—"}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button onClick={() => setSelectedId(fb.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0B4FC4] hover:bg-blue-50 transition cursor-pointer">
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Trang {page + 1} / {totalPages} ({filtered.length} kết quả)</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer">← Trước</button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer">Tiếp →</button>
            </div>
          </div>
        )}
      </div>
      <FeedbackDetailModal feedbackId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
