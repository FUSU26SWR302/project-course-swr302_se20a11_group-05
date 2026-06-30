import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Grid3X3,
  LayoutList,
  Leaf,
  ListChecks,
  MapPin,
  Megaphone,
  Plus,
  Search,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useCampaignList, useJoinCampaign } from "@/hooks/useCampaigns";
import { Role, useAuth } from "@/lib/auth";
import type { Campaign, CampaignCategory } from "@/lib/campaignStore";
import heroBg from "@/assets/campaign-hero-bg.jpg";

export const Route = createFileRoute("/campaigns/")({
  head: () => ({
    meta: [
      { title: "Chiến dịch cộng đồng - Đà Nẵng Kết Nối" },
      {
        name: "description",
        content: "Danh sách chiến dịch cộng đồng tại Đà Nẵng.",
      },
    ],
  }),
  component: CampaignList,
});

const statusOptions = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "recruiting", label: "Đang tuyển" },
  { value: "inProgress", label: "Đang thực hiện" },
  { value: "completed", label: "Hoàn thành" },
  { value: "pending_review", label: "Chờ duyệt" },
];

const categoryOptions: { value: "all" | CampaignCategory; label: string }[] = [
  { value: "all", label: "Tất cả lĩnh vực" },
  { value: "environment", label: "Môi trường" },
  { value: "infrastructure", label: "Hạ tầng" },
  { value: "public_safety", label: "An toàn cộng đồng" },
  { value: "construction", label: "Xây dựng" },
  { value: "fire_safety", label: "PCCC" },
];

const categoryLabel: Record<CampaignCategory, string> = {
  environment: "Môi trường",
  infrastructure: "Hạ tầng",
  public_safety: "An toàn",
  construction: "Xây dựng",
  fire_safety: "PCCC",
};

const categoryIcon: Record<CampaignCategory, typeof Leaf> = {
  environment: Leaf,
  infrastructure: MapPin,
  public_safety: Users,
  construction: Zap,
  fire_safety: Sparkles,
};

const mockImages = [
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&auto=format&fit=crop&q=80",
];

function CampaignList() {
  const campaigns = useCampaignList();
  const { user, isAuthenticated } = useAuth();
  const joinCampaign = useJoinCampaign();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState<"all" | CampaignCategory>("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return campaigns.filter((campaign) => {
      const matchesSearch =
        !keyword ||
        campaign.name.toLowerCase().includes(keyword) ||
        campaign.ward.toLowerCase().includes(keyword) ||
        campaign.desc.toLowerCase().includes(keyword) ||
        (campaign.locationText ?? "").toLowerCase().includes(keyword);
      const matchesStatus = status === "all" || campaign.status === status;
      const matchesCategory = category === "all" || campaign.category === category;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [campaigns, search, status, category]);

  const canCreate = isAuthenticated && user?.role === Role.WARD_STAFF;

  const handleJoin = async (campaign: Campaign) => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để tham gia chiến dịch.");
      return;
    }
    if (!campaign.canJoin) {
      toast.error("Chiến dịch hiện không mở đăng ký.");
      return;
    }
    await joinCampaign.mutateAsync(campaign.id);
    toast.success("Đã gửi yêu cầu tham gia, vui lòng chờ người quản lý duyệt.");
  };

  const stats = [
    { label: "Tất cả chiến dịch", value: campaigns.length, icon: ListChecks, color: "#7C3AED", border: "border-l-[#7C3AED]" },
    {
      label: "Đang tuyển quân",
      value: campaigns.filter((c) => c.status === "recruiting").length,
      icon: Megaphone,
      color: "#10B981",
      border: "border-l-[#10B981]",
    },
    {
      label: "Đang thực hiện",
      value: campaigns.filter((c) => c.status === "inProgress").length,
      icon: Zap,
      color: "#3B82F6",
      border: "border-l-[#3B82F6]",
    },
    {
      label: "Hoàn thành",
      value: campaigns.filter((c) => c.status === "completed").length,
      icon: CheckCircle2,
      color: "#6B7280",
      border: "border-l-[#6B7280]",
    },
  ];

  return (
    <main className="min-h-screen bg-[#F8F7FF] pb-16 text-slate-950">
      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        <section 
          className="relative mb-10 overflow-hidden rounded-[28px] p-8 shadow-2xl md:p-12 min-h-[440px] flex items-center border border-white/10"
        >
          {/* Blurred realistic background image */}
          <div 
            className="absolute inset-0 bg-cover bg-center blur-[4px] scale-[1.03] pointer-events-none" 
            style={{ backgroundImage: `url(${heroBg})` }}
          />
          {/* Uniform light overlay to ensure text contrast while revealing the full background */}
          <div className="absolute inset-0 bg-slate-950/30 pointer-events-none" />
          
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 grid gap-10 lg:grid-cols-[45%_55%] items-center w-full">
            {/* Left content area */}
            <div className="flex flex-col items-start text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-black uppercase tracking-[0.15em] text-violet-200 backdrop-blur-md border border-white/10">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Chiến dịch đã phê duyệt
              </div>
              
              <h1 className="mt-5 text-4xl sm:text-5xl font-black tracking-tight text-white leading-[1.15]">
                Chiến dịch <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-violet-200 via-indigo-100 to-white bg-clip-text text-transparent">cộng đồng</span>
              </h1>
              
              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300 font-medium">
                Xem các chiến dịch đã được phê duyệt, đăng ký tham gia và theo dõi tiến độ cải thiện đô thị tại địa phương của bạn.
              </p>

              <div className="mt-8 flex flex-wrap gap-4 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setStatus("recruiting");
                    document.getElementById("campaigns-list")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-6 text-sm font-black text-white shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 hover:shadow-indigo-500/40 active:translate-y-0 cursor-pointer"
                >
                  <Users size={16} />
                  Tham gia chiến dịch
                </button>
                <button
                  onClick={() => {
                    setStatus("inProgress");
                    document.getElementById("campaigns-list")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/20 px-6 text-sm font-black text-white backdrop-blur-md transition-all hover:bg-white/20 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  <Clock3 size={16} />
                  Xem tiến độ
                </button>
              </div>
            </div>

            {/* Right illustration + floating cards */}
            <div className="relative flex justify-center lg:justify-end items-center h-[320px] lg:h-[360px] w-full select-none">
              {/* Main vector graphic */}
              <div className="relative w-full max-w-[480px] h-full flex items-center justify-center">
                <VolunteerIllustration />
              </div>

              {/* Floating Card 1: Social Proof / Participants */}
              <div className="absolute top-4 left-0 sm:left-4 md:left-8 backdrop-blur-lg bg-slate-900/40 border border-white/10 shadow-2xl rounded-2xl p-3 flex items-center gap-3 text-white transition-all hover:scale-105 duration-300 hover:border-white/20">
                <div className="flex -space-x-2.5">
                  <img className="h-8 w-8 rounded-full border-2 border-slate-900 object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=60" alt="Participant" />
                  <img className="h-8 w-8 rounded-full border-2 border-slate-900 object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=60" alt="Participant" />
                  <img className="h-8 w-8 rounded-full border-2 border-slate-900 object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=60" alt="Participant" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-violet-200 tracking-wider uppercase">Đồng hành</span>
                  <span className="text-xs font-black text-white">1.248 người đã tham gia</span>
                </div>
                <div className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              {/* Floating Card 2: Progress & Interest */}
              <div className="absolute bottom-4 right-0 sm:right-4 backdrop-blur-lg bg-slate-900/40 border border-white/10 shadow-2xl rounded-2xl p-4 text-white w-[200px] transition-all hover:scale-105 duration-300 hover:border-white/20">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-300 tracking-wider uppercase">Chiến dịch xanh</span>
                  <button className="text-rose-400 hover:text-rose-500 transition-colors">
                    <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </button>
                </div>
                <p className="mt-1 text-sm font-black text-white">82% hoàn thành</p>
                <div className="h-1.5 w-full bg-white/20 rounded-full mt-2.5 overflow-hidden">
                  <div className="h-full w-[82%] bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="campaigns-list" className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className={`rounded-xl border border-white bg-white p-5 shadow-md border-l-4 ${stat.border}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{stat.label}</p>
                    <p className="mt-2 text-3xl font-black" style={{ color: stat.color }}>
                      {stat.value}
                    </p>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#F3F0FF]">
                    <Icon size={20} style={{ color: stat.color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="mb-6 rounded-xl border border-violet-100 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_190px_190px_auto]">
            <label className="relative block">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-3 text-sm outline-none transition focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
                placeholder="Tìm theo tên, phường hoặc mô tả..."
              />
            </label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as "all" | CampaignCategory)}
              className="h-12 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold outline-none transition focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-12 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold outline-none transition focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="inline-flex h-12 rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setView("grid")}
                className={`grid h-10 w-10 place-items-center rounded-md transition ${view === "grid" ? "bg-white text-[#7C3AED] shadow-sm" : "text-slate-500"}`}
                aria-label="Hiển thị dạng lưới"
              >
                <Grid3X3 size={17} />
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={`grid h-10 w-10 place-items-center rounded-md transition ${view === "list" ? "bg-white text-[#7C3AED] shadow-sm" : "text-slate-500"}`}
                aria-label="Hiển thị dạng danh sách"
              >
                <LayoutList size={18} />
              </button>
            </div>
          </div>
        </section>

        <section className={view === "grid" ? "grid gap-6 lg:grid-cols-2" : "grid gap-5"}>
          {filtered.map((campaign, index) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              image={campaign.cover || mockImages[index % mockImages.length]}
              compact={view === "list"}
              isJoining={joinCampaign.isPending}
              onJoin={() => handleJoin(campaign)}
            />
          ))}
        </section>

        {filtered.length === 0 && (
          <div className="mt-6 rounded-xl border border-dashed border-violet-200 bg-white p-10 text-center text-sm font-semibold text-slate-500">
            Chưa có chiến dịch phù hợp với bộ lọc hiện tại.
          </div>
        )}
      </div>
    </main>
  );
}

function CampaignCard({
  campaign,
  image,
  compact,
  isJoining,
  onJoin,
}: {
  campaign: Campaign;
  image: string;
  compact: boolean;
  isJoining: boolean;
  onJoin: () => void;
}) {
  const progressPercent = campaign.target > 0 ? Math.min(100, Math.round((campaign.participants / campaign.target) * 100)) : 0;
  const CategoryIcon = categoryIcon[campaign.category] ?? Leaf;

  return (
    <article
      className={`overflow-hidden rounded-xl border border-violet-100 bg-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
        compact ? "grid md:grid-cols-[280px_1fr]" : ""
      }`}
    >
      <div className={`relative bg-slate-100 ${compact ? "min-h-56 md:min-h-full" : "aspect-video"}`}>
        <img src={image} alt={campaign.name} className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute left-4 top-4">
          <StatusBadge status={campaign.status} />
        </div>
        <div className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/90 px-3 py-1 text-xs font-black text-slate-700 shadow-sm backdrop-blur">
          <CategoryIcon size={14} className="text-emerald-600" />
          {categoryLabel[campaign.category] ?? "Khác"}
        </div>
      </div>

      <div className="p-5">
        <Link
          to="/campaigns/$id"
          params={{ id: campaign.id }}
          className="line-clamp-2 text-lg font-black leading-7 text-slate-950 transition hover:text-[#6D28D9]"
        >
          {campaign.name}
        </Link>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{campaign.desc || "Chưa có mô tả công khai."}</p>

        <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={14} />
            {campaign.locationText || campaign.ward}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users size={14} />
            {campaign.participants}/{campaign.target} người
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 size={14} />
            {campaign.daysLeft > 0 ? `Còn ${campaign.daysLeft} ngày` : "Đã kết thúc"}
          </span>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs font-black text-slate-600">
            <span>Tiến độ tuyển quân</span>
            <span>
              {campaign.participants}/{campaign.target} ({progressPercent}%)
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-[#10B981] transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {campaign.currentUserJoinStatus && (
          <div className="mt-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
            {joinLabel(campaign.currentUserJoinStatus)}
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link
            to="/campaigns/$id"
            params={{ id: campaign.id }}
            className={campaign.status === "pending_review" ? "col-span-2 inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 text-sm font-black text-slate-700 transition hover:bg-slate-50" : "inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 text-sm font-black text-slate-700 transition hover:bg-slate-50"}
          >
            Chi tiết
          </Link>
          {campaign.status !== "pending_review" && (
            <button
              type="button"
              onClick={onJoin}
              disabled={isJoining || !campaign.canJoin || campaign.status !== "recruiting"}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#7C3AED] text-sm font-black text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Tham gia
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: Campaign["status"] }) {
  const meta = {
    pending_review: { label: "Chờ duyệt", className: "border-slate-200 bg-slate-100 text-slate-600" },
    recruiting: { label: "Đang tuyển", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    inProgress: { label: "Đang thực hiện", className: "border-amber-200 bg-amber-50 text-amber-700" },
    completed: { label: "Hoàn thành", className: "border-violet-200 bg-violet-50 text-[#7C3AED]" },
  }[status];

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black shadow-sm ${meta.className}`}>{meta.label}</span>;
}

function VolunteerIllustration() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 500 360" className="w-full h-full max-w-[460px] drop-shadow-2xl">
        <defs>
          <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="groundGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Ambient background glow */}
        <circle cx="250" cy="180" r="140" fill="url(#skyGrad)" />

        {/* Stylized background trees/bushes */}
        <g opacity="0.35">
          <path d="M50 300 C80 240, 120 240, 150 300 Z" fill="#059669" />
          <path d="M120 310 C160 220, 220 220, 260 310 Z" fill="#047857" />
          <path d="M380 300 C410 250, 440 250, 470 300 Z" fill="#047857" />
          <path d="M320 315 C350 230, 400 230, 430 315 Z" fill="#065F46" />
        </g>

        {/* Smooth park ground line */}
        <path d="M20 300 Q250 330 480 300 T480 330 L20 330 Z" fill="url(#groundGrad)" />

        {/* --- Volunteer 1: Planting a Tree (Left side) --- */}
        <g transform="translate(60, 160)">
          {/* Plant/Sapling */}
          <path d="M80 140 Q80 110 85 90 T95 60" fill="none" stroke="#34D399" strokeWidth="4" strokeLinecap="round" />
          <path d="M85 90 C70 85, 60 95, 75 100 Z" fill="#10B981" />
          <path d="M87 75 C100 70, 105 85, 90 85 Z" fill="#059669" />
          {/* Soil/Pot */}
          <ellipse cx="80" cy="140" rx="18" ry="6" fill="#78350F" />
          
          {/* Person Kneeling */}
          {/* Legs/knees */}
          <path d="M25 140 Q35 125 50 125 T70 140" fill="none" stroke="#818CF8" strokeWidth="10" strokeLinecap="round" />
          {/* Torso */}
          <path d="M35 125 Q25 90 40 80 T65 110" fill="none" stroke="#E0E7FF" strokeWidth="16" strokeLinecap="round" />
          {/* Arms reaching down to plant */}
          <path d="M35 90 C45 95, 60 115, 75 125" fill="none" stroke="#FEE2E2" strokeWidth="6" strokeLinecap="round" />
          {/* Head */}
          <circle cx="32" cy="62" r="11" fill="#FCA5A5" />
          {/* Hair */}
          <path d="M22 62 C22 52, 42 52, 42 62 Z" fill="#1E1B4B" />
        </g>

        {/* --- Volunteer 2: Cleaning the Park with Grabber (Middle-Right) --- */}
        <g transform="translate(240, 120)">
          {/* Trash bag / Bin */}
          <path d="M95 180 C95 155, 120 155, 120 180 Z" fill="#64748B" />
          {/* Person Standing/Bending */}
          {/* Legs */}
          <path d="M40 180 L45 140 M60 180 L55 140" stroke="#475569" strokeWidth="8" strokeLinecap="round" />
          {/* Torso */}
          <path d="M50 140 Q40 90 55 80" fill="none" stroke="#10B981" strokeWidth="18" strokeLinecap="round" />
          {/* Head */}
          <circle cx="60" cy="60" r="11" fill="#FED7AA" />
          {/* Cap */}
          <path d="M50 56 C50 48, 70 48, 70 56 L76 58 Z" fill="#3B82F6" />
          {/* Grabber Tool & arm */}
          <path d="M42 95 Q20 120 5 160" fill="none" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
          {/* Arm holding tool */}
          <path d="M45 95 C30 100, 25 115, 20 120" fill="none" stroke="#FED7AA" strokeWidth="6" strokeLinecap="round" />
          {/* Small trash piece being picked up */}
          <circle cx="4" cy="162" r="3" fill="#F87171" />
        </g>

        {/* --- Volunteer 3: Holding Donation/Support Box (Center-Left) --- */}
        <g transform="translate(150, 100)">
          {/* Legs */}
          <path d="M45 200 L45 155 M60 200 L60 155" stroke="#312E81" strokeWidth="8" strokeLinecap="round" />
          {/* Torso */}
          <path d="M52 155 L52 110" stroke="#F59E0B" strokeWidth="20" strokeLinecap="round" />
          {/* Donation Box */}
          <rect x="28" y="115" width="48" height="34" rx="4" fill="#D97706" stroke="#FCD34D" strokeWidth="2" />
          <path d="M52 125 C47 125, 47 132, 52 132 C57 132, 57 125, 52 125" fill="#EF4444" /> {/* Heart symbol on box */}
          {/* Arms holding box */}
          <path d="M38 100 Q25 110 32 130" fill="none" stroke="#FDBA74" strokeWidth="6" strokeLinecap="round" />
          <path d="M66 100 Q75 110 68 130" fill="none" stroke="#FDBA74" strokeWidth="6" strokeLinecap="round" />
          {/* Head */}
          <circle cx="52" cy="84" r="11" fill="#FDBA74" />
          {/* Hair */}
          <path d="M41 84 C41 74, 63 74, 63 84 Z" fill="#78350F" />
        </g>

        {/* Decorative Map Pins & Connection Waves */}
        <g transform="translate(380, 80)" opacity="0.85">
          {/* Floating Map Pin */}
          <path d="M20 10 Q20 30 35 45 Q50 30 50 10 A15 15 0 0 0 20 10 Z" fill="#EF4444" />
          <circle cx="35" cy="18" r="6" fill="#ffffff" />
          <path d="M35 45 L35 60" stroke="#EF4444" strokeWidth="3" strokeDasharray="3 3" />
        </g>

        <g transform="translate(70, 70)" opacity="0.75">
          {/* Floating Heart / Like Icon */}
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#EC4899" />
        </g>
      </svg>
    </div>
  );
}

function joinLabel(status: NonNullable<Campaign["currentUserJoinStatus"]>) {
  if (status === "APPROVED") return "Đã duyệt tham gia";
  if (status === "PENDING") return "Chờ duyệt tham gia";
  if (status === "REJECTED") return "Bị từ chối";
  return "Đã hủy";
}
