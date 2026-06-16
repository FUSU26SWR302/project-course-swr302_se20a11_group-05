import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useFeedbacks } from "@/lib/hooks";
import { StatusBadge } from "@/components/site/StatusBadge";
import { EmptyState, ErrorState, NotLoggedIn } from "@/components/site/EmptyState";
import { DemoBanner } from "@/components/site/DemoBanner";
import { MapPin, RefreshCw, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { reports as mockReports } from "@/lib/mock-data";
import { mapStatus } from "@/lib/status";
import { toast } from "sonner";
import { Role, AUTHORITY_ROLES, parseBackendRole } from "@/lib/roles";
import { getToken } from "@/lib/api";
import { useState } from "react";

export const Route = createFileRoute("/my-reports/")({
  /**
   * beforeLoad guard — citizen portal protected route.
   *
   * SECURITY:
   *   - Unauthenticated users → redirect to /login
   *   - Authority staff navigating here → redirect to /login (not a threat,
   *     but they should not access citizen report history)
   */
  beforeLoad: async () => {
    const token = typeof window !== "undefined" ? getToken() : null;
    const raw = typeof window !== "undefined"
      ? localStorage.getItem("dn_auth_user_v2")
      : null;

    if (!token || !raw) {
      throw redirect({ to: "/login", search: { redirect: "/my-reports" } });
    }

    let user: { role: string } | null = null;
    try { user = JSON.parse(raw); } catch { /* ignore */ }

    if (!user) throw redirect({ to: "/login" });

    const role = parseBackendRole(user.role);

    // Authority staff should not access citizen report list
    if (AUTHORITY_ROLES.has(role)) {
      throw redirect({ to: "/login" });
    }

    // Confirm CITIZEN role
    if (role !== Role.CITIZEN) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Báo cáo của tôi — Đà Nẵng Kết Nối" },
      { name: "description", content: "Theo dõi tất cả phản ánh bạn đã gửi." },
    ],
  }),
  component: MyReports,
});

function MyReports() {
  const { t, locale } = useI18n();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [page, setPage] = useState(0);
  const pageSize = 10;

  const { data: feedbacksPage, isLoading, isFetching, refetch, error, isError } = useFeedbacks(page, pageSize);

  // Toast API errors
  useEffect(() => {
    if (isError && error) {
      toast.error(error instanceof Error ? error.message : "Failed to load reports", { id: "reports-error" });
    }
  }, [isError, error]);

  const hasApiData = !!feedbacksPage && feedbacksPage.content.length > 0;
  const apiFeedbacks = feedbacksPage?.content ?? [];

  // Nếu chưa đăng nhập → hiện thông báo
  if (!isAuthenticated) {
    return <NotLoggedIn />;
  }

  // Dữ liệu hiển thị: API nếu có, fallback mock
  const displayItems = hasApiData ? apiFeedbacks : mockReports;
  const isUsingMock = !hasApiData;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-14">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-4xl md:text-5xl text-gov-blue mb-2">{t("my.title")}</h1>
          <p className="text-lg text-ink-soft">{t("my.subtitle")}</p>
          {user && (
            <p className="text-sm text-ink-soft mt-1">
              👤 {user.name} · {locale === "vi" ? "Đang hiển thị phản ánh của bạn" : "Showing your reports"}
            </p>
          )}
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn-civic btn-civic-ghost flex items-center gap-2 min-h-[44px]"
        >
          {isFetching ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
          {locale === "vi" ? "Làm mới" : "Refresh"}
        </button>
      </div>

      {/* Trạng thái kết nối */}
      {isUsingMock && !isError && <DemoBanner />}

      {isError && !isLoading && (
        <ErrorState
          message={error instanceof Error ? error.message : (locale === "vi" ? "Không thể tải dữ liệu từ máy chủ" : "Failed to load data from server")}
          onRetry={() => refetch()}
          compact
        />
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={40} className="animate-spin text-gov-blue" />
        </div>
      )}

      {!isLoading && displayItems.length === 0 && (
        <EmptyState
          title={locale === "vi" ? "Chưa có phản ánh nào" : "No reports yet"}
          description={locale === "vi" ? "Hãy gửi phản ánh đầu tiên của bạn về các vấn đề đô thị tại Đà Nẵng." : "Submit your first report about urban issues in Da Nang."}
          action={<Link to="/report" className="btn-civic btn-civic-primary">{locale === "vi" ? "Gửi phản ánh đầu tiên" : "Submit your first report"}</Link>}
        />
      )}

      <div className="space-y-4">
        {!isLoading && hasApiData && apiFeedbacks.map((r, idx) => (
          <div
            key={r.id}
            className={`card-civic p-5 md:p-6 flex flex-col sm:flex-row gap-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up stagger-${Math.min(idx + 1, 4)}`}
          >
            <div className="flex-1">
              <div className="flex flex-wrap items-start gap-2 mb-2">
                <StatusBadge status={mapStatus(r.status)} />
                <span className="text-ink-soft text-sm ml-auto font-mono">{r.trackingCode}</span>
              </div>
              <h2 className="text-xl font-bold text-ink font-sans mb-1">{r.title}</h2>
              <p className="text-ink-soft mb-3 line-clamp-2">{r.description}</p>
              <div className="flex flex-wrap gap-4 text-sm text-ink-soft">
                {r.addressDetails && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={16} /> {r.addressDetails}
                  </span>
                )}
                <span className="text-xs text-ink-soft">{r.createdAt?.slice(0, 10)}</span>
              </div>
            </div>
          </div>
        ))}

        {/* Fallback mock items khi chưa kết nối */}
        {!isLoading && !hasApiData && mockReports.map((r, idx) => (
          <Link
            key={r.id}
            to="/my-reports/$id"
            params={{ id: r.id }}
            className={`card-civic p-5 md:p-6 flex flex-col sm:flex-row gap-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up stagger-${Math.min(idx + 1, 4)}`}
          >
            <img
              src={r.image}
              alt={r.title[locale]}
              loading="lazy"
              width={400}
              height={400}
              className="w-full sm:w-40 h-40 object-cover rounded-lg"
            />
            <div className="flex-1">
              <div className="flex flex-wrap items-start gap-2 mb-2">
                <StatusBadge status={r.status} />
                <span className="text-ink-soft text-sm ml-auto">{r.createdAt}</span>
              </div>
              <h2 className="text-xl font-bold text-ink font-sans mb-1">{r.title[locale]}</h2>
              <p className="text-ink-soft mb-3 line-clamp-2">{r.description[locale]}</p>
              <div className="flex flex-wrap gap-4 text-sm text-ink-soft">
                <span className="flex items-center gap-1.5"><MapPin size={16} /> {r.address[locale]}</span>
                <span className="font-mono text-xs">{r.id}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {hasApiData && feedbacksPage && feedbacksPage.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="btn-civic btn-civic-ghost disabled:opacity-30"
          >
            <ChevronLeft size={18} /> {locale === "vi" ? "Trước" : "Prev"}
          </button>
          {Array.from({ length: Math.min(feedbacksPage.totalPages, 5) }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`min-w-[40px] min-h-[40px] rounded-lg font-semibold text-sm border transition-all ${
                i === page
                  ? "bg-gov-blue text-white border-gov-blue"
                  : "bg-white border-slate-200 hover:border-gov-blue"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min((feedbacksPage.totalPages || 1) - 1, p + 1))}
            disabled={page >= (feedbacksPage.totalPages || 1) - 1}
            className="btn-civic btn-civic-ghost disabled:opacity-30"
          >
            {locale === "vi" ? "Sau" : "Next"} <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
