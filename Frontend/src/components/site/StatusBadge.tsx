import { useI18n } from "@/lib/i18n";
import type { ReportStatus } from "@/types/status";

const styles: Record<ReportStatus, string> = {
  pending: "bg-amber-50 text-amber-800 border border-amber-200",
  inProgress: "bg-amber-50 text-amber-800 border border-amber-200",
  resolved: "bg-green-50 text-green-800 border border-green-200",
  urgent: "bg-red-50 text-red-800 border border-red-200",
};

const dots: Record<ReportStatus, string> = {
  pending: "bg-amber-500",
  inProgress: "bg-amber-500",
  resolved: "bg-green-500",
  urgent: "bg-red-500",
};

const labels: Record<ReportStatus, "status.pending" | "status.inProgress" | "status.resolved" | "status.urgent"> = {
  pending: "status.pending",
  inProgress: "status.inProgress",
  resolved: "status.resolved",
  urgent: "status.urgent",
};

export function StatusBadge({ status }: { status: ReportStatus }) {
  const { t } = useI18n();
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full tracking-wide ${styles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status]}`} />
      {t(labels[status])}
    </span>
  );
}
