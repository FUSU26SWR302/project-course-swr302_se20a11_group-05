import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useFeedbackDetail } from "@/lib/hooks";
import { reports as mockReports } from "@/lib/mock-data";
import { StatusBadge } from "@/components/site/StatusBadge";
import { ArrowLeft, Check, Clock, MapPin, User, SearchX } from "lucide-react";
import { Role, AUTHORITY_ROLES, parseBackendRole } from "@/lib/roles";
import { getToken } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/site/EmptyState";
import { DemoBanner } from "@/components/site/DemoBanner";

function mapTimelineStage(status: string): "pending" | "inProgress" | "resolved" {
  const s = status.toUpperCase();
  if (s === "RESOLVED") return "resolved";
  if (s === "PENDING") return "pending";
  return "inProgress";
}

export const Route = createFileRoute("/my-reports/$id")({
  beforeLoad: async ({ params }) => {
    const token = typeof window !== "undefined" ? getToken() : null;
    const raw = typeof window !== "undefined"
      ? localStorage.getItem("dn_auth_user_v2")
      : null;

    if (!token || !raw) {
      throw redirect({ to: "/login", search: { redirect: `/my-reports/${params.id}` } });
    }

    let user: { role: string } | null = null;
    try { user = JSON.parse(raw); } catch { /* ignore */ }
    if (!user) throw redirect({ to: "/login" });

    const role = parseBackendRole(user.role);
    if (AUTHORITY_ROLES.has(role) || role !== Role.CITIZEN) {
      throw redirect({ to: "/login" });
    }
  },
  head: ({ params }) => ({
    meta: [
      { title: `Phản ánh ${params.id} — Đà Nẵng Kết Nối` },
      { name: "description", content: `Trạng thái phản ánh ${params.id} và lịch sử xử lý.` },
    ],
  }),
  component: ReportDetail,
});


function ReportDetail() {
  const { id } = Route.useParams();
  const { t, locale } = useI18n();

  const { data: apiReport, isLoading, isError } = useFeedbackDetail(id);

  // Fallback to mock data if API fails
  const mockReport = !isLoading && (isError || !apiReport) ? mockReports.find(r => r.id === id) : null;
  const isApi = !!apiReport;

  const stages = ["pending", "inProgress", "resolved"] as const;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-10 md:py-14 animate-fade-in">
        <Skeleton className="h-5 w-32 mb-6" />
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-6 w-full mb-8" />
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        </div>
        <Skeleton className="h-8 w-48 mb-5" />
        <div className="space-y-6 pl-6">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </div>
    );
  }

  if (!isApi && !mockReport) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 animate-fade-in">
        <EmptyState
          icon={SearchX}
          title={locale === "vi" ? "Không tìm thấy phản ánh" : "Report not found"}
          description={locale === "vi"
            ? "Phản ánh bạn tìm không tồn tại hoặc đã bị xoá."
            : "The report you're looking for doesn't exist or has been removed."}
          action={
            <Link to="/my-reports" className="btn-civic btn-civic-primary">
              {locale === "vi" ? "Quay lại danh sách" : "Back to list"}
            </Link>
          }
        />
        <Link to="/my-reports" className="inline-flex items-center gap-2 text-gov-blue font-semibold mb-6 hover:underline">
          <ArrowLeft size={18} /> {t("my.title")}
        </Link>
      </div>
    );
  }

  const currentStage = isApi ? mapTimelineStage(apiReport.status) : mockReport!.status;
  const currentIdx = stages.indexOf(currentStage as typeof stages[number]);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-10 md:py-14 animate-fade-in-up">
      <Link to="/my-reports" className="inline-flex items-center gap-2 text-gov-blue font-semibold mb-6 hover:underline transition-all hover:gap-3">
        <ArrowLeft size={18} /> {t("my.title")}
      </Link>

      {!isApi && <DemoBanner />}

      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <StatusBadge status={currentStage} />
        <span className="font-mono text-sm text-ink-soft">{isApi ? apiReport.trackingCode : mockReport!.id}</span>
      </div>

      <h1 className="font-heading text-3xl md:text-4xl text-gov-blue mb-4">
        {isApi ? apiReport.title : mockReport!.title[locale]}
      </h1>
      <p className="text-lg text-ink-soft mb-8 leading-relaxed">
        {isApi ? apiReport.description : mockReport!.description[locale]}
      </p>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <img
          src={isApi ? "https://placehold.co/800x800/e2e8f0/475569?text=No+Image" : mockReport!.image}
          alt={isApi ? apiReport.title : mockReport!.title[locale]}
          loading="lazy"
          width={800}
          height={800}
          className="w-full aspect-square object-cover rounded-2xl shadow-sm border border-slate-100"
        />
        <div className="card-civic p-6 space-y-4 animate-slide-in-right">
          <div className="flex items-start gap-3">
            <MapPin className="text-gov-blue mt-1 shrink-0" size={20} />
            <div>
              <div className="text-xs uppercase font-bold text-ink-soft tracking-wider">
                {locale === "vi" ? "Vị trí" : "Location"}
              </div>
              <div className="text-base text-ink">
                {isApi ? (apiReport.addressDetails || "Chưa cung cấp") : mockReport!.address[locale]}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <User className="text-gov-blue mt-1 shrink-0" size={20} />
            <div>
              <div className="text-xs uppercase font-bold text-ink-soft tracking-wider">
                {locale === "vi" ? "Người gửi" : "Reporter"}
              </div>
              <div className="text-base text-ink">
                {isApi ? (apiReport.citizenName || "Ẩn danh") : mockReport!.reporter}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="text-gov-blue mt-1 shrink-0" size={20} />
            <div>
              <div className="text-xs uppercase font-bold text-ink-soft tracking-wider">
                {locale === "vi" ? "Thời gian" : "Time"}
              </div>
              <div className="text-base text-ink">
                {isApi ? apiReport.createdAt?.slice(0, 16).replace('T', ' ') : mockReport!.createdAt}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <h2 className="text-2xl mb-5">
        {locale === "vi" ? "Tiến trình xử lý" : "Resolution timeline"}
      </h2>
      <ol className="relative border-l-4 border-slate-200 pl-6 space-y-6">
        {stages.map((stage, i) => {
          const reached = i <= currentIdx || currentStage === "urgent";

          let stageLabel = "";
          let stageTime = "";

          if (!isApi) {
            const entry = mockReport!.timeline.find(te => te.status === stage);
            if (entry) {
              stageLabel = entry.label[locale];
              stageTime = entry.at;
            }
          } else {
            if (stage === "pending" && apiReport.createdAt) {
              stageLabel = locale === "vi" ? "Tiếp nhận hệ thống" : "Received by system";
              stageTime = apiReport.createdAt.slice(0, 16).replace('T', ' ');
            } else if (stage === currentStage) {
              stageLabel = locale === "vi" ? "Trạng thái hiện tại" : "Current status";
              stageTime = apiReport.updatedAt?.slice(0, 16).replace('T', ' ') || "";
            }
          }

          const label =
            stage === "pending" ? t("my.timeline.submitted")
              : stage === "inProgress" ? t("my.timeline.inProgress")
                : t("my.timeline.resolved");

          return (
            <li key={stage} className={`relative animate-fade-in-up stagger-${i + 1}`}>
              <span
                className={`absolute -left-[34px] w-7 h-7 rounded-full grid place-items-center border-4 transition-all duration-300 ${reached ? "bg-[var(--status-success)] border-white shadow-sm" : "bg-slate-200 border-white"
                  }`}
              >
                {reached && <Check size={14} className="text-white" strokeWidth={3} />}
              </span>
              <div className={`font-bold text-lg ${reached ? "text-ink" : "text-ink-soft"}`}>{label}</div>
              {stageLabel && (
                <div className="text-sm text-ink-soft">{stageLabel} {stageTime ? `· ${stageTime}` : ""}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
