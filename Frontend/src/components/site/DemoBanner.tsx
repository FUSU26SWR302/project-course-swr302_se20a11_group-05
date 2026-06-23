import { useI18n } from "@/lib/i18n";

export function DemoBanner() {
  const { locale } = useI18n();
  return (
    <div className="mb-6 px-4 py-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-xs flex items-center gap-2">
      <svg
        className="w-4 h-4 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
        />
      </svg>
      {locale === "vi"
        ? "Đang hiển thị dữ liệu minh họa — kết nối backend sẽ hiển thị số liệu thực."
        : "Showing demo data — connect backend for live data."}
    </div>
  );
}
