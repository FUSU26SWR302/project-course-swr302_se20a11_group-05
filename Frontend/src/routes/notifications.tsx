import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileClock,
  Loader2,
  MessageSquareWarning,
  RefreshCw,
  Route as RouteIcon,
  Send,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { toast } from "sonner";
import { getToken, type NotificationResponse } from "@/lib/api";
import { useInfiniteNotifications, useMarkNotificationReadMutation } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/notifications")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!getToken() || !localStorage.getItem("dn_auth_user_v2")) {
      throw redirect({ to: "/login", search: { redirect: "/notifications", error: undefined } });
    }
  },
  component: NotificationsPage,
});

const PAGE_SIZE = 5;

function NotificationsPage() {
  const { locale } = useI18n();
  const navigate = useNavigate();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [openingId, setOpeningId] = useState<number | null>(null);
  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
    isError,
    error,
  } = useInfiniteNotifications(PAGE_SIZE);
  const markRead = useMarkNotificationReadMutation();

  const notifications = useMemo(
    () => data?.pages.flatMap((page) => page.content ?? []) ?? [],
    [data],
  );

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleNotificationClick = async (item: NotificationResponse) => {
    const feedbackId = item.feedbackId ?? item.referenceId;

    try {
      setOpeningId(item.id);
      if (!item.isRead) {
        await markRead.mutateAsync(item.id);
      }

      if (!feedbackId) {
        toast.error(
          locale === "vi"
            ? "Thông báo này không có phản ánh liên quan."
            : "This notification is not linked to a report.",
        );
        return;
      }

      await navigate({ to: "/my-reports/$id", params: { id: String(feedbackId) } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-10 md:py-14">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-4xl md:text-5xl text-gov-blue mb-2">
            {locale === "vi" ? "Thông báo" : "Notifications"}
          </h1>
          <p className="text-ink-soft">
            {locale === "vi"
              ? "Theo dõi cập nhật mới về phản ánh và tài khoản của bạn."
              : "Track updates for your reports and account."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn-civic btn-civic-ghost"
        >
          {isFetching && !isFetchingNextPage ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <RefreshCw size={18} />
          )}
          {locale === "vi" ? "Làm mới" : "Refresh"}
        </button>
      </div>

      {isLoading && <NotificationSkeleton />}

      {isError && (
        <div className="card-civic p-6 mb-6 border-red-100">
          <p className="text-[var(--status-danger)]">
            {error instanceof Error ? error.message : "Could not load notifications"}
          </p>
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <div className="card-civic p-10 text-center">
          <Bell className="mx-auto text-gov-blue mb-4" size={48} />
          <h2 className="text-2xl font-heading text-gov-blue mb-2">
            {locale === "vi" ? "Chưa có thông báo" : "No notifications"}
          </h2>
          <p className="text-ink-soft">
            {locale === "vi"
              ? "Khi phản ánh có cập nhật, thông báo sẽ hiển thị tại đây."
              : "Report updates will appear here."}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {notifications.map((item) => (
          <NotificationCard
            key={item.id}
            item={item}
            locale={locale}
            isOpening={openingId === item.id || (markRead.isPending && openingId === item.id)}
            onOpen={() => void handleNotificationClick(item)}
          />
        ))}
      </div>

      <div ref={loadMoreRef} className="py-6 text-center text-sm text-ink-soft">
        {isFetchingNextPage && (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="animate-spin text-gov-blue" size={18} />
            {locale === "vi" ? "Đang tải thêm thông báo..." : "Loading more notifications..."}
          </span>
        )}
        {!isLoading && notifications.length > 0 && !hasNextPage && (
          <span>
            {locale === "vi" ? "Đã hiển thị tất cả thông báo" : "All notifications are shown"}
          </span>
        )}
      </div>
    </div>
  );
}

function NotificationCard({
  item,
  locale,
  isOpening,
  onOpen,
}: {
  item: NotificationResponse;
  locale: string;
  isOpening: boolean;
  onOpen: () => void;
}) {
  const Icon = iconForType(item.type);
  const statusLabel = item.feedbackStatus ? statusText(item.feedbackStatus, locale) : null;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className={`card-civic p-5 border-l-4 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gov-blue ${
        item.isRead
          ? "!bg-white !border-slate-200 border-l-slate-200"
          : "!bg-blue-50 !border-gov-blue border-l-gov-blue ring-1 ring-gov-blue/20"
      }`}
    >
      <div className="grid grid-cols-[44px_minmax(0,1fr)_auto] gap-4 items-start">
        <div
          className={`w-11 h-11 rounded-lg grid place-items-center ${item.isRead ? "bg-slate-100 text-gov-blue" : "bg-gov-blue text-white"}`}
        >
          <Icon size={21} />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="font-bold text-lg text-ink leading-snug">{item.title}</h2>
            {!item.isRead && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gov-gold text-gov-blue-deep">
                {locale === "vi" ? "Mới" : "New"}
              </span>
            )}
          </div>
          <p className="text-ink-soft mb-3 leading-relaxed">{item.content}</p>

          {(item.feedbackTrackingCode || item.feedbackTitle || statusLabel) && (
            <div className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 mb-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                {item.feedbackTrackingCode && (
                  <span className="font-mono text-gov-blue font-semibold">
                    {item.feedbackTrackingCode}
                  </span>
                )}
                {statusLabel && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-ink-soft">
                    {statusLabel}
                  </span>
                )}
              </div>
              {item.feedbackTitle && (
                <p className="text-sm text-ink mt-1 line-clamp-2">{item.feedbackTitle}</p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3 text-xs text-ink-soft">
            <span>{typeText(item.type, locale)}</span>
            <span>{formatDateTime(item.createdAt)}</span>
          </div>
        </div>

        {isOpening && <Loader2 className="animate-spin text-gov-blue mt-2" size={18} />}
      </div>
    </article>
  );
}

function NotificationSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="card-civic p-5 animate-pulse">
          <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-4">
            <div className="w-11 h-11 rounded-lg bg-slate-200" />
            <div className="space-y-3">
              <div className="h-5 w-1/2 rounded bg-slate-200" />
              <div className="h-4 w-4/5 rounded bg-slate-100" />
              <div className="h-10 w-full rounded bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function iconForType(type?: string): ComponentType<{ size?: number; className?: string }> {
  const icons: Record<string, ComponentType<{ size?: number; className?: string }>> = {
    FEEDBACK_SUBMITTED: Send,
    FEEDBACK_ACCEPTED: ClipboardCheck,
    FEEDBACK_REJECTED: AlertCircle,
    FEEDBACK_ASSIGNED: RouteIcon,
    FEEDBACK_IN_PROGRESS: FileClock,
    FEEDBACK_COMPLETED: CheckCircle2,
    FEEDBACK_CLOSED: CheckCircle2,
    NEED_MORE_INFO: MessageSquareWarning,
  };
  return icons[type || ""] || Clock3;
}

function typeText(type: string | undefined, locale: string) {
  const labels: Record<string, string> = {
    FEEDBACK_SUBMITTED: locale === "vi" ? "Đã gửi phản ánh" : "Feedback submitted",
    FEEDBACK_ACCEPTED: locale === "vi" ? "Đã tiếp nhận" : "Feedback accepted",
    FEEDBACK_REJECTED: locale === "vi" ? "Từ chối" : "Rejected",
    FEEDBACK_ASSIGNED: locale === "vi" ? "Đã phân công" : "Assigned",
    FEEDBACK_IN_PROGRESS: locale === "vi" ? "Đang xử lý" : "In progress",
    FEEDBACK_COMPLETED: locale === "vi" ? "Hoàn thành" : "Completed",
    FEEDBACK_CLOSED: locale === "vi" ? "Đã đóng" : "Closed",
    NEED_MORE_INFO: locale === "vi" ? "Cần bổ sung thông tin" : "Need more info",
  };
  return labels[type || ""] || type || "SYSTEM";
}

function statusText(status: string, locale: string) {
  const labels: Record<string, string> = {
    PENDING: locale === "vi" ? "Đang chờ duyệt" : "Pending review",
    ASSIGNED: locale === "vi" ? "Đã phân công" : "Assigned",
    IN_PROGRESS: locale === "vi" ? "Đang xử lý" : "In progress",
    WAITING_INFO: locale === "vi" ? "Chờ bổ sung thông tin" : "Waiting for info",
    RESOLVED: locale === "vi" ? "Đã hoàn thành" : "Resolved",
    REJECTED: locale === "vi" ? "Đã từ chối" : "Rejected",
    PRE_EMPTIVE: locale === "vi" ? "Phòng ngừa" : "Pre-emptive",
  };
  return labels[status] || status;
}

function formatDateTime(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 16).replace("T", " ");
}
