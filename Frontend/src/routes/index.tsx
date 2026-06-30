import { clientOnly } from "@/components/ClientOnly";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { usePublicFeedbacks, usePublicFeedbackStatistics, useRecentPublicFeedback } from "@/lib/hooks";
import { OFFICIAL_CATEGORIES } from "@/lib/categoryConfig";
import { reports as mockReports, kpis } from "@/lib/mock-data";
import { StatusBadge } from "@/components/site/StatusBadge";
import { mapStatus } from "@/lib/status";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  Camera,
  MapPin,
  User,
  RefreshCw,
  Loader2,
  PlayCircle,
  Search,
  Car,
  Leaf,
  Cone,
  Shield,
  Store,
  Grid,
  PenLine,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lock,
  ShieldCheck,
  Clock,
  HeartHandshake,
} from "lucide-react";
import { lazy, Suspense, useState, useEffect } from "react";
import { staticNews, staticFaqs } from "@/lib/static-content";

const CivicMap = clientOnly(() =>
  import("@/components/site/CivicMap").then((m) => ({ default: m.CivicMap })),
);

// ── Da Nang city slideshow images (Unsplash)
const DA_NANG_SLIDES = [
  {
    url: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=900&h=700&fit=crop&q=80",
    caption: { vi: "Cầu Rồng — Biểu tượng của Đà Nẵng", en: "Dragon Bridge — Symbol of Da Nang" },
  },
  {
    url: "https://images.unsplash.com/photo-1563640847-d7f0040c9cc2?w=900&h=700&fit=crop&q=80",
    caption: { vi: "Cầu Vàng — Bà Nà Hills huyền bí", en: "Golden Bridge — Mystical Ba Na Hills" },
  },
  {
    url: "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=900&h=700&fit=crop&q=80",
    caption: {
      vi: "Biển Mỹ Khê — Bãi biển đẹp nhất châu Á",
      en: "My Khe Beach — Asia's Most Beautiful Beach",
    },
  },
  {
    url: "https://images.unsplash.com/photo-1528127269322-539801943592?w=900&h=700&fit=crop&q=80",
    caption: { vi: "Vịnh Đà Nẵng — Thành phố đáng sống", en: "Da Nang Bay — Most Livable City" },
  },
  {
    url: "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=900&h=700&fit=crop&q=80",
    caption: {
      vi: "Sông Hàn về đêm — Trái tim Đà Nẵng",
      en: "Han River at Night — Heart of Da Nang",
    },
  },
  {
    url: "https://images.unsplash.com/photo-1602934585418-f3a27d8924a5?w=900&h=700&fit=crop&q=80",
    caption: {
      vi: "Đà Nẵng — Thành phố văn minh, hiện đại",
      en: "Da Nang — Modern and Civilized City",
    },
  },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Đà Nẵng Kết Nối — Cổng phản ánh thành phố" },
      {
        name: "description",
        content: "Gửi phản ánh hạ tầng, môi trường, an ninh — cùng xây dựng Đà Nẵng văn minh.",
      },
      { property: "og:title", content: "Đà Nẵng Kết Nối" },
      {
        property: "og:description",
        content: "Da Nang civic reporting platform — submit and track municipal reports.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { t, locale } = useI18n();
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "1m" | "3m" | "1y">("24h");

  const getFromDateString = (range: "24h" | "7d" | "1m" | "3m" | "1y") => {
    const now = new Date();
    let diffDays = 0;
    switch (range) {
      case "24h": diffDays = 1; break;
      case "7d": diffDays = 7; break;
      case "1m": diffDays = 30; break;
      case "3m": diffDays = 90; break;
      case "1y": diffDays = 365; break;
    }
    const fromDate = new Date(now.getTime() - diffDays * 24 * 60 * 60 * 1000);
    const year = fromDate.getFullYear();
    const month = String(fromDate.getMonth() + 1).padStart(2, '0');
    const day = String(fromDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const { data: feedbacksPage, isLoading: listLoading, refetch: refetchList } = usePublicFeedbacks(0, 100);
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = usePublicFeedbackStatistics({
    fromDate: getFromDateString(timeRange),
  });
  const { data: recentPage, isLoading: recentLoading, refetch: refetchRecent } = useRecentPublicFeedback(5);

  const refetch = () => {
    refetchList();
    refetchStats();
    refetchRecent();
  };

  const isBackendConnected = feedbacksPage !== undefined || statsData !== undefined || recentPage !== undefined;
  const hasApiData = isBackendConnected;
  const isLoading = listLoading || statsLoading || recentLoading;

  const apiFeedbacks = feedbacksPage?.content ?? [];

  // ── Slideshow state (kept to preserve existing hooks/state)
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % DA_NANG_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

  useEffect(() => {
    if (activeSlide && isPaused) {
      // noop
    }
  }, [activeSlide, isPaused]);

  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate({ to: "/feedback-search" as any, search: { q: searchQuery.trim() } as any });
    }
  };

  const handleChipClick = (chip: string) => {
    setSearchQuery(chip);
    navigate({ to: "/feedback-search" as any, search: { q: chip } as any });
  };

  const popularChips = locale === "vi"
    ? ["Giao thông", "Môi trường", "An ninh trật tự", "Hạ tầng", "Trật tự đô thị"]
    : ["Traffic", "Environment", "Public safety", "Infrastructure", "Urban order"];

  const handleCategoryClick = (categoryCode: string) => {
    navigate({ to: "/feedback-search" as any, search: { category: categoryCode } as any });
  };

  const handleKpiClick = (status?: "PROCESSING" | "PROCESSED") => {
    navigate({
      to: "/feedback-search" as any,
      search: {
        status: status || undefined,
        range: timeRange || undefined,
      } as any,
    });
  };

  const isWithinTimeRange = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    if (diffTime < 0) return true; // timezone drift safety

    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;

    switch (timeRange) {
      case "24h":
        return diffTime <= oneDay;
      case "7d":
        return diffTime <= 7 * oneDay;
      case "1m":
        return diffTime <= 30 * oneDay;
      case "3m":
        return diffTime <= 90 * oneDay;
      case "1y":
        return diffTime <= 365 * oneDay;
      default:
        return true;
    }
  };

  const filteredFeedbacks = apiFeedbacks.filter((f) => isWithinTimeRange(f.createdAt));

  const mockStatsByRange = {
    "24h": { total: 28, resolved: 12, pending: 14, overdue: 0 },
    "7d": { total: 184, resolved: 142, pending: 38, overdue: 4 },
    "1m": { total: 512, resolved: 412, pending: 88, overdue: 12 },
    "3m": { total: 1248, resolved: 986, pending: 212, overdue: 50 },
    "1y": { total: 4850, resolved: 4120, pending: 610, overdue: 120 },
  };

  const totalCount = hasApiData
    ? (statsData ? statsData.total : filteredFeedbacks.length)
    : mockStatsByRange[timeRange].total;

  const resolvedCount = hasApiData
    ? (statsData ? statsData.resolved : filteredFeedbacks.filter((f) => f.status === "RESOLVED").length)
    : mockStatsByRange[timeRange].resolved;

  const pendingCount = hasApiData
    ? (statsData ? statsData.pending : filteredFeedbacks.filter(
        (f) =>
          f.status === "PENDING" ||
          f.status === "ASSIGNED" ||
          f.status === "IN_PROGRESS" ||
          f.status === "WAITING_INFO" ||
          f.status === "PRE_EMPTIVE",
      ).length)
    : mockStatsByRange[timeRange].pending;

  const resolvedPct = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

  const getMockChartData = (
    range: "24h" | "7d" | "1m" | "3m" | "1y",
    buckets: { label: string }[],
  ) => {
    return buckets.map((b, index) => {
      let total = 0;
      let processing = 0;
      let processed = 0;

      if (range === "24h") {
        const hour = parseInt(b.label.split(":")[0]);
        const isPeak = (hour >= 8 && hour <= 11) || (hour >= 14 && hour <= 17);
        const base = isPeak ? 3 : 0;
        const seed = (hour * 7) % 5;
        total = base + seed;
        processing = Math.max(0, Math.floor(total * 0.4));
        processed = total - processing;
      } else if (range === "7d") {
        const isWeekend = b.label === "Sat" || b.label === "Sun" || b.label === "T7" || b.label === "CN";
        const base = isWeekend ? 15 : 28;
        const seed = (index * 13) % 8;
        total = base + seed;
        processing = Math.floor(total * 0.3);
        processed = total - processing;
      } else if (range === "1m") {
        const base = 95;
        const seed = (index * 17) % 15;
        total = base + seed;
        processing = Math.floor(total * 0.2);
        processed = total - processing;
      } else if (range === "3m") {
        const base = 390;
        const seed = (index * 23) % 30;
        total = base + seed;
        processing = Math.floor(total * 0.18);
        processed = total - processing;
      } else if (range === "1y") {
        const base = 370;
        const seed = (index * 31) % 80;
        total = base + seed;
        processing = Math.floor(total * 0.15);
        processed = total - processing;
      }

      return {
        name: b.label,
        total,
        processing,
        processed,
      };
    });
  };

  const getGroupedChartData = () => {
    const now = new Date();
    const buckets: {
      label: string;
      start: Date;
      end: Date;
    }[] = [];

    const monthsVi = ["Thg 1", "Thg 2", "Thg 3", "Thg 4", "Thg 5", "Thg 6", "Thg 7", "Thg 8", "Thg 9", "Thg 10", "Thg 11", "Thg 12"];
    const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    if (timeRange === "24h") {
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 60 * 60 * 1000);
        const hourStr = String(d.getHours()).padStart(2, "0") + ":00";
        buckets.push({
          label: hourStr,
          start: new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), 0, 0, 0),
          end: new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), 59, 59, 999),
        });
      }
    } else if (timeRange === "7d") {
      const daysVi = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
      const daysEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayLabel = locale === "vi" ? daysVi[d.getDay()] : daysEn[d.getDay()];
        buckets.push({
          label: dayLabel,
          start: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0),
          end: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999),
        });
      }
    } else if (timeRange === "1m") {
      for (let i = 4; i >= 0; i--) {
        const startDayOffset = (i + 1) * 6;
        const endDayOffset = i * 6;
        const start = new Date(now.getTime() - startDayOffset * 24 * 60 * 60 * 1000);
        const end = new Date(now.getTime() - endDayOffset * 24 * 60 * 60 * 1000);
        buckets.push({
          label: locale === "vi" ? `Tuần ${5 - i}` : `Week ${5 - i}`,
          start: new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0),
          end: new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999),
        });
      }
    } else if (timeRange === "3m") {
      for (let i = 2; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = locale === "vi" ? monthsVi[d.getMonth()] : monthsEn[d.getMonth()];
        const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
        buckets.push({ label, start, end });
      }
    } else if (timeRange === "1y") {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = locale === "vi" ? monthsVi[d.getMonth()] : monthsEn[d.getMonth()];
        const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
        buckets.push({ label, start, end });
      }
    }

    if (!hasApiData) {
      return getMockChartData(timeRange, buckets);
    }

    return buckets.map((b) => {
      let total = 0;
      let processing = 0;
      let processed = 0;

      const startMs = b.start.getTime();
      const endMs = b.end.getTime();

      apiFeedbacks.forEach((f) => {
        const createdMs = new Date(f.createdAt).getTime();

        if (createdMs >= startMs && createdMs <= endMs) {
          total++;
          const isProcessing = f.status !== "RESOLVED" && f.status !== "REJECTED";
          if (isProcessing) {
            processing++;
          }
        }

        const resolvedTimeStr = f.resolvedAt || (f.status === "RESOLVED" ? f.updatedAt : null);
        if (resolvedTimeStr) {
          const resolvedMs = new Date(resolvedTimeStr).getTime();
          if (resolvedMs >= startMs && resolvedMs <= endMs) {
            processed++;
          }
        }
      });

      return {
        name: b.label,
        total,
        processing,
        processed,
      };
    });
  };

  const getMockReportTime = (r: typeof mockReports[0]) => {
    if (r.createdAt.includes("phút trước") || r.createdAt.includes("mins ago")) {
      return new Date().getTime() - 2 * 60 * 1000;
    }
    if (r.createdAt.includes("Hôm nay") || r.createdAt.includes("Today")) {
      return new Date().getTime() - 10 * 60 * 1000;
    }
    if (r.createdAt.includes("Hôm qua") || r.createdAt.includes("Yesterday")) {
      return new Date().getTime() - 24 * 60 * 60 * 1000;
    }
    const parts = r.createdAt.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (parts) {
      const d = new Date(parseInt(parts[3]), parseInt(parts[2]) - 1, parseInt(parts[1]));
      return d.getTime();
    }
    return 0;
  };

  const recentMockReports = [...mockReports]
    .sort((a, b) => getMockReportTime(b) - getMockReportTime(a))
    .slice(0, 5);

  const recentApiFeedbacks = [...(recentPage?.content ?? [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getCategoryPlaceholder = (category: string | null | undefined) => {
    const cat = (category || "").toUpperCase();
    if (cat.includes("TRAFFIC") || cat.includes("GIAO_THONG") || cat.includes("GIAO THÔNG")) {
      return "https://images.unsplash.com/photo-1541416410408-01314df08803?auto=format&fit=crop&w=150&h=150&q=80";
    }
    if (cat.includes("ENVIRONMENT") || cat.includes("MOI_TRUONG") || cat.includes("MÔI TRƯỜNG") || cat.includes("TRASH") || cat.includes("RÁC")) {
      return "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=150&h=150&q=80";
    }
    if (cat.includes("URBAN") || cat.includes("HA_TANG") || cat.includes("HẠ TẦNG") || cat.includes("INFRASTRUCTURE")) {
      return "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=150&h=150&q=80";
    }
    if (cat.includes("SECURITY") || cat.includes("AN_NINH") || cat.includes("AN NINH")) {
      return "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=150&h=150&q=80";
    }
    if (cat.includes("CONSTRUCTION") || cat.includes("XAY_DUNG") || cat.includes("XÂY DỰNG")) {
      return "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=150&h=150&q=80";
    }
    if (cat.includes("FIRE") || cat.includes("PHONG_CHAY") || cat.includes("PCCC")) {
      return "https://images.unsplash.com/photo-1508873696983-2df519f0397e?auto=format&fit=crop&w=150&h=150&q=80";
    }
    return "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=150&h=150&q=80";
  };

  const getFeedbackThumbnail = (fb: any) => {
    if (fb.attachments && fb.attachments.length > 0) {
      const imgAtt = fb.attachments.find((att: any) => att.fileType === "IMAGE" || (att.fileType && att.fileType.toUpperCase().startsWith("IMAGE")));
      if (imgAtt && imgAtt.fileUrl) {
        return imgAtt.fileUrl;
      }
      const videoAtt = fb.attachments.find((att: any) => att.fileType === "VIDEO" || (att.fileType && att.fileType.toUpperCase().startsWith("VIDEO")));
      if (videoAtt) {
        return getCategoryPlaceholder(fb.categoryCode || fb.category);
      }
    }

    if (fb.mediaUrls && fb.mediaUrls.length > 0) {
      return fb.mediaUrls[0];
    }

    return getCategoryPlaceholder(fb.categoryCode || fb.category);
  };

  const isOnlyVideoFeedback = (fb: any) => {
    if (fb.attachments && fb.attachments.length > 0) {
      const hasImage = fb.attachments.some((att: any) => att.fileType === "IMAGE" || (att.fileType && att.fileType.toUpperCase().startsWith("IMAGE")));
      const hasVideo = fb.attachments.some((att: any) => att.fileType === "VIDEO" || (att.fileType && att.fileType.toUpperCase().startsWith("VIDEO")));
      return hasVideo && !hasImage;
    }
    return false;
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "RESOLVED":
        return "bg-[#E8F5E9] text-[#16A34A]";
      case "IN_PROGRESS":
      case "ASSIGNED":
        return "bg-[#FFF8E1] text-[#F97316]";
      case "REJECTED":
        return "bg-[#FFEBEE] text-[#DC2626]";
      case "PENDING":
      default:
        return "bg-[#F5F9FF] text-[#0B4FC4]";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "RESOLVED":
        return t("status.resolvedLabel");
      case "ASSIGNED":
      case "IN_PROGRESS":
        return t("status.inProgressLabel");
      case "REJECTED":
        return t("status.rejected");
      case "PENDING":
      default:
        return t("status.pendingReview");
    }
  };

  const getStatusStylesMock = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-[#E8F5E9] text-[#16A34A]";
      case "inProgress":
        return "bg-[#FFF8E1] text-[#F97316]";
      case "urgent":
        return "bg-[#FFEBEE] text-[#DC2626]";
      case "pending":
      default:
        return "bg-[#F5F9FF] text-[#0B4FC4]";
    }
  };

  const getStatusLabelMock = (status: string) => {
    switch (status) {
      case "resolved":
        return t("status.resolvedLabel");
      case "inProgress":
        return t("status.inProgressLabel");
      case "urgent":
        return t("status.urgent");
      case "pending":
      default:
        return t("status.pendingReview");
    }
  };

  return (
    <div className="w-full flex flex-col">
      {/* Hero section */}
      <section
        className="relative w-full min-h-[340px] md:min-h-[380px] lg:min-h-[340px] xl:min-h-[340px] flex items-center bg-cover bg-center py-8 md:py-10 lg:py-0 border-b border-[#E4EAF2]"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.92) 40%, rgba(255,255,255,0.7) 60%, rgba(255,255,255,0.15) 100%), url('https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1600&h=600&q=80')`,
        }}
      >
        <div className="max-w-[1440px] mx-auto w-full px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-center relative z-10">
          {/* Left Column (Content) */}
          <div className="lg:col-span-7 flex flex-col justify-center animate-fade-in pr-0 lg:pr-10">
            <h1 className="font-heading text-[#123E8A] font-bold leading-tight mb-3">
              <span className="block text-3xl md:text-[38px] xl:text-[44px] font-medium leading-none">
                {t("home.hero.line1")}
              </span>
              <span className="block text-4xl md:text-[46px] xl:text-[52px] mt-1 font-bold">
                {t("home.hero.line2")}
              </span>
            </h1>

            <p className="text-[#667085] text-sm md:text-base leading-relaxed mb-6 max-w-[500px]">
              {t("home.hero.desc")}
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/report"
                className="px-5 py-3 bg-[#0B4FC4] text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-2 shadow-sm font-sans"
              >
                <Camera size={18} />
                {t("home.cta.report")}
              </Link>

              <Link
                to="/my-reports"
                search={{ q: "" } as any}
                className="px-5 py-3 bg-white text-[#0B4FC4] border border-[#0B4FC4] rounded-lg text-sm font-semibold hover:bg-blue-50 transition flex items-center gap-2 shadow-sm font-sans"
              >
                <PlayCircle size={18} />
                {t("home.cta.guide")}
              </Link>
            </div>
          </div>

          {/* Right Column (Search Card) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end animate-slide-in-right">
            <div className="w-full max-w-[480px] bg-white rounded-2xl p-6 shadow-lg border border-[#E4EAF2]">
              <h2 className="text-[#0B4FC4] font-bold text-lg md:text-xl mb-4 font-sans">
                {t("home.search.title")}
              </h2>

              {/* Search form */}
              <div className="relative mb-5">
                <input
                  type="text"
                  placeholder={t("home.search.placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                  className="w-full h-11 pl-4 pr-10 rounded-lg border border-[#E4EAF2] text-sm outline-none focus:border-[#0B4FC4] bg-white text-[#123E8A] placeholder-[#667085]/60 shadow-inner font-sans"
                />
                <button
                  onClick={handleSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#667085] hover:text-[#0B4FC4] transition"
                  aria-label={t("home.search.label")}
                >
                  <Search size={18} />
                </button>
              </div>

              {/* Popular searches */}
              <div>
                <span className="block text-xs font-semibold text-[#667085] uppercase tracking-wider mb-2 font-sans">
                  {t("home.search.popular")}
                </span>
                <div className="flex flex-wrap gap-2">
                  {popularChips.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleChipClick(chip)}
                      className="px-3 py-1.5 bg-[#F5F9FF] text-[#0B4FC4] hover:bg-[#0B4FC4] hover:text-white rounded-lg text-xs font-semibold transition border border-transparent hover:border-[#E4EAF2] font-sans"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main page content below hero */}
      <div className="max-w-[1360px] mx-auto w-full px-4 md:px-8 py-10 md:py-14 space-y-10">
        {/* Section 1 — PHẢN ÁNH THEO LĨNH VỰC */}
        <section className="animate-fade-in-up stagger-1">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1.5 h-6 bg-[#0B4FC4] rounded-sm" />
            <h2 className="text-[#123E8A] font-bold text-lg md:text-xl font-sans">
              {t("home.category.title")}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
            {OFFICIAL_CATEGORIES.map((c) => {
              const IconComponent = c.icon;
              return (
                <button
                  key={c.code}
                  onClick={() => handleCategoryClick(c.code)}
                  className="bg-white rounded-2xl border border-[#E4EAF2] p-6 flex flex-col items-center text-center group hover:shadow-[0_12px_24px_rgba(11,79,196,0.08)] hover:border-[#0B4FC4] hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#0B4FC4] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                  <div className="w-14 h-14 rounded-2xl bg-[#F5F9FF] flex items-center justify-center text-[#0B4FC4] mb-4 group-hover:bg-[#0B4FC4] group-hover:text-white transition-all duration-300 group-hover:rotate-6 shadow-sm">
                    <IconComponent size={26} />
                  </div>
                  <h3 className="text-sm font-bold text-[#123E8A] group-hover:text-[#0B4FC4] transition-colors duration-200 mb-2 font-sans tracking-tight">
                    {t(c.nameKey as any)}
                  </h3>
                  <p className="text-xs text-[#667085] leading-relaxed line-clamp-3 font-sans group-hover:text-[#475467] transition-colors duration-200">
                    {t(c.descKey as any)}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 2 — THỐNG KÊ TOÀN THÀNH PHỐ */}
        <section className="bg-white rounded-2xl border border-[#E4EAF2] p-6 animate-fade-in-up stagger-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-[#0B4FC4] rounded-sm" />
              <h2 className="text-[#123E8A] font-bold text-lg md:text-xl font-sans">
                {t("home.stats.title")}
              </h2>
            </div>
            <div className="relative">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="bg-white border border-[#E4EAF2] rounded-lg px-3 py-1.5 text-xs font-semibold text-[#123E8A] outline-none focus:border-[#0B4FC4] font-sans cursor-pointer"
              >
                <option value="24h">{t("home.stats.last24h")}</option>
                <option value="7d">{t("home.stats.last7days")}</option>
                <option value="1m">{t("home.stats.last1month")}</option>
                <option value="3m">{t("home.stats.last3months")}</option>
                <option value="1y">{t("home.stats.last1year")}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tổng phản ánh */}
            <button
              onClick={() => handleKpiClick(undefined)}
              className="bg-white border border-[#E4EAF2] hover:border-[#0B4FC4] hover:shadow-md rounded-xl p-5 flex flex-col justify-between text-left transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0B4FC4]/20 group"
            >
              <div>
                <span className="text-[#667085] text-xs font-bold uppercase tracking-wider font-sans group-hover:text-[#0B4FC4] transition-colors">
                  {t("home.stats.total")}
                </span>
                <div className="text-2xl md:text-3xl font-extrabold text-[#0B4FC4] mt-1 font-sans">
                  {totalCount.toLocaleString("vi-VN")}
                </div>
              </div>
            </button>

            {/* Đang xử lý */}
            <button
              onClick={() => handleKpiClick("PROCESSING")}
              className="bg-white border border-[#E4EAF2] hover:border-[#F97316] hover:shadow-md rounded-xl p-5 flex flex-col justify-between text-left transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 group"
            >
              <div>
                <span className="text-[#667085] text-xs font-bold uppercase tracking-wider font-sans group-hover:text-[#F97316] transition-colors">
                  {t("home.stats.inProgress")}
                </span>
                <div className="text-2xl md:text-3xl font-extrabold text-[#F97316] mt-1 font-sans">
                  {pendingCount.toLocaleString("vi-VN")}
                </div>
              </div>
            </button>

            {/* Đã xử lý */}
            <button
              onClick={() => handleKpiClick("PROCESSED")}
              className="bg-white border border-[#E4EAF2] hover:border-[#16A34A] hover:shadow-md rounded-xl p-5 flex flex-col justify-between text-left transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[#667085] text-xs font-bold uppercase tracking-wider font-sans group-hover:text-[#16A34A] transition-colors">
                    {t("home.stats.resolved")}
                  </span>
                  <span className="text-xs font-bold text-[#16A34A] bg-[#E8F5E9] px-2 py-0.5 rounded font-sans">
                    {resolvedPct}%
                  </span>
                </div>
                <div className="text-2xl md:text-3xl font-extrabold text-[#16A34A] mt-1 font-sans">
                  {resolvedCount.toLocaleString("vi-VN")}
                </div>
              </div>
            </button>
          </div>

          {/* Grouped Bar Chart */}
          <div className="hidden w-full bg-white border border-[#E4EAF2] rounded-xl p-5 hover:shadow-sm transition">
            <div className="h-[320px] md:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={getGroupedChartData()}
                  margin={{ top: 20, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748B", fontSize: 12, fontWeight: 500 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748B", fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: "#F8FAFC" }}
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                    }}
                    labelStyle={{ fontWeight: 600, color: "#1E293B", marginBottom: "4px" }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => {
                      if (value === "total") return <span className="text-sm font-medium text-[#475569]">{t("home.stats.total")}</span>;
                      if (value === "processing") return <span className="text-sm font-medium text-[#475569]">{t("home.stats.inProgress")}</span>;
                      if (value === "processed") return <span className="text-sm font-medium text-[#475569]">{t("home.stats.resolved")}</span>;
                      return value;
                    }}
                  />
                  <Bar
                    dataKey="total"
                    name="total"
                    fill="#0B4FC4"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar
                    dataKey="processing"
                    name="processing"
                    fill="#F97316"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar
                    dataKey="processed"
                    name="processed"
                    fill="#16A34A"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Sections 3, 4, 5, 6 — MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Recent reports (Section 4) */}
          <section className="lg:col-span-8 bg-white rounded-2xl border border-[#E4EAF2] p-5 md:p-6 animate-fade-in-up stagger-3">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 bg-[#0B4FC4] rounded-sm" />
                <h2 className="text-[#123E8A] font-bold text-lg md:text-xl font-sans">
                  {t("home.recent")}
                </h2>
              </div>
              <Link
                to="/feedback-search"
                search={{ q: "", category: "" } as any}
                className="text-sm font-semibold text-[#0B4FC4] hover:underline flex items-center gap-1 font-sans"
              >
                {t("home.recent.viewAll")} &rarr;
              </Link>
            </div>

            {/* Loading state: skeleton cards */}
            {isLoading && (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className="border-b border-[#E4EAF2] pb-4 flex gap-4 animate-pulse">
                    <div className="w-20 h-20 bg-slate-100 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-100 rounded w-1/4" />
                      <div className="h-5 bg-slate-100 rounded w-3/4" />
                      <div className="h-4 bg-slate-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !hasApiData && mockReports.length === 0 && (
              <div className="py-10 text-center text-[#667085] font-sans">
                {t("home.recent.empty")}
              </div>
            )}

            {/* List of reports */}
            <div className="divide-y divide-[#E4EAF2]">
              {/* Show API feedbacks if available */}
              {!isLoading &&
                hasApiData &&
                recentApiFeedbacks.map((fb) => (
                  <Link
                    key={fb.id}
                    to={`/my-reports/${fb.id}` as any}
                    className="py-4 flex gap-4 group items-center hover:bg-slate-50/50 transition px-2 rounded-lg -mx-2"
                  >
                    <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-[#E4EAF2] relative">
                      <img
                        src={getFeedbackThumbnail(fb)}
                        alt={fb.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getCategoryPlaceholder(fb.categoryCode || fb.category);
                        }}
                      />
                      {isOnlyVideoFeedback(fb) && (
                        <div className="absolute inset-0 bg-black/35 flex items-center justify-center text-white">
                          <PlayCircle size={20} className="drop-shadow-md" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="px-2 py-0.5 bg-[#F5F9FF] text-[#0B4FC4] rounded text-[10px] font-bold uppercase tracking-wider font-sans">
                          {fb.categoryName || t("home.category.other")}
                        </span>
                        <span className="text-xs text-[#667085] font-semibold font-sans">
                          {new Date(fb.createdAt).toLocaleDateString(
                            locale === "vi" ? "vi-VN" : "en-US",
                          )}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-[#123E8A] group-hover:text-[#0B4FC4] transition truncate font-sans mb-1 leading-snug">
                        {fb.title}
                      </h3>

                      <div className="flex items-center text-xs text-[#667085] gap-3">
                        <span className="flex items-center gap-1 font-sans truncate max-w-[240px]">
                          <MapPin size={14} className="text-[#667085]" />
                          {fb.addressDetails || "Đà Nẵng"}
                        </span>
                        <span className="font-mono text-[10px] text-[#667085]/70 shrink-0">
                          {fb.trackingCode}
                        </span>
                      </div>
                    </div>

                    {/* Status and Arrow */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded text-xs font-bold font-sans ${getStatusStyles(fb.status)}`}
                      >
                        {getStatusLabel(fb.status)}
                      </span>
                      <span className="text-[#667085] group-hover:text-[#0B4FC4] transition text-lg">
                        &rarr;
                      </span>
                    </div>
                  </Link>
                ))}

              {/* Fallback to mock reports if no API data */}
              {!isLoading &&
                !hasApiData &&
                recentMockReports.map((r) => (
                  <Link
                    key={r.id}
                    to={`/my-reports/${r.id}` as any}
                    className="py-4 flex gap-4 group items-center hover:bg-slate-50/50 transition px-2 rounded-lg -mx-2"
                  >
                    <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-[#E4EAF2]">
                      <img
                        src={r.image}
                        alt={r.title[locale]}
                        className="w-full h-full object-cover font-sans"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="px-2 py-0.5 bg-[#F5F9FF] text-[#0B4FC4] rounded text-[10px] font-bold uppercase tracking-wider font-sans">
                          {r.category === "infra"
                            ? t("category.infra")
                            : r.category === "env"
                              ? t("category.env")
                              : r.category === "traffic"
                                ? t("category.traffic")
                                : t("category.security")}
                        </span>
                        <span className="text-xs text-[#667085] font-semibold font-sans">
                          {r.createdAt}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-[#123E8A] group-hover:text-[#0B4FC4] transition truncate font-sans mb-1 leading-snug">
                        {r.title[locale]}
                      </h3>

                      <div className="flex items-center text-xs text-[#667085] gap-3">
                        <span className="flex items-center gap-1 font-sans truncate max-w-[240px]">
                          <MapPin size={14} className="text-[#667085]" />
                          {r.address[locale]}
                        </span>
                        <span className="font-mono text-[10px] text-[#667085]/70 shrink-0">
                          {r.id}
                        </span>
                      </div>
                    </div>

                    {/* Status and Arrow */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded text-xs font-bold font-sans ${getStatusStylesMock(r.status)}`}
                      >
                        {getStatusLabelMock(r.status)}
                      </span>
                      <span className="text-[#667085] group-hover:text-[#0B4FC4] transition text-lg">
                        &rarr;
                      </span>
                    </div>
                  </Link>
                ))}
            </div>
          </section>

          {/* Right Column: Map + Hotline (Sections 5, 6) */}
          <div className="lg:col-span-4 flex flex-col justify-between lg:space-y-0 space-y-6">
            {/* Map Section */}
            <section className="bg-white rounded-2xl border border-[#E4EAF2] p-5 animate-fade-in-up stagger-3">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-[#0B4FC4] rounded-sm" />
                  <h2 className="text-[#123E8A] font-bold text-base md:text-lg font-sans">
                    {t("home.map.title")}
                  </h2>
                </div>
                <Link
                  to="/ward"
                  className="text-xs font-semibold text-[#0B4FC4] hover:underline font-sans"
                >
                  {t("home.map.viewOnMap")} &rarr;
                </Link>
              </div>

              <div className="aspect-[4/3] rounded-xl overflow-hidden border border-[#E4EAF2] mb-1">
                <Suspense fallback={<div className="w-full h-full bg-slate-100 animate-pulse" />}>
                  <CivicMap
                    markers={
                      hasApiData
                        ? apiFeedbacks
                            .filter((f) => f.latitude && f.longitude)
                            .map((f) => ({
                              position: [f.latitude!, f.longitude!] as [number, number],
                              title: f.title,
                              description: f.description,
                              status: mapStatus(f.status),
                            }))
                        : [
                            {
                              position: [16.062, 108.222],
                              title: mockReports[0].title.vi,
                              description: mockReports[0].description.vi,
                              status: mockReports[0].status,
                            },
                            {
                              position: [16.08, 108.155],
                              title: mockReports[1].title.vi,
                              description: mockReports[1].description.vi,
                              status: mockReports[1].status,
                            },
                            {
                              position: [16.078, 108.158],
                              title: mockReports[2].title.vi,
                              description: mockReports[2].description.vi,
                              status: mockReports[2].status,
                            },
                            {
                              position: [16.06, 108.228],
                              title: mockReports[3].title.vi,
                              description: mockReports[3].description.vi,
                              status: mockReports[3].status,
                            },
                          ]
                    }
                    height="100%"
                    interactive={true}
                  />
                </Suspense>
              </div>
            </section>

            {/* Hotline Section */}
            <section className="bg-white rounded-2xl border border-[#E4EAF2] p-5 animate-fade-in-up stagger-4">
              <h2 className="text-[#123E8A] font-bold text-base md:text-lg mb-3 font-sans">
                {t("home.hotline.support")}
              </h2>
              <p className="text-[#667085] text-xs font-semibold mb-1 font-sans">
                {t("home.hotline.desc")}
              </p>
              <div className="text-3xl font-extrabold text-[#0B4FC4] tracking-wide font-sans mb-1">
                1022
              </div>
              <p className="text-[#667085] text-[11px] font-semibold mb-4 font-sans">
                24/7 &middot; {t("home.hotline.free")}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/assistant"
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-[#F5F9FF] text-[#0B4FC4] hover:bg-[#0B4FC4] hover:text-white rounded-lg text-xs font-bold border border-transparent hover:border-[#E4EAF2] transition font-sans"
                >
                  <User size={14} />
                  {t("home.hotline.chat")}
                </Link>
                <a
                  href="mailto:gopy@danang.gov.vn"
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-[#F5F9FF] text-[#0B4FC4] hover:bg-[#0B4FC4] hover:text-white rounded-lg text-xs font-bold border border-transparent hover:border-[#E4EAF2] transition font-sans"
                >
                  <Send size={14} />
                  {t("home.hotline.email")}
                </a>
              </div>
            </section>
          </div>
        </div>

        {/* Section 7 — QUY TRÌNH GỬI PHẢN ÁNH */}
        <section
          id="huong-dan"
          className="bg-white rounded-2xl border border-[#E4EAF2] p-6 animate-fade-in-up stagger-4 scroll-mt-24"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1.5 h-6 bg-[#0B4FC4] rounded-sm" />
            <h2 className="text-[#123E8A] font-bold text-lg md:text-xl font-sans">
              {t("home.process.title")}
            </h2>
          </div>

          <div className="relative">
            {/* Connector Line (Desktop) */}
            <div className="hidden lg:block absolute top-[32px] left-[10%] right-[10%] h-[1.5px] border-t border-dashed border-[#E4EAF2] z-0" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-16 h-16 rounded-full bg-white border-2 border-[#0B4FC4] flex items-center justify-center text-[#0B4FC4] shadow-sm">
                    <Camera size={24} />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#0B4FC4] text-white text-xs font-bold flex items-center justify-center">
                    1
                  </div>
                </div>
                <h3 className="text-sm font-bold text-[#123E8A] mb-1 font-sans">
                  {t("home.process.step1")}
                </h3>
                <p className="text-xs text-[#667085] max-w-[200px] leading-relaxed font-sans">
                  {t("home.process.step1Desc")}
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-16 h-16 rounded-full bg-white border-2 border-[#0B4FC4] flex items-center justify-center text-[#0B4FC4] shadow-sm">
                    <PenLine size={24} />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#0B4FC4] text-white text-xs font-bold flex items-center justify-center">
                    2
                  </div>
                </div>
                <h3 className="text-sm font-bold text-[#123E8A] mb-1 font-sans">{t("home.process.step2")}</h3>
                <p className="text-xs text-[#667085] max-w-[200px] leading-relaxed font-sans">
                  {t("home.process.step2Desc")}
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-16 h-16 rounded-full bg-white border-2 border-[#0B4FC4] flex items-center justify-center text-[#0B4FC4] shadow-sm">
                    <Send size={24} />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#0B4FC4] text-white text-xs font-bold flex items-center justify-center">
                    3
                  </div>
                </div>
                <h3 className="text-sm font-bold text-[#123E8A] mb-1 font-sans">{t("home.process.step3")}</h3>
                <p className="text-xs text-[#667085] max-w-[200px] leading-relaxed font-sans">
                  {t("home.process.step3Desc")}
                </p>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-16 h-16 rounded-full bg-white border-2 border-[#0B4FC4] flex items-center justify-center text-[#0B4FC4] shadow-sm">
                    <CheckCircle2 size={24} />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#0B4FC4] text-white text-xs font-bold flex items-center justify-center">
                    4
                  </div>
                </div>
                <h3 className="text-sm font-bold text-[#123E8A] mb-1 font-sans">
                  {t("home.process.step4")}
                </h3>
                <p className="text-xs text-[#667085] max-w-[200px] leading-relaxed font-sans">
                  {t("home.process.step4Desc")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Sections 1 & 2: Tin tức/thông báo & Câu hỏi thường gặp */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left panel: Tin tức & thông báo (65%) */}
          <section
            id="tin-tuc"
            className="lg:col-span-8 bg-white rounded-2xl border border-[#E4EAF2] p-5 md:p-6 flex flex-col justify-between animate-fade-in-up stagger-4 scroll-mt-24"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-[#0B4FC4] rounded-sm" />
                  <h2 className="text-[#123E8A] font-bold text-lg md:text-xl font-sans">
                    {t("home.news.title")}
                  </h2>
                </div>
                <Link
                  to="/notifications"
                  className="text-sm font-semibold text-[#0B4FC4] hover:underline flex items-center gap-1 font-sans"
                >
                  {t("home.recent.viewAll")} &rarr;
                </Link>
              </div>

              {staticNews.length === 0 ? (
                <div className="py-10 text-center text-[#667085] font-sans">
                  {t("home.news.empty")}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {staticNews.map((n) => (
                    <a
                      key={n.id}
                      href={n.link}
                      className="flex flex-col bg-white rounded-xl border border-[#E4EAF2] overflow-hidden hover:shadow-md transition duration-200 group h-full"
                    >
                      <div className="aspect-[16/10] overflow-hidden bg-slate-100 relative">
                        <img
                          src={n.image}
                          alt={n.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                        />
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                n.badge === "Thông báo"
                                  ? "bg-[#0B4FC4] text-white"
                                  : n.badge === "Hướng dẫn"
                                    ? "bg-[#FFF8E1] text-[#F97316]"
                                    : "bg-[#F5F9FF] text-[#0B4FC4]"
                              }`}
                            >
                              {n.badge}
                            </span>
                            <span className="text-[11px] text-[#667085] font-semibold font-sans">
                              {n.date}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-[#123E8A] line-clamp-2 mb-1 group-hover:text-[#0B4FC4] transition leading-snug font-sans">
                            {n.title}
                          </h3>
                          <p className="text-xs text-[#667085] line-clamp-2 leading-relaxed font-sans">
                            {n.summary}
                          </p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Right panel: Câu hỏi thường gặp (35%) */}
          <section className="lg:col-span-4 bg-white rounded-2xl border border-[#E4EAF2] p-5 md:p-6 flex flex-col justify-between animate-fade-in-up stagger-4">
            <div>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1.5 h-6 bg-[#0B4FC4] rounded-sm" />
                <h2 className="text-[#123E8A] font-bold text-lg md:text-xl font-sans">
                  {t("home.faq.title")}
                </h2>
              </div>

              <div className="space-y-3">
                {staticFaqs.map((f) => {
                  const isOpen = openFaq === f.id;
                  return (
                    <div
                      key={f.id}
                      className="border border-[#E4EAF2] rounded-lg overflow-hidden transition"
                    >
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : f.id)}
                        aria-expanded={isOpen}
                        className="w-full flex items-center justify-between text-left py-3 px-4 bg-slate-50/50 hover:bg-slate-50/80 transition focus:outline-none focus:ring-2 focus:ring-[#0B4FC4] font-sans"
                      >
                        <span className="text-xs font-bold text-[#123E8A] pr-2 leading-snug">
                          {f.question}
                        </span>
                        {isOpen ? (
                          <ChevronUp size={16} className="text-[#0B4FC4] shrink-0" />
                        ) : (
                          <ChevronDown size={16} className="text-[#0B4FC4] shrink-0" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="p-4 bg-white border-t border-[#E4EAF2] text-xs text-[#667085] leading-relaxed font-sans animate-fade-in">
                          {f.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 text-center">
              <Link
                to="/my-reports"
                search={{ q: "" } as any}
                className="text-xs font-bold text-[#0B4FC4] hover:underline font-sans"
              >
                {t("home.faq.viewAll")} &rarr;
              </Link>
            </div>
          </section>
        </div>

        {/* Section 3: Public-service Trust-Benefit Strip */}
        <section className="bg-white rounded-2xl border border-[#E4EAF2] py-6 px-6 animate-fade-in-up stagger-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
            {/* Item 1 */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F5F9FF] flex items-center justify-center text-[#0B4FC4] shrink-0">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#123E8A] font-sans">{t("home.trust.security")}</h3>
                <p className="text-xs text-[#667085] leading-relaxed font-sans">
                  {t("home.trust.securityDesc")}
                </p>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F5F9FF] flex items-center justify-center text-[#0B4FC4] shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#123E8A] font-sans">{t("home.trust.transparent")}</h3>
                <p className="text-xs text-[#667085] leading-relaxed font-sans">
                  {t("home.trust.transparentDesc")}
                </p>
              </div>
            </div>

            {/* Item 3 */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F5F9FF] flex items-center justify-center text-[#0B4FC4] shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#123E8A] font-sans">{t("home.trust.fast")}</h3>
                <p className="text-xs text-[#667085] leading-relaxed font-sans">
                  {t("home.trust.fastDesc")}
                </p>
              </div>
            </div>

            {/* Item 4 */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F5F9FF] flex items-center justify-center text-[#0B4FC4] shrink-0">
                <HeartHandshake size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#123E8A] font-sans">
                  {t("home.trust.better")}
                </h3>
                <p className="text-xs text-[#667085] leading-relaxed font-sans">
                  {t("home.trust.betterDesc")}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

