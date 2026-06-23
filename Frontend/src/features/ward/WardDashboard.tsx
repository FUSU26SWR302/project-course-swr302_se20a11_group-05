import { clientOnly } from "@/components/ClientOnly";
import { lazy, Suspense, useState, useEffect, useRef, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { getGroupedFeedbackStatus } from "@/lib/status";
import {
  useFeedbacks,
  useNotifications,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useNotificationUnreadCount,
  useWardStaffStatistics,
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
  ChevronLeft,
  Search,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  Shield,
  RefreshCw,
  Calendar,
  Sliders,
  Hourglass,
  UserCheck,
  Activity,
  BarChart3,
  Settings,
} from "lucide-react";
import logoImg from "@/assets/logo.png";
import { toast } from "sonner";
import { authApi, type NotificationResponse, type FeedbackResponse } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdministrativeUnitLabel, getAdministrativeUnitName } from "@/lib/administrativeUnit";
import { WardFeedbackManagementPage } from "./WardFeedbackManagementPage";

const CivicMap = clientOnly(() =>
  import("@/components/site/CivicMap").then((m) => ({ default: m.CivicMap })),
);

import { WARD_CENTERS } from "@/lib/geojson";

type WardSection = "overview" | "feedback" | "campaign" | "schedule" | "config";

// Date formatting helper
function formatDate(dateStr: string, includeTime = true): string {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  const datePart = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  if (!includeTime) return datePart;
  return `${datePart} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

// Ward neighborhood/residential group name generator based on report details
const getAreaName = (fb: FeedbackResponse) => {
  const addr = fb.addressDetails || fb.address || "";
  if (addr.includes("Trường Chinh")) return "Tổ dân phố 7 - Trường Chinh";
  if (addr.includes("Âu Cơ")) return "Tổ dân phố 3 - Âu Cơ";
  if (addr.includes("Cộng Hòa")) return "Tổ dân phố 11 - Cộng Hòa";
  if (addr.includes("Hoàng Văn Thụ")) return "Tổ dân phố 5 - Hoàng Văn Thụ";
  if (addr.includes("Lê Trọng Tấn")) return "Tổ dân phố 9 - Lê Trọng Tấn";
  if (addr.includes("Hoàng Diệu")) return "Tổ dân phố 2 - Hoàng Diệu";
  if (addr.includes("Nguyễn Văn Linh")) return "Tổ dân phố 4 - Nguyễn Văn Linh";

  const streetName = addr
    .split(/[,\-]/)[0]
    ?.replace(/^(Duong|Kiet|Hem|Đường|Kiệt|Hẻm)\s+/i, "")
    .trim();
  if (streetName && streetName.length > 4) {
    return `Tổ dân phố ${(fb.id % 15) + 1} - ${streetName}`;
  }
  return `Tổ dân phố ${(fb.id % 15) + 1}`;
};

export function WardDashboard() {
  const { locale } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();

  // State controls for sidebar and dropdowns
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeSection, setActiveSection] = useState<WardSection>(() => {
    if (typeof window === "undefined") return "overview";
    const tab = new URLSearchParams(window.location.search).get("tab") as WardSection | null;
    return tab && ["overview", "feedback", "campaign", "schedule", "config"].includes(tab) ? tab : "overview";
  });

  // Map persistent states
  const [mapCenterState, setMapCenterState] = useState<[number, number] | undefined>(undefined);
  const [mapZoomState, setMapZoomState] = useState<number | undefined>(undefined);
  const [mapLayerType, setMapLayerType] = useState<"osm" | "satellite">("osm");
  const [activeStatusFilter, setActiveStatusFilter] = useState<"ALL" | "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED">("ALL");
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<number | null>(null);

  const defaultCenter = useMemo<[number, number]>(() => {
    if (user?.wardName && WARD_CENTERS[user.wardName]) {
      return WARD_CENTERS[user.wardName];
    }
    return [16.044, 108.220];
  }, [user]);

  // Scroll card into view when selectedFeedbackId changes
  useEffect(() => {
    if (selectedFeedbackId) {
      const element = document.getElementById(`fb-card-${selectedFeedbackId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [selectedFeedbackId]);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

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

  // Date Picker & Reload Logic
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const dateInputRef = useRef<HTMLInputElement>(null);

  const formatDateToISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDateToDisplay = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const isTodayDate = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const dateStr = useMemo(() => formatDateToISO(selectedDate), [selectedDate]);

  // Derive fromDate/toDate for API filter from selectedDate (full day range)
  const feedbackDateFilters = useMemo(() => ({
    keyword: debouncedSearch,
    fromDate: dateStr,
    toDate: dateStr,
  }), [debouncedSearch, dateStr]);

  const { data: feedbacksPage, isLoading: feedbacksLoading, refetch } = useFeedbacks(0, 500, feedbackDateFilters);
  const { data: notifications = [], isLoading: notifLoading } = useNotifications();
  const { data: unreadCountData } = useNotificationUnreadCount(!!user);
  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();

  const unreadCount = unreadCountData ?? notifications.filter((n) => !n.isRead).length;

  const rawFeedbacks = feedbacksPage?.content ?? [];

  // Filter rawFeedbacks by WARD_STAFF role allowed categories
  const feedbacks = useMemo(() => {
    return rawFeedbacks.filter((fb) => {
      const code = (fb.categoryCode || "").toUpperCase();
      if (code) {
        return code === "URBAN_INFRASTRUCTURE" || code === "ENVIRONMENT" || code === "CONSTRUCTION";
      }
      const name = (fb.categoryName || fb.category || "").toLowerCase();
      const isTraffic = name.includes("giao thông") || name.includes("traffic") || name.includes("giao thong");
      const isSecurity = name.includes("an ninh") || name.includes("security") || name.includes("safety") || name.includes("trật tự") || name.includes("pháp") || name.includes("công an");
      const isFire = name.includes("phòng cháy") || name.includes("chữa cháy") || name.includes("fire");
      return !isTraffic && !isSecurity && !isFire;
    });
  }, [rawFeedbacks]);

  // Administrative Unit details
  const authorityUnitName = getAdministrativeUnitName(user?.wardName, user?.org) || "Tân Bình";
  const authorityUnitLabel = getAdministrativeUnitLabel(
    user?.wardType || user?.org,
    authorityUnitName,
  );

  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useWardStaffStatistics(dateStr);

  const dateLabel = isTodayDate(selectedDate)
    ? `Hôm nay - ${formatDateToDisplay(selectedDate)}`
    : formatDateToDisplay(selectedDate);

  // Reload reloads current selected date â€” does NOT reset date to today
  const handleReload = () => {
    refetch();
    refetchStats();
  };

  // Dynamic statistics counts mapping API response to the 5 status cards
  const totalCount = statsData?.total ?? 0;
  const pendingCount = statsData?.pending ?? 0;
  const inProgressCount = statsData?.inProgress ?? 0;
  const resolvedCount = statsData?.resolved ?? 0;
  const rejectedCount = statsData?.rejected ?? 0;

  const statusCounts = useMemo(() => {
    return {
      ALL: totalCount,
      PENDING: pendingCount,
      IN_PROGRESS: inProgressCount,
      RESOLVED: resolvedCount,
      REJECTED: rejectedCount,
    };
  }, [totalCount, pendingCount, inProgressCount, resolvedCount, rejectedCount]);

  const filteredFeedbacks = useMemo(() => {
    if (activeStatusFilter === "ALL") return feedbacks;
    return feedbacks.filter((fb) => getGroupedFeedbackStatus(fb.status) === activeStatusFilter);
  }, [feedbacks, activeStatusFilter]);

  const mapMarkers = useMemo(() => {
    return filteredFeedbacks
      .filter((f) => f.latitude !== null && f.longitude !== null)
      .map((f) => ({
        id: f.id,
        position: [f.latitude!, f.longitude!] as [number, number],
        title: f.title,
        description: f.description,
        status: f.status,
        address: f.addressDetails || f.address || "",
        category: mapCategoryName(f.categoryName),
        date: formatDate(f.createdAt),
      }));
  }, [filteredFeedbacks]);

  const mapCenter = useMemo<[number, number]>(() => {
    if (mapMarkers.length > 0) {
      return mapMarkers[0].position;
    }
    return defaultCenter;
  }, [mapMarkers, defaultCenter]);

  // Priority Area list calculation â€” uses feedbacks already filtered by selectedDate via useFeedbacks
  const priorityAreas = useMemo(() => {
    const areaCounts: Record<string, { count: number; category: string }> = {};

    feedbacks.forEach((fb) => {
      const grp = getGroupedFeedbackStatus(fb.status);
      const isUnresolved = grp !== "RESOLVED" && grp !== "REJECTED";
      if (isUnresolved) {
        const area = getAreaName(fb);
        const cat = mapCategoryName(fb.categoryName);
        if (!areaCounts[area]) {
          areaCounts[area] = { count: 0, category: cat };
        }
        areaCounts[area].count++;
      }
    });

    return Object.entries(areaCounts)
      .map(([name, data]) => ({
        name,
        count: data.count,
        category: data.category,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [feedbacks]);

  // Categories chart stats
  const categoryCounts = useMemo(() => {
    const counts = {
      ENVIRONMENT: 0,
      URBAN_INFRASTRUCTURE: 0,
      CONSTRUCTION: 0,
    };

    feedbacks.forEach((fb) => {
      const code = (fb.categoryCode || "").toUpperCase();
      if (code === "ENVIRONMENT") {
        counts.ENVIRONMENT++;
      } else if (code === "CONSTRUCTION") {
        counts.CONSTRUCTION++;
      } else if (code === "URBAN_INFRASTRUCTURE") {
        counts.URBAN_INFRASTRUCTURE++;
      } else {
        const name = (fb.categoryName || fb.category || "").toLowerCase();
        if (name.includes("môi trường") || name.includes("environment") || name.includes("moi truong") || name.includes("rác")) {
          counts.ENVIRONMENT++;
        } else if (name.includes("xây dựng") || name.includes("construction") || name.includes("xay dung")) {
          counts.CONSTRUCTION++;
        } else {
          counts.URBAN_INFRASTRUCTURE++;
        }
      }
    });

    const total = feedbacks.length || 1;

    const displayList = [
      { name: "Vệ sinh môi trường", count: counts.ENVIRONMENT, color: "bg-[#0b5ed7]" },
      { name: "Hạ tầng đô thị", count: counts.URBAN_INFRASTRUCTURE, color: "bg-[#0b5ed7]" },
      { name: "Trật tự xây dựng", count: counts.CONSTRUCTION, color: "bg-[#0b5ed7]" },
    ];

    return displayList.map((item) => ({
      ...item,
      percentage: ((item.count / total) * 100).toFixed(1).replace(".", ","),
      rawPercentage: (item.count / total) * 100,
    }));
  }, [feedbacks]);

  // Inter-agency coordination counts â€” police-transferred feedback in selected date (from rawFeedbacks)
  const coordinationStats = useMemo(() => {
    const policeCount = rawFeedbacks.filter((fb) => {
      const n = (fb.categoryName || fb.category || "").toLowerCase();
      return (
        n.includes("an ninh") ||
        n.includes("security") ||
        n.includes("trật tự") ||
        n.includes("công an")
      );
    }).length;

    return { policeCount };
  }, [rawFeedbacks]);

  // Quick info statistics â€” all counts use feedbacks already filtered by selectedDate
  const quickInfo = useMemo(() => {
    const newInDate = feedbacks.length;

    const resolvedInDate = feedbacks.filter((f) => {
      const grp = getGroupedFeedbackStatus(f.status);
      return grp === "RESOLVED";
    }).length;

    const inProgressOverdue = feedbacks.filter((f) => {
      const grp = getGroupedFeedbackStatus(f.status);
      const isInProgress = grp === "IN_PROGRESS";
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - new Date(f.createdAt).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return isInProgress && diffDays > 3;
    }).length;

    const hasRating = resolvedInDate > 0;

    return {
      newInDate,
      resolvedInDate,
      inProgressOverdue,
      hasRating,
    };
  }, [feedbacks]);

  // High-priority reports table â€” uses feedbacks already filtered by selectedDate
  const priorityReports = useMemo(() => {
    return feedbacks
      .filter((fb) => {
        const grp = getGroupedFeedbackStatus(fb.status);
        return grp !== "RESOLVED" && grp !== "REJECTED";
      })
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
  const handleSectionChange = (section: WardSection) => {
    setActiveSection(section);
    setSidebarOpen(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (section === "overview") {
        url.searchParams.delete("tab");
      } else {
        url.searchParams.set("tab", section);
      }
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
  };

  const menuItems = [
    { name: "Tổng quan", section: "overview" as const, icon: Sliders },
    { name: "Phản ánh", section: "feedback" as const, icon: FileText },
    { name: "Chiến dịch", section: "campaign" as const, icon: Activity },
    { name: "Lịch tiếp công dân", section: "schedule" as const, icon: Calendar },
    { name: "Cấu hình", section: "config" as const, icon: Settings },
  ];

  const activeSectionTitle =
    menuItems.find((item) => item.section === activeSection)?.name || "T\u1ed5ng quan";

  return (
    <div className="min-h-screen bg-[#F4F7FA] text-[#1E293B] font-sans antialiased flex">
      {/* â”€â”€â”€ 1. FIXED LEFT SIDEBAR â”€â”€â”€ */}
      <aside
        className={`bg-gradient-to-b from-[#0F2042] to-[#0A1630] text-white flex flex-col z-[2010] transition-all duration-300 fixed inset-y-0 left-0 ${sidebarCollapsed ? "w-[76px]" : "w-[240px]"
          } ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Emblem & Ward Title */}
        <div className="p-5 flex flex-col items-center border-b border-white/10 shrink-0">
          <img
            src={logoImg}
            alt="Biểu trưng UBND"
            className={`transition-all duration-300 object-contain ${sidebarCollapsed ? "w-10 h-10" : "w-14 h-14"
              }`}
          />
          {!sidebarCollapsed && (
            <div className="mt-3 text-center">
              <span className="font-extrabold text-sm tracking-wider uppercase block text-[#e2e8f0]">
                {getAdministrativeUnitLabel(user?.wardType, user?.wardName).replace(authorityUnitName, "").trim() || "UBND"}
              </span>
              <span className="font-extrabold text-base tracking-widest uppercase block text-white mt-0.5 animate-pulse">
                {authorityUnitName.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activeSection === item.section;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSectionChange(item.section)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${isActive
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
          className="fixed inset-0 bg-slate-900/40 z-[2050] md:hidden"
        />
      )}

      {/* â”€â”€â”€ MAIN WRAPPER â”€â”€â”€ */}
      <div
        className={`flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300 ${sidebarCollapsed ? "md:pl-[76px]" : "md:pl-[240px]"
          }`}
      >
        {/* â”€â”€â”€ 2. TOP WHITE HEADER â”€â”€â”€ */}
        <header className="h-[76px] bg-white border-b border-[#E4EAF2] flex items-center justify-between px-6 sticky top-0 z-[2000] shadow-sm shrink-0">
          {/* Title & Hamburger */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-slate-500 hover:text-[#0F5BD8] p-2 rounded-lg border border-slate-200 bg-slate-50"
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-xl font-extrabold text-[#0B2545] font-sans">{activeSectionTitle}</h2>
          </div>

          {/* Search bar */}
          {activeSection !== "feedback" && (
            <div className="hidden md:flex items-center relative w-96">
              <input
                type="text"
                placeholder="Tìm kiếm phản ánh, địa điểm, người dân..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-4 pr-10 rounded-xl border border-[#E4EAF2] text-sm focus:border-[#0F5BD8] focus:ring-1 focus:ring-[#0F5BD8] outline-none bg-slate-50/50"
              />
              <Search size={16} className="absolute right-3.5 text-slate-400 pointer-events-none" />
            </div>
          )}

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
                            <span className="text-xs font-bold text-slate-800 block truncate">
                              {item.title}
                            </span>
                            <span className="text-[11px] text-slate-500 mt-0.5 block line-clamp-2 leading-relaxed">
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
                    {user?.name || "Nguyễn Văn Nam"}
                    <ChevronDown size={14} className="text-slate-400" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">
                    {authorityUnitLabel}
                  </span>
                </div>
              </button>

              {userOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-[#E4EAF2] rounded-xl shadow-xl py-2 z-50 animate-fade-in">
                  <div className="px-4 py-2 border-b border-slate-100 mb-1">
                    <div className="text-xs font-bold text-slate-700 truncate">
                      {user?.name || "Nguyễn Văn Nam"}
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">
                      {authorityUnitLabel}
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
        <main className={`flex-1 space-y-6 overflow-y-auto ${activeSection === "feedback" ? "p-5 md:p-6" : "p-6 md:p-8"}`}>
          {activeSection === "feedback" ? (
            <WardFeedbackManagementPage />
          ) : activeSection === "overview" ? (
            <>
              {/* Header Action Section */}
              <div className="flex flex-wrap items-center justify-end gap-3 -mt-2">
                <div className="relative">
                  <button
                    onClick={() => dateInputRef.current?.showPicker ? dateInputRef.current.showPicker() : dateInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E4EAF2] rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm cursor-pointer"
                  >
                    <Calendar size={14} className="text-slate-400" />
                    <span>{dateLabel}</span>
                    <ChevronDown size={14} className="text-slate-400" />
                  </button>
                  <input
                    type="date"
                    ref={dateInputRef}
                    value={formatDateToISO(selectedDate)}
                    onChange={(e) => {
                      if (e.target.value) {
                        const [year, month, day] = e.target.value.split("-").map(Number);
                        setSelectedDate(new Date(year, month - 1, day));
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-none"
                  />
                </div>
                <button
                  onClick={handleReload}
                  className="p-2 bg-white border border-[#E4EAF2] rounded-xl hover:bg-slate-50 transition shadow-sm cursor-pointer"
                  aria-label="Tải lại dữ liệu"
                >
                  <RefreshCw size={16} className={`text-slate-500 ${feedbacksLoading ? "animate-spin" : ""}`} />
                </button>
              </div>

              {/* ─── KPI CARDS ─── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  {
                    title: "Tổng phản ánh",
                    val: totalCount,
                    bg: "bg-[#0b5ed7]/10 text-[#0b5ed7]",
                    icon: FileText,
                  },
                  {
                    title: "Chờ xử lý",
                    val: pendingCount,
                    bg: "bg-[#0dcaf0]/10 text-[#0dcaf0]",
                    icon: AlertCircle,
                  },
                  {
                    title: "Đang xử lý",
                    val: inProgressCount,
                    bg: "bg-[#fd7e14]/10 text-[#fd7e14]",
                    icon: Hourglass,
                  },
                  {
                    title: "Đã xử lý",
                    val: resolvedCount,
                    bg: "bg-[#198754]/10 text-[#198754]",
                    icon: CheckCircle2,
                  },
                  {
                    title: "Đã từ chối",
                    val: rejectedCount,
                    bg: "bg-[#dc3545]/10 text-[#dc3545]",
                    icon: X,
                  },
                ].map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl border border-[#E4EAF2] p-5 shadow-sm flex items-center gap-4"
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${card.bg}`}
                      >
                        <Icon size={22} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-400 block whitespace-normal leading-tight">
                          {card.title}
                        </span>
                        <h3 className="text-2xl font-extrabold text-[#0B2545] mt-0.5 leading-none font-sans">
                          {statsLoading || feedbacksLoading ? (
                            <Skeleton className="h-6 w-12" />
                          ) : (
                            card.val.toLocaleString("vi-VN")
                          )}
                        </h3>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ─── MIDDLE ROW GRID ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Map Panel (65%) */}
                <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E4EAF2] shadow-sm overflow-hidden flex flex-col h-[480px]">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <h3 className="font-extrabold text-base text-[#0B2545] flex items-center gap-2">
                      Bản đồ phản ánh theo khu vực
                      <span className="text-[10px] text-slate-400 cursor-pointer">â“˜</span>
                    </h3>
                  </div>

                  {/* Status Filter Chips */}
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-2 shrink-0">
                    {[
                      { key: "ALL", label: "Tất cả", color: "bg-slate-100 text-slate-800 border-slate-200" },
                      { key: "PENDING", label: "Chờ xử lý", color: "bg-blue-50 text-blue-700 border-blue-200" },
                      { key: "IN_PROGRESS", label: "Đang xử lý", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
                      { key: "RESOLVED", label: "Đã xử lý", color: "bg-green-50 text-green-700 border-green-200" },
                      { key: "REJECTED", label: "Đã từ chối", color: "bg-red-50 text-red-700 border-red-200" },
                    ].map((chip) => {
                      const isActive = activeStatusFilter === chip.key;
                      return (
                        <button
                          key={chip.key}
                          type="button"
                          onClick={() => setActiveStatusFilter(chip.key as any)}
                          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border transition ${isActive
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : `${chip.color} hover:bg-slate-100 cursor-pointer`
                            }`}
                        >
                          <span>{chip.label}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${isActive ? "bg-white text-blue-600" : "bg-white/70 text-slate-700"
                              }`}
                          >
                            {statusCounts[chip.key as keyof typeof statusCounts]}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Split Content (Map + Sidebar List) */}
                  <div className="flex-1 flex flex-col md:flex-row min-h-0">
                    {/* Map Container */}
                    <div className="flex-1 h-full relative">
                      <Suspense
                        fallback={
                          <div className="w-full h-full flex items-center justify-center text-slate-400 animate-pulse">
                            Đang tải bản đồ...
                          </div>
                        }
                      >
                        <CivicMap
                          center={mapCenterState || defaultCenter}
                          zoom={mapZoomState || 13}
                          markers={mapMarkers}
                          height="100%"
                          wardName={user?.wardName || undefined}
                          showBoundary={false}
                          activeMarkerId={selectedFeedbackId || undefined}
                          layerType={mapLayerType}
                          onMarkerClick={(id) => {
                            setSelectedFeedbackId(Number(id));
                          }}
                          onViewportChange={(center, zoom) => {
                            setMapCenterState(center);
                            setMapZoomState(zoom);
                          }}
                          onLayerTypeChange={setMapLayerType}
                        />
                      </Suspense>
                    </div>

                    {/* Sidebar Scrollable Feedback List */}
                    <div className="w-full md:w-80 flex flex-col h-full bg-slate-50 shrink-0 border-t md:border-t-0 md:border-l border-slate-100">
                      <div className="p-3 border-b border-slate-100 bg-white font-bold text-xs text-[#0B2545] flex items-center justify-between shrink-0">
                        <span>DANH SÁCH PHẢN ÁNH</span>
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">
                          {filteredFeedbacks.length}
                        </span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[150px] md:max-h-none">
                        {filteredFeedbacks.length === 0 ? (
                          <div className="text-center text-slate-400 py-10 text-xs">
                            Không có phản ánh nào
                          </div>
                        ) : (
                          filteredFeedbacks.map((fb) => {
                            const isSelected = selectedFeedbackId === fb.id;
                            const grp = getGroupedFeedbackStatus(fb.status);
                            const statusColor =
                              grp === "RESOLVED"
                                ? "bg-green-500"
                                : grp === "REJECTED"
                                  ? "bg-red-500"
                                  : grp === "IN_PROGRESS"
                                    ? "bg-yellow-500"
                                    : "bg-blue-500";
                            return (
                              <div
                                key={fb.id}
                                id={`fb-card-${fb.id}`}
                                onClick={() => {
                                  setSelectedFeedbackId(fb.id);
                                  if (fb.latitude && fb.longitude) {
                                    setMapCenterState([fb.latitude, fb.longitude]);
                                    setMapZoomState(16);
                                  }
                                }}
                                className={`p-3 rounded-xl border text-left transition cursor-pointer ${isSelected
                                  ? "bg-blue-50/70 border-blue-400 shadow-sm"
                                  : "bg-white border-slate-100 hover:border-slate-300"
                                  }`}
                              >
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className={`w-2 h-2 rounded-full ${statusColor}`} />
                                  <span className="font-bold text-[11px] text-slate-700 truncate">
                                    {fb.trackingCode || `#${fb.id}`}
                                  </span>
                                  <span className="text-[10px] text-slate-400 ml-auto shrink-0 font-medium">
                                    {formatDate(fb.createdAt, false)}
                                  </span>
                                </div>
                                <h4 className="font-bold text-xs text-slate-800 line-clamp-1 mb-1">
                                  {fb.title}
                                </h4>
                                <p className="text-[11px] text-slate-500 line-clamp-1">
                                  {fb.addressDetails || fb.address}
                                </p>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Color Legend */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-4 items-center justify-between shrink-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Trạng thái phản ánh:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
                        <span className="text-[11px] font-bold text-slate-600">Chờ xử lý</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#facc15]" />
                        <span className="text-[11px] font-bold text-slate-600">Đang xử lý</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
                        <span className="text-[11px] font-bold text-slate-600">Đã xử lý</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                        <span className="text-[11px] font-bold text-slate-600">Đã từ chối</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Priority Area Panel (35%) */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E4EAF2] shadow-sm p-5 flex flex-col justify-between h-[480px]">
                  <div>
                    <h3 className="font-extrabold text-base text-[#0B2545] border-b border-slate-100 pb-3 mb-4">
                      Khu vực cần ưu tiên
                    </h3>
                    <div className="space-y-4">
                      {feedbacksLoading ? (
                        [1, 2, 3].map((i) => (
                          <div key={i} className="flex gap-3 animate-pulse">
                            <div className="w-6 h-6 bg-slate-100 rounded-full shrink-0" />
                            <div className="flex-1 space-y-2">
                              <div className="h-3 bg-slate-100 rounded w-1/3" />
                              <div className="h-2.5 bg-slate-100 rounded w-2/3" />
                            </div>
                          </div>
                        ))
                      ) : priorityAreas.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                          Chưa có khu vực cần ưu tiên.
                        </div>
                      ) : (
                        priorityAreas.map((area, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-6 h-6 rounded-full bg-red-50 text-red-600 font-extrabold text-xs flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-slate-700 block truncate">
                                  {area.name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold">
                                  Chủ yếu: {area.category}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-extrabold text-slate-700 block">
                                {area.count} phản ánh
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="pt-2 text-right">
                    <Link
                      to="/my-reports"
                      className="text-xs font-bold text-[#0F5BD8] hover:underline inline-flex items-center gap-1"
                    >
                      Xem tất cả →
                    </Link>
                  </div>
                </div>
              </div>

              {/* ─── BOTTOM ROW GRID ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Reports by Category Panel (30%) */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E4EAF2] shadow-sm p-5 flex flex-col justify-between min-h-[380px]">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                      <h3 className="font-extrabold text-base text-[#0B2545]">
                        Phản ánh theo lĩnh vực
                      </h3>
                      <Link
                        to="/my-reports"
                        className="text-xs font-bold text-[#0F5BD8] hover:underline"
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                    <div className="space-y-4">
                      {feedbacksLoading ? (
                        [1, 2, 3].map((i) => (
                          <div key={i} className="space-y-2">
                            <Skeleton className="h-3 w-1/3" />
                            <Skeleton className="h-2 w-full" />
                          </div>
                        ))
                      ) : (
                        categoryCounts.map((cat, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-slate-600">
                              <span>{cat.name}</span>
                              <span className="text-slate-800 font-extrabold">
                                {cat.count}{" "}
                                <span className="text-slate-400 font-semibold font-sans">({cat.percentage}%)</span>
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-[#0F5BD8] h-full rounded-full transition-all duration-500"
                                style={{ width: `${cat.rawPercentage}%` }}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-50">
                    <span className="text-xs font-extrabold text-slate-700">
                      Tổng: {totalCount} phản ánh
                    </span>
                  </div>
                </div>

                {/* High Priority Reports Table (50%) */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E4EAF2] shadow-sm p-5 flex flex-col justify-between min-h-[380px]">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                      <h3 className="font-extrabold text-base text-[#0B2545]">
                        Phản ánh ưu tiên cao
                      </h3>
                      <Link
                        to="/my-reports"
                        className="text-xs font-bold text-[#0F5BD8] hover:underline"
                      >
                        Xem tất cả →
                      </Link>
                    </div>
                    <div className="overflow-x-auto -mx-5">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#E4EAF2] bg-slate-50/50">
                            <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Mã phản ánh
                            </th>
                            <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Nội dung
                            </th>
                            <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Lĩnh vực
                            </th>
                            <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Địa chỉ
                            </th>
                            <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Thời gian
                            </th>
                            <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Trạng thái
                            </th>
                            <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">
                              Hành động
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E4EAF2]">
                          {feedbacksLoading ? (
                            [1, 2, 3].map((i) => (
                              <tr key={i} className="animate-pulse">
                                <td className="px-5 py-3"><Skeleton className="h-3.5 w-16" /></td>
                                <td className="px-5 py-3"><Skeleton className="h-3.5 w-36" /></td>
                                <td className="px-5 py-3"><Skeleton className="h-3.5 w-24" /></td>
                                <td className="px-5 py-3"><Skeleton className="h-3.5 w-24" /></td>
                                <td className="px-5 py-3"><Skeleton className="h-3.5 w-16" /></td>
                                <td className="px-5 py-3"><Skeleton className="h-5 w-12" /></td>
                                <td className="px-5 py-3 text-right"><Skeleton className="h-6 w-16 inline-block" /></td>
                              </tr>
                            ))
                          ) : priorityReports.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-5 py-8 text-center text-xs text-slate-400">
                                Chưa có phản ánh ưu tiên cao.
                              </td>
                            </tr>
                          ) : (
                            priorityReports.map((row) => {
                              const grp = getGroupedFeedbackStatus(row.status);
                              return (
                                <tr
                                  key={row.id}
                                  className="hover:bg-slate-50 transition-colors"
                                >
                                  <td className="px-5 py-3.5 text-xs font-bold text-slate-800">
                                    {row.trackingCode}
                                  </td>
                                  <td className="px-5 py-3.5 text-xs text-slate-700 font-semibold max-w-[150px] truncate" title={row.title}>
                                    {row.title}
                                  </td>
                                  <td className="px-5 py-3.5 text-xs text-slate-600">
                                    {mapCategoryName(row.categoryName)}
                                  </td>
                                  <td className="px-5 py-3.5 text-xs text-slate-500 truncate max-w-[120px] font-sans" title={row.addressDetails || row.address || "Tân Bình"}>
                                    {row.addressDetails || row.address || "Tân Bình"}
                                  </td>
                                  <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap font-sans">
                                    {formatDate(row.createdAt)}
                                  </td>
                                  <td className="px-5 py-3.5">
                                    {grp === "PENDING" ? (
                                      <span className="px-2 py-0.5 text-[9px] font-extrabold rounded bg-blue-50 text-blue-700 border border-blue-100 whitespace-nowrap">
                                        Chờ xử lý
                                      </span>
                                    ) : grp === "IN_PROGRESS" ? (
                                      <span className="px-2 py-0.5 text-[9px] font-extrabold rounded bg-yellow-50 text-yellow-700 border border-yellow-100 whitespace-nowrap">
                                        Đang xử lý
                                      </span>
                                    ) : grp === "RESOLVED" ? (
                                      <span className="px-2 py-0.5 text-[9px] font-extrabold rounded bg-green-50 text-green-700 border border-green-100 whitespace-nowrap">
                                        Đã xử lý
                                      </span>
                                    ) : grp === "REJECTED" ? (
                                      <span className="px-2 py-0.5 text-[9px] font-extrabold rounded bg-red-50 text-red-600 border border-red-100 whitespace-nowrap">
                                        Đã từ chối
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 text-[9px] font-extrabold rounded bg-slate-50 text-slate-600 border border-slate-100 whitespace-nowrap">
                                        Không xác định
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-5 py-3.5 text-right">
                                    <Link
                                      to="/my-reports/$id"
                                      params={{ id: String(row.id) }}
                                      className="inline-flex items-center justify-center px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg transition-colors border border-blue-200/50 cursor-pointer"
                                    >
                                      Xem chi tiết
                                    </Link>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Right Panel Stack: Coordination & Quick Info (30%) */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                  {/* Inter-agency Coordination â€” Police only */}
                  <div className="bg-white rounded-2xl border border-[#E4EAF2] shadow-sm p-5 space-y-4">
                    <div className="flex items-center gap-1 pb-2 border-b border-slate-100">
                      <h3 className="font-extrabold text-sm text-[#0B2545]">Phối hợp liên ngành</h3>
                      <span className="text-[10px] text-slate-400 cursor-pointer">â“˜</span>
                    </div>
                    <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="w-8 h-8 rounded-full bg-[#198754]/10 text-[#198754] flex items-center justify-center shrink-0">
                          <Shield size={16} />
                        </span>
                        <span className="text-xs font-semibold text-slate-600">Chuyển công an</span>
                      </div>
                      <h4 className="text-3xl font-extrabold text-[#0B2545] leading-none mb-1">
                        {feedbacksLoading ? (
                          <Skeleton className="h-8 w-12" />
                        ) : (
                          coordinationStats.policeCount
                        )}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium mt-2">
                        Phản ánh trong ngày {formatDateToDisplay(selectedDate)}
                      </p>
                      <Link
                        to="/my-reports"
                        className="text-[10px] font-extrabold text-[#0F5BD8] hover:underline mt-3 block"
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                  </div>

                  {/* Quick Info Panel */}
                  <div className="bg-white rounded-2xl border border-[#E4EAF2] shadow-sm p-5 space-y-3">
                    <h3 className="font-extrabold text-sm text-[#0B2545] pb-2 border-b border-slate-100">
                      Thông tin nhanh
                    </h3>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span className="flex items-center gap-2">
                          <FileText size={14} className="text-slate-400 shrink-0" />
                          {isTodayDate(selectedDate) ? "Phản ánh mới hôm nay" : "Phản ánh mới trong ngày"}
                        </span>
                        <span className="text-[#0B2545] font-extrabold font-sans">{quickInfo.newInDate}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-slate-400 shrink-0" />
                          {isTodayDate(selectedDate) ? "Phản ánh đã xử lý hôm nay" : "Phản ánh đã xử lý trong ngày"}
                        </span>
                        <span className="text-[#0B2545] font-extrabold font-sans">{quickInfo.resolvedInDate}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span className="flex items-center gap-2">
                          <Clock size={14} className="text-slate-400 shrink-0" />
                          Đang xử lý quá hạn
                        </span>
                        <span className="text-[#0B2545] font-extrabold font-sans">
                          {quickInfo.inProgressOverdue}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span className="flex items-center gap-2">
                          <UserCheck size={14} className="text-slate-400 shrink-0" />
                          Tỷ lệ hài lòng của người dân
                        </span>
                        {quickInfo.hasRating ? (
                          <span className="text-slate-400 font-semibold text-[11px] shrink-0">
                            Chưa có dữ liệu
                          </span>
                        ) : (
                          <span className="text-slate-400 font-semibold text-[11px] shrink-0">
                            Chưa có dữ liệu
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer branding */}
              <footer className="pt-4 border-t border-slate-100 text-center text-xs text-slate-400 font-semibold">
                © 2026 {authorityUnitLabel}. Hệ thống quản lý phản ánh hiện trường
              </footer>
            </>
          ) : (
            <WardSectionPlaceholder section={activeSection} />
          )}
        </main>
      </div>
    </div>
  );
}

function WardSectionPlaceholder({ section }: { section: Exclude<WardSection, "overview" | "feedback"> }) {
  const labels: Record<Exclude<WardSection, "overview" | "feedback">, { title: string; description: string }> = {
    campaign: {
      title: "Chi\u1ebfn d\u1ecbch",
      description: "Khu v\u1ef1c qu\u1ea3n l\u00fd chi\u1ebfn d\u1ecbch s\u1ebd \u0111\u01b0\u1ee3c hi\u1ec3n th\u1ecb trong khung dashboard n\u00e0y.",
    },
    schedule: {
      title: "L\u1ecbch ti\u1ebfp c\u00f4ng d\u00e2n",
      description: "Khu v\u1ef1c l\u1ecbch ti\u1ebfp c\u00f4ng d\u00e2n s\u1ebd \u0111\u01b0\u1ee3c hi\u1ec3n th\u1ecb trong khung dashboard n\u00e0y.",
    },
    config: {
      title: "C\u1ea5u h\u00ecnh",
      description: "Khu v\u1ef1c c\u1ea5u h\u00ecnh s\u1ebd \u0111\u01b0\u1ee3c hi\u1ec3n th\u1ecb trong khung dashboard n\u00e0y.",
    },
  };
  const copy = labels[section];

  return (
    <div className="rounded-2xl border border-[#E4EAF2] bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-extrabold text-[#0B2545]">{copy.title}</h1>
      <p className="mt-2 text-sm text-slate-500">{copy.description}</p>
    </div>
  );
}

