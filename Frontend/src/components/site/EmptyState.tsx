import { useI18n } from "@/lib/i18n";
import { type LucideIcon, Inbox } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, compact }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? "py-10" : "py-20"}`}>
      <div className="w-16 h-16 rounded-full bg-slate-100 grid place-items-center mb-4">
        <Icon size={32} className="text-ink-soft/60" />
      </div>
      <h3 className="text-lg font-bold text-ink mb-1">{title}</h3>
      {description && <p className="text-ink-soft text-sm max-w-sm mb-4">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}

interface ErrorProps {
  message: string;
  onRetry?: () => void;
  compact?: boolean;
}

export function ErrorState({ message, onRetry, compact }: ErrorProps) {
  const { locale } = useI18n();
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? "py-10" : "py-20"}`}>
      <div className="w-16 h-16 rounded-full bg-red-50 grid place-items-center mb-4">
        <svg className="w-8 h-8 text-[var(--status-danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-ink mb-1">
        {locale === "vi" ? "Có lỗi xảy ra" : "Something went wrong"}
      </h3>
      <p className="text-ink-soft text-sm max-w-sm mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-civic btn-civic-ghost text-sm">
          {locale === "vi" ? "Thử lại" : "Retry"}
        </button>
      )}
    </div>
  );
}

export function NotLoggedIn() {
  const { locale } = useI18n();
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-gov-blue/10 grid place-items-center mx-auto mb-4">
        <svg className="w-8 h-8 text-gov-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
        </svg>
      </div>
      <h1 className="font-heading text-3xl text-gov-blue mb-3">
        {locale === "vi" ? "Vui lòng đăng nhập" : "Please log in"}
      </h1>
      <p className="text-ink-soft mb-6">
        {locale === "vi"
          ? "Bạn cần đăng nhập để xem nội dung này."
          : "You need to log in to view this content."}
      </p>
      <Link to={"/login" as any} className="btn-civic btn-civic-primary">
        {locale === "vi" ? "Đăng nhập ngay" : "Log in"}
      </Link>
    </div>
  );
}
