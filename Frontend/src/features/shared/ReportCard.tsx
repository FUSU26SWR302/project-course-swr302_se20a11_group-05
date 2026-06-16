import { Video } from "lucide-react";
import { StatusBadge } from "@/components/site/StatusBadge";
import { mapStatus } from "@/lib/status";
import type { FeedbackResponse } from "@/types/api";

interface SharedReport {
  id: number | string;
  trackingCode?: string;
  title: string | { vi: string; en: string };
  description: string | { vi: string; en: string };
  addressDetails?: string | null;
  address?: string | { vi: string; en: string };
  status: string;
  image?: string;
  licensePlate?: string;
}

interface ReportCardProps {
  report: SharedReport | FeedbackResponse;
  isApi: boolean;
  locale: "vi" | "en";
  policeView?: boolean;
}

export function ReportCard({
  report,
  isApi,
  locale,
  policeView = false,
}: ReportCardProps) {
  const getVal = (field: any) => {
    if (!field) return "";
    if (typeof field === "object" && locale in field) {
      return field[locale];
    }
    return String(field);
  };

  const status = isApi ? mapStatus(report.status) : (report.status as any);
  const id = isApi ? (report as FeedbackResponse).trackingCode : String(report.id);
  const title = isApi ? (report as FeedbackResponse).title : getVal(report.title);
  const description = isApi ? (report as FeedbackResponse).description : getVal(report.description);
  const address = isApi
    ? ((report as FeedbackResponse).addressDetails || "Chưa cung cấp")
    : getVal((report as any).address);

  const imageSrc = !isApi && (report as any).image ? (report as any).image : null;

  return (
    <div
      className="card-civic p-5 md:p-6 grid md:grid-cols-12 gap-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up"
    >
      <div className="md:col-span-3 bg-slate-100 w-full aspect-video md:aspect-square flex items-center justify-center rounded-lg text-slate-400 overflow-hidden border border-slate-100">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={title}
            loading="lazy"
            width={400}
            height={400}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-sm font-medium text-slate-400">
            {locale === "vi" ? "Không có ảnh" : "No image"}
          </span>
        )}
      </div>
      <div className="md:col-span-6">
        <div className="flex items-center gap-2 mb-2">
          <StatusBadge status={status} />
          <span className="font-mono text-xs text-ink-soft">{id}</span>
        </div>
        <h3 className="text-lg font-bold mb-2 text-ink font-sans">{title}</h3>
        <p className="text-ink-soft text-sm mb-3 leading-relaxed">{description}</p>
        <div className="text-sm text-ink-soft">{address}</div>
      </div>
      <div className="md:col-span-3 flex flex-col gap-2">
        {policeView && (report as any).licensePlate && (
          <div className="bg-slate-900 text-[var(--status-danger)] p-3 rounded-lg text-center">
            <div className="text-[10px] uppercase tracking-widest text-white/60">
              {locale === "vi" ? "BIỂN SỐ" : "LICENSE PLATE"}
            </div>
            <div className="font-mono font-bold text-xl">{(report as any).licensePlate}</div>
          </div>
        )}
        <button className={`btn-civic btn-civic-primary text-sm ${policeView ? "bg-[var(--status-danger)] border-[var(--status-danger)]" : ""}`}>
          <Video size={18} />
          {locale === "vi" ? "Xem video bằng chứng" : "View video evidence"}
        </button>
        <button className="btn-civic btn-civic-ghost text-sm">
          {locale === "vi" ? "Chuyển đơn vị khác" : "Forward dispatch"}
        </button>
      </div>
    </div>
  );
}
