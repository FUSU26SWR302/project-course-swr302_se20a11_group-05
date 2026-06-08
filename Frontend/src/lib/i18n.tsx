import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Locale = "vi" | "en";

type Dict = Record<string, { vi: string; en: string }>;

export const dict: Dict = {
  "brand.name": { vi: "Đà Nẵng Kết Nối", en: "Da Nang Listens" },
  "brand.tag": { vi: "Cổng phản ánh chính quyền thành phố", en: "Municipal Reporting Portal" },
  "nav.home": { vi: "Trang chủ", en: "Home" },
  "nav.report": { vi: "Gửi phản ánh", en: "Submit report" },
  "nav.myReports": { vi: "Báo cáo của tôi", en: "My reports" },
  "nav.assistant": { vi: "Trợ lý AI", en: "AI Assistant" },
  "nav.ward": { vi: "Cổng cán bộ phường", en: "Ward portal" },
  "nav.police": { vi: "Cổng công an", en: "Police portal" },
  "nav.cityAdmin": { vi: "Lãnh đạo thành phố", en: "City leadership" },
  "nav.login": { vi: "Đăng nhập", en: "Sign in" },
  "a11y.fontSmaller": { vi: "Cỡ chữ nhỏ hơn", en: "Smaller text" },
  "a11y.fontLarger": { vi: "Cỡ chữ lớn hơn", en: "Larger text" },
  "lang.vi": { vi: "Tiếng Việt", en: "Vietnamese" },
  "lang.en": { vi: "Tiếng Anh", en: "English" },

  "home.title": { vi: "Thành Phố Kết Nối ", en: "A City Connect" },
  "home.subtitle": {
    vi: "Gửi phản ánh về hạ tầng đô thị, môi trường, an ninh trật tự — cùng xây dựng Đà Nẵng văn minh, an toàn.",
    en: "Report urban infrastructure, environment, and safety issues — together we build a better Da Nang.",
  },
  "home.cta.report": { vi: "Gửi phản ánh ngay", en: "Submit a report" },
  "home.cta.reportHint": { vi: "Chụp ảnh hoặc quay video dưới 1 phút", en: "Take a photo or short video" },
  "home.kpi.total": { vi: "Tổng số phản ánh", en: "Total reports" },
  "home.kpi.resolved": { vi: "Đã xử lý", en: "Resolved" },
  "home.kpi.pending": { vi: "Đang chờ duyệt", en: "Awaiting review" },
  "home.kpi.avg": { vi: "Thời gian trung bình", en: "Avg response" },
  "home.recent": { vi: "Phản ánh gần đây", en: "Recent reports" },
  "home.filter.all": { vi: "Tất cả", en: "All" },
  "home.filter.env": { vi: "Môi trường", en: "Environment" },
  "home.filter.traffic": { vi: "Giao thông", en: "Traffic" },
  "home.filter.infra": { vi: "Hạ tầng", en: "Infrastructure" },
  "home.map.title": { vi: "Bản đồ phản ánh trực tuyến", en: "Live reports map" },
  "home.map.cta": { vi: "Xem bản đồ toàn thành phố", en: "View full city map" },
  "home.hotline.title": { vi: "Tổng đài 1022", en: "Hotline 1022" },
  "home.hotline.body": {
    vi: "Mọi thắc mắc cần hỗ trợ trực tiếp, vui lòng gọi đường dây nóng của thành phố.",
    en: "For direct help, please call the city's 24/7 hotline.",
  },

  "status.pending": { vi: "Đang chờ duyệt", en: "Pending" },
  "status.inProgress": { vi: "Đang xử lý", en: "In progress" },
  "status.resolved": { vi: "Đã hoàn thành", en: "Resolved" },
  "status.urgent": { vi: "Khẩn cấp", en: "Urgent" },

  "report.title": { vi: "Gửi phản ánh mới", en: "New report" },
  "report.step": { vi: "Bước", en: "Step" },
  "report.step1": { vi: "Hình ảnh & video", en: "Photo & video" },
  "report.step2": { vi: "Vị trí GPS", en: "Location" },
  "report.step3": { vi: "Mô tả bằng giọng nói", en: "Voice description" },
  "report.takePhoto": { vi: "Chụp ảnh", en: "Take photo" },
  "report.recordVideo": { vi: "Quay video (≥ 10s)", en: "Record video (≥ 10s)" },
  "report.locationConfirm": {
    vi: "Bạn có đang ở: 123 Nguyễn Văn Linh, Đà Nẵng?",
    en: "Are you at: 123 Nguyen Van Linh, Da Nang?",
  },
  "report.useLocation": { vi: "Đúng, dùng vị trí này", en: "Yes, use this location" },
  "report.changeLocation": { vi: "Chọn vị trí khác", en: "Pick another location" },
  "report.tapToSpeak": { vi: "Nhấn để nói", en: "Tap to speak" },
  "report.recording": { vi: "Đang ghi âm…", en: "Recording…" },
  "report.next": { vi: "Tiếp tục", en: "Continue" },
  "report.back": { vi: "Quay lại", en: "Back" },
  "report.submit": { vi: "Gửi phản ánh", en: "Submit report" },
  "report.submitted": { vi: "Đã gửi phản ánh thành công!", en: "Report submitted successfully!" },

  "my.title": { vi: "Báo cáo của tôi", en: "My reports" },
  "my.subtitle": { vi: "Theo dõi tiến độ tất cả phản ánh bạn đã gửi.", en: "Track every report you've submitted." },
  "my.timeline.submitted": { vi: "Đã tiếp nhận", en: "Submitted" },
  "my.timeline.inProgress": { vi: "Đang xử lý", en: "In progress" },
  "my.timeline.resolved": { vi: "Đã hoàn thành", en: "Resolved" },

  "assistant.title": { vi: "Trợ lý AI Khẩn cấp", en: "Emergency AI Assistant" },
  "assistant.subtitle": {
    vi: "Hỏi về hỗ trợ khẩn cấp, quy trình hành chính, hoặc đường dây nóng.",
    en: "Ask about emergencies, civic procedures, or hotlines.",
  },
  "assistant.placeholder": { vi: "Ví dụ: Nhà tôi ngập, tôi cần đi đâu?", en: "e.g. My house is flooded, where can I go?" },
  "assistant.send": { vi: "Gửi", en: "Send" },

  "ward.title": { vi: "Bảng điều khiển — UBND Phường Hải Châu I", en: "Dashboard — Hai Chau I Ward" },
  "ward.incoming": { vi: "Phản ánh đến", en: "Incoming reports" },
  "ward.accept": { vi: "Tiếp nhận", en: "Accept" },
  "ward.reject": { vi: "Từ chối", en: "Reject" },
  "ward.resolve": { vi: "Đánh dấu hoàn thành", en: "Mark resolved" },

  "police.title": { vi: "Cổng Công an & CSGT", en: "Police & Traffic Portal" },
  "police.licensePlate": { vi: "Biển số nhận diện (OCR)", en: "Detected license plate (OCR)" },
  "police.broadcast": { vi: "Phát cảnh báo khu vực", en: "Broadcast area alert" },

  "city.title": { vi: "Bảng điều hành Lãnh đạo Thành phố", en: "City Leadership Dashboard" },
  "city.kpi.wardPerf": { vi: "Hiệu suất theo phường", en: "Performance by ward" },
  "city.export": { vi: "Xuất báo cáo CSV", en: "Export CSV report" },

  "login.title": { vi: "Đăng nhập", en: "Sign in" },
  "login.phone": { vi: "Số điện thoại", en: "Phone number" },
  "login.password": { vi: "Mật khẩu", en: "Password" },
  "login.submit": { vi: "Đăng nhập", en: "Sign in" },
  "login.register": { vi: "Tạo tài khoản mới", en: "Create an account" },

  "footer.org": {
    vi: "Cơ quan chủ quản: Ủy ban Nhân dân Thành phố Đà Nẵng. Vận hành bởi Trung tâm IOC.",
    en: "Operated by Da Nang City People's Committee — IOC.",
  },
};

interface I18nCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: keyof typeof dict) => string;
}
const I18nContext = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("vi");
  useEffect(() => {
    const saved = typeof window !== "undefined" ? (localStorage.getItem("locale") as Locale | null) : null;
    if (saved === "vi" || saved === "en") setLocale(saved);
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("locale", locale);
    if (typeof document !== "undefined") document.documentElement.lang = locale;
  }, [locale]);
  const t = (key: keyof typeof dict) => dict[key]?.[locale] ?? String(key);
  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

/* ---------- Font scale (A+ / A-) ---------- */
interface FontScaleCtx {
  scale: number;
  inc: () => void;
  dec: () => void;
}
const FontScaleContext = createContext<FontScaleCtx | null>(null);

export function FontScaleProvider({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const saved = typeof window !== "undefined" ? Number(localStorage.getItem("fontScale") || "1") : 1;
    if (!Number.isNaN(saved) && saved >= 0.85 && saved <= 1.45) setScale(saved);
  }, []);
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("--font-scale", String(scale));
    }
    if (typeof window !== "undefined") localStorage.setItem("fontScale", String(scale));
  }, [scale]);
  const inc = () => setScale((s) => Math.min(1.45, +(s + 0.1).toFixed(2)));
  const dec = () => setScale((s) => Math.max(0.85, +(s - 0.1).toFixed(2)));
  return <FontScaleContext.Provider value={{ scale, inc, dec }}>{children}</FontScaleContext.Provider>;
}
export function useFontScale() {
  const ctx = useContext(FontScaleContext);
  if (!ctx) throw new Error("useFontScale must be used inside FontScaleProvider");
  return ctx;
}
