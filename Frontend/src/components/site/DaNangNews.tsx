// ============================================================
// DaNangNews.tsx
// Cách dùng: <DaNangNews />
// Yêu cầu: @tanstack/react-query đã setup ở root
// ============================================================

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// ---------- Types ----------
interface NewsItem {
  title: string;
  description: string;
  link: string;
  thumbnail: string;
  pubDate: string;
  source: string;
}

// ---------- Constants ----------
const KEYWORDS = ["đà nẵng", "da nang", "danang", "sơn trà", "hải châu", "liên chiểu", "thanh khê", "ngũ hành sơn", "cẩm lệ", "hoà vang"];

const SOURCES = [
  {
    url: "https://baodanang.vn/rss/home.rss",
    name: "Báo Đà Nẵng",
    alwaysInclude: true, // 100% local, không cần lọc keyword
  },
  {
    url: "https://vnexpress.net/rss/thoi-su.rss",
    name: "VnExpress",
    alwaysInclude: false,
  },
  {
    url: "https://tuoitre.vn/rss/chinh-tri-xa-hoi.rss",
    name: "Tuổi Trẻ",
    alwaysInclude: false,
  },
];

// ---------- RSS to JSON proxy ----------
const toApiUrl = (rssUrl: string) =>
  `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=40`;

// ---------- Fetch & Filter Hook ----------
export function useDaNangNews() {
  return useQuery<NewsItem[]>({
    queryKey: ["news-danang"],
    queryFn: async () => {
      const results = await Promise.allSettled(
        SOURCES.map((src) =>
          fetch(toApiUrl(src.url))
            .then((r) => r.json())
            .then((data) =>
              (data.items ?? []).map((item: any) => ({
                ...item,
                source: src.name,
                alwaysInclude: src.alwaysInclude,
              }))
            )
        )
      );

      const allItems = results
        .filter((r) => r.status === "fulfilled")
        .flatMap((r) => (r as PromiseFulfilledResult<any[]>).value);

      // Lọc theo keyword hoặc nguồn địa phương
      const filtered = allItems.filter((item) => {
        if (item.alwaysInclude) return true;
        const text = `${item.title} ${item.description}`.toLowerCase();
        return KEYWORDS.some((kw) => text.includes(kw));
      });

      // Sắp xếp mới nhất trước, loại trùng link
      const seen = new Set<string>();
      return filtered
        .filter((item) => {
          if (seen.has(item.link)) return false;
          seen.add(item.link);
          return true;
        })
        .sort(
          (a, b) =>
            new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
        );
    },
    staleTime: 1000 * 60 * 15,   // cache 15 phút
    refetchInterval: 1000 * 60 * 20, // tự làm mới 20 phút
  });
}

// ---------- Helpers ----------
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

// ---------- Source badge colors ----------
const SOURCE_COLORS: Record<string, string> = {
  "Báo Đà Nẵng": "#1D9E75",
  VnExpress:     "#E63329",
  "Tuổi Trẻ":    "#E67E22",
};

// ---------- Skeleton Card ----------
function SkeletonCard() {
  return (
    <div style={{
      background: "var(--color-background-primary)",
      border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: 12,
      padding: "14px 16px",
      display: "flex",
      gap: 12,
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: 8, flexShrink: 0,
        background: "var(--color-background-secondary)",
        animation: "pulse 1.4s ease-in-out infinite",
      }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ height: 14, borderRadius: 4, background: "var(--color-background-secondary)", width: "80%", animation: "pulse 1.4s ease-in-out infinite" }} />
        <div style={{ height: 12, borderRadius: 4, background: "var(--color-background-secondary)", width: "60%", animation: "pulse 1.4s ease-in-out infinite 0.1s" }} />
        <div style={{ height: 12, borderRadius: 4, background: "var(--color-background-secondary)", width: "40%", animation: "pulse 1.4s ease-in-out infinite 0.2s" }} />
      </div>
    </div>
  );
}

// ---------- News Card ----------
function NewsCard({ item }: { item: NewsItem }) {
  const badgeColor = SOURCE_COLORS[item.source] ?? "#888780";
  const desc = stripHtml(item.description);

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        gap: 12,
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: 12,
        padding: "14px 16px",
        textDecoration: "none",
        color: "inherit",
        transition: "border-color 0.15s, box-shadow 0.15s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-secondary)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-tertiary)";
      }}
    >
      {/* Thumbnail */}
      {item.thumbnail && (
        <img
          src={item.thumbnail}
          alt=""
          style={{
            width: 88,
            height: 88,
            objectFit: "cover",
            borderRadius: 8,
            flexShrink: 0,
            background: "var(--color-background-secondary)",
          }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      )}

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Source + time */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <span style={{
            fontSize: 10, fontWeight: 500, padding: "2px 8px",
            borderRadius: 20, color: "#fff",
            background: badgeColor,
            letterSpacing: "0.03em",
          }}>
            {item.source}
          </span>
          <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
            {timeAgo(item.pubDate)}
          </span>
        </div>

        {/* Title */}
        <p style={{
          fontSize: 14, fontWeight: 500, lineHeight: 1.45,
          color: "var(--color-text-primary)",
          margin: "0 0 6px",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {item.title}
        </p>

        {/* Description */}
        {desc && (
          <p style={{
            fontSize: 12, color: "var(--color-text-secondary)",
            lineHeight: 1.5, margin: 0,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {desc}
          </p>
        )}
      </div>
    </a>
  );
}

// ---------- Main Component ----------
export default function DaNangNews() {
  const { data, isLoading, isError, refetch, isFetching } = useDaNangNews();
  const [search, setSearch] = useState("");

  // Lọc thêm theo search input người dùng gõ
  const filtered = (data ?? []).filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 2px", color: "var(--color-text-primary)" }}>
              Tin tức Đà Nẵng
            </h2>
            <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", margin: 0 }}>
              {data ? `${filtered.length} tin mới nhất` : "Đang tải..."}
            </p>
          </div>

          {/* Refresh button */}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 12, padding: "6px 12px", borderRadius: 8,
              border: "0.5px solid var(--color-border-secondary)",
              background: "transparent", cursor: isFetching ? "not-allowed" : "pointer",
              color: "var(--color-text-secondary)", opacity: isFetching ? 0.5 : 1,
            }}
          >
            <svg
              width="14" height="14" viewBox="0 0 14 14" fill="none"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
              style={{ animation: isFetching ? "spin 0.8s linear infinite" : "none" }}
            >
              <path d="M12 7A5 5 0 1 1 7 2.2M12 2v3.5H8.5" />
            </svg>
            Làm mới
          </button>
        </div>

        {/* Search */}
        <div style={{ position: "relative" }}>
          <svg
            width="15" height="15" viewBox="0 0 15 15" fill="none"
            stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round"
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
          >
            <circle cx="6.5" cy="6.5" r="4.5" />
            <path d="M10 10l3 3" />
          </svg>
          <input
            type="text"
            placeholder="Tìm trong tin tức Đà Nẵng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "9px 12px 9px 36px",
              fontSize: 13, borderRadius: 8,
              border: "0.5px solid var(--color-border-secondary)",
              background: "var(--color-background-primary)",
              color: "var(--color-text-primary)",
              outline: "none",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: "var(--color-text-tertiary)", lineHeight: 1, padding: 2,
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Source filter pills */}
        {data && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Object.entries(SOURCE_COLORS).map(([src, color]) => {
              const count = (data ?? []).filter((i) => i.source === src).length;
              if (count === 0) return null;
              return (
                <span
                  key={src}
                  style={{
                    fontSize: 11, padding: "3px 10px", borderRadius: 20,
                    border: `0.5px solid ${color}30`,
                    background: `${color}15`,
                    color: color, fontWeight: 500,
                  }}
                >
                  {src} · {count}
                </span>
              );
            })}
          </div>
        )}

        {/* States */}
        {isLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {isError && (
          <div style={{
            padding: "20px 16px", borderRadius: 12, textAlign: "center",
            border: "0.5px solid var(--color-border-danger)",
            background: "var(--color-background-danger)",
          }}>
            <p style={{ fontSize: 14, color: "var(--color-text-danger)", margin: "0 0 8px" }}>
              Không thể tải tin tức
            </p>
            <button
              onClick={() => refetch()}
              style={{
                fontSize: 12, padding: "6px 14px", borderRadius: 6,
                border: "0.5px solid var(--color-border-danger)",
                background: "transparent", cursor: "pointer",
                color: "var(--color-text-danger)",
              }}
            >
              Thử lại
            </button>
          </div>
        )}

        {/* News List */}
        {!isLoading && !isError && (
          <>
            {filtered.length === 0 ? (
              <div style={{
                padding: "32px 16px", textAlign: "center",
                color: "var(--color-text-tertiary)", fontSize: 13,
              }}>
                Không tìm thấy tin nào phù hợp
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filtered.map((item) => (
                  <NewsCard key={item.link} item={item} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
