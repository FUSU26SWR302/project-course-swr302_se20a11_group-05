import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useI18n, type Locale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { getLoginPathForRole, ROLE_LABEL, Role } from "@/lib/roles";
import {
  Menu,
  X,
  LogOut,
  Bell,
  User,
  ChevronDown,
  Check,
  ClipboardList,
  Loader2,
  Send,
  ClipboardCheck,
  AlertCircle,
  FileClock,
  CheckCircle2,
  MessageSquareWarning,
  Clock3,
  Route as RouteIcon,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import logoUrl from "@/assets/logo.png";
import { useNotifications, useMarkNotificationReadMutation, useMarkAllNotificationsReadMutation, useNotificationUnreadCount } from "@/lib/hooks";
import { toast } from "sonner";
import { authApi, type NotificationResponse } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function timeAgo(dateStr: string, locale: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return locale === "vi" ? "Vừa xong" : "Just now";
  if (m < 60) return locale === "vi" ? `${m} phút trước` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return locale === "vi" ? `${h} giờ trước` : `${h}h ago`;
  return locale === "vi" ? `${Math.floor(h / 24)} ngày trước` : `${Math.floor(h / 24)}d ago`;
}

function iconForType(type?: string) {
  switch (type) {
    case "FEEDBACK_SUBMITTED":
      return Send;
    case "FEEDBACK_ACCEPTED":
      return ClipboardCheck;
    case "FEEDBACK_REJECTED":
      return AlertCircle;
    case "FEEDBACK_ASSIGNED":
      return RouteIcon;
    case "FEEDBACK_IN_PROGRESS":
      return FileClock;
    case "FEEDBACK_COMPLETED":
    case "FEEDBACK_CLOSED":
      return CheckCircle2;
    case "NEED_MORE_INFO":
      return MessageSquareWarning;
    default:
      return Clock3;
  }
}

const LANGUAGE_OPTIONS: Array<{
  code: Locale;
  shortLabel: string;
  nativeLabel: string;
  helperLabel: string;
}> = [
  { code: "vi", shortLabel: "VI", nativeLabel: "Tiếng Việt", helperLabel: "Vietnamese" },
  { code: "en", shortLabel: "EN", nativeLabel: "English", helperLabel: "English" },
];

export function Header() {
  const { locale, setLocale, t } = useI18n();
  const { user, logout, hasRole } = useAuth();
  const isWardStaff = user?.role === Role.WARD_STAFF;
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false); // Mobile hamburger menu
  const [langOpen, setLangOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const activeLanguage =
    LANGUAGE_OPTIONS.find((language) => language.code === locale) ?? LANGUAGE_OPTIONS[0];

  // Notifications logic
  const {
    data: notifications = [],
    isLoading: notifLoading,
    isError: notifError,
    refetch: notifRefetch,
  } = useNotifications();
  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();

  const { data: unreadCountData } = useNotificationUnreadCount(!!user);
  const unreadCount = unreadCountData ?? notifications.filter((n) => !n.isRead).length;

  // Debug log in dev mode
  useEffect(() => {
    if (import.meta.env.DEV && notifications.length > 0) {
      console.table(
        notifications.map((n) => ({
          id: n.id,
          title: n.title,
          isRead: n.isRead,
          createdAt: n.createdAt,
        }))
      );
    }
  }, [notifications]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Escape key listener
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setNotifOpen(false);
        setUserOpen(false);
        setLangOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleNotif = () => {
    setNotifOpen(!notifOpen);
    setUserOpen(false);
    setLangOpen(false);
    setOpen(false);
  };

  const toggleUser = () => {
    setUserOpen(!userOpen);
    setNotifOpen(false);
    setLangOpen(false);
    setOpen(false);
  };

  const toggleLang = () => {
    setLangOpen(!langOpen);
    setNotifOpen(false);
    setUserOpen(false);
    setOpen(false);
  };

  // Mark all unread notifications in dropdown as read
  const handleMarkAllRead = async () => {
    try {
      await markAllRead.mutateAsync();
      toast.success(
        locale === "vi" ? "Đã đánh dấu đọc tất cả thông báo" : "All notifications marked as read",
      );
    } catch (err) {
      toast.error(locale === "vi" ? "Thao tác thất bại" : "Action failed");
    }
  };

  const handleNotifClick = async (item: NotificationResponse) => {
    const feedbackId = item.feedbackId ?? item.referenceId;
    setNotifOpen(false);
    try {
      if (!item.isRead) {
        await markRead.mutateAsync(item.id);
      }
      if (feedbackId) {
        await navigate({ to: "/my-reports/$id", params: { id: String(feedbackId) } });
      } else {
        await navigate({ to: "/notifications" });
      }
    } catch (err) {
      // noop
    }
  };

  const handleLogout = async () => {
    const loginPath = getLoginPathForRole(user?.role);
    try {
      await authApi.logout().catch(() => {});
    } catch (err) {
      // noop
    }
    logout();
    queryClient.clear();
    void navigate({ to: loginPath });
  };

  // Simplified core navigation items
  const publicMenuItems: Array<{ to: string; hash?: string; label: string }> = [
    { to: "/", label: locale === "vi" ? "Trang chủ" : "Home" },
    { to: "/tin-tuc", label: locale === "vi" ? "Tin tức" : "News" },
    { to: "/feedback-search", label: locale === "vi" ? "Tra cứu" : "Search" },
    { to: "/campaigns", label: locale === "vi" ? "Chiến dịch" : "Campaigns" },
    { to: "/", hash: "huong-dan", label: locale === "vi" ? "Hướng dẫn" : "Guides" },
    ...(!isWardStaff ? [{ to: "/", hash: "lien-he", label: locale === "vi" ? "Liên hệ" : "Contact" }] : []),
  ];
  const menuItems = isWardStaff
    ? publicMenuItems.filter((item) => item.to !== "/" || item.hash === "lien-he")
    : publicMenuItems;

  const staffItemsAll = [
    { to: "/ward", label: t("nav.ward"), roles: [Role.WARD_STAFF, Role.SUPER_ADMIN] as const },
    { to: "/police", label: t("nav.police"), roles: [Role.POLICE, Role.SUPER_ADMIN] as const },
    { to: "/city-admin", label: t("nav.cityAdmin"), roles: [Role.SUPER_ADMIN] as const },
  ] as const;
  const staffItems = staffItemsAll.filter((i) => hasRole(...i.roles));

  // Nếu là SUPER_ADMIN, không hiện menu public — chỉ hiện nút vào dashboard
  const isSuperAdmin = user?.role === Role.SUPER_ADMIN;

  // Determine active item based on pathname and label
  const isItemActive = (item: (typeof menuItems)[number]) => {
    if (typeof window === "undefined") {
      if (item.label === "Trang chủ" || item.label === "Home") return path === "/";
      return false;
    }
    const hash = window.location.hash;
    if (item.label === "Trang chủ" || item.label === "Home") {
      return path === "/" && hash !== "#huong-dan" && hash !== "#tin-tuc" && hash !== "#lien-he";
    }
    if (item.label === "Tin tức" || item.label === "News") {
      return path === "/tin-tuc";
    }
    if (item.label === "Tra cứu" || item.label === "Search") {
      return path === "/feedback-search";
    }
    if (item.label === "Chiến dịch" || item.label === "Campaigns") {
      return path.startsWith("/campaigns");
    }
    if (item.label === "Hướng dẫn" || item.label === "Guides") {
      return path === "/" && hash === "#huong-dan";
    }
    if (item.label === "Liên hệ" || item.label === "Contact") {
      return path === "/" && hash === "#lien-he";
    }
    return false;
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E4EAF2] shadow-sm">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-[76px] flex items-center justify-between">
        {/* Left: Brand logo & text */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <img src={logoUrl} alt="Đà Nẵng Kết Nối" className="h-9 w-auto object-contain md:h-10" />
          <div className="flex flex-col leading-none">
            <span className="text-sm md:text-base font-extrabold tracking-tight text-[#0B4FC4] uppercase font-sans">
              {t("header.brand")}
            </span>
            <span className="text-[8px] md:text-[9px] text-[#667085] font-bold uppercase tracking-wider mt-0.5 font-sans hidden sm:block">
              {t("header.brandSub")}
            </span>
          </div>
        </Link>

        {/* Center: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 h-full" aria-label="Main">
          <ul className="flex items-center gap-5 xl:gap-7 h-full">
            {/* Nếu là SUPER_ADMIN: chỉ hiện nút vào dashboard, ẩn toàn bộ menu public */}
            {isSuperAdmin ? (
              <li className="h-full flex items-center">
                <Link
                  to="/city-admin"
                  className="px-4 py-2 bg-[#0B4FC4] text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-sm font-sans flex items-center gap-2"
                >
                  Bảng điều hành IOC
                </Link>
              </li>
            ) : (
              <>
                {menuItems.map((item, index) => {
                  const active = isItemActive(item);
                  return (
                    <li key={index} className="h-full flex items-center">
                      <Link
                        to={item.to}
                        hash={item.hash}
                        className={`relative py-2 text-sm font-semibold transition-all font-sans ${
                          active
                            ? "text-[#0B4FC4] border-b-2 border-[#0B4FC4] pt-2"
                            : "text-[#123E8A] hover:text-[#0B4FC4]"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}

                {/* Staff access links nếu là WARD_STAFF hoặc POLICE */}
                {staffItems.map((item, index) => (
                  <li key={`staff-${index}`} className="h-full flex items-center">
                    <Link
                      to={item.to}
                      className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded text-xs font-bold border border-amber-200 hover:bg-amber-100 transition font-sans"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </>
            )}
          </ul>
        </nav>

        {/* Right: Controls & Account + Mobile Menu Trigger */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6">
          {/* Language Selector */}
          {!isWardStaff && (
            <div className="relative hidden md:block" ref={langRef}>
            <button
              onClick={toggleLang}
              className="group flex min-h-[40px] items-center gap-2 rounded-full border border-transparent px-2.5 text-sm font-semibold text-[#123E8A] transition hover:border-[#E4EAF2] hover:bg-[#F5F9FF] hover:text-[#0B4FC4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4FC4]/20 cursor-pointer"
              aria-label="Select Language"
              aria-haspopup="menu"
              aria-expanded={langOpen}
            >
              <span className="grid h-6 w-8 place-items-center rounded-md bg-[#EEF4FF] text-[11px] font-extrabold tracking-wide text-[#0B4FC4] font-sans">
                {activeLanguage.shortLabel}
              </span>
              <span className="hidden xl:inline font-sans">{activeLanguage.nativeLabel}</span>
              <ChevronDown
                size={14}
                className={`text-[#667085] transition-transform group-hover:text-[#0B4FC4] ${
                  langOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {langOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-44 rounded-xl border border-[#E4EAF2] bg-white p-1.5 shadow-[0_16px_40px_rgba(16,24,40,0.12)] z-50 animate-fade-in"
              >
                {LANGUAGE_OPTIONS.map((language) => {
                  const active = language.code === locale;
                  return (
                    <button
                      key={language.code}
                      type="button"
                      role="menuitem"
                      aria-current={active ? "true" : undefined}
                      onClick={() => {
                        setLocale(language.code);
                        setLangOpen(false);
                      }}
                      className={`w-full rounded-lg px-2.5 py-2.5 text-left transition flex items-center gap-2.5 font-sans cursor-pointer ${
                        active ? "bg-[#F5F9FF] text-[#0B4FC4]" : "text-[#123E8A] hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`grid h-7 w-8 place-items-center rounded-md text-[11px] font-extrabold tracking-wide ${
                          active ? "bg-white text-[#0B4FC4]" : "bg-slate-100 text-[#123E8A]"
                        }`}
                      >
                        {language.shortLabel}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-bold leading-5">
                          {language.nativeLabel}
                        </span>
                        <span className="block text-[10px] font-semibold leading-4 text-[#667085]">
                          {language.helperLabel}
                        </span>
                      </span>
                      <Check size={14} className={active ? "text-[#0B4FC4]" : "text-transparent"} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          )}

          {/* Notification bell & dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={toggleNotif}
              className={`relative p-2 text-[#123E8A] hover:text-[#0B4FC4] transition rounded-full hover:bg-slate-50 min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer`}
              aria-label="Mở danh sách thông báo"
              aria-expanded={notifOpen}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white font-sans">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-[300px] sm:w-[340px] md:w-[380px] bg-white border border-[#E4EAF2] rounded-xl shadow-lg py-3 z-50 animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between px-4 pb-2 border-b border-[#E4EAF2]">
                  <span className="text-sm font-bold text-[#123E8A] font-sans">
                    {locale === "vi" ? "Thông báo" : "Notifications"}
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-[#0B4FC4] hover:underline font-semibold font-sans cursor-pointer"
                    >
                      {locale === "vi" ? "Đánh dấu đã đọc" : "Mark as read"}
                    </button>
                  )}
                </div>

                {/* Body */}
                <div className="max-h-[300px] overflow-y-auto divide-y divide-[#E4EAF2]">
                  {notifLoading && (
                    <div className="p-4 space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3 animate-pulse">
                          <div className="w-8 h-8 bg-slate-100 rounded-full shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3.5 bg-slate-100 rounded w-1/3" />
                            <div className="h-3 bg-slate-100 rounded w-4/5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {notifError && (
                    <div className="p-4 text-center text-xs text-red-500 font-sans">
                      {locale === "vi"
                        ? "Không thể tải thông báo."
                        : "Could not load notifications."}
                      <button
                        onClick={() => void notifRefetch()}
                        className="block mx-auto mt-2 text-[#0B4FC4] hover:underline font-bold cursor-pointer"
                      >
                        {locale === "vi" ? "Thử lại" : "Retry"}
                      </button>
                    </div>
                  )}

                  {!notifLoading && !notifError && notifications.length === 0 && (
                    <div className="py-8 text-center text-xs text-[#667085] font-sans">
                      {locale === "vi"
                        ? "Bạn chưa có thông báo mới."
                        : "You have no new notifications."}
                    </div>
                  )}

                  {!notifLoading &&
                    !notifError &&
                    notifications.slice(0, 5).map((item) => {
                      const NotifIcon = iconForType(item.type);
                      return (
                        <button
                          key={item.id}
                          onClick={() => void handleNotifClick(item)}
                          className={`w-full text-left p-3.5 flex gap-3 transition-colors cursor-pointer border-l-4 ${
                            item.isRead
                              ? "bg-[#FFFFFF] hover:bg-[#F8FAFC] border-l-transparent"
                              : "bg-[#EFF6FF] hover:bg-[#DBEAFE] border-l-[#0F5BD8]"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              item.isRead ? "bg-slate-100 text-slate-500" : "bg-[#0F5BD8] text-white"
                            }`}
                          >
                            <NotifIcon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1 mb-0.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <h4 className={`text-xs text-[#123E8A] truncate font-sans ${
                                  item.isRead ? "font-semibold" : "font-bold"
                                }`}>
                                  {item.title}
                                </h4>
                                {!item.isRead && (
                                  <span className="px-1.5 py-0.2 bg-[#F59E0B] text-white text-[9px] font-bold rounded-full font-sans uppercase shrink-0">
                                    {locale === "vi" ? "Mới" : "New"}
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] text-[#667085] shrink-0 font-sans">
                                {timeAgo(item.createdAt, locale)}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#667085] line-clamp-2 leading-relaxed font-sans">
                              {item.content}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                </div>

                {/* Footer */}
                <div className="pt-2 text-center border-t border-[#E4EAF2]">
                  <Link
                    to="/notifications"
                    onClick={() => setNotifOpen(false)}
                    className="text-xs font-bold text-[#0B4FC4] hover:underline inline-block py-1 font-sans"
                  >
                    {locale === "vi" ? "Xem tất cả thông báo" : "See all notifications"}
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Authentication Area & Dropdown */}
          {user ? (
            <div className="relative" ref={userRef}>
              <button
                onClick={toggleUser}
                className="flex items-center gap-2 border-l border-[#E4EAF2] pl-2 sm:pl-3 md:pl-4 lg:pl-6 focus:outline-none group min-h-[40px] text-left cursor-pointer"
                aria-expanded={userOpen}
                aria-haspopup="true"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[#0B4FC4] border border-[#E4EAF2] group-hover:bg-[#F5F9FF] transition shrink-0">
                  <User size={16} />
                </div>
                <div className="text-right leading-tight hidden md:block">
                  <div className="text-sm font-bold text-[#123E8A] font-sans group-hover:text-[#0B4FC4] transition flex items-center gap-1">
                    {user.name}
                    <ChevronDown
                      size={14}
                      className="text-[#667085] group-hover:text-[#0B4FC4] transition"
                    />
                  </div>
                  <div className="text-[9px] uppercase tracking-widest text-[#667085] font-extrabold font-sans">
                    {ROLE_LABEL[user.role][locale]}
                  </div>
                </div>
              </button>

              {/* User Dropdown Menu */}
              {userOpen && (
                <div className="absolute right-0 mt-2 w-[240px] bg-white border border-[#E4EAF2] rounded-xl shadow-lg py-2 z-50 animate-fade-in">
                  {/* User info summary */}
                  <div className="px-4 py-2 border-b border-[#E4EAF2] mb-1">
                    <div className="text-xs font-bold text-[#123E8A] font-sans truncate">
                      {user.name}
                    </div>
                    <div className="text-[9px] uppercase tracking-widest text-[#667085] font-extrabold font-sans truncate mt-0.5">
                      {ROLE_LABEL[user.role][locale]}
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setUserOpen(false)}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-[#123E8A] hover:bg-slate-50 transition flex items-center gap-2.5 font-sans"
                  >
                    <User size={14} className="text-[#667085]" />
                    {t("header.profile")}
                  </Link>

                  <Link
                    to="/feedback-search"
                    onClick={() => setUserOpen(false)}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-[#123E8A] hover:bg-slate-50 transition flex items-center gap-2.5 font-sans"
                  >
                    <ClipboardList size={14} className="text-[#667085]" />
                    {t("header.myReports")}
                  </Link>

                  <Link
                    to="/notifications"
                    onClick={() => setUserOpen(false)}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-[#123E8A] hover:bg-slate-50 transition flex items-center gap-2.5 font-sans"
                  >
                    <Bell size={14} className="text-[#667085]" />
                    {t("header.myNotifications")}
                  </Link>

                  <div className="border-t border-[#E4EAF2] my-1" />

                  <button
                    onClick={() => {
                      setLogoutConfirmOpen(true);
                      setUserOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50/50 transition flex items-center gap-2.5 font-sans cursor-pointer"
                  >
                    <LogOut size={14} />
                    {t("header.logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="px-3 py-1.5 md:px-4 md:py-2 bg-[#0B4FC4] text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 shadow-sm font-sans shrink-0"
            >
              <User size={16} />
              <span className="hidden sm:inline">{t("header.login")}</span>
              <span className="sm:hidden">{t("header.loginShort")}</span>
            </Link>
          )}

          {/* Mobile menu trigger */}
          <button
            className="lg:hidden min-w-[40px] min-h-[40px] grid place-items-center text-[#123E8A] hover:text-[#0B4FC4] border border-[#E4EAF2] rounded-lg bg-slate-50/50 hover:bg-slate-50 transition ml-1 cursor-pointer"
            onClick={() => {
              setOpen(!open);
              setNotifOpen(false);
              setUserOpen(false);
              setLangOpen(false);
            }}
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <nav
          className="lg:hidden bg-white border-t border-[#E4EAF2] py-4 px-4 space-y-1 animate-fade-in"
          aria-label="Mobile"
        >
          {isSuperAdmin ? (
            <Link
              to="/city-admin"
              onClick={() => setOpen(false)}
              className="block min-h-[48px] px-4 py-3 rounded-md font-bold text-white bg-[#0B4FC4] text-center font-sans"
            >
              Bảng điều hành IOC
            </Link>
          ) : (
            <>
              {menuItems.map((item, index) => {
                return (
                  <Link
                    key={index}
                    to={item.to}
                    hash={item.hash}
                    onClick={() => setOpen(false)}
                    className={`block min-h-[48px] px-4 py-3 rounded-md font-semibold transition-all font-sans ${
                      isItemActive(item)
                        ? "bg-[#F5F9FF] text-[#0B4FC4]"
                        : "text-[#123E8A] hover:bg-slate-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {staffItems.length > 0 && (
                <>
                  <div className="pt-2 pb-1 px-4 text-[10px] uppercase tracking-widest text-[#667085] font-extrabold font-sans">
                    {t("header.staffArea")}
                  </div>
                  {staffItems.map((item, index) => {
                    return (
                      <Link
                        key={`mobile-staff-${index}`}
                        to={item.to}
                        onClick={() => setOpen(false)}
                        className="block min-h-[48px] px-4 py-3 rounded-md text-amber-700 bg-amber-50 border border-amber-100 font-bold font-sans"
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </>
              )}
            </>
          )}

          {/* Mobile Utility Actions */}
          <div className="pt-3 mt-3 border-t border-[#E4EAF2] flex flex-col gap-3">
            {!isWardStaff && (
              <div className="flex items-center justify-between px-4">
              <span className="text-sm font-semibold text-[#123E8A] font-sans">
                {t("header.langLabel")}
              </span>
              <div className="flex gap-2">
                {LANGUAGE_OPTIONS.map((language) => {
                  const active = language.code === locale;
                  return (
                    <button
                      key={language.code}
                      type="button"
                      onClick={() => {
                        setLocale(language.code);
                        setOpen(false);
                      }}
                      className={`min-h-9 rounded-lg border px-3 text-xs font-extrabold transition font-sans ${
                        active
                          ? "bg-[#0B4FC4] text-white border-[#0B4FC4] shadow-sm"
                          : "border-[#E4EAF2] text-[#123E8A] hover:bg-[#F5F9FF]"
                      }`}
                    >
                      {language.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>
            )}

            {user ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className="block min-h-[48px] px-4 py-3 rounded-md font-semibold text-[#123E8A] hover:bg-slate-50 font-sans"
                >
                  {t("header.profile")}
                </Link>
                <Link
                  to="/feedback-search"
                  onClick={() => setOpen(false)}
                  className="block min-h-[48px] px-4 py-3 rounded-md font-semibold text-[#123E8A] hover:bg-slate-50 font-sans"
                >
                  {t("header.myReports")}
                </Link>
                <button
                  onClick={() => {
                    setLogoutConfirmOpen(true);
                    setOpen(false);
                  }}
                  className="w-full text-left min-h-[48px] px-4 py-3 rounded-md hover:bg-red-50 text-red-600 font-semibold inline-flex items-center gap-2 transition-all font-sans cursor-pointer"
                >
                  <LogOut size={18} /> {t("header.logout")} ({user.name})
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="block min-h-[48px] px-4 py-3 rounded-lg bg-[#0B4FC4] text-white font-bold text-center font-sans"
              >
                {t("header.login")}
              </Link>
            )}
          </div>
        </nav>
      )}

      <AlertDialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-sans">
              {locale === "vi" ? "Bạn chắc chắn muốn đăng xuất?" : "Are you sure you want to log out?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="font-sans">
              {locale === "vi"
                ? "Phiên đăng nhập của bạn sẽ kết thúc. Bạn sẽ cần đăng nhập lại để thực hiện các chức năng cá nhân."
                : "Your login session will end. You will need to log in again to perform personal actions."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-sans">
              {locale === "vi" ? "Hủy" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleLogout()}
              className="bg-red-600 hover:bg-red-700 text-white font-sans font-bold"
            >
              {locale === "vi" ? "Đăng xuất" : "Log out"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
