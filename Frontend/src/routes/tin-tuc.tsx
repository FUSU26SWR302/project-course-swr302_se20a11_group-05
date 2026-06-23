import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { staticNews, type StaticNewsItem } from "@/lib/static-content";
import {
  Search,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  Bell,
  FileText,
  Activity,
  Building2,
  TrendingUp,
  Shield,
  HelpCircle,
  X,
} from "lucide-react";

// Register query search parameters
interface NewsSearchSchema {
  q?: string;
  category?: string;
  page?: number;
}

export const Route = createFileRoute("/tin-tuc")({
  validateSearch: (search: Record<string, unknown>): NewsSearchSchema => ({
    q: typeof search.q === "string" ? search.q : undefined,
    category: typeof search.category === "string" ? search.category : undefined,
    page: typeof search.page === "number" ? search.page : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Tin tức & Thông báo — Đà Nẵng Kết Nối" },
      {
        name: "description",
        content: "Cập nhật các thông tin, hoạt động, chính sách và thông báo mới nhất từ chính quyền thành phố Đà Nẵng.",
      },
    ],
  }),
  component: NewsPage,
});

const CATEGORIES = [
  "Tất cả",
  "Thông báo",
  "Chính sách",
  "Hoạt động",
  "Hạ tầng - Đô thị",
  "Kinh tế - Xã hội",
  "An ninh - Trật tự",
  "Khác",
];

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  "Thông báo": Bell,
  "Chính sách": FileText,
  "Hoạt động": Activity,
  "Hạ tầng - Đô thị": Building2,
  "Kinh tế - Xã hội": TrendingUp,
  "An ninh - Trật tự": Shield,
  "Khác": HelpCircle,
};

const CATEGORY_COLORS: Record<string, { text: string; bg: string }> = {
  "Thông báo": { text: "text-[#0B4FC4]", bg: "bg-[#EEF5FF]" },
  "Chính sách": { text: "text-[#6D28D9]", bg: "bg-[#F2EDFF]" },
  "Hoạt động": { text: "text-[#EA580C]", bg: "bg-[#FFF4E8]" },
  "Hạ tầng - Đô thị": { text: "text-[#15803D]", bg: "bg-[#EAF8EF]" },
  "Kinh tế - Xã hội": { text: "text-[#0891B2]", bg: "bg-[#ECFEFF]" },
  "An ninh - Trật tự": { text: "text-[#1E3A8A]", bg: "bg-[#EBF3FF]" },
  "Khác": { text: "text-[#4B5563]", bg: "bg-[#F3F4F6]" },
};

const ITEMS_PER_PAGE = 5;

function NewsPage() {
  const { locale } = useI18n();
  const searchParams = useSearch({ from: "/tin-tuc" });
  const navigate = useNavigate();

  // Search keyword and category state, synchronized with URL
  const queryKeyword = searchParams.q || "";
  const queryCategory = searchParams.category || "Tất cả";
  const queryPage = searchParams.page || 1;

  const [searchInput, setSearchInput] = useState(queryKeyword);

  // Sync state when URL updates
  useEffect(() => {
    setSearchInput(queryKeyword);
  }, [queryKeyword]);

  // Handle updates to route search query
  const updateQueryParams = (updates: Partial<NewsSearchSchema>) => {
    void navigate({
      to: "/tin-tuc",
      search: (prev) => {
        const next = { ...prev, ...updates };
        // Clean undefined or empty parameters
        if (next.q === "") delete next.q;
        if (next.category === "Tất cả") delete next.category;
        if (next.page === 1) delete next.page;
        return next;
      },
    });
  };

  // Perform search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQueryParams({ q: searchInput, page: 1 });
  };

  const handleClearSearch = () => {
    setSearchInput("");
    updateQueryParams({ q: "", page: 1 });
  };

  const handleCategoryChange = (category: string) => {
    updateQueryParams({ category, page: 1 });
  };

  // Filtered and paginated news
  const filteredNews = useMemo(() => {
    return staticNews.filter((item) => {
      // 1. Keyword search check
      const matchesKeyword =
        !queryKeyword ||
        item.title.toLowerCase().includes(queryKeyword.toLowerCase()) ||
        item.summary.toLowerCase().includes(queryKeyword.toLowerCase());

      // 2. Category badge check
      const matchesCategory =
        queryCategory === "Tất cả" || item.badge === queryCategory;

      return matchesKeyword && matchesCategory;
    });
  }, [queryKeyword, queryCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredNews.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(queryPage, totalPages);

  const paginatedNews = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredNews.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [filteredNews, currentPage]);

  // Sidebar: Most read articles sorted by views
  const mostReadNews = useMemo(() => {
    return [...staticNews]
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  }, []);

  return (
    <div className="w-full flex flex-col min-h-screen bg-[#F8FAFD] font-sans pb-16">
      {/* 1. News Hero Banner */}
      <section
        className="relative w-full h-[220px] md:h-[240px] flex items-center bg-cover bg-center overflow-hidden border-b border-[#E4EAF2]"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.96) 40%, rgba(255,255,255,0.85) 60%, rgba(255,255,255,0.2) 100%), url('https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1600&h=600&q=80')`,
        }}
      >
        <div className="max-w-[1440px] mx-auto w-full px-6 md:px-12 flex flex-col justify-center h-full relative z-10">
          <div className="max-w-[620px]">
            <h1 className="font-serif text-[#0E3F8F] text-[36px] md:text-[46px] font-bold leading-tight mb-2 tracking-tight">
              Tin tức
            </h1>
            <p className="text-[#475467] text-sm md:text-base leading-relaxed mb-6 font-medium">
              Cập nhật các thông tin, hoạt động, chính sách và thông báo mới nhất từ chính quyền thành phố Đà Nẵng.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Container for Search & Filters & Content */}
      <div className="max-w-[1440px] mx-auto w-full px-6 md:px-12 -mt-7 relative z-20">
        {/* Search Bar positioned lower-left inside the hero zone */}
        <form onSubmit={handleSearchSubmit} className="max-w-[620px] mb-6">
          <div className="relative bg-white rounded-xl border border-[#E4EAF2] shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center h-[50px] px-4">
            <Search size={20} className="text-[#667085] shrink-0" />
            <input
              type="text"
              placeholder="Nhập từ khóa tìm kiếm tin tức..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full h-full bg-transparent border-none outline-none pl-3 pr-8 text-[#123E8A] text-sm font-semibold placeholder-[#667085]"
              aria-label="Tìm kiếm tin tức"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-4 text-[#667085] hover:text-[#0B4FC4] p-1 cursor-pointer"
                aria-label="Xóa từ khóa"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </form>

        {/* 3. Horizontal News-Category Filter Bar */}
        <div className="w-full overflow-x-auto scrollbar-hide py-2 mb-8 -mx-1 px-1">
          <div className="flex items-center gap-2.5 min-w-max">
            {CATEGORIES.map((cat) => {
              const isActive = queryCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg border transition duration-200 cursor-pointer ${
                    isActive
                      ? "bg-[#0B4FC4] text-white border-[#0B4FC4] shadow-sm"
                      : "bg-white text-[#123E8A] border-[#E4EAF2] hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Main Two-Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Newest News List (74%) */}
          <main className="lg:col-span-9 bg-white rounded-xl border border-[#E4EAF2] p-5 md:p-6 shadow-sm flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between border-b border-[#E4EAF2] pb-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-[#0B4FC4] rounded-sm" />
                <h2 className="text-[#0E3F8F] font-bold text-base md:text-lg">
                  Tin tức mới nhất
                </h2>
              </div>
              <span className="text-xs text-[#667085] font-semibold">
                Tìm thấy {filteredNews.length} tin tức
              </span>
            </div>

            {/* News List */}
            {paginatedNews.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-[#667085] mb-4">
                  <Search size={24} />
                </div>
                <h3 className="text-[#123E8A] font-bold text-sm mb-1">
                  Không tìm thấy tin tức phù hợp.
                </h3>
                <p className="text-xs text-[#667085] max-w-[320px]">
                  Vui lòng thử thay đổi từ khóa hoặc danh mục tìm kiếm của bạn.
                </p>
              </div>
            ) : (
              <div className="flex-grow divide-y divide-[#E4EAF2]">
                {paginatedNews.map((item) => {
                  const badgeStyle = CATEGORY_COLORS[item.badge] || {
                    text: "text-slate-600",
                    bg: "bg-slate-100",
                  };
                  return (
                    <div
                      key={item.id}
                      className="py-5 first:pt-0 last:pb-0 flex flex-col md:flex-row gap-5 group"
                    >
                      {/* Thumbnail Left */}
                      <Link
                        to={item.link as any}
                        className="w-full md:w-[220px] aspect-[16/10] md:h-[138px] rounded-lg overflow-hidden shrink-0 border border-slate-100 bg-slate-50 relative block"
                      >
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          loading="lazy"
                        />
                      </Link>

                      {/* Content Right */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          {/* Badge */}
                          <div className="mb-2">
                            <span
                              className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${badgeStyle.bg} ${badgeStyle.text}`}
                            >
                              {item.badge}
                            </span>
                          </div>

                          {/* Title */}
                          <Link
                            to={item.link as any}
                            className="block text-[#123E8A] font-bold text-sm md:text-base leading-snug line-clamp-2 hover:text-[#0B4FC4] transition duration-150 mb-2 font-sans"
                          >
                            {item.title}
                          </Link>

                          {/* Excerpt */}
                          <p className="text-xs text-[#475467] leading-relaxed line-clamp-3 mb-3 font-medium">
                            {item.summary}
                          </p>
                        </div>

                        {/* Footer (Date & Views) */}
                        <div className="flex items-center gap-4 text-[11px] text-[#667085] font-semibold">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-[#667085]" />
                            {item.date}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Eye size={13} className="text-[#667085]" />
                            {item.views.toLocaleString("vi-VN")} lượt xem
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Component */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-1.5 pt-8 mt-6 border-t border-[#E4EAF2]">
                {/* Prev Button */}
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => updateQueryParams({ page: currentPage - 1 })}
                  className="w-9 h-9 rounded-lg border border-[#E4EAF2] flex items-center justify-center text-[#123E8A] bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                  aria-label="Trang trước"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Page Index Buttons */}
                {Array.from({ length: totalPages }, (_, idx) => {
                  const pageNum = idx + 1;
                  const isCurrent = currentPage === pageNum;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => updateQueryParams({ page: pageNum })}
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center text-xs font-bold transition cursor-pointer ${
                        isCurrent
                          ? "bg-[#0B4FC4] border-[#0B4FC4] text-white shadow-sm"
                          : "bg-white border-[#E4EAF2] text-[#123E8A] hover:bg-slate-50"
                      }`}
                      aria-current={isCurrent ? "page" : undefined}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {/* Next Button */}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => updateQueryParams({ page: currentPage + 1 })}
                  className="w-9 h-9 rounded-lg border border-[#E4EAF2] flex items-center justify-center text-[#123E8A] bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                  aria-label="Trang sau"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </main>

          {/* Right Column: Sidebar Widgets (26%) */}
          <aside className="lg:col-span-3 flex flex-col gap-6">
            {/* Widget 1: Tin đọc nhiều */}
            <section className="bg-white rounded-xl border border-[#E4EAF2] p-5 shadow-sm">
              <div className="flex items-center gap-2 border-b border-[#E4EAF2] pb-3 mb-4">
                <div className="w-1.5 h-4 bg-[#0B4FC4] rounded-sm" />
                <h2 className="text-[#0E3F8F] font-bold text-sm uppercase tracking-wide">
                  Tin đọc nhiều
                </h2>
              </div>

              {mostReadNews.length === 0 ? (
                <p className="text-xs text-[#667085] py-4 text-center font-medium">
                  Chưa có dữ liệu tin đọc nhiều.
                </p>
              ) : (
                <div className="space-y-4">
                  {mostReadNews.map((item, index) => {
                    const rank = index + 1;
                    const rankBg =
                      rank === 1
                        ? "bg-[#0B4FC4] text-white"
                        : rank === 2
                          ? "bg-[#123E8A] text-white"
                          : rank === 3
                            ? "bg-[#E67E22] text-white"
                            : "bg-[#F3F4F6] text-[#667085]";

                    return (
                      <div key={item.id} className="flex gap-3 group relative items-start">
                        {/* Rank Circle Badge */}
                        <div
                          className={`w-[20px] h-[20px] rounded-full shrink-0 flex items-center justify-center text-[10px] font-extrabold shadow-sm ${rankBg}`}
                        >
                          {rank}
                        </div>

                        {/* Thumbnail */}
                        <Link
                          to={item.link as any}
                          className="w-[52px] h-[52px] rounded overflow-hidden shrink-0 border border-slate-100 bg-slate-50 block"
                        >
                          <img
                            src={item.image}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                          />
                        </Link>

                        {/* Detail Info */}
                        <div className="flex-grow min-w-0">
                          <Link
                            to={item.link as any}
                            className="block text-[#123E8A] font-bold text-xs leading-snug line-clamp-2 hover:text-[#0B4FC4] transition duration-150 mb-1 font-sans"
                          >
                            {item.title}
                          </Link>
                          <span className="flex items-center gap-1 text-[10px] text-[#667085] font-semibold">
                            <Eye size={11} className="text-[#667085]" />
                            {item.views.toLocaleString("vi-VN")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Widget 2: Danh mục nhanh */}
            <section className="bg-white rounded-xl border border-[#E4EAF2] p-5 shadow-sm">
              <div className="flex items-center gap-2 border-b border-[#E4EAF2] pb-3 mb-4">
                <div className="w-1.5 h-4 bg-[#0B4FC4] rounded-sm" />
                <h2 className="text-[#0E3F8F] font-bold text-sm uppercase tracking-wide">
                  Danh mục nhanh
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.filter((c) => c !== "Tất cả" && c !== "Khác").map((cat) => {
                  const IconComponent = CATEGORY_ICONS[cat] || HelpCircle;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        handleCategoryChange(cat);
                        // Scroll up to filter section with smooth animation
                        window.scrollTo({ top: 180, behavior: "smooth" });
                      }}
                      className="bg-white border border-[#E4EAF2] rounded-lg p-2.5 flex flex-col items-center justify-center text-center gap-1.5 hover:bg-slate-50 hover:border-[#0B4FC4] transition group cursor-pointer"
                    >
                      <IconComponent
                        size={16}
                        className="text-[#0B4FC4] group-hover:scale-110 transition duration-150"
                      />
                      <span className="text-[10px] font-bold text-[#123E8A] leading-tight">
                        {cat}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
