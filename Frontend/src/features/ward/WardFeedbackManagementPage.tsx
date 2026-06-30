import { useEffect, useMemo, useState, type ReactNode, type SelectHTMLAttributes } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Role } from "@/lib/roles";
import { useCategories, useFeedbacks } from "@/lib/hooks";
import { feedbackApi, wardApi, type FeedbackListFilters, type FeedbackStatus } from "@/lib/api";
import { OFFICIAL_CATEGORIES } from "@/lib/categoryConfig";
import { FeedbackDetailModal } from "@/features/city-admin/pages/FeedbackDetailModal";

const WARD_STAFF_CATEGORY_CODES = ["URBAN_INFRASTRUCTURE", "ENVIRONMENT", "CONSTRUCTION"];

const STATUS_TABS: Array<{
  key: "ALL" | FeedbackStatus;
  label: string;
  countKey: "total" | "pending" | "inProgress" | "resolved" | "rejected";
}> = [
  { key: "ALL", label: "Tất cả", countKey: "total" },
  { key: "PENDING", label: "Chờ xử lý", countKey: "pending" },
  { key: "IN_PROGRESS", label: "Đang xử lý", countKey: "inProgress" },
  { key: "RESOLVED", label: "Đã xử lý", countKey: "resolved" },
  { key: "REJECTED", label: "Đã từ chối", countKey: "rejected" },
];

const PRIORITY_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "LOW", label: "Thấp" },
  { value: "MEDIUM", label: "Trung bình" },
  { value: "HIGH", label: "Cao" },
  { value: "CRITICAL", label: "Khẩn cấp" },
];

export function WardFeedbackManagementPage() {
  const { user } = useAuth();
  const isWardStaff = user?.role === Role.WARD_STAFF;
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchDraft, setSearchDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState<FeedbackStatus | "">("");
  const [categoryDraft, setCategoryDraft] = useState("");
  const [priorityDraft, setPriorityDraft] = useState("");
  const [fromDateDraft, setFromDateDraft] = useState("");
  const [toDateDraft, setToDateDraft] = useState("");
  const [wardDraft, setWardDraft] = useState<string>(() => isWardStaff && user?.wardId ? String(user.wardId) : "");
  const [activeTab, setActiveTab] = useState<"ALL" | FeedbackStatus>("ALL");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filters, setFilters] = useState<FeedbackListFilters>(() => ({
    wardId: isWardStaff ? user?.wardId || undefined : undefined,
    categories: isWardStaff ? WARD_STAFF_CATEGORY_CODES.join(",") : undefined,
  }));

  const queryFilters = useMemo<FeedbackListFilters>(() => ({
    ...filters,
    status: activeTab !== "ALL" ? activeTab : filters.status,
    wardId: isWardStaff ? user?.wardId || undefined : filters.wardId,
    categories: isWardStaff ? WARD_STAFF_CATEGORY_CODES.join(",") : undefined,
  }), [activeTab, filters, isWardStaff, user?.wardId]);

  const statsFilters = useMemo<FeedbackListFilters>(() => ({
    ...filters,
    status: "",
    wardId: isWardStaff ? user?.wardId || undefined : filters.wardId,
    categories: isWardStaff ? WARD_STAFF_CATEGORY_CODES.join(",") : undefined,
  }), [filters, isWardStaff, user?.wardId]);

  const { data: feedbacksPage, isLoading } = useFeedbacks(page, pageSize, queryFilters);
  const { data: categories = [] } = useCategories();
  const { data: wards = [] } = useQuery({
    queryKey: ["wards", "feedback-management"],
    queryFn: () => wardApi.getAll(),
    enabled: !isWardStaff,
    staleTime: 300_000,
  });
  const { data: stats } = useQuery({
    queryKey: ["feedbacks", "management-stats", statsFilters],
    queryFn: () => feedbackApi.getMyStats(statsFilters),
    staleTime: 30_000,
  });

  const categoryOptions = useMemo(() => {
    const allowed = isWardStaff ? new Set(WARD_STAFF_CATEGORY_CODES) : null;
    const byCode = new Map<string, { code: string; label: string }>();
    OFFICIAL_CATEGORIES.forEach((category) => {
      if (!allowed || allowed.has(category.code)) {
        byCode.set(category.code, { code: category.code, label: officialCategoryName(category.code) });
      }
    });
    categories.forEach((category) => {
      if (!allowed || allowed.has(category.code)) {
        byCode.set(category.code, { code: category.code, label: category.nameVi || category.name || officialCategoryName(category.code) });
      }
    });
    return Array.from(byCode.values());
  }, [categories, isWardStaff]);

  useEffect(() => {
    if (isWardStaff && user?.wardId) {
      setWardDraft(String(user.wardId));
      setFilters((current) => ({
        ...current,
        wardId: user.wardId || undefined,
        categories: WARD_STAFF_CATEGORY_CODES.join(","),
      }));
    }
  }, [isWardStaff, user?.wardId]);

  const rows = feedbacksPage?.content ?? [];
  const totalPages = feedbacksPage?.totalPages ?? 0;
  const totalElements = feedbacksPage?.totalElements ?? 0;
  const pageButtons = getVisiblePageIndexes(page, totalPages);

  const applyFilters = () => {
    setPage(0);
    setActiveTab(statusDraft || "ALL");
    setFilters({
      keyword: searchDraft.trim(),
      status: statusDraft,
      category: categoryDraft,
      priority: priorityDraft,
      fromDate: fromDateDraft,
      toDate: toDateDraft,
      wardId: isWardStaff ? user?.wardId || undefined : wardDraft || undefined,
      categories: isWardStaff ? WARD_STAFF_CATEGORY_CODES.join(",") : undefined,
    });
  };

  const resetFilters = () => {
    setSearchDraft("");
    setStatusDraft("");
    setCategoryDraft("");
    setPriorityDraft("");
    setFromDateDraft("");
    setToDateDraft("");
    setWardDraft(isWardStaff && user?.wardId ? String(user.wardId) : "");
    setActiveTab("ALL");
    setPage(0);
    setFilters({
      wardId: isWardStaff ? user?.wardId || undefined : undefined,
      categories: isWardStaff ? WARD_STAFF_CATEGORY_CODES.join(",") : undefined,
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#344767]">Quản lý, tiếp nhận và xử lý phản ánh của người dân trong địa bàn</p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          applyFilters();
        }}
        className="rounded-lg border border-[#DFE7F2] bg-white p-5 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FilterField label="Tìm kiếm">
            <div className="relative">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7A99]" />
              <input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                className="h-10 w-full rounded-md border border-[#CBD7E6] bg-white pl-10 pr-3 text-sm text-[#0B2545] outline-none focus:border-[#0B4FC4] focus:ring-2 focus:ring-blue-100"
                placeholder="Tìm theo mã, nội dung, địa điểm, người gửi..."
              />
            </div>
          </FilterField>
          <FilterField label="Trạng thái">
            <Select value={statusDraft} onChange={(event) => setStatusDraft(event.target.value as FeedbackStatus | "")}>
              <option value="">Tất cả</option>
              <option value="PENDING">Chờ xử lý</option>
              <option value="IN_PROGRESS">Đang xử lý</option>
              <option value="RESOLVED">Đã xử lý</option>
              <option value="REJECTED">Đã từ chối</option>
            </Select>
          </FilterField>
          <FilterField label="Lĩnh vực">
            <Select value={categoryDraft} onChange={(event) => setCategoryDraft(event.target.value)}>
              <option value="">Tất cả</option>
              {categoryOptions.map((category) => (
                <option key={category.code} value={category.code}>{category.label}</option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Mức độ ưu tiên">
            <Select value={priorityDraft} onChange={(event) => setPriorityDraft(event.target.value)}>
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority.value} value={priority.value}>{priority.label}</option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Từ ngày">
            <input type="date" value={fromDateDraft} onChange={(event) => setFromDateDraft(event.target.value)} className="h-10 w-full rounded-md border border-[#CBD7E6] px-3 text-sm outline-none focus:border-[#0B4FC4] focus:ring-2 focus:ring-blue-100" />
          </FilterField>
          <FilterField label="Đến ngày">
            <input type="date" value={toDateDraft} onChange={(event) => setToDateDraft(event.target.value)} className="h-10 w-full rounded-md border border-[#CBD7E6] px-3 text-sm outline-none focus:border-[#0B4FC4] focus:ring-2 focus:ring-blue-100" />
          </FilterField>
          <FilterField label="Địa bàn">
            <Select value={wardDraft} disabled={isWardStaff} onChange={(event) => setWardDraft(event.target.value)}>
              <option value="">{isWardStaff ? user?.wardName || "Phường đang quản lý" : "Tất cả"}</option>
              {isWardStaff && user?.wardId ? <option value={String(user.wardId)}>{user.wardName || "Phường đang quản lý"}</option> : null}
              {!isWardStaff && wards.map((ward) => <option key={ward.id} value={ward.id}>{ward.name}</option>)}
            </Select>
          </FilterField>
          <div className="flex items-end justify-end gap-3">
            <button type="button" onClick={resetFilters} className="inline-flex h-10 items-center gap-2 rounded-md border border-[#CBD7E6] bg-white px-4 text-sm font-semibold text-[#0B2545] hover:bg-slate-50">
              <RefreshCw size={16} />
              Đặt lại
            </button>
            <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0B5CE7] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#084BC0]">
              <Search size={16} />
              Tìm kiếm
            </button>
          </div>
        </div>
      </form>

      <div className="rounded-lg border border-[#DFE7F2] bg-white shadow-sm">
        <div className="flex gap-7 overflow-x-auto border-b border-[#E6EDF6] px-4">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
                setStatusDraft(tab.key === "ALL" ? "" : tab.key);
                setPage(0);
              }}
              className={`flex h-14 shrink-0 items-center gap-2 border-b-3 px-1 text-sm font-bold ${
                activeTab === tab.key ? "border-[#0B5CE7] text-[#0B2545]" : "border-transparent text-[#344767] hover:text-[#0B4FC4]"
              }`}
            >
              {tab.label}
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-[#0B5CE7]">{stats?.[tab.countKey] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="overflow-x-auto p-4">
          <table className="w-full min-w-[1080px] border-separate border-spacing-0 overflow-hidden rounded-lg border border-[#E3EAF4] text-left">
            <thead>
              <tr className="bg-white text-xs font-bold text-[#0B2545]">
                {["Mã phản ánh", "Nội dung phản ánh", "Người gửi", "Địa điểm", "Lĩnh vực", "Mức độ ưu tiên", "Trạng thái", "Thời gian gửi", "Thao tác"].map((header) => (
                  <th key={header} className="border-b border-[#E3EAF4] px-3 py-3">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3EAF4]">
              {isLoading ? (
                Array.from({ length: pageSize }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={9} className="px-3 py-3">
                      <div className="h-9 animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-500">Không có phản ánh phù hợp.</td>
                </tr>
              ) : (
                rows.map((feedback) => (
                  <tr key={feedback.id} className="text-sm text-[#0B2545] hover:bg-[#F8FBFF]">
                    <td className="px-3 py-3 font-semibold text-[#0B5CE7]">{feedback.trackingCode || feedback.code || `#${feedback.id}`}</td>
                    <td className="max-w-[230px] px-3 py-3">
                      <div className="line-clamp-2 font-medium">{feedback.title || feedback.description}</div>
                    </td>
                    <td className="px-3 py-3">{feedback.citizenName || "-"}</td>
                    <td className="max-w-[180px] px-3 py-3"><span className="line-clamp-2">{feedback.addressDetails || feedback.wardName || "-"}</span></td>
                    <td className="px-3 py-3">{feedback.categoryName || officialCategoryName(feedback.categoryCode || feedback.category || "")}</td>
                    <td className="px-3 py-3"><PriorityBadge value={feedback.priority} /></td>
                    <td className="px-3 py-3"><StatusBadge status={feedback.status} /></td>
                    <td className="px-3 py-3">{formatDateTime(feedback.submittedAt || feedback.createdAt)}</td>
                    <td className="px-3 py-3">
                      <button type="button" onClick={() => setSelectedId(feedback.id)} className="rounded-md border border-[#CBD7E6] px-3 py-2 text-xs font-bold text-[#0B5CE7] hover:bg-blue-50">
                        Xem
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#E6EDF6] px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 text-sm text-[#344767]">
            <span>Hiển thị</span>
            <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }} className="h-9 rounded-md border border-[#CBD7E6] bg-white px-3 font-semibold text-[#0B2545]">
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <span>trên tổng số {totalElements.toLocaleString("vi-VN")} phản ánh</span>
          </div>
          <div className="flex items-center gap-2">
            <PageButton disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}><ChevronLeft size={16} /></PageButton>
            {pageButtons.map((pageIndex) => (
              <PageButton key={pageIndex} active={pageIndex === page} onClick={() => setPage(pageIndex)}>{pageIndex + 1}</PageButton>
            ))}
            <PageButton disabled={totalPages === 0 || page >= totalPages - 1} onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))}><ChevronRight size={16} /></PageButton>
          </div>
        </div>
      </div>
      <FeedbackDetailModal feedbackId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-bold text-[#0B2545]">{label}</span>
      {children}
    </label>
  );
}

function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`h-10 w-full rounded-md border border-[#CBD7E6] bg-white px-3 text-sm text-[#0B2545] outline-none focus:border-[#0B4FC4] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500 ${props.className || ""}`}
    />
  );
}

function PageButton({ active, disabled, onClick, children }: { active?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? "border-[#0B5CE7] bg-[#0B5CE7] text-white" : "border-[#E0E8F3] bg-white text-[#0B2545] hover:bg-blue-50"
      }`}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const info = getOfficerStatusInfo(status);
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${info.className}`}>{info.label}</span>;
}

function PriorityBadge({ value }: { value?: string | null }) {
  const normalized = (value || "MEDIUM").toUpperCase();
  const info =
    normalized === "URGENT" || normalized === "CRITICAL"
      ? { label: "Khẩn cấp", className: "bg-red-100 text-red-800" }
      : normalized === "HIGH"
        ? { label: "Cao", className: "bg-red-50 text-red-700" }
      : normalized === "LOW"
        ? { label: "Thấp", className: "bg-green-50 text-green-700" }
        : { label: "Trung bình", className: "bg-orange-50 text-orange-700" };
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${info.className}`}>{info.label}</span>;
}

function getOfficerStatusInfo(status: string) {
  if (status === "RESOLVED") return { label: "Đã xử lý", className: "bg-green-50 text-green-700" };
  if (status === "REJECTED") return { label: "Đã từ chối", className: "bg-red-50 text-red-700" };
  if (["IN_PROGRESS", "ASSIGNED", "WAITING_INFO", "NEED_LOCATION_REVIEW"].includes(status)) {
    return { label: "Đang xử lý", className: "bg-blue-50 text-blue-700" };
  }
  return { label: "Chờ xử lý", className: "bg-orange-50 text-orange-700" };
}

function officialCategoryName(code: string) {
  switch (code) {
    case "URBAN_INFRASTRUCTURE": return "Hạ tầng đô thị";
    case "ENVIRONMENT": return "Môi trường";
    case "CONSTRUCTION": return "Xây dựng";
    case "TRAFFIC": return "Giao thông";
    case "PUBLIC_SECURITY": return "An ninh trật tự";
    case "FIRE_SAFETY": return "An toàn PCCC";
    default: return code || "Khác";
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getVisiblePageIndexes(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const start = Math.max(0, Math.min(currentPage - 2, totalPages - 5));
  return Array.from({ length: 5 }, (_, index) => start + index);
}
