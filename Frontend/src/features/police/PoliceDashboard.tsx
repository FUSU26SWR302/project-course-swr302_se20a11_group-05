import { clientOnly } from "@/components/ClientOnly";
import { lazy, Suspense, useState, useEffect, useRef, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import {
  usePoliceAssignedFeedbacks,
  useNotifications,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useNotificationUnreadCount,
  useHotspots,
  useAcceptFeedback,
  useRejectFeedback,
  useRequestMoreInfo,
  useUpdatePoliceFeedbackStatus,
  useSubmitPoliceFeedbackResult,
} from "@/hooks";
import { useAuth } from "@/lib/auth";
import { getLoginPathForRole } from "@/lib/roles";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Menu,
  X,
  Bell,
  LogOut,
  User,
  ChevronDown,
  Search,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Building2,
  Leaf,
  Shield,
  Flame,
  Construction,
  Car,
  RefreshCw,
  ChevronLeft,
  Settings,
  MoreVertical,
  Activity,
  BarChart3,
  Sliders,
  CheckCircle,
  Plus,
  Grid,
  HelpCircle,
  Send,
  PlayCircle,
} from "lucide-react";

import logoImg from "@/assets/logo.png";
import policeEmblemImg from "@/assets/police-emblem.png";
import { toast } from "sonner";
import { authApi, type NotificationResponse, type FeedbackResponse, type PoliceFeedbackResponse } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

const CivicMap = clientOnly(() =>
  import("@/components/site/CivicMap").then((m) => ({ default: m.CivicMap })),
);

const HeatmapMap = clientOnly(() =>
  import("@/components/site/HeatmapMap").then((m) => ({ default: m.HeatmapMap })),
);

// Date formatting helper
function formatDate(dateStr: string, includeTime = true): string {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  const datePart = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  if (!includeTime) return datePart;
  return `${datePart} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Deadline formatter (3 days after creation)
function getDeadlineDate(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 3);
  return formatDate(d.toISOString(), false);
}

// Map whatever the backend categoryName is to our standard categories
const mapCategoryName = (name: string | null | undefined): string => {
  if (!name) return "Hạ tầng đô thị";
  const n = name.toLowerCase();
  if (n.includes("giao thông") || n.includes("traffic") || n.includes("giao thong")) {
    return "Giao thông";
  }
  if (n.includes("môi trường") || n.includes("environment") || n.includes("moi truong") || n.includes("rác")) {
    return "Môi trường";
  }
  if (n.includes("an ninh") || n.includes("security") || n.includes("safety") || n.includes("trật tự") || n.includes("pháp") || n.includes("công an")) {
    return "An ninh trật tự";
  }
  if (n.includes("xây dựng") || n.includes("construction") || n.includes("xay dung")) {
    return "Xây dựng";
  }
  if (n.includes("phòng cháy") || n.includes("chữa cháy") || n.includes("fire")) {
    return "Phòng cháy chữa cháy";
  }
  return "Hạ tầng đô thị";
};

export function PoliceDashboard() {
  const { locale, t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();

  // Controls for sidebar and header dropdowns
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [trackingViewMode, setTrackingViewMode] = useState<"week" | "month">("week");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedFeedback, setSelectedFeedback] = useState<PoliceFeedbackResponse | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [showRequestInfoInput, setShowRequestInfoInput] = useState(false);
  const [requestInfoReason, setRequestInfoReason] = useState("");
  const [showSubmitResultInput, setShowSubmitResultInput] = useState(false);
  const [resultNote, setResultNote] = useState("");

  const acceptFeedbackMut = useAcceptFeedback();
  const rejectFeedbackMut = useRejectFeedback();
  const requestInfoMut = useRequestMoreInfo();
  const updateStatusMut = useUpdatePoliceFeedbackStatus();
  const submitResultMut = useSubmitPoliceFeedbackResult();

  const handleSubmitResult = async (id: number) => {
    if (!resultNote.trim()) {
      toast.error("Vui lòng nhập kết quả xử lý");
      return;
    }
    try {
      await submitResultMut.mutateAsync({ id, resultNote });
      toast.success("Đã cập nhật kết quả xử lý thành công");
      setSelectedFeedback(null);
      setFilterStatus("RESOLVED");
      setActiveTab("feedbacks");
      setShowSubmitResultInput(false);
      setResultNote("");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi cập nhật kết quả");
    }
  };

  const handleAccept = async (id: number) => {
    try {
      await acceptFeedbackMut.mutateAsync(id);
      toast.success("Đã tiếp nhận phản ánh thành công");
      setSelectedFeedback(null);
      setFilterStatus("ACCEPTED");
      setActiveTab("feedbacks");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi tiếp nhận phản ánh");
    }
  };

  const handleReject = async (id: number) => {
    if (!rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }
    try {
      await rejectFeedbackMut.mutateAsync({ id, reason: rejectReason });
      toast.success("Đã từ chối phản ánh");
      setSelectedFeedback(null);
      setFilterStatus("REJECTED");
      setActiveTab("feedbacks");
      setShowRejectInput(false);
      setRejectReason("");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi từ chối phản ánh");
    }
  };

  const handleRequestInfo = async (id: number) => {
    try {
      await requestInfoMut.mutateAsync({ id, reason: requestInfoReason });
      toast.success("Đã gửi yêu cầu bổ sung thông tin");
      setSelectedFeedback(null);
      setFilterStatus("WAITING_INFO");
      setActiveTab("feedbacks");
      setShowRequestInfoInput(false);
      setRequestInfoReason("");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi gửi yêu cầu bổ sung");
    }
  };

  const handleStartProgress = async (id: number) => {
    try {
      await updateStatusMut.mutateAsync({ id, status: "IN_PROGRESS", note: "Bắt đầu xử lý phản ánh" });
      toast.success("Đã chuyển phản ánh sang trạng thái Đang xử lý");
      setSelectedFeedback(null);
      setFilterStatus("IN_PROGRESS");
      setActiveTab("feedbacks");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi cập nhật trạng thái");
    }
  };

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Click outside handler for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch real data
  const { data: feedbacksData, isLoading: feedbacksLoading, refetch } = usePoliceAssignedFeedbacks();
  const { data: hotspots } = useHotspots();
  const { data: notifications = [], isLoading: notifLoading } = useNotifications();
  const { data: unreadCountData } = useNotificationUnreadCount(!!user);
  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();

  const unreadCount = unreadCountData ?? notifications.filter((n) => !n.isRead).length;

  // Filter by keyword locally if needed since the API doesn't accept keyword yet
  const feedbacks = useMemo(() => {
    const data = feedbacksData ?? [];
    if (!debouncedSearch) return data;
    const lower = debouncedSearch.toLowerCase();
    return data.filter(
      (f) =>
        f.title?.toLowerCase().includes(lower) ||
        f.description?.toLowerCase().includes(lower) ||
        f.trackingCode?.toLowerCase().includes(lower)
    );
  }, [feedbacksData, debouncedSearch]);

  // Filtered and Sorted Feedbacks for the "Phản ánh" tab
  const filteredAndSortedFeedbacks = useMemo(() => {
    return [...feedbacks]
      .filter((fb) => {
        if (filterStatus === "ALL") return true;
        if (filterStatus === "PENDING") return fb.status === "PENDING" || fb.status === "PENDING_RECEIVE" || fb.status === "SUBMITTED" || fb.status === "NEED_LOCATION_REVIEW";
        if (filterStatus === "ACCEPTED") return fb.status === "ASSIGNED";
        if (filterStatus === "IN_PROGRESS") return fb.status === "IN_PROGRESS" || fb.status === "WAITING_INFO";
        if (filterStatus === "RESOLVED") return fb.status === "RESOLVED";
        if (filterStatus === "REJECTED") return fb.status === "REJECTED";
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [feedbacks, filterStatus]);

  // Sync stats dynamically from backend reports list
  const totalCount = feedbacks.length;
  const pendingCount = feedbacks.filter((f) => f.status === "PENDING" || f.status === "PENDING_RECEIVE" || f.status === "SUBMITTED" || f.status === "NEED_LOCATION_REVIEW").length;
  const acceptedCount = feedbacks.filter((f) => f.status === "ASSIGNED").length;
  const inProgressCount = feedbacks.filter(
    (f) => f.status === "IN_PROGRESS" || f.status === "WAITING_INFO"
  ).length;
  const resolvedCount = feedbacks.filter((f) => f.status === "RESOLVED").length;
  const rejectedCount = feedbacks.filter((f) => f.status === "REJECTED").length;

  // Trend computations
  const getKpiTrend = (statusType: "total" | "pending" | "accepted" | "inProgress" | "resolved" | "rejected") => {
    let filterFn = (f: FeedbackResponse) => true;
    if (statusType === "pending") {
      filterFn = (f: FeedbackResponse) => f.status === "PENDING" || f.status === "PENDING_RECEIVE" || f.status === "SUBMITTED" || f.status === "NEED_LOCATION_REVIEW";
    } else if (statusType === "accepted") {
      filterFn = (f: FeedbackResponse) => f.status === "ASSIGNED";
    } else if (statusType === "inProgress") {
      filterFn = (f: FeedbackResponse) =>
        f.status === "IN_PROGRESS" || f.status === "WAITING_INFO";
    } else if (statusType === "resolved") {
      filterFn = (f: FeedbackResponse) => f.status === "RESOLVED";
    } else if (statusType === "rejected") {
      filterFn = (f: FeedbackResponse) => f.status === "REJECTED";
    }

    const now = new Date().getTime();
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * MS_PER_DAY;
    const fourteenDaysAgo = now - 14 * MS_PER_DAY;

    const currentPeriod = feedbacks.filter(
      (f) => filterFn(f) && new Date(f.createdAt).getTime() >= sevenDaysAgo
    );
    const previousPeriod = feedbacks.filter(
      (f) =>
        filterFn(f) &&
        new Date(f.createdAt).getTime() >= fourteenDaysAgo &&
        new Date(f.createdAt).getTime() < sevenDaysAgo
    );

    const currentC = currentPeriod.length;
    const previousC = previousPeriod.length;

    if (previousC === 0) {
      if (currentC === 0) return { text: "0,0%", isUp: true, color: "text-slate-400" };
      return {
        text: "100,0%",
        isUp: true,
        color: statusType === "resolved" ? "text-green-600" : "text-red-500",
      };
    }

    const diff = currentC - previousC;
    const pct = ((diff / previousC) * 100).toFixed(1).replace(".", ",");

    let color = "text-green-600";
    if (diff > 0) {
      if (statusType === "overdue" || statusType === "pending") {
        color = "text-red-500";
      }
    } else if (diff < 0) {
      if (statusType === "overdue" || statusType === "pending") {
        color = "text-green-600";
      } else {
        color = "text-red-500";
      }
    } else {
      color = "text-slate-400";
    }

    return {
      text: `${Math.abs(Number((diff / previousC) * 100)).toFixed(1).replace(".", ",")}%`,
      isUp: diff >= 0,
      color,
    };
  };

  const totalTrend = getKpiTrend("total");
  const pendingTrend = getKpiTrend("pending");
  const acceptedTrend = getKpiTrend("accepted");
  const inProgressTrend = getKpiTrend("inProgress");
  const resolvedTrend = getKpiTrend("resolved");
  const rejectedTrend = getKpiTrend("rejected");

  const categoryStats = useMemo(() => {
    const categoriesList = [
      { name: "Giao thông", key: "TRAFFIC", icon: Car, color: "#0b5ed7", bgClass: "bg-[#0b5ed7]" },
      { name: "An ninh trật tự", key: "PUBLIC_SECURITY", icon: Shield, color: "#6f42c1", bgClass: "bg-[#6f42c1]" },
      { name: "Phòng cháy chữa cháy", key: "FIRE_SAFETY", icon: Flame, color: "#dc3545", bgClass: "bg-[#dc3545]" },
    ];

    const counts: Record<string, number> = {
      TRAFFIC: 0,
      URBAN_INFRASTRUCTURE: 0,
      ENVIRONMENT: 0,
      PUBLIC_SECURITY: 0,
      CONSTRUCTION: 0,
      FIRE_SAFETY: 0,
    };

    feedbacks.forEach((fb) => {
      const name = fb.categoryName || "";
      const n = name.toLowerCase();
      if (n.includes("giao thông") || n.includes("traffic") || n.includes("giao thong")) {
        counts["TRAFFIC"]++;
      } else if (n.includes("môi trường") || n.includes("environment") || n.includes("moi truong") || n.includes("rác")) {
        counts["ENVIRONMENT"]++;
      } else if (
        n.includes("an ninh") ||
        n.includes("security") ||
        n.includes("safety") ||
        n.includes("trật tự") ||
        n.includes("pháp") ||
        n.includes("công an")
      ) {
        counts["PUBLIC_SECURITY"]++;
      } else if (n.includes("xây dựng") || n.includes("construction") || n.includes("xay dung")) {
        counts["CONSTRUCTION"]++;
      } else if (n.includes("phòng cháy") || n.includes("chữa cháy") || n.includes("fire")) {
        counts["FIRE_SAFETY"]++;
      } else {
        counts["URBAN_INFRASTRUCTURE"]++;
      }
    });

    const total = feedbacks.length || 1;

    return categoriesList.map((c) => {
      const count = counts[c.key] || 0;
      const percentage = (count / total) * 100;
      return {
        ...c,
        count,
        percentage: percentage.toFixed(1).replace(".", ","),
        rawPercentage: percentage,
      };
    });
  }, [feedbacks]);

  // High-priority reports list filtering (unresolved, sorted by age / overdue)
  const priorityReports = useMemo(() => {
    return feedbacks
      .filter((fb) => fb.status !== "RESOLVED" && fb.status !== "REJECTED")
      .map((fb) => {
        const diffTime = Math.abs(new Date().getTime() - new Date(fb.createdAt).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          ...fb,
          diffDays,
        };
      })
      .sort((a, b) => b.diffDays - a.diffDays)
      .slice(0, 5);
  }, [feedbacks]);

  // Map markers mapping
  const mapMarkers = useMemo(() => {
    return feedbacks
      .filter((f) => f.latitude !== null && f.longitude !== null)
      .map((f) => {
        let markerStatus: "pending" | "inProgress" | "resolved" | "urgent" = "pending";
        const isPending = f.status === "PENDING" || f.status === "PENDING_RECEIVE" || f.status === "SUBMITTED" || f.status === "NEED_LOCATION_REVIEW";
        const isNotResolved = f.status !== "RESOLVED" && f.status !== "REJECTED";
        const diffTime = Math.abs(new Date().getTime() - new Date(f.createdAt).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (f.status === "RESOLVED" || f.status === "REJECTED") {
          markerStatus = "resolved";
        } else if (isNotResolved && diffDays > 3) {
          markerStatus = "urgent";
        } else if (
          f.status === "ASSIGNED" ||
          f.status === "IN_PROGRESS" ||
          f.status === "WAITING_INFO"
        ) {
          markerStatus = "inProgress";
        } else if (isPending) {
          markerStatus = "pending";
        }

        return {
          position: [f.latitude!, f.longitude!] as [number, number],
          title: f.title,
          description: f.description,
          status: markerStatus,
        };
      });
  }, [feedbacks]);

  const mapCenter = useMemo<[number, number]>(() => {
    if (mapMarkers.length > 0) {
      return mapMarkers[0].position;
    }
    return [16.0544, 108.2022]; // Da Nang center
  }, [mapMarkers]);

  const trackingChartData = useMemo(() => {
    const getWeekNumber = (d: Date) => {
      d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    };

    const dataMap: Record<string, { name: string; received: number; resolved: number }> = {};

    feedbacks.forEach((fb) => {
      const date = new Date(fb.createdAt);
      let key = "";
      let name = "";
      
      if (trackingViewMode === "week") {
        const weekNum = getWeekNumber(date);
        const year = date.getFullYear();
        key = `${year}-W${weekNum.toString().padStart(2, "0")}`;
        name = `Tuần ${weekNum}, ${year}`;
      } else {
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        key = `${year}-${month.toString().padStart(2, "0")}`;
        name = `Tháng ${month}/${year}`;
      }

      if (!dataMap[key]) {
        dataMap[key] = { name, received: 0, resolved: 0 };
      }
      dataMap[key].received += 1;
      
      if (fb.status === "RESOLVED") {
        const resolvedDate = new Date(fb.updatedAt);
        let rKey = "";
        let rName = "";
        
        if (trackingViewMode === "week") {
          const w = getWeekNumber(resolvedDate);
          rKey = `${resolvedDate.getFullYear()}-W${w.toString().padStart(2, "0")}`;
          rName = `Tuần ${w}, ${resolvedDate.getFullYear()}`;
        } else {
          const m = resolvedDate.getMonth() + 1;
          rKey = `${resolvedDate.getFullYear()}-${m.toString().padStart(2, "0")}`;
          rName = `Tháng ${m}/${resolvedDate.getFullYear()}`;
        }
        
        if (!dataMap[rKey]) {
          dataMap[rKey] = { name: rName, received: 0, resolved: 0 };
        }
        dataMap[rKey].resolved += 1;
      }
    });

    return Object.keys(dataMap).sort().map(k => dataMap[k]).slice(-12); // Show last 12 periods max
  }, [feedbacks, trackingViewMode]);

  // Handlers for notifications
  const handleMarkAllRead = async () => {
    try {
      await markAllRead.mutateAsync();
      toast.success(locale === "vi" ? "Đã đọc tất cả thông báo" : "All notifications marked read");
    } catch {
      toast.error(locale === "vi" ? "Thao tác thất bại" : "Action failed");
    }
  };

  const handleNotifClick = async (item: NotificationResponse) => {
    setNotifOpen(false);
    try {
      if (!item.isRead) {
        await markRead.mutateAsync(item.id);
      }
      const feedbackId = item.feedbackId ?? item.referenceId;
      if (feedbackId) {
        navigate({ to: "/my-reports/$id", params: { id: String(feedbackId) } });
      }
    } catch { }
  };

  const handleLogout = async () => {
    const loginPath = getLoginPathForRole(user?.role);
    try {
      await authApi.logout().catch(() => { });
    } catch { }
    logout();
    queryClient.clear();
    navigate({ to: loginPath });
  };

  const menuItems = [
    { name: "Tổng quan", id: "overview", icon: Grid },
    { name: "Phản ánh", id: "feedbacks", icon: FileText },
    { name: "Theo dõi xử lý", id: "tracking", icon: Activity },
    { name: "Báo cáo", id: "reports", icon: BarChart3 },
    { name: "Cấu hình", id: "settings", icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7FA] text-[#1E293B] font-sans antialiased flex">
      {/* ─── 1. FIXED LEFT SIDEBAR ─── */}
      <aside
        className={`bg-gradient-to-b from-[#0F2042] to-[#0A1630] text-white flex flex-col z-40 transition-all duration-300 fixed inset-y-0 left-0 ${sidebarCollapsed ? "w-[76px]" : "w-[240px]"
          } ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="p-5 flex flex-col items-center border-b border-white/10 shrink-0">
          <div className={`flex items-center justify-center transition-all duration-300 ${sidebarCollapsed ? "w-12 h-12" : "w-20 h-20"}`}>
            <img
              src={policeEmblemImg}
              alt="Police Emblem"
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>
          {!sidebarCollapsed && (
            <div className="mt-3 text-center">
              <span className="font-extrabold text-[13px] tracking-wider uppercase block text-amber-400 leading-snug px-2">
                {user?.org || "CÔNG AN ĐÀ NẴNG"}
              </span>
            </div>
          )}
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={idx}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${isActive
                    ? "bg-[#0F5BD8] text-white shadow-lg"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
              >
                <Icon size={18} className="shrink-0" />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </button>
            );
          })}
        </nav>

        {/* Collapse button at bottom */}
        <div className="p-4 border-t border-white/10 shrink-0">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
          >
            <ChevronLeft
              size={16}
              className={`transform transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`}
            />
            {!sidebarCollapsed && <span>Thu gọn</span>}
          </button>
        </div>
      </aside>

      {/* Drawer Overlay for Mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 z-30 md:hidden"
        />
      )}

      {/* ─── MAIN WRAPPER ─── */}
      <div
        className={`flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300 ${sidebarCollapsed ? "md:pl-[76px]" : "md:pl-[240px]"
          }`}
      >
        {/* ─── 2. TOP WHITE HEADER ─── */}
        <header className="h-[76px] bg-white border-b border-[#E4EAF2] flex items-center justify-between px-6 sticky top-0 z-35 shadow-sm shrink-0">
          {/* Title & Hamburger */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-slate-500 hover:text-[#0F5BD8] p-2 rounded-lg border border-slate-200 bg-slate-50"
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-xl font-extrabold text-[#0B2545] font-sans">Tổng quan</h2>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex items-center relative w-96">
            <input
              type="text"
              placeholder="Tìm kiếm phản ánh, mã phản ánh, địa điểm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-4 pr-10 rounded-xl border border-[#E4EAF2] text-sm focus:border-[#0F5BD8] focus:ring-1 focus:ring-[#0F5BD8] outline-none bg-slate-50/50"
            />
            <Search size={16} className="absolute right-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Controls: Bell & Profile */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setUserOpen(false);
                }}
                className="relative p-2 text-slate-500 hover:text-[#0F5BD8] hover:bg-slate-50 rounded-full transition flex items-center justify-center min-w-[40px] min-h-[40px] border border-[#E4EAF2] cursor-pointer"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-[18px] h-[18px] bg-[#dc3545] text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white font-sans">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown notification panel */}
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-[340px] bg-white border border-[#E4EAF2] rounded-xl shadow-xl py-3 z-50 animate-fade-in">
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-[#E4EAF2]">
                    <span className="text-xs font-bold text-[#0B2545]">Thông báo mới</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-[#0F5BD8] hover:underline font-bold"
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>
                  <div className="max-h-[280px] overflow-y-auto divide-y divide-[#E4EAF2]">
                    {notifLoading ? (
                      <div className="p-4 space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex gap-3 animate-pulse">
                            <div className="w-8 h-8 bg-slate-100 rounded-full shrink-0" />
                            <div className="flex-1 space-y-2">
                              <div className="h-3 bg-slate-100 rounded w-1/3" />
                              <div className="h-2.5 bg-slate-100 rounded w-4/5" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">Không có thông báo mới</div>
                    ) : (
                      notifications.slice(0, 5).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleNotifClick(item)}
                          className={`w-full text-left p-3.5 flex gap-3 transition-colors hover:bg-slate-50 ${item.isRead ? "opacity-70" : "bg-[#EFF6FF]"
                            }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-[#0F5BD8]/10 text-[#0F5BD8] flex items-center justify-center shrink-0">
                            <Bell size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-slate-800 leading-snug block">
                              {item.title}
                            </span>
                            <span className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed block">
                              {item.content}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="pt-2 text-center border-t border-[#E4EAF2]">
                    <Link
                      to="/notifications"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs font-bold text-[#0F5BD8] hover:underline inline-block py-1"
                    >
                      Xem tất cả thông báo
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={userRef}>
              <button
                onClick={() => {
                  setUserOpen(!userOpen);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-3 focus:outline-none cursor-pointer text-left pl-2 border-l border-[#E4EAF2]"
              >
                <div className="w-9 h-9 rounded-full bg-slate-100 text-[#0F5BD8] flex items-center justify-center font-bold border border-[#E4EAF2] shrink-0">
                  <User size={18} />
                </div>
                <div className="leading-tight hidden sm:block">
                  <div className="text-xs font-bold text-[#0B2545] flex items-center gap-1.5">
                    {user?.name || "Thượng úy Nguyễn Văn An"}
                    <ChevronDown size={14} className="text-slate-400" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">
                    {user?.org || "Admin công an phường"}
                  </span>
                </div>
              </button>

              {userOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-[#E4EAF2] rounded-xl shadow-xl py-2 z-50 animate-fade-in">
                  <div className="px-4 py-2 border-b border-slate-100 mb-1">
                    <div className="text-xs font-bold text-slate-700 truncate">
                      {user?.name || "Thượng úy Nguyễn Văn An"}
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">
                      {user?.org || "Admin công an phường"}
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setUserOpen(false)}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-2.5"
                  >
                    <Settings size={14} className="text-slate-400" />
                    Cấu hình cá nhân
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition flex items-center gap-2.5 cursor-pointer border-t border-slate-100 mt-1"
                  >
                    <LogOut size={14} />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ─── 3. MAIN DASHBOARD CONTENT ─── */}
        <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
          {activeTab === "overview" && (
            <>
              {/* ─── KPI CARDS ROW ─── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  {
                    title: "Chưa xử lý",
                    val: pendingCount,
                    bg: "bg-[#fd7e14]",
                    trend: pendingTrend,
                    filterValue: "PENDING",
                  },
                  {
                    title: "Đã tiếp nhận",
                    val: acceptedCount,
                    bg: "bg-[#8b5cf6]",
                    trend: acceptedTrend,
                    filterValue: "ACCEPTED",
                  },
                  {
                    title: "Đang xử lý",
                    val: inProgressCount,
                    bg: "bg-[#3b82f6]",
                    trend: inProgressTrend,
                    filterValue: "IN_PROGRESS",
                  },
                  {
                    title: "Đã xử lý",
                    val: resolvedCount,
                    bg: "bg-[#198754]",
                    trend: resolvedTrend,
                    filterValue: "RESOLVED",
                  },
                  {
                    title: "Từ chối",
                    val: rejectedCount,
                    bg: "bg-[#dc3545]",
                    trend: rejectedTrend,
                    filterValue: "REJECTED",
                  },
                ].map((card, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setFilterStatus(card.filterValue);
                      setActiveTab("feedbacks");
                    }}
                    className={`bg-white rounded-2xl border ${filterStatus === card.filterValue ? "border-[#0F5BD8] ring-1 ring-[#0F5BD8] shadow-md" : "border-[#E4EAF2]"} p-5 shadow-sm flex flex-col justify-between cursor-pointer hover:border-[#0F5BD8] hover:shadow-md transition-all group`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 ${card.bg}`}
                      >
                        <FileText size={22} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-400 block truncate">
                          {card.title}
                        </span>
                        <h3 className="text-2xl font-extrabold text-[#0B2545] mt-0.5 leading-none font-sans">
                          {feedbacksLoading ? (
                            <Skeleton className="h-6 w-12" />
                          ) : (
                            card.val.toLocaleString("vi-VN")
                          )}
                        </h3>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-50 flex items-center">
                      <span className={`text-[11px] font-bold flex items-center gap-0.5 ${card.trend.color}`}>
                        {card.trend.isUp ? "↑" : "↓"} {card.trend.text}
                        <span className="text-slate-400 font-semibold ml-1">so với 7 ngày trước</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* ─── GRID CONTENT ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left Column (65%) */}
                <div className="lg:col-span-8 flex flex-col gap-6">


                  {/* Heatmap Card */}
                  <div className="bg-white rounded-2xl border border-[#E4EAF2] shadow-sm overflow-hidden flex flex-col min-h-[480px]">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-extrabold text-base text-[#0B2545] flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#dc3545]" />
                        Bản đồ Điểm nóng vi phạm (Heatmap)
                      </h3>
                    </div>
                    <div className="flex-1 bg-slate-50 relative p-4">
                      <Suspense
                        fallback={
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            Đang tải bản đồ nhiệt...
                          </div>
                        }
                      >
                        <div className="h-[400px] w-full bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                          <HeatmapMap hotspots={hotspots || []} />
                        </div>
                      </Suspense>
                    </div>
                  </div>

                  {/* Priority Reports Table */}
                  <div className="bg-white rounded-2xl border border-[#E4EAF2] shadow-sm p-5 flex flex-col justify-between min-h-[360px]">
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                        <h3 className="font-extrabold text-base text-[#0B2545]">
                          Phản ánh ưu tiên cao
                        </h3>
                        <Link
                          to="/my-reports"
                          className="text-xs font-bold text-[#0F5BD8] hover:underline"
                        >
                          Xem tất cả
                        </Link>
                      </div>
                      <div className="overflow-x-auto -mx-5">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-[#E4EAF2] bg-slate-50/50">
                              <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Mã phản ánh
                              </th>
                              <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Nội dung
                              </th>
                              <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Địa điểm
                              </th>
                              <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Thời gian
                              </th>
                              <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Hạn xử lý
                              </th>
                              <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Trạng thái
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E4EAF2]">
                            {feedbacksLoading ? (
                              [1, 2, 3].map((i) => (
                                <tr key={i} className="animate-pulse">
                                  <td className="px-5 py-4"><Skeleton className="h-4 w-12" /></td>
                                  <td className="px-5 py-4"><Skeleton className="h-4 w-40" /></td>
                                  <td className="px-5 py-4"><Skeleton className="h-4 w-32" /></td>
                                  <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                                  <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
                                  <td className="px-5 py-4"><Skeleton className="h-6 w-16" /></td>
                                </tr>
                              ))
                            ) : priorityReports.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="px-5 py-8 text-center text-xs text-slate-400">
                                  Chưa có phản ánh ưu tiên cao.
                                </td>
                              </tr>
                            ) : (
                              priorityReports.map((row) => (
                                <tr
                                  key={row.id}
                                  onClick={() => {
                                    setSelectedFeedback(row as any);
                                    setShowRejectInput(false);
                                    setRejectReason("");
                                    setShowRequestInfoInput(false);
                                    setRequestInfoReason("");
                                  }}
                                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                  <td className="px-5 py-4 text-xs font-bold text-[#0F5BD8]">
                                    {row.trackingCode || `PA-${row.id}`}
                                  </td>
                                  <td className="px-5 py-4 text-xs text-slate-700 font-semibold max-w-[200px] truncate">
                                    {row.title}
                                  </td>
                                  <td className="px-5 py-4 text-xs text-slate-500 truncate max-w-[150px]">
                                    {row.addressDetails || row.address || "Chưa xác định"}
                                  </td>
                                  <td className="px-5 py-4 text-xs text-slate-500">
                                    {formatDate(row.createdAt)}
                                  </td>
                                  <td className="px-5 py-4 text-xs text-slate-500 font-bold">
                                    {getDeadlineDate(row.createdAt)}
                                  </td>
                                  <td className="px-5 py-4">
                                    {(() => {
                                      const isNotResolved =
                                        row.status !== "RESOLVED" && row.status !== "REJECTED";
                                      if (isNotResolved && row.diffDays > 3) {
                                        return (
                                          <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-red-50 text-red-600 border border-red-100 uppercase">
                                            Quá hạn
                                          </span>
                                        );
                                      }
                                      switch (row.status) {
                                        case "PENDING":
                                        case "PENDING_RECEIVE":
                                        case "SUBMITTED":
                                        case "NEED_LOCATION_REVIEW":
                                          return (
                                            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-orange-50 text-orange-600 border border-orange-100 uppercase">
                                              Chưa xử lý
                                            </span>
                                          );
                                        case "ASSIGNED":
                                          return (
                                            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-purple-50 text-purple-600 border border-purple-100 uppercase">
                                              Đã tiếp nhận
                                            </span>
                                          );
                                        case "RESOLVED":
                                          return (
                                            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-green-50 text-green-600 border border-green-100 uppercase">
                                              Đã xử lý
                                            </span>
                                          );
                                        case "REJECTED":
                                          return (
                                            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-red-50 text-red-600 border border-red-100 uppercase">
                                              Từ chối
                                            </span>
                                          );
                                        default:
                                          return (
                                            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-blue-50 text-blue-600 border border-blue-100 uppercase">
                                              Đang xử lý
                                            </span>
                                          );
                                      }
                                    })()}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column (35%) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  {/* Category Classification Card */}
                  <div className="bg-white rounded-2xl border border-[#E4EAF2] shadow-sm p-5 flex flex-col justify-between h-[480px]">
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                        <h3 className="font-extrabold text-base text-[#0B2545]">
                          Phân loại phản ánh
                        </h3>
                        <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                          7 ngày qua
                        </span>
                      </div>
                      <div className="flex-1 flex flex-col min-h-0">
                        {feedbacksLoading ? (
                          <div className="space-y-4">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                              <div key={i} className="space-y-2">
                                <div className="flex justify-between">
                                  <Skeleton className="h-3 w-20" />
                                  <Skeleton className="h-3 w-10" />
                                </div>
                                <Skeleton className="h-2 w-full rounded" />
                              </div>
                            ))}
                          </div>
                        ) : feedbacks.length === 0 ? (
                          <div className="py-8 text-center text-xs text-slate-400">
                            Chưa có dữ liệu phân loại.
                          </div>
                        ) : (
                          <div className="flex flex-col h-full gap-2">
                            <div className="h-[200px] w-full relative shrink-0">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={categoryStats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={85}
                                    paddingAngle={3}
                                    dataKey="count"
                                    stroke="none"
                                  >
                                    {categoryStats.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <RechartsTooltip
                                    formatter={(value: number, name: string) => [value, name]}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #E4EAF2', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', fontSize: '12px', fontWeight: 'bold' }}
                                    itemStyle={{ color: '#0B2545' }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-4xl font-black text-[#0B2545] leading-none">{feedbacks.length}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tổng cộng</span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2.5 overflow-y-auto mt-2 pr-1 pb-1">
                              {categoryStats.map((cat, idx) => {
                                const Icon = cat.icon;
                                return (
                                  <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100 hover:border-slate-300 hover:shadow-sm transition-all group">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white ${cat.bgClass} shadow-sm group-hover:scale-110 transition-transform`}>
                                        <Icon size={16} />
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-extrabold text-slate-700 truncate" title={cat.name}>{cat.name}</span>
                                        <span className="text-[10px] font-semibold text-slate-400">{cat.percentage}%</span>
                                      </div>
                                    </div>
                                    <span className="text-sm font-black text-[#0B2545] shrink-0 pl-2">{cat.count}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity Card */}
                  <div className="bg-white rounded-2xl border border-[#E4EAF2] shadow-sm p-5 flex flex-col justify-between h-[360px]">
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                        <h3 className="font-extrabold text-base text-[#0B2545]">
                          Hoạt động gần đây
                        </h3>
                        <Link
                          to="/notifications"
                          className="text-xs font-bold text-[#0F5BD8] hover:underline"
                        >
                          Xem tất cả
                        </Link>
                      </div>
                      <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1">
                        {notifLoading ? (
                          [1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-3 animate-pulse">
                              <div className="w-8 h-8 bg-slate-100 rounded-full shrink-0" />
                              <div className="flex-1 space-y-2">
                                <div className="h-3 bg-slate-100 rounded w-1/3" />
                                <div className="h-2.5 bg-slate-100 rounded w-4/5" />
                              </div>
                            </div>
                          ))
                        ) : notifications.length === 0 ? (
                          <div className="py-8 text-center text-xs text-slate-400">
                            Chưa có hoạt động gần đây.
                          </div>
                        ) : (
                          notifications.slice(0, 4).map((activity) => {
                            let iconBg = "bg-blue-50 text-blue-600 border-blue-100";
                            let Icon = RefreshCw;
                            if (activity.type === "FEEDBACK_SUBMITTED") {
                              iconBg = "bg-purple-50 text-purple-600 border-purple-100";
                              Icon = Plus;
                            } else if (
                              activity.type === "FEEDBACK_COMPLETED" ||
                              activity.type === "RESOLVED" ||
                              activity.type === "FEEDBACK_CLOSED"
                            ) {
                              iconBg = "bg-green-50 text-green-600 border-green-100";
                              Icon = CheckCircle2;
                            } else if (activity.type === "FEEDBACK_ASSIGNED") {
                              iconBg = "bg-blue-50 text-blue-600 border-blue-100";
                              Icon = User;
                            }

                            return (
                              <div key={activity.id} className="flex gap-3">
                                <div
                                  className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${iconBg}`}
                                >
                                  <Icon size={14} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs font-bold text-slate-800 block truncate">
                                    {activity.title}
                                  </span>
                                  <span className="text-[10px] text-slate-500 mt-0.5 block line-clamp-2 leading-relaxed">
                                    {activity.content}
                                  </span>
                                  <span className="text-[9px] text-slate-400 mt-1 block">
                                    {formatDate(activity.createdAt)}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "tracking" && (
            <div className="bg-white rounded-2xl border border-[#E4EAF2] shadow-sm p-5 flex flex-col min-h-[500px]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <h3 className="font-extrabold text-lg text-[#0B2545]">Theo dõi tiến độ xử lý</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Hiển thị theo:</span>
                  <select
                    value={trackingViewMode}
                    onChange={(e) => setTrackingViewMode(e.target.value as "week" | "month")}
                    className="h-8 pl-3 pr-8 text-xs font-bold bg-slate-50 border border-[#E4EAF2] rounded-lg focus:outline-none focus:border-[#0F5BD8] text-[#0B2545]"
                  >
                    <option value="week">Theo tuần</option>
                    <option value="month">Theo tháng</option>
                  </select>
                </div>
              </div>
              <div className="flex-1 w-full mt-4 min-h-[400px]">
                {trackingChartData.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">
                    Chưa có dữ liệu xử lý để hiển thị biểu đồ.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={trackingChartData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4EAF2" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis 
                        tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                        dx={-10}
                      />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E4EAF2', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', fontSize: '12px', fontWeight: 'bold', color: '#0B2545' }}
                        cursor={{ fill: '#F8FAFC' }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 'bold', color: '#0B2545' }}
                      />
                      <Bar name="Tổng tiếp nhận" dataKey="received" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={50} />
                      <Bar name="Đã xử lý xong" dataKey="resolved" fill="#198754" radius={[6, 6, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}

          {activeTab === "feedbacks" && (
            <div className="bg-white rounded-2xl border border-[#E4EAF2] shadow-sm p-5 flex flex-col min-h-[500px]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <h3 className="font-extrabold text-lg text-[#0B2545]">Tất cả Phản ánh</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Lọc theo:</span>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="h-8 pl-3 pr-8 text-xs font-bold bg-slate-50 border border-[#E4EAF2] rounded-lg focus:outline-none focus:border-[#0F5BD8] text-[#0B2545]"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="PENDING">Chưa xử lý</option>
                    <option value="ACCEPTED">Đã tiếp nhận</option>
                    <option value="IN_PROGRESS">Đang xử lý</option>
                    <option value="RESOLVED">Đã xử lý</option>
                    <option value="REJECTED">Từ chối</option>
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto -mx-5 flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E4EAF2] bg-slate-50/50">
                      <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Mã phản ánh</th>
                      <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Nội dung</th>
                      <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Địa điểm</th>
                      <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Thời gian</th>
                      <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Hạn xử lý</th>
                      <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4EAF2]">
                    {feedbacksLoading ? (
                      [1, 2, 3, 4, 5].map((i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-5 py-4"><Skeleton className="h-4 w-12" /></td>
                          <td className="px-5 py-4"><Skeleton className="h-4 w-40" /></td>
                          <td className="px-5 py-4"><Skeleton className="h-4 w-32" /></td>
                          <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                          <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
                          <td className="px-5 py-4"><Skeleton className="h-6 w-16" /></td>
                        </tr>
                      ))
                    ) : filteredAndSortedFeedbacks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-xs text-slate-400">Không có phản ánh nào.</td>
                      </tr>
                    ) : (
                      filteredAndSortedFeedbacks.map((row) => (
                        <tr
                          key={row.id}
                          onClick={() => {
                            setSelectedFeedback(row);
                            setShowRejectInput(false);
                            setRejectReason("");
                          }}
                          className="hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <td className="px-5 py-4 text-xs font-bold text-[#0F5BD8]">{row.trackingCode || `PA-${row.id}`}</td>
                          <td className="px-5 py-4 text-xs text-slate-700 font-semibold max-w-[200px] truncate">{row.title}</td>
                          <td className="px-5 py-4 text-xs text-slate-500 truncate max-w-[150px]">{row.addressDetails || row.address || "Chưa xác định"}</td>
                          <td className="px-5 py-4 text-xs text-slate-500">{formatDate(row.createdAt)}</td>
                          <td className="px-5 py-4 text-xs text-slate-500 font-bold">{getDeadlineDate(row.createdAt)}</td>
                          <td className="px-5 py-4">
                            {(() => {
                              const isNotResolved = row.status !== "RESOLVED" && row.status !== "REJECTED";
                              const diffTime = Math.abs(new Date().getTime() - new Date(row.createdAt).getTime());
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              if (isNotResolved && diffDays > 3) {
                                return <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-red-50 text-red-600 border border-red-100 uppercase">Quá hạn</span>;
                              }
                              switch (row.status) {
                                case "PENDING":
                                case "PENDING_RECEIVE":
                                case "SUBMITTED":
                                case "NEED_LOCATION_REVIEW":
                                  return <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-orange-50 text-orange-600 border border-orange-100 uppercase">Chưa xử lý</span>;
                                case "ASSIGNED":
                                  return <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-purple-50 text-purple-600 border border-purple-100 uppercase">Đã tiếp nhận</span>;
                                case "RESOLVED": return <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-green-50 text-green-600 border border-green-100 uppercase">Đã xử lý</span>;
                                case "REJECTED": return <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-red-50 text-red-600 border border-red-100 uppercase">Từ chối</span>;
                                default: return <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-blue-50 text-blue-600 border border-blue-100 uppercase">Đang xử lý</span>;
                              }
                            })()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {["tracking", "reports", "settings"].includes(activeTab) && (
            <div className="bg-white rounded-2xl border border-[#E4EAF2] shadow-sm p-6 flex flex-col items-center justify-center min-h-[400px]">
              <Settings size={48} className="text-slate-300 mb-4" />
              <h3 className="font-extrabold text-lg text-[#0B2545] mb-2">Tính năng đang phát triển</h3>
              <p className="text-slate-500 text-sm">Chức năng {menuItems.find(i => i.id === activeTab)?.name} hiện đang được cập nhật. Vui lòng quay lại sau.</p>
            </div>
          )}

        </main>
      </div>

      {/* ─── MODAL DUYỆT PHẢN ÁNH ─── */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedFeedback(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            <div className="p-6 md:p-8">
              <h2 className="text-xl font-extrabold text-[#0B2545] mb-2">Chi tiết phản ánh</h2>
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 mb-6">
                <span className="bg-blue-50 text-[#0F5BD8] px-2 py-1 rounded border border-blue-100">
                  {selectedFeedback.trackingCode || `PA-${selectedFeedback.id}`}
                </span>
                <span>{formatDate(selectedFeedback.createdAt)}</span>
              </div>

              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Tiêu đề</h3>
                  <p className="text-[#0B2545] font-semibold">{selectedFeedback.title}</p>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Nội dung</h3>
                  <p className="text-slate-700 text-sm leading-relaxed">{selectedFeedback.description}</p>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Địa điểm</h3>
                  <p className="text-[#0B2545] text-sm flex items-center gap-2">
                    <AlertTriangle size={14} className="text-orange-500" />
                    {selectedFeedback.addressDetails || selectedFeedback.address || "Chưa xác định"}
                  </p>
                </div>

                {selectedFeedback.mediaUrls && selectedFeedback.mediaUrls.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Hình ảnh đính kèm</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedFeedback.mediaUrls.map((url, i) => (
                        <div key={i} className="aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                          <img src={url} alt="Đính kèm" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION AREA */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                {["PENDING", "PENDING_RECEIVE", "SUBMITTED", "NEED_LOCATION_REVIEW"].includes(selectedFeedback.status) ? (
                  showRejectInput ? (
                    <div className="space-y-3 animate-in slide-in-from-top-2">
                      <label className="text-sm font-bold text-slate-700">Lý do từ chối:</label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Nhập lý do từ chối phản ánh này..."
                        className="w-full h-24 p-3 text-sm rounded-xl border border-slate-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none"
                      ></textarea>
                      <div className="flex gap-3 justify-end">
                        <button
                          onClick={() => setShowRejectInput(false)}
                          className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={() => handleReject(selectedFeedback.id)}
                          disabled={rejectFeedbackMut.isPending}
                          className="px-6 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
                        >
                          {rejectFeedbackMut.isPending && <RefreshCw size={14} className="animate-spin" />}
                          Xác nhận từ chối
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleAccept(selectedFeedback.id)}
                        disabled={acceptFeedbackMut.isPending}
                        className="flex-1 bg-[#0F5BD8] hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all flex justify-center items-center gap-2"
                      >
                        {acceptFeedbackMut.isPending ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                        Tiếp nhận xử lý ngay
                      </button>
                      <button
                        onClick={() => setShowRejectInput(true)}
                        className="flex-1 bg-white hover:bg-red-50 text-red-600 border-2 border-red-100 hover:border-red-200 font-bold py-3 px-4 rounded-xl transition-all flex justify-center items-center gap-2"
                      >
                        <X size={18} />
                        Từ chối
                      </button>
                    </div>
                  )
                ) : selectedFeedback.status === "ASSIGNED" ? (
                  showRequestInfoInput ? (
                    <div className="space-y-3 animate-in slide-in-from-top-2">
                      <label className="text-sm font-bold text-slate-700">Nội dung yêu cầu bổ sung:</label>
                      <textarea
                        className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                        rows={3}
                        placeholder="Nhập thông tin cần người dân cung cấp thêm..."
                        value={requestInfoReason}
                        onChange={(e) => setRequestInfoReason(e.target.value)}
                      ></textarea>
                      <div className="flex gap-3 justify-end">
                        <button
                          onClick={() => setShowRequestInfoInput(false)}
                          className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={() => handleRequestInfo(selectedFeedback.id)}
                          disabled={requestInfoMut.isPending || !requestInfoReason.trim()}
                          className="px-6 py-2 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors flex items-center gap-2"
                        >
                          {requestInfoMut.isPending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                          Gửi yêu cầu
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleStartProgress(selectedFeedback.id)}
                        disabled={updateStatusMut.isPending}
                        className="flex-1 bg-[#198754] hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-green-500/30 transition-all flex justify-center items-center gap-2"
                      >
                        {updateStatusMut.isPending ? <RefreshCw size={18} className="animate-spin" /> : <PlayCircle size={18} />}
                        Đang xử lý
                      </button>
                      <button
                        onClick={() => setShowRequestInfoInput(true)}
                        className="flex-1 bg-white hover:bg-orange-50 text-orange-500 border-2 border-orange-100 hover:border-orange-200 font-bold py-3 px-4 rounded-xl transition-all flex justify-center items-center gap-2"
                      >
                        <HelpCircle size={18} />
                        Yêu cầu bổ sung
                      </button>
                    </div>
                  )
                ) : selectedFeedback.status === "IN_PROGRESS" ? (
                  showSubmitResultInput ? (
                    <div className="bg-green-50 p-4 rounded-xl border-2 border-green-100 animate-in slide-in-from-top-2">
                      <h4 className="font-bold text-green-800 mb-2">Kết quả xử lý</h4>
                      <textarea
                        value={resultNote}
                        onChange={(e) => setResultNote(e.target.value)}
                        placeholder="Nhập nội dung kết quả xử lý..."
                        className="w-full border-2 border-green-200 p-3 rounded-lg focus:outline-none focus:border-green-400 min-h-[100px] mb-3 bg-white"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setShowSubmitResultInput(false);
                            setResultNote("");
                          }}
                          className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={() => handleSubmitResult(selectedFeedback.id)}
                          disabled={submitResultMut.isPending}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2"
                        >
                          {submitResultMut.isPending ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                          Hoàn tất xử lý
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowSubmitResultInput(true)}
                      className="w-full bg-[#198754] hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-green-500/30 transition-all flex justify-center items-center gap-2"
                    >
                      <CheckCircle size={20} />
                      Xử lý xong
                    </button>
                  )
                ) : (
                  <div className="space-y-4">
                    {selectedFeedback.status === "REJECTED" ? (
                      <div className="bg-red-50 rounded-xl p-4 border border-red-100 flex flex-col items-center text-center gap-3 animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 text-red-600">
                          <X size={20} />
                          <span className="font-bold">Phản ánh này đã bị từ chối</span>
                        </div>
                        {selectedFeedback.rejectionReason && (
                          <div className="bg-white p-3 rounded-lg border border-red-200 text-slate-700 w-full text-left italic shadow-sm">
                            <span className="font-semibold text-red-800">Lý do: </span>
                            {selectedFeedback.rejectionReason}
                          </div>
                        )}
                        <button
                          onClick={async () => {
                            try {
                              await updateStatusMut.mutateAsync({ id: selectedFeedback.id, status: "ASSIGNED", note: "Hủy từ chối, tiếp tục xử lý" });
                              toast.success("Đã hủy từ chối thành công");
                              setSelectedFeedback(null);
                              setFilterStatus("ACCEPTED");
                              setActiveTab("feedbacks");
                              refetch();
                            } catch (err: any) {
                              toast.error(err.message || "Lỗi khi hủy từ chối");
                            }
                          }}
                          disabled={updateStatusMut.isPending}
                          className="mt-2 bg-white hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2"
                        >
                          {updateStatusMut.isPending ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                          Hủy từ chối (Tiếp tục xử lý)
                        </button>
                      </div>
                    ) : selectedFeedback.status === "RESOLVED" ? (
                      <div className="bg-green-50 rounded-xl p-4 border border-green-100 flex flex-col items-center text-center gap-3 animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle size={20} />
                          <span className="font-bold">Phản ánh đã được xử lý xong</span>
                        </div>
                        {selectedFeedback.resolutionNote && (
                          <div className="bg-white p-3 rounded-lg border border-green-200 text-slate-700 w-full text-left shadow-sm">
                            <span className="font-semibold text-green-800">Kết quả: </span>
                            {selectedFeedback.resolutionNote}
                          </div>
                        )}
                      </div>
                    ) : selectedFeedback.status === "WAITING_INFO" ? (
                      <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-center gap-3 border border-slate-100">
                        <HelpCircle size={20} className="text-orange-500" />
                        <span className="font-bold text-slate-500">Đang chờ người dân bổ sung thông tin...</span>
                      </div>
                    ) : (
                      <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-center gap-3 border border-slate-100">
                        <CheckCircle size={20} className="text-green-500" />
                        <span className="font-bold text-slate-500">Phản ánh này đang được xử lý hoặc đã xử lý xong.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

