import { clientOnly } from "@/components/ClientOnly";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef, Suspense } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { usePublicFeedbacks, usePublicFeedbackStats, useFeedbackStatuses } from "@/lib/hooks";
import { EmptyState, ErrorState } from "@/components/site/EmptyState";
import {
  Search,
  MapPin,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  RefreshCw,
  Headset,
  Calendar,
  Grid,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Info,
  Loader2,
  X,
} from "lucide-react";
import { mapStatus } from "@/lib/status";
import { toast } from "sonner";
import { Role } from "@/lib/roles";
import { type FeedbackStatus } from "@/lib/api";
import { OFFICIAL_CATEGORIES } from "@/lib/categoryConfig";
import { WardFeedbackManagementPage } from "@/features/ward/WardFeedbackManagementPage";

const CivicMap = clientOnly(() =>
  import("@/components/site/CivicMap").then((m) => ({ default: m.CivicMap })),
);

export const Route = createFileRoute("/feedback-search")({
  validateSearch: (search: Record<string, unknown>): {
    category?: string;
    q?: string;
    status?: string;
    range?: string;
    wardId?: string | number;
    categories?: string;
  } => ({
    category: search.category as string | undefined,
    q: search.q as string | undefined,
    status: search.status as string | undefined,
    range: search.range as string | undefined,
    wardId: search.wardId ? (typeof search.wardId === 'number' ? search.wardId : Number(search.wardId)) : undefined,
    categories: search.categories as string | undefined,
  }),
  head: () => ({
    meta: [
      { title: "Tra cứu phản ánh — Đà Nẵng Kết Nối" },
      { name: "description", content: "Tìm kiếm và theo dõi tình trạng xử lý các phản ánh hiện trường." },
    ],
  }),
  component: FeedbackSearch,
});

const getFromDateString = (range: string) => {
  const now = new Date();
  let diffDays = 0;
  switch (range) {
    case "24h": diffDays = 1; break;
    case "7d": diffDays = 7; break;
    case "1m": diffDays = 30; break;
    case "3m": diffDays = 90; break;
    case "1y": diffDays = 365; break;
    default: return "";
  }
  const fromDate = new Date(now.getTime() - diffDays * 24 * 60 * 60 * 1000);
  const year = fromDate.getFullYear();
  const month = String(fromDate.getMonth() + 1).padStart(2, '0');
  const day = String(fromDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function FeedbackSearch() {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated && (user?.role === Role.WARD_STAFF || user?.role === Role.SUPER_ADMIN)) {
    return <WardFeedbackManagementPage />;
  }
  return <PublicFeedbackLookup />;
}

function PublicFeedbackLookup() {
  const { locale, t } = useI18n();
  const navigate = useNavigate({ from: "/feedback-search" });
  const { category = "", q = "", status = "", range = "", wardId, categories } = Route.useSearch();
  const { isAuthenticated, user: currentUser } = useAuth();
  const isWardStaffUser = currentUser?.role === "WARD_STAFF";
  // WARD_STAFF allowed categories constant
  const WARD_STAFF_CATEGORIES = ["URBAN_INFRASTRUCTURE", "ENVIRONMENT", "CONSTRUCTION"];

  // Detect Case 2: WardStaff clicked "Phản ánh" in Officer Sidebar (search params have wardId or categories)
  const [enteredFromSidebar] = useState(() => {
    if (!isWardStaffUser) return false;
    return !!(wardId || categories);
  });

  // Parse initial selected categories from URL params
  const parseCategories = (raw: string | undefined): string[] => {
    if (!raw) return [];
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  };

  // Search & Filter Panel state variables
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [keywordInput, setKeywordInput] = useState(q);
  const [locationInput, setLocationInput] = useState(() => {
    if (enteredFromSidebar) return currentUser?.wardName || "";
    return "";
  });
  // Multi-select: selectedCategories replaces single categoryInput
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    if (categories) return parseCategories(categories);
    if (category) return [category];
    if (enteredFromSidebar) return WARD_STAFF_CATEGORIES;
    return [];
  });
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const [statusInput, setStatusInput] = useState<FeedbackStatus | "">("");
  const [fromDateInput, setFromDateInput] = useState("");
  const [toDateInput, setToDateInput] = useState("");

  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [sortBy, setSortBy] = useState("newest");

  // Committed search filters
  const [filters, setFilters] = useState(() => {
    const isMatchingWard = !!(currentUser?.wardName && locationInput.trim().toLowerCase() === currentUser.wardName.trim().toLowerCase());
    const resolvedWardId = wardId || (enteredFromSidebar ? (isMatchingWard ? currentUser?.wardId || undefined : undefined) : undefined);
    return {
      keyword: q,
      location: locationInput,
      category: "",
      status: "" as FeedbackStatus | "",
      fromDate: "",
      toDate: "",
      wardId: resolvedWardId,
      categories: categories || (enteredFromSidebar ? WARD_STAFF_CATEGORIES.join(",") : undefined),
    };
  });

  const isFiltered = useMemo(() => {
    return (
      filters.keyword.trim() !== "" ||
      filters.location.trim() !== "" ||
      filters.status !== "" ||
      filters.fromDate !== "" ||
      filters.toDate !== ""
    );
  }, [filters]);

  // Close category dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const lastSyncedWardId = useRef<string | number | undefined>(wardId);
  const lastSyncedCategories = useRef<string | undefined>(categories);

  // Sync search URL query parameter
  useEffect(() => {
    let mappedStatus: FeedbackStatus | "" = "";
    if (status === "PROCESSING") {
      mappedStatus = "IN_PROGRESS";
    } else if (status === "PROCESSED") {
      mappedStatus = "RESOLVED";
    } else if (status) {
      mappedStatus = status as FeedbackStatus;
    }

    let calculatedFromDate = "";
    if (range) {
      calculatedFromDate = getFromDateString(range);
    }

    setKeywordInput(q);
    setStatusInput(mappedStatus);

    if (calculatedFromDate) {
      setFromDateInput(calculatedFromDate);
    } else if (range === "") {
      setFromDateInput("");
    }

    // Sync selectedCategories from URL only when URL changes
    if (categories !== lastSyncedCategories.current) {
      lastSyncedCategories.current = categories;
      if (categories) {
        setSelectedCategories(parseCategories(categories));
      } else {
        setSelectedCategories([]);
      }
    }

    // Sync locationInput/wardId from URL only when URL changes
    if (wardId !== lastSyncedWardId.current) {
      lastSyncedWardId.current = wardId;
      if (wardId && currentUser?.wardId && Number(wardId) === currentUser.wardId) {
        setLocationInput(currentUser?.wardName || "");
      } else if (!wardId) {
        setLocationInput("");
      }
    }

    const derivedCategories = categories ||
      (category ? category : null) ||
      (enteredFromSidebar ? WARD_STAFF_CATEGORIES.join(",") : undefined);

    setFilters((prev) => {
      const isMatchingWard = !!(currentUser?.wardName && locationInput.trim().toLowerCase() === currentUser.wardName.trim().toLowerCase());
      const resolvedWardId = wardId || (enteredFromSidebar ? (isMatchingWard ? currentUser?.wardId || undefined : undefined) : undefined);
      return {
        ...prev,
        keyword: q,
        location: locationInput,
        category: "",
        status: mappedStatus,
        fromDate: calculatedFromDate || (status || range ? "" : prev.fromDate),
        wardId: resolvedWardId,
        categories: derivedCategories || prev.categories,
      };
    });
    setPage(0);
  }, [q, category, status, range, wardId, categories, enteredFromSidebar, currentUser]);

  // Construct query filters to send to backend API
  const apiFilters = useMemo(() => {
    const parts = [];
    if (filters.keyword.trim()) parts.push(filters.keyword.trim());
    if (filters.location.trim()) parts.push(filters.location.trim());
    const mergedKeyword = parts.join(" ");

    const resolvedCategories = selectedCategories.length > 0 ? selectedCategories.join(",") : undefined;

    return {
      keyword: mergedKeyword,
      category: "",
      status: filters.status,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      wardId: filters.wardId,
      categories: resolvedCategories,
    };
  }, [filters, selectedCategories]);

  // Main reports list fetch (Public lookup)
  const {
    data: feedbacksPage,
    isLoading,
    isFetching,
    refetch,
    error,
    isError,
  } = usePublicFeedbacks(page, pageSize, apiFilters);

  // Fetch public statistics for overview panel
  const { data: publicStats } = usePublicFeedbackStats(apiFilters);

  const { data: statuses = [] } = useFeedbackStatuses();

  // Reset page number on filter changes
  useEffect(() => {
    setPage(0);
  }, [filters.keyword, filters.location, filters.category, filters.status, filters.fromDate, filters.toDate]);

  const feedbacks = feedbacksPage?.content ?? [];
  const totalPages = feedbacksPage?.totalPages ?? 0;

  const filteredFeedbacks = feedbacks;

  // Client-side sorting fallback (backend forces newest first)
  const sortedFeedbacks = useMemo(() => {
    const list = [...filteredFeedbacks];
    if (sortBy === "oldest") {
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === "updated") {
      list.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime(),
      );
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list;
  }, [filteredFeedbacks, sortBy]);

  // Combined statistics helper from backend
  const stats = useMemo(() => {
    if (publicStats) {
      return {
        total: publicStats.total,
        resolved: publicStats.resolved,
        pending: publicStats.pending,
        rejected: publicStats.rejected,
      };
    }
    return { total: 0, resolved: 0, pending: 0, rejected: 0 };
  }, [publicStats]);

  // Popular categories calculations based on real data list
  const categoryStats = useMemo(() => {
    const list = feedbacks;
    if (!list || list.length === 0) return [];
    const counts: Record<string, number> = {};
    list.forEach((f) => {
      const cat = f.categoryName || f.category || (locale === "vi" ? "Khác" : "Other");
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const total = list.length;
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [feedbacks, locale]);

  const handleCategoryToggle = (code: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(code)) {
        return prev.filter((c) => c !== code);
      } else {
        return [...prev, code];
      }
    });
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPage(0);

    let urlStatus: string | undefined = undefined;
    if (statusInput === "IN_PROGRESS") {
      urlStatus = "PROCESSING";
    } else if (statusInput === "RESOLVED") {
      urlStatus = "PROCESSED";
    } else if (statusInput) {
      urlStatus = statusInput;
    }

    // Build categories from multi-select state
    const resolvedCategoriesForSubmit = selectedCategories.length > 0 ? selectedCategories.join(",") : undefined;

    const isMatchingWard = !!(currentUser?.wardName && locationInput.trim().toLowerCase() === currentUser.wardName.trim().toLowerCase());
    const resolvedWardId = enteredFromSidebar ? (isMatchingWard ? currentUser?.wardId || undefined : undefined) : undefined;

    setFilters({
      keyword: keywordInput,
      location: locationInput,
      category: "",
      status: statusInput,
      fromDate: fromDateInput,
      toDate: toDateInput,
      wardId: resolvedWardId,
      categories: resolvedCategoriesForSubmit,
    });

    navigate({
      search: (prev) => {
        const nextSearch: Record<string, any> = {
          ...prev,
          q: keywordInput || undefined,
          category: undefined,
          categories: resolvedCategoriesForSubmit || undefined,
          status: urlStatus || undefined,
          wardId: resolvedWardId || undefined,
        };
        // If range is set, verify if fromDateInput still matches it.
        if (prev.range) {
          const expectedFromDate = getFromDateString(prev.range);
          if (expectedFromDate !== fromDateInput) {
            nextSearch.range = undefined;
          }
        }
        return nextSearch;
      },
    });
  };

  const handleReset = () => {
    setPage(0);
    setKeywordInput("");
    setStatusInput("");
    setFromDateInput("");
    setToDateInput("");

    if (enteredFromSidebar) {
      // Reset to WARD_STAFF scope: current ward + their 3 categories
      setLocationInput(currentUser?.wardName || "");
      setSelectedCategories(WARD_STAFF_CATEGORIES);
      setFilters({
        keyword: "",
        location: currentUser?.wardName || "",
        category: "",
        status: "",
        fromDate: "",
        toDate: "",
        wardId: currentUser?.wardId || undefined,
        categories: WARD_STAFF_CATEGORIES.join(","),
      });
      navigate({
        search: () => ({
          wardId: currentUser?.wardId || undefined,
          categories: WARD_STAFF_CATEGORIES.join(","),
        }),
      });
    } else {
      setLocationInput("");
      setSelectedCategories([]);
      setFilters({
        keyword: "",
        location: "",
        category: "",
        status: "",
        fromDate: "",
        toDate: "",
        wardId: undefined,
        categories: undefined,
      });
      navigate({
        search: () => ({}),
      });
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "RESOLVED":
        return {
          label: locale === "vi" ? "Đã xử lý" : "Resolved",
          badgeClass: "bg-[#EAF8EF] text-[#16A34A]",
        };
      case "IN_PROGRESS":
      case "ASSIGNED":
      case "PENDING_RECEIVE":
        return {
          label: locale === "vi" ? "Đang xử lý" : "Processing",
          badgeClass: "bg-[#FFF4E8] text-[#F97316]",
        };
      case "NEED_LOCATION_REVIEW":
        return {
          label: locale === "vi" ? "Cần kiểm tra vị trí" : "Location review",
          badgeClass: "bg-[#FFF7D6] text-[#A16207]",
        };
      case "REJECTED":
        return {
          label: locale === "vi" ? "Từ chối" : "Rejected",
          badgeClass: "bg-[#FDECEC] text-[#DC2626]",
        };
      case "PENDING":
      case "SUBMITTED":
      default:
        return {
          label: locale === "vi" ? "Tiếp nhận" : "Received",
          badgeClass: "bg-[#EAF2FF] text-[#0B4FC4]",
        };
    }
  };

  const pageButtons = getVisiblePageIndexes(page, totalPages);

  return (
    <div className="w-full flex flex-col min-h-screen" style={{ background: "#F7FAFF" }}>
      {/* 1. Hero Banner */}
      <section
        className="relative w-full h-[260px] md:h-[280px] flex items-center bg-cover bg-center overflow-hidden border-b border-[#E4EAF2]"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.96) 40%, rgba(255,255,255,0.85) 60%, rgba(255,255,255,0.2) 100%), url('https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1600&h=600&q=80')`,
        }}
      >
        <div className="max-w-[1440px] mx-auto w-full px-6 md:px-12 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="max-w-[600px] flex flex-col justify-center">
            <h1 className="font-sans text-[#123E8A] text-4xl md:text-5xl font-bold leading-tight mb-3">
              Tra cứu phản ánh
            </h1>
            <p className="text-[#475467] text-sm md:text-base leading-relaxed">
              Tìm kiếm và theo dõi tình trạng xử lý các phản ánh hiện trường của người dân trên địa bàn thành phố Đà Nẵng.
            </p>
          </div>

          <div className="shrink-0 flex justify-start md:justify-end">
            <a
              href="tel:1022"
              className="bg-white rounded-2xl border border-[#E4EAF2] p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow duration-200"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#0B4FC4]">
                <Headset size={22} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#667085] uppercase tracking-wider leading-none mb-1">
                  {locale === "vi" ? "Cần hỗ trợ?" : "Need support?"}
                </span>
                <span className="text-xs text-[#475467] leading-none mb-1">
                  {locale === "vi" ? "Gọi ngay đường dây nóng" : "Call hotline now"}
                </span>
                <span className="text-2xl font-extrabold text-[#0B4FC4] leading-tight font-sans">
                  1022
                </span>
                <span className="text-[10px] text-[#667085] mt-0.5 leading-none">
                  {locale === "vi" ? "24/7 · Miễn phí" : "24/7 · Free"}
                </span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Center container */}
      <div className="max-w-[1440px] mx-auto w-full px-6 md:px-12 pb-16">
        {/* 2. Large Search & Filter Panel */}
        <div className="-mt-12 relative z-20 bg-white border border-[#E4EAF2] rounded-2xl p-6 shadow-md mb-8">
          <form onSubmit={handleSearchSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Field 1: Từ khóa */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="filter-keyword" className="text-xs font-bold text-[#667085] uppercase tracking-wider">
                  {locale === "vi" ? "Từ khóa" : "Keyword"}
                </label>
                <div className="relative">
                  <input
                    id="filter-keyword"
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    placeholder={locale === "vi" ? "Nhập mã, tiêu đề, nội dung..." : "Enter code, title, content..."}
                    className="w-full min-h-[48px] pl-4 pr-10 rounded-xl border-2 border-slate-200 bg-white text-sm focus:border-[#0B4FC4] outline-none transition-colors"
                  />
                  <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* Field 2: Lĩnh vực — Multi-select dropdown */}
              <div className="flex flex-col gap-1.5 relative" ref={categoryDropdownRef}>
                <label className="text-xs font-bold text-[#667085] uppercase tracking-wider">
                  {locale === "vi" ? "Lĩnh vực" : "Category"}
                </label>
                {/* Trigger button */}
                <button
                  id="filter-category"
                  type="button"
                  onClick={() => setCategoryDropdownOpen((o) => !o)}
                  className="w-full min-h-[48px] px-3.5 rounded-xl border-2 border-slate-200 bg-white text-sm text-left flex items-center justify-between gap-2 hover:border-[#0B4FC4] focus:border-[#0B4FC4] outline-none transition-colors cursor-pointer"
                >
                  <span className="truncate text-[#475467]">
                    {selectedCategories.length === 0
                      ? (locale === "vi" ? "Tất cả lĩnh vực" : "All categories")
                      : selectedCategories.length === 1
                        ? t((OFFICIAL_CATEGORIES.find((c) => c.code === selectedCategories[0])?.nameKey ?? "") as any)
                        : `${selectedCategories.length} ${locale === "vi" ? "lĩnh vực" : "categories"}`}
                  </span>
                  <ChevronDown size={14} className="text-slate-400 shrink-0" />
                </button>

                {/* Dropdown panel */}
                {categoryDropdownOpen && (
                  <div className="absolute top-[74px] left-0 right-0 bg-white border border-[#E4EAF2] rounded-xl shadow-lg py-2 z-50 min-w-[200px]">
                    {/* "All" toggle option */}
                    <button
                      type="button"
                      onClick={() => setSelectedCategories([])}
                      className={`w-full text-left px-4 py-2.5 text-xs flex items-center gap-2.5 transition-colors ${
                        selectedCategories.length === 0
                          ? "bg-blue-50 text-[#0B4FC4] font-bold"
                          : "text-slate-700 hover:bg-slate-50 font-semibold"
                      }`}
                    >
                      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                        selectedCategories.length === 0 ? "border-[#0B4FC4] bg-[#0B4FC4]" : "border-slate-300"
                      }`}>
                        {selectedCategories.length === 0 && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </span>
                      {locale === "vi" ? "Tất cả lĩnh vực" : "All categories"}
                    </button>
                    {OFFICIAL_CATEGORIES.map((c) => {
                      const checked = selectedCategories.includes(c.code);
                      return (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => handleCategoryToggle(c.code)}
                          className={`w-full text-left px-4 py-2.5 text-xs flex items-center gap-2.5 transition-colors ${
                            checked
                              ? "bg-blue-50 text-[#0B4FC4] font-bold"
                              : "text-slate-700 hover:bg-slate-50 font-semibold"
                          }`}
                        >
                          <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                            checked ? "border-[#0B4FC4] bg-[#0B4FC4]" : "border-slate-300"
                          }`}>
                            {checked && (
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </span>
                          {t(c.nameKey as any)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Field 3: Địa điểm */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="filter-location" className="text-xs font-bold text-[#667085] uppercase tracking-wider">
                  {locale === "vi" ? "Địa điểm" : "Location"}
                </label>
                <div className="relative">
                  <input
                    id="filter-location"
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder={locale === "vi" ? "Nhập địa điểm, phường, quận..." : "Enter location, ward, district..."}
                    className="w-full min-h-[48px] pl-4 pr-10 rounded-xl border-2 border-slate-200 bg-white text-sm focus:border-[#0B4FC4] outline-none transition-colors"
                  />
                  <MapPin size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* Field 4: Trạng thái */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="filter-status" className="text-xs font-bold text-[#667085] uppercase tracking-wider">
                  {locale === "vi" ? "Trạng thái" : "Status"}
                </label>
                <select
                  id="filter-status"
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value as FeedbackStatus | "")}
                  className="w-full min-h-[48px] px-3.5 rounded-xl border-2 border-slate-200 bg-white text-sm focus:border-[#0B4FC4] outline-none transition-colors appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='%23667085' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
                    backgroundPosition: "right 12px center",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  <option value="">{locale === "vi" ? "Tất cả trạng thái" : "All statuses"}</option>
                  {statuses.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field 5: Thời gian */}
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-xs font-bold text-[#667085] uppercase tracking-wider">
                  {locale === "vi" ? "Thời gian" : "Date range"}
                </label>
                <button
                  type="button"
                  onClick={() => setDateRangeOpen(!dateRangeOpen)}
                  className="w-full min-h-[48px] px-4 rounded-xl border-2 border-slate-200 bg-white text-sm text-left flex items-center justify-between text-[#475467] hover:border-[#0B4FC4] transition-colors"
                >
                  <span className="truncate flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    {fromDateInput || toDateInput
                      ? `${fromDateInput || "..."} → ${toDateInput || "..."}`
                      : (locale === "vi" ? "Chọn khoảng thời gian" : "Select date range")}
                  </span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                {dateRangeOpen && (
                  <div className="absolute top-[70px] left-0 right-0 lg:left-auto lg:right-0 w-[280px] bg-white border border-[#E4EAF2] rounded-xl shadow-lg p-4 z-50 space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[#667085]">{locale === "vi" ? "Từ ngày" : "From date"}</span>
                      <input
                        type="date"
                        value={fromDateInput}
                        onChange={(e) => setFromDateInput(e.target.value)}
                        className="w-full h-10 border border-slate-200 rounded-lg px-2 text-sm focus:border-[#0B4FC4] outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[#667085]">{locale === "vi" ? "Đến ngày" : "To date"}</span>
                      <input
                        type="date"
                        value={toDateInput}
                        onChange={(e) => setToDateInput(e.target.value)}
                        className="w-full h-10 border border-slate-200 rounded-lg px-2 text-sm focus:border-[#0B4FC4] outline-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setFromDateInput("");
                          setToDateInput("");
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-[#667085] hover:text-[#0B4FC4] hover:bg-slate-50 rounded"
                      >
                        {locale === "vi" ? "Xóa" : "Clear"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDateRangeOpen(false)}
                        className="px-3 py-1 bg-[#0B4FC4] text-white text-xs font-semibold rounded hover:bg-blue-700"
                      >
                        {locale === "vi" ? "Áp dụng" : "Apply"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-end border-t border-slate-100 pt-4 gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="min-h-[40px] px-4 rounded-lg border-2 border-slate-200 bg-white text-xs font-bold text-[#475467] hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer animate-fade-in"
              >
                <RefreshCw size={14} />
                {locale === "vi" ? "Đặt lại" : "Reset"}
              </button>
              <button
                type="submit"
                className="min-h-[40px] px-6 rounded-lg bg-[#0B4FC4] hover:bg-blue-700 text-xs font-bold text-white transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Search size={14} />
                {locale === "vi" ? "Tìm kiếm" : "Search"}
              </button>
            </div>
          </form>
        </div>

        {/* 3. Two-Column split area */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Column: Report results list */}
          <div className="md:col-span-8 space-y-6">
            <div className="bg-white border border-[#E4EAF2] rounded-2xl p-5 md:p-6 shadow-sm space-y-6">
              {/* Header result info */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-2">
                <div className="text-sm font-semibold text-[#475467]">
                  {isFiltered ? (
                    <>
                      {locale === "vi" ? "Tìm thấy" : "Found"}{" "}
                      <span className="text-2xl font-extrabold text-[#0B4FC4] font-sans inline-block align-middle -mt-1 mx-1">
                        {feedbacksPage?.totalElements ?? 0}
                      </span>{" "}
                      {locale === "vi" ? "kết quả" : "results"}
                    </>
                  ) : null}
                </div>

                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-[#667085]">{locale === "vi" ? "Sắp xếp theo:" : "Sort by:"}</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent text-[#123E8A] outline-none border-b-2 border-transparent focus:border-[#0B4FC4] cursor-pointer py-1 font-bold"
                  >
                    <option value="newest">{locale === "vi" ? "Mới nhất" : "Newest"}</option>
                    <option value="oldest">{locale === "vi" ? "Cũ nhất" : "Oldest"}</option>
                    <option value="updated">{locale === "vi" ? "Cập nhật gần nhất" : "Last updated"}</option>
                  </select>
                </div>
              </div>

              {/* Error state */}
              {isError && !isLoading && (
                <ErrorState
                  message={
                    error instanceof Error
                      ? error.message
                      : locale === "vi"
                        ? "Không thể tải dữ liệu phản ánh."
                        : "Failed to load reports."
                  }
                  onRetry={() => refetch()}
                  compact
                />
              )}

              {/* Loading skeleton */}
              {isLoading && (
                <div className="space-y-4">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="border border-[#E4EAF2] rounded-2xl p-5 flex gap-4 animate-pulse">
                      <div className="w-32 aspect-[16/10] bg-slate-100 rounded-xl" />
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-slate-100 rounded w-1/4" />
                        <div className="h-5 bg-slate-100 rounded w-3/4" />
                        <div className="h-4 bg-slate-100 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!isLoading && !isError && sortedFeedbacks.length === 0 && (
                <EmptyState
                  title={locale === "vi" ? "Không tìm thấy phản ánh phù hợp." : "No matching reports found."}
                  description={locale === "vi" ? "Vui lòng thử thay đổi từ khóa hoặc bộ lọc tìm kiếm." : "Please try modifying your keywords or filters."}
                  action={
                    <button onClick={handleReset} className="px-4 py-2 bg-[#0B4FC4] hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition">
                      {locale === "vi" ? "Xóa bộ lọc" : "Clear filters"}
                    </button>
                  }
                />
              )}

              {/* List rows */}
              {!isLoading && !isError && sortedFeedbacks.length > 0 && (
                <div className="space-y-4">
                  {sortedFeedbacks.map((report) => (
                    <article
                      key={report.id}
                      onClick={() => navigate({ to: "/my-reports/$id", params: { id: String(report.id) } })}
                      className="bg-white rounded-xl border border-[#E4EAF2] p-4 flex flex-col md:flex-row gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                    >
                      {/* Left thumbnail */}
                      <div className="w-full md:w-36 aspect-[16/10] md:h-[90px] bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-100 relative">
                        <img
                          src={
                            report.attachments?.[0]?.fileUrl ||
                            "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=150&h=150&q=80"
                          }
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      {/* Main text content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-[#EAF2FF] text-[#0B4FC4] text-[9px] font-bold rounded font-mono uppercase tracking-wider">
                              {locale === "vi" ? "Mã:" : "Code:"} {report.trackingCode}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-[#123E8A] leading-snug line-clamp-1 mb-2 hover:text-[#0B4FC4] transition-colors">
                            {report.title}
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-4 text-[11px] text-[#667085]">
                            <span className="flex items-center gap-1.5 truncate">
                              <MapPin size={13} className="shrink-0 text-slate-400" />
                              {report.addressDetails || report.wardName || (locale === "vi" ? "Đà Nẵng" : "Da Nang")}
                            </span>
                            <span className="flex items-center gap-1.5 truncate">
                              <Grid size={13} className="shrink-0 text-slate-400" />
                              {report.categoryName || report.category || (locale === "vi" ? "Khác" : "Other")}
                            </span>
                            <span className="flex items-center gap-1.5 truncate">
                              <MapPin size={13} className="shrink-0 text-slate-400" />
                              {report.wardName || (locale === "vi" ? "Cần kiểm tra vị trí" : "Location review needed")}
                            </span>
                            <span className="flex items-center gap-1.5 truncate">
                              <Grid size={13} className="shrink-0 text-slate-400" />
                              {report.assignedUnitName || (locale === "vi" ? "Chưa phân đơn vị" : "Unassigned unit")}
                            </span>
                            <span className="flex items-center gap-1.5 truncate">
                              <Calendar size={13} className="shrink-0 text-slate-400" />
                              {new Date(report.createdAt).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US")} -{" "}
                              {new Date(report.createdAt).toLocaleTimeString(locale === "vi" ? "vi-VN" : "en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right action status section */}
                      <div className="flex flex-col items-end justify-between shrink-0 self-stretch md:border-l md:border-slate-100 md:pl-5 md:min-w-[120px] md:pt-0 pt-3 border-t md:border-t-0 border-slate-100">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide leading-none ${getStatusInfo(report.status).badgeClass}`}>
                          {getStatusInfo(report.status).label}
                        </span>
                        <span className="text-[10px] text-[#667085] font-medium mt-auto md:mb-0 mb-1">
                          {locale === "vi" ? "Cập nhật:" : "Updated:"} {new Date(report.updatedAt || report.createdAt).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US")}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {!isLoading && !isError && totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6 mt-8">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={feedbacksPage?.first}
                      className="w-9 h-9 rounded-xl border border-[#E4EAF2] bg-white flex items-center justify-center text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-colors"
                      aria-label={locale === "vi" ? "Trang trước" : "Previous page"}
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {pageButtons.map((pi) => (
                      <button
                        key={pi}
                        type="button"
                        onClick={() => setPage(pi)}
                        className={`w-9 h-9 rounded-xl font-bold text-xs border transition-colors ${
                          pi === page
                            ? "bg-[#0B4FC4] text-white border-[#0B4FC4]"
                            : "bg-white border-[#E4EAF2] text-[#475467] hover:border-[#0B4FC4]"
                        }`}
                      >
                        {pi + 1}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={feedbacksPage?.last}
                      className="w-9 h-9 rounded-xl border border-[#E4EAF2] bg-white flex items-center justify-center text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-colors"
                      aria-label={locale === "vi" ? "Trang sau" : "Next page"}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-[#475467]">
                    <span>{locale === "vi" ? "Hiển thị:" : "Show:"}</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(0);
                      }}
                      className="bg-white border-2 border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-[#123E8A] focus:border-[#0B4FC4] outline-none cursor-pointer"
                    >
                      <option value={5}>5 / {locale === "vi" ? "trang" : "page"}</option>
                      <option value={10}>10 / {locale === "vi" ? "trang" : "page"}</option>
                      <option value={20}>20 / {locale === "vi" ? "trang" : "page"}</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#F4F9FF] border border-[#E1EEFF] rounded-2xl p-4 flex items-start gap-3">
              <Info size={16} className="text-[#0B4FC4] shrink-0 mt-0.5" />
              <p className="text-xs text-[#475467] leading-relaxed">
                {locale === "vi"
                  ? "Kết quả được cập nhật liên tục. Vui lòng chọn bộ lọc phù hợp để tìm kiếm chính xác hơn."
                  : "Results are updated continuously. Please select appropriate filters for a more accurate search."}
              </p>
            </div>
          </div>

          {/* Right Column: Sidebar panels */}
          <div className="md:col-span-4 md:sticky md:top-[100px] md:self-start space-y-6 md:max-h-[calc(100vh-120px)] md:overflow-y-auto pr-1">
            <div className="bg-white border border-[#E4EAF2] rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-[#123E8A] font-bold text-base border-b border-slate-100 pb-3 flex items-center gap-2">
                {locale === "vi" ? "Thống kê tổng quan" : "Overview Statistics"}
              </h3>
              {isLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((s) => (
                    <div key={s} className="bg-slate-50 border border-slate-100 rounded-xl p-3 h-[72px] animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white border border-[#E4EAF2] rounded-xl p-3 flex items-center justify-between shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase text-[#667085] tracking-wider">{locale === "vi" ? "Tổng phản ánh" : "Total reports"}</span>
                      <span className="text-xl font-extrabold text-[#0B4FC4] mt-0.5">{stats.total.toLocaleString("vi-VN")}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0B4FC4] flex items-center justify-center shrink-0">
                      <FileText size={16} />
                    </div>
                  </div>

                  <div className="bg-white border border-[#E4EAF2] rounded-xl p-3 flex items-center justify-between shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase text-[#667085] tracking-wider">{locale === "vi" ? "Đang xử lý" : "Processing"}</span>
                      <span className="text-xl font-extrabold text-[#F97316] mt-0.5">{stats.pending.toLocaleString("vi-VN")}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-orange-50 text-[#F97316] flex items-center justify-center shrink-0">
                      <Clock size={16} />
                    </div>
                  </div>

                  <div className="bg-white border border-[#E4EAF2] rounded-xl p-3 flex items-center justify-between shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase text-[#667085] tracking-wider">{locale === "vi" ? "Đã xử lý" : "Resolved"}</span>
                      <span className="text-xl font-extrabold text-[#16A34A] mt-0.5">{stats.resolved.toLocaleString("vi-VN")}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-green-50 text-[#16A34A] flex items-center justify-center shrink-0">
                      <CheckCircle2 size={16} />
                    </div>
                  </div>

                  <div className="bg-white border border-[#E4EAF2] rounded-xl p-3 flex items-center justify-between shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase text-[#667085] tracking-wider">{locale === "vi" ? "Từ chối" : "Rejected"}</span>
                      <span className="text-xl font-extrabold text-[#DC2626] mt-0.5">{stats.rejected.toLocaleString("vi-VN")}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-red-50 text-[#DC2626] flex items-center justify-center shrink-0">
                      <AlertTriangle size={16} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white border border-[#E4EAF2] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-[#123E8A] font-bold text-base">
                  {locale === "vi" ? "Phân bố theo khu vực" : "Geographic Distribution"}
                </h3>

              </div>
              <div className="aspect-[4/3] rounded-xl overflow-hidden border border-[#E4EAF2] relative z-0">
                <Suspense fallback={<div className="w-full h-full bg-slate-100 animate-pulse" />}>
                  <CivicMap
                    markers={sortedFeedbacks
                      .filter((f) => f.latitude && f.longitude)
                      .map((f) => ({
                        position: [f.latitude!, f.longitude!] as [number, number],
                        title: f.title,
                        description: f.description,
                        status: mapStatus(f.status),
                      }))}
                    height="100%"
                    interactive={true}
                  />
                </Suspense>
              </div>

            </div>

            {categoryStats.length > 0 && (
              <div className="bg-white border border-[#E4EAF2] rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-1">
                  <h3 className="text-[#123E8A] font-bold text-base">
                    {locale === "vi" ? "Lĩnh vực phổ biến" : "Popular Categories"}
                  </h3>
                </div>
                <div className="space-y-3">
                  {categoryStats.slice(0, 4).map((c) => {
                    let barColor = "bg-[#0B4FC4]";
                    if (c.name.includes("Môi trường")) barColor = "bg-[#16A34A]";
                    else if (c.name.includes("Hạ tầng")) barColor = "bg-[#8B5CF6]";
                    else if (c.name.includes("Trật tự")) barColor = "bg-[#F97316]";

                    return (
                      <div key={c.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-[#123E8A]">{c.name}</span>
                          <span className="text-[#475467]">{c.percentage}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${barColor} rounded-full`} style={{ width: `${c.percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getVisiblePageIndexes(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const start = Math.max(0, Math.min(currentPage - 2, totalPages - 5));
  return Array.from({ length: 5 }, (_, index) => start + index);
}

