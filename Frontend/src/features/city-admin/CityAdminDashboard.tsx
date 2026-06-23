import { lazy, Suspense, useState, useEffect, useRef, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNotifications, useMarkNotificationReadMutation } from "@/hooks";
import { useFeedbackNotification } from "@/hooks/use-notification";
import { useAuth } from "@/lib/auth";
import { getLoginPathForRole } from "@/lib/roles";
import { analyticsApi, authApi, feedbackApi, type KpiData, type WardPerformance, type MonthlyTrend } from "@/lib/api";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  kpis as mockKpis,
  wardPerformance as mockWardPerf,
  reports as mockReports,
} from "@/lib/mock-data";
import { Skeleton } from "@/components/ui/skeleton";
import { mapStatus } from "@/lib/status";
import logoImg from "@/assets/logo.png";
import { OverviewPage } from "./pages/OverviewPage";
import { FeedbacksPage } from "./pages/FeedbacksPage";
import { ReportsPage } from "./pages/ReportsPage";
import { UsersPage } from "./pages/UsersPage";
import { PermissionsPage } from "./pages/PermissionsPage";
import { toast } from "sonner";
import {
  LayoutDashboard,
  MapPin,
  FileText,
  BarChart3,
  Users,
  Shield,
  Menu,
  Search,
  Bell,
  ChevronDown,
  Clock,
  RefreshCw,
  AlertCircle,
  Building2,
  Leaf,
  Flame,
  Construction,
  Car,
  Download,
  Settings,
  LogOut,
  ChevronRight,
  TrendingUp,
  Home,
  UserCheck,
  Activity,
  Zap,
  Maximize2,
  Minimize2,
} from "lucide-react";

// Lazy-load Leaflet map component to prevent SSR issues (window is not defined)
const SuperAdminMap = lazy(() =>
  import("./SuperAdminMap").then((m) => ({ default: m.SuperAdminMap })),
);

// Map category helper
const mapCategoryName = (name: string | null | undefined): string => {
  if (!name) return "Hạ tầng đô thị";
  const n = name.toLowerCase();
  if (n.includes("giao thông") || n.includes("traffic") || n.includes("giao thong")) {
    return "Giao thông";
  }
  if (n.includes("môi trường") || n.includes("environment") || n.includes("moi truong") || n.includes("rác")) {
    return "Môi trường";
  }
  if (n.includes("an ninh") || n.includes("security") || n.includes("safety") || n.includes("trật tự") || n.includes("pháp")) {
    return "An ninh trật tự";
  }
  if (n.includes("xây dựng") || n.includes("construction") || n.includes("xay dung")) {
    return "Xây dựng";
  }
  if (n.includes("phòng cháy") || n.includes("chữa cháy") || n.includes("fire")) {
    return "Phòng cháy chữa cháy";
  }
  // Default to "Hạ tầng đô thị" for generic / infrastructure cases
  return "Hạ tầng đô thị";
};

// Category Icon helper
const getCategoryIcon = (catName: string) => {
  switch (catName) {
    case "Giao thông":
      return <Car className="w-5 h-5" />;
    case "Hạ tầng đô thị":
      return <Building2 className="w-5 h-5" />;
    case "Môi trường":
      return <Leaf className="w-5 h-5" />;
    case "An ninh trật tự":
      return <Shield className="w-5 h-5" />;
    case "Xây dựng":
      return <Construction className="w-5 h-5" />;
    case "Phòng cháy chữa cháy":
      return <Flame className="w-5 h-5" />;
    default:
      return <Building2 className="w-5 h-5" />;
  }
};

// Calculate time elapsed since report was created in Vietnamese format
function getOverdueTime(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHrs < 24) {
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / 60000);
    return `${diffHrs} giờ ${mins} phút`;
  } else {
    const days = Math.floor(diffHrs / 24);
    const remainingHrs = diffHrs % 24;
    return `${days} ngày ${remainingHrs} giờ`;
  }
}

export function CityAdminDashboard() {
  const { locale } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useFeedbackNotification(); // Real-time WebSockets update listener
  const { user, logout } = useAuth();

  // State controls for headers/sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "feedbacks" | "reports" | "users" | "permissions">("overview");
  const [fullscreen, setFullscreen] = useState(false);

  // Filter states
  const [selectedWard, setSelectedWard] = useState<string | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Click outside listener for dropdowns
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

  // Fetch real backend data — dùng admin endpoint để lấy toàn bộ phản ánh thành phố
  const { data: feedbacksPage, isLoading: feedbacksLoading, isError: feedbacksError, refetch: refetchFeedbacks } = useQuery({
    queryKey: ["admin", "feedbacks", "all"],
    queryFn: () => feedbackApi.adminGetAll(0, 500),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const { data: analyticsKpi, isLoading: kpiLoading, isError: kpiError } = useQuery<KpiData>({
    queryKey: ["analytics", "kpi"],
    queryFn: () => analyticsApi.kpi(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const { data: wardPerf, isLoading: wardLoading } = useQuery<WardPerformance[]>({
    queryKey: ["analytics", "ward-performance"],
    queryFn: () => analyticsApi.wardPerformance(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const { data: monthlyTrend } = useQuery<MonthlyTrend[]>({
    queryKey: ["analytics", "monthly-trend"],
    queryFn: () => analyticsApi.monthlyTrend(12),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationReadMutation();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const feedbacks = feedbacksPage?.content ?? [];
  const hasApiData = feedbacks.length > 0;

  // Sync / derive stats dynamically from real report list
  const totalReportsCount = hasApiData ? feedbacks.length : (analyticsKpi?.total ?? 0);
  const unresolvedCount = feedbacks.filter((f) => f.status !== "RESOLVED" && f.status !== "REJECTED").length;
  const inProgressCount = feedbacks.filter((f) => f.status === "IN_PROGRESS" || f.status === "ASSIGNED" || f.status === "WAITING_INFO").length;
  
  // Overdue count derivation (created > 3 days ago and not resolved)
  const overdueCount = feedbacks.filter((f) => {
    const isNotResolved = f.status !== "RESOLVED" && f.status !== "REJECTED";
    const diffTime = Math.abs(new Date().getTime() - new Date(f.createdAt).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return isNotResolved && diffDays > 3;
  }).length;

  // Deriving trend statistics from monthlyTrend
  const getTrendPct = (key: "total" | "resolved") => {
    if (!monthlyTrend || monthlyTrend.length < 2) return null;
    const current = monthlyTrend[monthlyTrend.length - 1];
    const previous = monthlyTrend[monthlyTrend.length - 2];
    if (!previous || previous[key] === 0) return null;
    const diff = current[key] - previous[key];
    const pct = (diff / previous[key]) * 100;
    return {
      pct: Math.abs(pct).toFixed(1) + "%",
      isUp: diff >= 0,
    };
  };

  const totalTrend = getTrendPct("total");
  const resolvedTrend = getTrendPct("resolved");

  // Navigation config for left blue sidebar
  const navItems = [
    { 
      name: "Tổng quan", 
      tab: "overview" as const, 
      icon: Home, 
      badge: null,
      description: "Dashboard tổng quan"
    },
    { 
      name: "Phản ánh", 
      tab: "feedbacks" as const, 
      icon: FileText, 
      badge: unresolvedCount > 0 ? unresolvedCount : null,
      description: "Quản lý phản ánh từ dân"
    },
    { 
      name: "Báo cáo", 
      tab: "reports" as const, 
      icon: BarChart3, 
      badge: null,
      description: "Thống kê & phân tích"
    },
    { 
      name: "Tài khoản", 
      tab: "users" as const, 
      icon: Users, 
      badge: null,
      description: "Quản lý người dùng"
    },
    // Tạm ẩn Phân quyền theo yêu cầu
    // { 
    //   name: "Phân quyền", 
    //   tab: "permissions" as const, 
    //   icon: Shield, 
    //   badge: "NEW",
    //   description: "Cấp quyền & phân công"
    // },
  ];

  // Hotspot location database
  const defaultWards = ["Hải Châu", "Thanh Khê", "Liên Chiểu", "Sơn Trà", "Ngũ Hành Sơn", "Cẩm Lệ", "Hòa Vang"];
  const WARD_COORDINATES: Record<string, [number, number]> = {
    "Hải Châu": [16.047, 108.218],
    "Thanh Khê": [16.062, 108.182],
    "Liên Chiểu": [16.079, 108.152],
    "Sơn Trà": [16.085, 108.244],
    "Ngũ Hành Sơn": [16.023, 108.258],
    "Cẩm Lệ": [16.014, 108.173],
    "Hòa Vang": [15.992, 108.115],
  };

  // Group real feedbacks by area
  const areaHotspots = useMemo(() => {
    const areaMap: Record<string, { name: string; total: number; unresolved: number; overdue: number; categoryCounts: Record<string, number> }> = {};

    defaultWards.forEach((w) => {
      areaMap[w] = { name: w, total: 0, unresolved: 0, overdue: 0, categoryCounts: {} };
    });

    feedbacks.forEach((fb) => {
      // Find ward name from database mapping
      let matchedWard = "Khác";
      for (const w of defaultWards) {
        if (fb.wardName?.toLowerCase().includes(w.toLowerCase()) || fb.addressDetails?.toLowerCase().includes(w.toLowerCase())) {
          matchedWard = w;
          break;
        }
      }

      if (matchedWard === "Khác") return;

      areaMap[matchedWard].total++;
      const isUnresolved = fb.status !== "RESOLVED" && fb.status !== "REJECTED";
      if (isUnresolved) {
        areaMap[matchedWard].unresolved++;
        const diffTime = Math.abs(new Date().getTime() - new Date(fb.createdAt).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 3) {
          areaMap[matchedWard].overdue++;
        }
        const mappedCat = mapCategoryName(fb.categoryName);
        areaMap[matchedWard].categoryCounts[mappedCat] = (areaMap[matchedWard].categoryCounts[mappedCat] || 0) + 1;
      }
    });

    return Object.values(areaMap).map((w) => {
      // Find top category
      let topCategory = "";
      let maxCatCount = 0;
      Object.entries(w.categoryCounts).forEach(([cat, count]) => {
        if (count > maxCatCount) {
          maxCatCount = count;
          topCategory = cat;
        }
      });

      const coords = WARD_COORDINATES[w.name] || [16.0544, 108.2022];
      return {
        name: w.name,
        lat: coords[0],
        lng: coords[1],
        total: w.total,
        unresolved: w.unresolved,
        overdue: w.overdue,
        unresolvedPct: w.total > 0 ? (w.unresolved / w.total) * 100 : 0,
        topCategory,
      };
    });
  }, [feedbacks]);

  // Sort areas by unresolved count to display in ranking list
  const rankedAreas = useMemo(() => {
    return [...areaHotspots]
      .sort((a, b) => b.unresolved - a.unresolved)
      .slice(0, 5);
  }, [areaHotspots]);

  // Unresolved counts by 6 main categories
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      "Giao thông": 0,
      "Hạ tầng đô thị": 0,
      "Môi trường": 0,
      "An ninh trật tự": 0,
      "Xây dựng": 0,
      "Phòng cháy chữa cháy": 0,
    };

    feedbacks.forEach((fb) => {
      const isUnresolved = fb.status !== "RESOLVED" && fb.status !== "REJECTED";
      if (isUnresolved) {
        const mapped = mapCategoryName(fb.categoryName);
        if (mapped in counts) {
          counts[mapped]++;
        }
      }
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
    }));
  }, [feedbacks]);

  const maxCategoryCount = useMemo(() => {
    return Math.max(1, ...categoryCounts.map((c) => c.count));
  }, [categoryCounts]);

  // High priority list derivation
  const priorityReports = useMemo(() => {
    return feedbacks
      .filter((fb) => fb.status !== "RESOLVED" && fb.status !== "REJECTED")
      .map((fb) => {
        const diffTime = Math.abs(new Date().getTime() - new Date(fb.createdAt).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let priorityStatus = "Đang xử lý";
        let priorityBadgeColor = "bg-blue-50 text-blue-600 border border-blue-100";
        
        if (diffDays > 3) {
          priorityStatus = "Quá hạn";
          priorityBadgeColor = "bg-red-50 text-red-600 border border-red-100";
        } else if (diffDays >= 1) {
          priorityStatus = "Sắp quá hạn";
          priorityBadgeColor = "bg-orange-50 text-orange-600 border border-orange-100";
        }

        // Find area name
        let matchedWard = "Đà Nẵng";
        for (const w of defaultWards) {
          if (fb.wardName?.toLowerCase().includes(w.toLowerCase()) || fb.addressDetails?.toLowerCase().includes(w.toLowerCase())) {
            matchedWard = w;
            break;
          }
        }

        return {
          id: fb.id,
          trackingCode: fb.trackingCode || `PA-${fb.id}`,
          ward: matchedWard,
          category: mapCategoryName(fb.categoryName),
          status: priorityStatus,
          badgeColor: priorityBadgeColor,
          overdueTime: getOverdueTime(fb.createdAt),
          createdAt: new Date(fb.createdAt).getTime(),
          diffDays,
        };
      })
      // Sort: Overdue first, then Sắp quá hạn, then Đang xử lý
      .sort((a, b) => b.diffDays - a.diffDays);
  }, [feedbacks]);

  // Filters application
  const filteredPriorityReports = useMemo(() => {
    let result = [...priorityReports];
    if (selectedWard) {
      result = result.filter((r) => r.ward === selectedWard);
    }
    if (selectedCategory) {
      result = result.filter((r) => r.category === selectedCategory);
    }
    if (selectedStatus) {
      result = result.filter((r) => r.status === selectedStatus);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((r) => 
        r.trackingCode.toLowerCase().includes(q) ||
        r.ward.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
      );
    }
    return result.slice(0, 5);
  }, [priorityReports, selectedWard, selectedCategory, selectedStatus, searchQuery]);

  const handleMarkAllRead = async () => {
    const unreadItems = notifications.filter((n) => !n.isRead).slice(0, 5);
    if (unreadItems.length === 0) return;
    try {
      await Promise.all(unreadItems.map((item) => markRead.mutateAsync(item.id)));
      toast.success("Đã đánh dấu đọc tất cả thông báo");
    } catch (err) {
      toast.error("Thao tác thất bại");
    }
  };

  const handleNotifClick = async (id: number | string, refId: number | null) => {
    setNotifOpen(false);
    try {
      await markRead.mutateAsync(id);
      if (refId) {
        await navigate({ to: "/my-reports/$id", params: { id: String(refId) } });
      }
    } catch (err) {
      // ignore
    }
  };

  const handleLogout = async () => {
    try {
      const loginPath = getLoginPathForRole(user?.role);
      await authApi.logout().catch(() => {
        // Ignore logout API errors, still proceed with local logout
      });
      logout();
      setUserOpen(false);
      toast.success("Đã đăng xuất thành công");
      // Small delay to show toast before navigation
      setTimeout(() => {
        navigate({ to: loginPath });
      }, 500);
    } catch (error) {
      // Even if logout fails, still clear local state
      logout();
      setUserOpen(false);
      navigate({ to: "/login" });
    }
  };

  const resetAllFilters = () => {
    setSelectedWard(undefined);
    setSelectedCategory(undefined);
    setSelectedStatus(undefined);
    setSearchQuery("");
  };

  // Error boundary cho queries
  if (feedbacksError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7FAFF] to-[#EDF4FF] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Không thể tải dữ liệu</h2>
          <p className="text-slate-600 mb-4">Vui lòng thử lại sau</p>
          <button
            onClick={() => {
              // Refresh data instead of reloading page
              queryClient.invalidateQueries();
              toast.success("Đã làm mới dữ liệu");
            }}
            className="px-4 py-2 bg-[#0B4FC4] text-white rounded-lg hover:bg-blue-700 transition"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7FAFF] to-[#EDF4FF] flex text-[#1D2939] font-sans antialiased overflow-x-hidden">
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>
      {/* 1. LEFT MODERN SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 bg-gradient-to-b from-[#0647A5] to-[#043A8F] text-white flex flex-col z-40 transform transition-all duration-300 ease-in-out shadow-2xl ${
          sidebarCollapsed ? "w-16" : "w-64"
        } ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Branding */}
        <div className={`p-5 flex items-center border-b border-[#053d8e] shrink-0 transition-all duration-300 ${
          sidebarCollapsed ? "justify-center" : "gap-3"
        }`}>
          <img
            src={logoImg}
            alt="Đà Nẵng Connect Logo"
            className="w-10 h-10 object-contain shrink-0"
          />
          {!sidebarCollapsed && (
            <>
              <div className="flex flex-col leading-none flex-1">
                <span className="font-extrabold text-base tracking-tight uppercase font-sans">
                  ĐÀ NẴNG
                </span>
                <span className="font-extrabold text-base tracking-tight uppercase font-sans">
                  KẾT NỐI
                </span>
                <span className="text-[7.5px] text-[#A6C5F7] font-bold uppercase tracking-wider mt-0.5 leading-tight font-sans">
                  NỀN TẢNG PHẢN ÁNH HIỆN TRƯỜNG
                </span>
              </div>
              {/* Collapse Toggle Button - moved here next to logo */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="w-8 h-8 flex items-center justify-center text-[#B8D4FF] hover:text-white hover:bg-[#0753BF] rounded-lg transition-all shrink-0"
                title="Thu gọn"
              >
                <ChevronRight 
                  size={14} 
                  className="transform transition-transform duration-300 rotate-180"
                />
              </button>
            </>
          )}
          {sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center text-[#B8D4FF] hover:text-white hover:bg-[#0753BF] rounded-lg transition-all"
              title="Mở rộng"
            >
              <ChevronRight 
                size={12} 
                className="transform transition-transform duration-300 rotate-0"
              />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeTab === item.tab;
            return (
              <div key={index} className="relative group">
                <button
                  onClick={() => { setActiveTab(item.tab); setSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between rounded-xl transition-all relative overflow-hidden ${
                    sidebarCollapsed ? "px-3 py-3.5" : "px-4 py-3.5"
                  } ${
                    isActive
                      ? "bg-white/95 text-[#0647A5] shadow-lg font-bold transform scale-[1.02] backdrop-blur-sm"
                      : "text-[#B8D4FF] hover:bg-white/10 hover:text-white hover:transform hover:scale-[1.01] hover:shadow-md"
                  }`}
                  title={sidebarCollapsed ? `${item.name} - ${item.description}` : undefined}
                >
                  {/* Gradient overlay for active state */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-80 rounded-xl"></div>
                  )}
                  
                  <div className={`flex items-center relative z-10 ${sidebarCollapsed ? "justify-center" : "gap-3"}`}>
                    <Icon size={18} className={`shrink-0 ${isActive ? "text-[#0647A5]" : ""}`} />
                    {!sidebarCollapsed && (
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-semibold">{item.name}</span>
                        <span className={`text-[10px] font-medium opacity-75 ${
                          isActive ? "text-slate-600" : "text-[#A6C5F7]"
                        }`}>
                          {item.description}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {item.badge && !sidebarCollapsed && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black relative z-10 ${
                      String(item.badge) === "NEW" 
                        ? "bg-gradient-to-r from-emerald-400 to-emerald-600 text-white shadow-sm" 
                        : isActive 
                          ? "bg-red-100 text-red-600" 
                          : "bg-red-500 text-white shadow-sm"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  
                  {item.badge && sidebarCollapsed && (
                    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                      String(item.badge) === "NEW" ? "bg-emerald-500" : "bg-red-500"
                    } shadow-sm`}></div>
                  )}
                </button>
                
                {/* Tooltip for collapsed sidebar */}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap shadow-lg">
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-slate-300 text-[10px]">{item.description}</div>
                    <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                  </div>
                )}
              </div>
            );
          })}
          
          {!sidebarCollapsed && (
            <>
              {/* Elegant Separator */}
              <div className="relative my-6 px-2">
                <div className="h-px bg-gradient-to-r from-transparent via-[#053d8e] to-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-[#053d8e] rounded-full"></div>
                </div>
              </div>
              
              {/* Enhanced System Stats */}
              <div className="px-4 py-4 bg-gradient-to-br from-[#053c8c] to-[#042f6b] rounded-xl border border-[#0753BF]/30 shadow-inner">
                <div className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                  <Activity size={14} className="text-emerald-400" />
                  Tình trạng hệ thống
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-[#A6C5F7] font-medium">Phản ánh chưa xử lý</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{unresolvedCount}</span>
                      <div className={`w-2 h-2 rounded-full ${unresolvedCount > 0 ? "bg-orange-400 animate-pulse" : "bg-green-400"}`}></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-[#A6C5F7] font-medium">Báo cáo quá hạn</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-red-300">{overdueCount}</span>
                      <div className={`w-2 h-2 rounded-full ${overdueCount > 0 ? "bg-red-400 animate-pulse" : "bg-green-400"}`}></div>
                    </div>
                  </div>
                  <div className="h-px bg-white/10 my-2"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-emerald-300 font-semibold">Hiệu suất xử lý</span>
                    <span className="text-xs font-bold text-emerald-300">
                      {feedbacks.length > 0 ? Math.round(((feedbacks.length - unresolvedCount) / feedbacks.length) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </nav>

        {/* Bottom account summary */}
        <div className="p-4 border-t border-[#053d8e] bg-[#053c8c] flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-full bg-[#002B73] border border-blue-400/20 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm truncate text-white">Super Admin</span>
            <span className="text-[10px] text-[#A6C5F7] font-medium leading-none mt-0.5">
              Quyền cao nhất
            </span>
          </div>
        </div>
      </aside>

      {/* Drawer Overlay for Mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 z-30 md:hidden transition-opacity duration-300"
        />
      )}

      {/* Main Container Wrapper */}
      <div className={`flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300 ${
        sidebarCollapsed ? "md:pl-16" : "md:pl-64"
      }`}>
        
        {/* 2. TOP MODERN HEADER */}
        <header className="h-16 bg-white/95 backdrop-blur-sm border-b border-[#E4EAF2] flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-slate-500 hover:text-[#0B4FC4] p-1.5 rounded-lg border border-slate-200 bg-slate-50 transition-all hover:scale-105"
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-bold text-[#1D2939] font-sans flex items-center gap-2">
              {activeTab === "overview" && (
                <>
                  <Home size={20} className="text-[#0B4FC4]" />
                  Tổng quan
                </>
              )}
              {activeTab === "feedbacks" && (
                <>
                  <FileText size={20} className="text-[#0B4FC4]" />
                  Phản ánh
                  {unresolvedCount > 0 && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                      {unresolvedCount} chưa xử lý
                    </span>
                  )}
                </>
              )}
              {activeTab === "reports" && (
                <>
                  <BarChart3 size={20} className="text-[#0B4FC4]" />
                  Báo cáo & Thống kê
                </>
              )}
              {activeTab === "users" && (
                <>
                  <Users size={20} className="text-[#0B4FC4]" />
                  Quản lý tài khoản
                </>
              )}
              {/* Tạm ẩn header Phân quyền */}
              {/* {activeTab === "permissions" && (
                <>
                  <Shield size={20} className="text-[#0B4FC4]" />
                  Phân quyền & Ủy quyền
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                    MỚI
                  </span>
                </>
              )} */}
            </h2>
          </div>

          {/* Search field */}
          <div className="hidden md:flex items-center relative w-96">
            <input
              type="text"
              placeholder="Tìm kiếm phản ánh, khu vực, mã..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-4 pr-10 rounded-lg border border-[#E4EAF2] text-sm focus:border-[#0B4FC4] outline-none bg-slate-50/50"
            />
            <Search size={16} className="absolute right-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* User profile dropdown and notification controls */}
          <div className="flex items-center gap-3">
            
            {/* Quick Actions */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={() => setFullscreen(!fullscreen)}
                className="p-2 text-slate-500 hover:text-[#0B4FC4] transition rounded-lg hover:bg-slate-100 flex items-center justify-center"
                title={fullscreen ? "Thu nhỏ" : "Toàn màn hình"}
              >
                {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
              
              <button
                onClick={() => {
                  // Refresh data instead of reloading page
                  if (activeTab === "feedbacks") {
                    queryClient.invalidateQueries({ queryKey: ["admin", "feedbacks", "all"] });
                  } else if (activeTab === "users") {
                    queryClient.invalidateQueries({ queryKey: ["admin", "users", "all"] });
                  } else {
                    queryClient.invalidateQueries();
                  }
                  toast.success("Đã làm mới dữ liệu");
                }}
                className="p-2 text-slate-500 hover:text-[#0B4FC4] transition rounded-lg hover:bg-slate-100 flex items-center justify-center"
                title="Làm mới dữ liệu"
              >
                <RefreshCw size={18} />
              </button>
            </div>
            
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setUserOpen(false);
                }}
                className="relative p-2 text-slate-500 hover:text-[#0B4FC4] transition rounded-full hover:bg-slate-100 flex items-center justify-center cursor-pointer min-w-[36px] min-h-[36px]"
                aria-label="Thông báo"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-[320px] bg-white border border-[#E4EAF2] rounded-xl shadow-lg py-2.5 z-50 animate-fade-in">
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-700">Thông báo mới</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-[#0B4FC4] hover:underline font-bold"
                      >
                        Đọc tất cả
                      </button>
                    )}
                  </div>
                  <div className="max-h-[240px] overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">Không có thông báo mới</div>
                    ) : (
                      notifications.slice(0, 5).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleNotifClick(item.id, item.feedbackId ?? item.referenceId)}
                          className={`w-full text-left p-3 flex flex-col transition-colors hover:bg-slate-50 ${
                            item.isRead ? "opacity-75" : "bg-blue-50/40"
                          }`}
                        >
                          <span className="text-xs font-bold text-slate-800 leading-snug">{item.title}</span>
                          <span className="text-[10px] text-slate-500 mt-1 leading-snug">{item.content}</span>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="pt-2 text-center border-t border-slate-100">
                    <Link
                      to="/notifications"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs font-bold text-[#0B4FC4] hover:underline inline-block py-0.5"
                    >
                      Xem tất cả
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown */}
            <div className="relative" ref={userRef}>
              <button
                onClick={() => {
                  setUserOpen(!userOpen);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2 focus:outline-none cursor-pointer text-left"
              >
                <div className="w-8.5 h-8.5 rounded-full bg-blue-100 text-[#0B4FC4] flex items-center justify-center font-bold text-sm border border-slate-200">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "S"}
                </div>
                <div className="leading-tight hidden sm:block">
                  <div className="text-xs font-bold text-[#1D2939] flex items-center gap-1">
                    {user?.name || "Super Admin"}
                    <ChevronDown size={14} className="text-slate-400" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">Super Admin</span>
                </div>
              </button>

              {/* User settings menu dropdown */}
              {userOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E4EAF2] rounded-xl shadow-lg py-1.5 z-50 animate-fade-in">
                  <div className="px-4 py-2 border-b border-slate-100 mb-1">
                    <div className="text-xs font-bold text-slate-700 truncate">{user?.name || "Super Admin"}</div>
                    <div className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">super_admin@danang.gov.vn</div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setUserOpen(false)}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-[#1D2939] hover:bg-slate-50 transition flex items-center gap-2"
                  >
                    <Settings size={14} className="text-slate-400" />
                    Cấu hình tài khoản
                  </Link>
                  <button
                    onClick={() => void handleLogout()}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50/50 transition flex items-center gap-2 cursor-pointer border-t border-slate-100 mt-1"
                  >
                    <LogOut size={14} />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* 3. MAIN DASHBOARD CONTENT */}
        <main className={`flex-1 overflow-y-auto transition-all duration-300 ${fullscreen ? 'p-2' : 'p-6 md:p-8'}`}>
          <div className={`${fullscreen ? 'max-w-none' : 'max-w-7xl mx-auto'}`}>
            {/* Loading State */}
            {(feedbacksLoading || kpiLoading) && activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-2xl" />
                  ))}
                </div>
                <Skeleton className="h-96 rounded-2xl" />
              </div>
            )}
            
            {/* Content */}
            {!(feedbacksLoading || kpiLoading) && (
              <>
                {activeTab === "overview" && <OverviewPage />}
                {activeTab === "feedbacks" && <FeedbacksPage />}
                {activeTab === "reports" && <ReportsPage />}
                {activeTab === "users" && <UsersPage />}
                {/* Tạm ẩn PermissionsPage */}
                {/* {activeTab === "permissions" && <PermissionsPage />} */}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
