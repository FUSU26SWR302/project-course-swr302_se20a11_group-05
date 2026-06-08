import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useFeedbacks } from "@/lib/hooks";
import { reports as mockReports } from "@/lib/mock-data";
import { StaffShell } from "@/components/site/StaffShell";
import { Loader2, RefreshCw } from "lucide-react";

export function WardDashboard() {
  const { t, locale } = useI18n();
  const { data: feedbacksPage, isFetching, refetch } = useFeedbacks(0, 50);

  const [selectedId, setSelectedId] = useState<string | number | null>(null);

  const hasApiData = !!feedbacksPage && feedbacksPage.content.length > 0;
  const apiFeedbacks = feedbacksPage?.content ?? [];

  // Auto-select first item when data loads
  useEffect(() => {
    if (selectedId !== null) return;
    if (hasApiData && apiFeedbacks.length > 0) {
      setSelectedId(apiFeedbacks[0].id);
    } else if (!hasApiData && mockReports.length > 0) {
      setSelectedId(mockReports[0].id);
    }
  }, [hasApiData, apiFeedbacks, selectedId]);

  return (
    <StaffShell
      accent="blue"
      eyebrow={locale === "vi" ? "Cổng cán bộ phường" : "Ward officer portal"}
      title={t("ward.title")}
      org="UBND Phường Hải Châu I · Quận Hải Châu"
    >
      <div className="flex flex-wrap items-end justify-end gap-2 mb-6">
        {["Hôm nay", "Tuần này", "Tháng này"].map((p, i) => (
          <button
            key={p}
            className={`min-h-[44px] px-4 rounded-md font-semibold text-sm border ${
              i === 0 ? "bg-gov-blue text-white border-gov-blue" : "bg-white border-slate-200"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-end justify-between gap-2 mb-6">
        <div className="flex gap-2">
          {["Hôm nay", "Tuần này", "Tháng này"].map((p, i) => (
            <button
              key={p}
              className={`min-h-[44px] px-4 rounded-md font-semibold text-sm border ${
                i === 0 ? "bg-gov-blue text-white border-gov-blue" : "bg-white border-slate-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => refetch()} disabled={isFetching} className="btn-civic btn-civic-ghost flex items-center gap-2">
            {isFetching ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {locale === "vi" ? "Làm mới" : "Refresh"}
          </button>
        </div>
      </div>
    </StaffShell>
  );
}
