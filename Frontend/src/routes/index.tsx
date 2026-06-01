import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useFeedbacks } from "@/lib/hooks";
import { reports as mockReports, kpis } from "@/lib/mock-data";
import { StatusBadge } from "@/components/site/StatusBadge";
import { DemoBanner } from "@/components/site/DemoBanner";
import { mapStatus } from "@/lib/status";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkline, textClassToHex } from "@/components/site/KpiChart";
import { Camera, MapPin, User, RefreshCw, Loader2, PlayCircle } from "lucide-react";
import { lazy, Suspense, useState, useEffect } from "react";
import DaNangNews from "@/components/site/DaNangNews";

const CivicMap = lazy(() => import("@/components/site/CivicMap").then(m => ({ default: m.CivicMap })));

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
    caption: { vi: "Biển Mỹ Khê — Bãi biển đẹp nhất châu Á", en: "My Khe Beach — Asia's Most Beautiful Beach" },
  },
  {
    url: "https://images.unsplash.com/photo-1528127269322-539801943592?w=900&h=700&fit=crop&q=80",
    caption: { vi: "Vịnh Đà Nẵng — Thành phố đáng sống", en: "Da Nang Bay — Most Livable City" },
  },
  {
    url: "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=900&h=700&fit=crop&q=80",
    caption: { vi: "Sông Hàn về đêm — Trái tim Đà Nẵng", en: "Han River at Night — Heart of Da Nang" },
  },
  {
    url: "https://images.unsplash.com/photo-1602934585418-f3a27d8924a5?w=900&h=700&fit=crop&q=80",
    caption: { vi: "Đà Nẵng — Thành phố văn minh, hiện đại", en: "Da Nang — Modern and Civilized City" },
  },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Đà Nẵng Kết Nối — Cổng phản ánh thành phố" },
      { name: "description", content: "Gửi phản ánh hạ tầng, môi trường, an ninh — cùng xây dựng Đà Nẵng văn minh." },
      { property: "og:title", content: "Đà Nẵng Kết Nối" },
      { property: "og:description", content: "Da Nang civic reporting platform — submit and track municipal reports." },
    ],
  }),
  component: HomePage,
});


function HomePage() {
  const { t, locale } = useI18n();
  const { data: feedbacksPage, isLoading, isFetching, refetch } = useFeedbacks(0, 20);

  const hasApiData = !!feedbacksPage && feedbacksPage.content.length > 0;
  const apiFeedbacks = feedbacksPage?.content ?? [];

  // ── Slideshow state
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % DA_NANG_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14">
      {/* Hero — 2 column: text left, slideshow right */}
      <section className="animate-fade-in grid grid-cols-1 lg:grid-cols-2 items-center gap-10 lg:gap-16 mb-14">

        {/* Left: Content */}
        <div className="flex flex-col">
          <p className="text-gov-gold uppercase tracking-[0.2em] text-xs font-bold mb-4">
            Chính quyền điện tử · E-Government
          </p>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl text-gov-blue mb-5 leading-tight">
            {t("home.title")}
          </h1>
          <p className="text-lg md:text-xl text-ink-soft leading-relaxed mb-8">
            {t("home.subtitle")}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/report"
              className="btn-civic btn-civic-primary animate-civic-pulse text-base px-7 py-4"
            >
              <Camera size={20} />
              <span className="flex flex-col items-start leading-tight">
                <span>{t("home.cta.report")}</span>
                <span className="text-xs font-medium text-white/75 normal-case">{t("home.cta.reportHint")}</span>
              </span>
            </Link>
            <Link
              to="/my-reports"
              className="btn-civic btn-civic-ghost text-base px-7 py-4"
            >
              <PlayCircle size={20} />
              {locale === "vi" ? "Xem quy trình" : "See how it works"}
            </Link>
          </div>
        </div>

        {/* Right: Da Nang City Slideshow in Device Frame */}
        <div className="relative flex justify-center lg:justify-end">
          {/* Gold accent shadow behind frame */}
          <div
            aria-hidden="true"
            className="absolute top-4 right-0 w-[90%] max-w-[460px] aspect-[4/5] rounded-[2.5rem] bg-gov-gold/20 -z-10 translate-x-3"
          />

          {/* Device frame */}
          <div
            className="relative w-full max-w-[460px] aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl border-[5px] border-white ring-1 ring-slate-200/80"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Slides */}
            {DA_NANG_SLIDES.map((slide, i) => (
              <div
                key={i}
                aria-hidden={i !== activeSlide}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  i === activeSlide ? "opacity-100 z-10" : "opacity-0 z-0"
                }`}
              >
                <img
                  src={slide.url}
                  alt={slide.caption[locale as keyof typeof slide.caption]}
                  className="w-full h-full object-cover"
                  loading={i === 0 ? "eager" : "lazy"}
                  width={460}
                  height={575}
                />
                {/* Caption gradient overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent pt-16 pb-14 px-6">
                  <p className="text-white text-sm font-semibold leading-snug drop-shadow">
                    {slide.caption[locale as keyof typeof slide.caption]}
                  </p>
                </div>
              </div>
            ))}

            {/* Dot indicators */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {DA_NANG_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setActiveSlide(i); setIsPaused(true); }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === activeSlide
                      ? "w-7 bg-white shadow-sm"
                      : "w-1.5 bg-white/50 hover:bg-white/80"
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>

            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-black/10 z-20">
              <div
                key={activeSlide}
                className="h-full bg-gov-gold origin-left"
                style={{
                  animation: isPaused ? "none" : "slideProgress 5s linear forwards",
                }}
              />
            </div>
          </div>

          {/* City label badge */}
          <div className="absolute -bottom-4 left-4 bg-white border border-slate-100 shadow-lg rounded-xl px-4 py-2.5 flex items-center gap-2.5 z-20">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--status-success)] animate-pulse shrink-0" />
            <span className="text-xs font-bold text-ink">
              {locale === "vi" ? "Đà Nẵng · Thành phố đáng sống" : "Da Nang · City to Live"}
            </span>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-14">
        {[
          { label: t("home.kpi.total"), value: hasApiData ? apiFeedbacks.length.toString() : kpis.total.toLocaleString(), accent: "border-gov-blue", val: "text-gov-blue", spark: [85, 92, 78, 105, 98, 110, 102, 95, 112, 108, 96, 104] },
          { label: t("home.kpi.resolved"), value: hasApiData ? apiFeedbacks.filter(f => f.status === "RESOLVED").length.toString() : kpis.resolved.toLocaleString(), accent: "border-[var(--status-success)]", val: "text-[var(--status-success)]", spark: [62, 70, 58, 78, 72, 82, 76, 68, 84, 80, 71, 78] },
          { label: t("home.kpi.pending"), value: hasApiData ? apiFeedbacks.filter(f => f.status === "PENDING").length.toString() : kpis.pending.toLocaleString(), accent: "border-[var(--status-pending)]", val: "text-[var(--status-pending)]", spark: [15, 18, 12, 22, 16, 20, 14, 19, 17, 21, 13, 16] },
          { label: t("home.kpi.avg"), value: `${kpis.avgHours} ${locale === "vi" ? "giờ" : "hrs"}`, accent: "border-gov-gold", val: "text-ink", spark: [52, 48, 55, 44, 50, 46, 53, 47, 51, 45, 49, 43] },
        ].map((k, i) => (
          <div key={k.label} className={`card-civic p-5 md:p-6 border-l-4 ${k.accent} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up stagger-${i + 1}`}>
            <div className="text-ink-soft text-xs md:text-sm font-bold uppercase tracking-wider mb-2">{k.label}</div>
            <div className={`text-2xl md:text-3xl font-bold ${k.val}`}>{k.value}</div>
            <Sparkline data={k.spark} color={textClassToHex(k.val)} height={36} />
          </div>
        ))}
      </section>

      {/* Demo banner khi chưa kết nối backend */}
      {!hasApiData && !isLoading && <DemoBanner />}

      {/* Recent + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
        <section className="lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl md:text-3xl font-bold">{t("home.recent")}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => refetch()} disabled={isFetching} className="text-xs text-ink-soft hover:text-gov-blue transition-colors inline-flex items-center gap-1 mr-2" title={locale === "vi" ? "Làm mới" : "Refresh"}>
                <RefreshCw size={12} className={isFetching ? "animate-spin" : ""} />
                {locale === "vi" ? "Làm mới" : "Refresh"}
              </button>
              {[t("home.filter.all"), t("home.filter.env"), t("home.filter.traffic"), t("home.filter.infra")].map(
                (f, i) => (
                  <button
                    key={f}
                    className={`min-h-[44px] px-4 py-2 rounded-md text-sm border font-semibold ${
                      i === 0 ? "bg-gov-blue text-white border-gov-blue" : "bg-white border-slate-200 text-ink hover:border-gov-blue"
                    }`}
                  >
                    {f}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Loading state: skeleton cards */}
          {isLoading && (
            <div className="space-y-5">
              {[1, 2, 3].map((s) => (
                <div key={s} className="card-civic p-5 md:p-6 flex flex-col sm:flex-row gap-5">
                  <div className="flex-1 space-y-3">
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-20 rounded" />
                      <Skeleton className="h-6 w-32 rounded ml-auto" />
                    </div>
                    <Skeleton className="h-7 w-3/4 rounded" />
                    <Skeleton className="h-4 w-full rounded" />
                    <Skeleton className="h-4 w-1/2 rounded" />
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-40 rounded" />
                      <Skeleton className="h-4 w-24 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-5">
            {/* Show API feedbacks if available */}
            {!isLoading && hasApiData && apiFeedbacks.slice(0, 5).map((fb, idx) => (
              <div key={fb.id} className={`card-civic flex flex-col sm:flex-row overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up stagger-${Math.min(idx + 1, 4)}`}>
                <div className="p-5 md:p-6 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <StatusBadge status={mapStatus(fb.status)} />
                    <span className="text-ink-soft text-sm">{new Date(fb.createdAt).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US")}</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-2 text-ink font-sans group-hover:text-gov-blue transition-colors">
                    {fb.title}
                  </h3>
                  <p className="text-ink-soft mb-3 leading-relaxed line-clamp-2">{fb.description}</p>
                  <div className="flex flex-wrap items-center text-sm text-ink-soft gap-4">
                    {fb.addressDetails && (
                      <span className="flex items-center gap-1.5"><MapPin size={16} /> {fb.addressDetails}</span>
                    )}
                    {fb.citizenName && (
                      <span className="flex items-center gap-1.5"><User size={16} /> {fb.citizenName}</span>
                    )}
                    <span className="font-mono text-xs text-ink-soft/70">{fb.trackingCode}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Fallback mock data when no API data */}
            {!isLoading && !hasApiData && mockReports.slice(0, 3).map((r, idx) => (
              <Link
                key={r.id}
                to="/my-reports/$id"
                params={{ id: r.id }}
                className={`card-civic flex flex-col sm:flex-row overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up stagger-${Math.min(idx + 1, 4)}`}
              >
                <div className="sm:w-56 shrink-0 aspect-video sm:aspect-auto bg-slate-100">
                  <img src={r.image} alt={r.title[locale]} loading="lazy" width={400} height={400} className="w-full h-full object-cover" />
                </div>
                <div className="p-5 md:p-6 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <StatusBadge status={r.status} />
                    <span className="text-ink-soft text-sm">{r.createdAt}</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-2 text-ink font-sans group-hover:text-gov-blue transition-colors">
                    {r.title[locale]}
                  </h3>
                  <p className="text-ink-soft mb-3 leading-relaxed">{r.description[locale]}</p>
                  <div className="flex flex-wrap items-center text-sm text-ink-soft gap-4">
                    <span className="flex items-center gap-1.5"><MapPin size={16} /> {r.district}, Đà Nẵng</span>
                    <span className="flex items-center gap-1.5"><User size={16} /> {r.reporter}</span>
                    <span className="font-mono text-xs text-ink-soft/70">{r.id}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <aside className="lg:col-span-4 space-y-6 animate-slide-in-right">
          <div className="card-civic p-6 hover:shadow-md transition-all duration-200">
            <h3 className="text-lg font-bold text-gov-blue mb-4">{t("home.map.title")}</h3>
            <div className="aspect-square rounded-xl overflow-hidden border border-slate-100 mb-4">
              <Suspense fallback={<div className="w-full h-full bg-slate-100 animate-pulse" />}>
                <CivicMap
                  markers={[
                    { position: [16.062, 108.222], title: mockReports[0].title.vi, description: mockReports[0].description.vi, status: mockReports[0].status },
                    { position: [16.080, 108.155], title: mockReports[1].title.vi, description: mockReports[1].description.vi, status: mockReports[1].status },
                    { position: [16.078, 108.158], title: mockReports[2].title.vi, description: mockReports[2].description.vi, status: mockReports[2].status },
                    { position: [16.060, 108.228], title: mockReports[3].title.vi, description: mockReports[3].description.vi, status: mockReports[3].status },
                  ]}
                  height="100%"
                  interactive={false}
                />
              </Suspense>
            </div>
            <Link to="/ward" className="btn-civic btn-civic-ghost w-full">
              {t("home.map.cta")}
            </Link>
          </div>

          <div className="bg-gov-blue rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-3 text-white font-heading">{t("home.hotline.title")}</h3>
              <p className="text-blue-100 mb-6 leading-relaxed">{t("home.hotline.body")}</p>
              <a href="tel:1022" className="inline-block text-3xl font-bold text-gov-gold tracking-widest hover:underline">
                (0236) 1022
              </a>
            </div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full" />
            <div className="absolute -right-4 -top-8 w-24 h-24 bg-gov-gold/10 rounded-full" />
          </div>

          <div className="card-civic p-6">
            <DaNangNews />
          </div>
        </aside>
      </div>
    </div>
  );
}
