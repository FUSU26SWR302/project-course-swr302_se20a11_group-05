import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import type { ElementType, ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  Facebook,
  Heart,
  Lock,
  Map,
  MapPin,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Package,
  Send,
  ShieldCheck,
  Users,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import {
  useApproveCampaign,
  useApproveCampaignParticipant,
  useCampaignChat,
  useCampaignComments,
  useCampaignDetail,
  useCampaignParticipants,
  useJoinCampaign,
  useRejectCampaignParticipant,
} from "@/hooks/useCampaigns";
import type { CampaignParticipantResponse } from "@/lib/api";
import { Role, useAuth } from "@/lib/auth";
import type { Campaign } from "@/lib/campaignStore";
import { buildGoogleMapsEmbedUrl, buildGoogleMapsSearchUrl, resolveCampaignCoordinates } from "@/lib/campaignLocation";

export const Route = createFileRoute("/campaigns/$id")({
  head: () => ({
    meta: [
      { title: "Chi tiết chiến dịch - Đà Nẵng Kết Nối" },
      {
        name: "description",
        content: "Thông tin chi tiết chiến dịch cộng đồng.",
      },
    ],
  }),
  component: CampaignDetailPage,
});

const defaultHeroImage = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&auto=format&fit=crop&q=85";

function CampaignDetailPage() {
  const { id } = Route.useParams();
  const isGroupChatRoute = useRouterState({
    select: (state) => state.location.pathname.endsWith("/group-chat"),
  });
  const campaign = useCampaignDetail(id);
  const { user, isAuthenticated } = useAuth();
  const joinCampaign = useJoinCampaign();
  const approveCampaign = useApproveCampaign();

  if (isGroupChatRoute) {
    return <Outlet />;
  }

  if (!campaign) {
    return (
      <main className="min-h-screen bg-[#F8F7FF] px-4 py-10">
        <section className="mx-auto max-w-3xl rounded-2xl border border-violet-100 bg-white p-8 text-center shadow-md">
          <h1 className="text-2xl font-black text-slate-900">Không tìm thấy chiến dịch</h1>
          <Link to="/campaigns" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#7C3AED]">
            <ArrowLeft size={16} />
            Quay lại danh sách
          </Link>
        </section>
      </main>
    );
  }

  const progressPercent = campaign.target > 0 ? Math.min(100, Math.round((campaign.participants / campaign.target) * 100)) : 0;
  const approvedStatus = campaign.currentUserJoinStatus === "APPROVED";

  const handleJoin = async () => {
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

  const handleApprove = async () => {
    await approveCampaign.mutateAsync(campaign.id);
    toast.success("Đã phê duyệt chiến dịch và mở đăng ký.");
  };

  return (
    <main className="min-h-screen bg-[#F8F7FF] pb-16 text-slate-950">
      <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <Link to="/campaigns" className="inline-flex items-center gap-2 text-sm font-black text-slate-600 transition hover:text-[#6D28D9]">
            <ArrowLeft size={16} />
            Chiến dịch
          </Link>
          <StatusBadge status={campaign.status} />
        </div>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,65fr)_minmax(320px,35fr)]">
          <article className="space-y-6">
            <div className="relative aspect-[21/9] overflow-hidden rounded-2xl shadow-lg">
              <img src={campaign.cover || defaultHeroImage} alt={campaign.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <h1 className="absolute bottom-6 left-6 right-6 text-2xl font-black leading-tight text-white md:text-[28px]">{campaign.name}</h1>
            </div>

            <section className="rounded-2xl border border-violet-100 bg-white p-7 shadow-md">
              <p className="text-base leading-8 text-slate-600">{campaign.desc || "Chưa có mô tả công khai."}</p>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <InfoTile icon={MapPin} label="Khu vực" value={campaign.locationText || campaign.ward} />
                <InfoTile icon={Users} label="Người tham gia" value={`${campaign.participants}/${campaign.target}`} />
                <InfoTile icon={CalendarDays} label="Thời gian" value={dateRange(campaign)} />
              </div>

              <div className="mt-7 rounded-xl bg-[#F3F0FF] p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-slate-900">Tiến độ tuyển quân</p>
                    <p className="text-xs font-semibold text-slate-500">Cập nhật theo số lượng người được duyệt tham gia.</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#7C3AED] shadow-sm">
                    {campaign.participants}/{campaign.target} ({progressPercent}%)
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-[#10B981] transition-all duration-700" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            </section>

            <Panel title="Về chiến dịch này" icon={ListIcon}>
              <p className="text-sm leading-7 text-slate-600">
                Chiến dịch được phát động nhằm kêu gọi cộng đồng chung tay dọn dẹp bãi biển Xuân Thiều, một trong những bãi biển đẹp của Đà Nẵng.
                Hoạt động gồm thu gom rác thải nhựa, phân loại rác tại chỗ, trồng cây ven biển và tuyên truyền bảo vệ môi trường. Đây là cơ hội để
                người dân Đà Nẵng thể hiện tình yêu quê hương và ý thức bảo vệ thiên nhiên.
              </p>
            </Panel>

            {campaign.privateDetailsVisible ? (
              <PrivateDetails campaign={campaign} />
            ) : (
              <section className="rounded-2xl border border-dashed border-amber-200 bg-[#FFFBF0] p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                    <Lock size={20} />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-900">Thông tin nội bộ được bảo mật</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Vị trí tập trung cụ thể, dụng cụ, liên hệ ban tổ chức và group chat chỉ hiển thị cho người đã được duyệt tham gia hoặc người quản lý chiến dịch.
                    </p>
                  </div>
                </div>
              </section>
            )}

            <MapPanel campaign={campaign} />
            <DiscussionPanel campaign={campaign} />
          </article>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            {user?.role === Role.SUPER_ADMIN && campaign.status === "pending_review" && (
              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-lg">
                <div className="mb-3 flex items-center gap-2 font-black text-amber-800">
                  <ShieldCheck size={18} />
                  Cần phê duyệt
                </div>
                <p className="mb-4 text-sm leading-6 text-amber-800">
                  Chiến dịch đang chờ lãnh đạo thành phố phê duyệt trước khi mở đăng ký cho người dân.
                </p>
                <button
                  onClick={handleApprove}
                  disabled={approveCampaign.isPending}
                  className="h-11 w-full rounded-xl bg-amber-600 text-sm font-black text-white transition hover:brightness-110 disabled:opacity-60"
                >
                  Phê duyệt và mở đăng ký
                </button>
              </section>
            )}

            <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-500">Hành động</h2>
              {campaign.status === "recruiting" && (
                <button
                  onClick={handleJoin}
                  disabled={joinCampaign.isPending || !campaign.canJoin}
                  className="h-12 w-full rounded-xl bg-[#7C3AED] text-sm font-black text-white shadow-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {campaign.currentUserJoinStatus === "PENDING" ? "Đang chờ duyệt" : "Đăng ký tham gia"}
                </button>
              )}

              {campaign.currentUserJoinStatus && (
                <div className="mt-4 inline-flex w-full items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
                  <CheckCircle2 size={16} />
                  Trạng thái: {joinLabel(campaign.currentUserJoinStatus)}
                </div>
              )}

              <div className="mt-4 inline-flex w-full items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-black text-amber-700">
                <Clock3 size={16} />
                {campaign.daysLeft > 0 ? `Còn ${campaign.daysLeft} ngày để đăng ký` : "Đợt đăng ký đã kết thúc"}
              </div>

              {!isAuthenticated && (
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Đăng nhập để đăng ký tham gia, bình luận và truy cập group chat khi được duyệt.
                </p>
              )}
            </section>

            {campaign.canManage && <ParticipantReviewPanel campaignId={campaign.id} />}

            <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-500">Người phụ trách</h2>
              <div className="flex items-center gap-3">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-[#F3F0FF] text-lg font-black text-[#7C3AED]">CB</div>
                <div>
                  <p className="font-black text-slate-900">{campaign.createdBy}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{campaign.ward}</p>
                </div>
              </div>
              <button type="button" className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-violet-200 text-sm font-black text-[#7C3AED] transition hover:bg-[#F3F0FF]">
                <MessageCircle size={16} />
                Nhắn tin
              </button>
            </section>

            <GroupChatNavigationCard campaign={campaign} approvedStatus={approvedStatus} />
            <ShareCard />
          </aside>
        </section>
      </div>
    </main>
  );
}

function ParticipantReviewPanel({ campaignId }: { campaignId: string }) {
  const participantsQuery = useCampaignParticipants(campaignId);
  const approveParticipant = useApproveCampaignParticipant(campaignId);
  const rejectParticipant = useRejectCampaignParticipant(campaignId);
  const participants = participantsQuery.data ?? [];
  const pendingParticipants = participants.filter((participant) => participant.joinStatus === "PENDING");

  const handleApprove = async (participant: CampaignParticipantResponse) => {
    await approveParticipant.mutateAsync(participant.id);
    toast.success(`Đã duyệt ${participant.citizenName} vào chiến dịch.`);
  };

  const handleReject = async (participant: CampaignParticipantResponse) => {
    const reason = window.prompt("Nhập lý do từ chối yêu cầu tham gia:", "");
    if (reason === null) return;

    await rejectParticipant.mutateAsync({
      participantId: participant.id,
      reason: reason.trim() || undefined,
    });
    toast.success(`Đã từ chối yêu cầu của ${participant.citizenName}.`);
  };

  return (
    <section className="rounded-2xl border border-violet-100 bg-white p-5 shadow-lg">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-500">Yêu cầu tham gia</h2>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">{pendingParticipants.length} chờ duyệt</span>
      </div>

      {participantsQuery.isLoading ? (
        <p className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-500">Đang tải yêu cầu...</p>
      ) : pendingParticipants.length === 0 ? (
        <p className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-500">Chưa có yêu cầu tham gia đang chờ duyệt.</p>
      ) : (
        <div className="space-y-3">
          {pendingParticipants.map((participant) => (
            <div key={participant.id} className="rounded-xl border border-slate-200 p-3">
              <div className="mb-3">
                <p className="font-black text-slate-900">{participant.citizenName}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">Gửi lúc {formatDateTime(participant.createdAt)}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleReject(participant)}
                  disabled={rejectParticipant.isPending || approveParticipant.isPending}
                  className="h-9 rounded-lg border border-red-200 bg-red-50 text-xs font-black text-red-700 disabled:opacity-50"
                >
                  Từ chối
                </button>
                <button
                  type="button"
                  onClick={() => handleApprove(participant)}
                  disabled={approveParticipant.isPending || rejectParticipant.isPending}
                  className="h-9 rounded-lg bg-emerald-600 text-xs font-black text-white disabled:opacity-50"
                >
                  Duyệt
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function PrivateDetails({ campaign }: { campaign: Campaign }) {
  return (
    <section className="rounded-2xl border border-amber-300 bg-[#FFFBF0] p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-lg font-black text-slate-950">
        <Lock size={18} className="text-amber-600" />
        Thông tin nội bộ
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <InfoTile icon={MapPin} label="Điểm tập kết" value={campaign.privateLocationText || "Chưa cập nhật"} />
        <InfoTile icon={Package} label="Dụng cụ" value={campaign.requiredTools || "Chưa cập nhật"} />
        <InfoTile icon={Users} label="Liên hệ" value={campaign.organizerContact || "Chưa cập nhật"} />
      </div>
    </section>
  );
}

function MapPanel({ campaign }: { campaign: Campaign }) {
  const coordinates = resolveCampaignCoordinates(campaign);
  const displayLocation = campaign.locationText || coordinates.label;

  return (
    <Panel title="Vị trí hoạt động" icon={MapPin}>
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <iframe
          title={displayLocation}
          src={buildGoogleMapsEmbedUrl(coordinates)}
          className="h-80 w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-600">{displayLocation}</p>
          <a
            href={buildGoogleMapsSearchUrl(coordinates)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-violet-200 px-4 text-sm font-black text-[#7C3AED] transition hover:bg-[#F3F0FF]"
          >
            <Map size={16} />
            Xem trên Google Maps
          </a>
        </div>
      </div>
    </Panel>
  );
}
function DiscussionPanel({ campaign }: { campaign: Campaign }) {
  const comments = useCampaignComments(campaign.id);
  const [commentText, setCommentText] = useState("");
  const fallbackComments = [
    { id: "mock-1", authorName: "Nguyễn Văn A", createdAt: "10:30", content: "Mình đã đăng ký rồi, rất mong được tham gia!" },
    { id: "mock-2", authorName: "Trần Thị B", createdAt: "11:15", content: "Chiến dịch ý nghĩa quá, ủng hộ 100%!" },
    { id: "mock-3", authorName: "Lê Văn C", createdAt: "14:00", content: "Cho mình hỏi có cần mang theo đồ ăn không ạ?" },
  ];
  const visibleComments = comments.data?.length ? comments.data : fallbackComments;

  const submitComment = async () => {
    if (!commentText.trim()) return;
    await comments.addComment.mutateAsync(commentText.trim());
    setCommentText("");
  };

  return (
    <Panel title="Bình luận chiến dịch" icon={MessageCircle}>
      <div className="mb-4 space-y-3">
        {visibleComments.map((comment) => (
          <div key={comment.id} className="flex gap-3 rounded-xl border border-slate-100 bg-white p-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#F3F0FF] text-xs font-black text-[#7C3AED]">
              {comment.authorName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-black text-slate-900">{comment.authorName}</p>
                <span className="text-xs font-semibold text-slate-400">{comment.createdAt ? formatDisplayTime(comment.createdAt) : ""}</span>
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-600">{comment.content}</p>
              <button type="button" className="mt-2 inline-flex items-center gap-1.5 text-xs font-black text-slate-500 transition hover:text-[#7C3AED]">
                <Heart size={14} />
                Like
              </button>
            </div>
          </div>
        ))}
      </div>
      {campaign.canComment && (
        <Composer
          value={commentText}
          onChange={setCommentText}
          onSubmit={submitComment}
          disabled={comments.addComment.isPending}
          placeholder="Nhập bình luận..."
        />
      )}
    </Panel>
  );
}

function GroupChatNavigationCard({ campaign, approvedStatus }: { campaign: Campaign; approvedStatus: boolean }) {
  const chat = useCampaignChat(campaign.id);
  const memberCount = Math.max(1, campaign.participants || 0);
  const latest = chat.data?.at(-1);
  const latestPreview = latest
    ? `${latest.senderName}: ${latest.message}`
    : "Cán Bộ Phường 1: Chiến dịch sẽ bắt đầu lúc 6h sáng 19/6.";
  const avatars = ["CB", "A", "B"];

  return (
    <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-black text-slate-950">
          <MessageSquare size={17} className="text-[#7C3AED]" />
          Nhóm chat chiến dịch
        </h2>
        {approvedStatus && <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-red-600">Tin mới</span>}
      </div>
      <div className="flex -space-x-2">
        {avatars.map((avatar) => (
          <span key={avatar} className="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-[#F3F0FF] text-xs font-black text-[#7C3AED] shadow-sm">
            {avatar}
          </span>
        ))}
      </div>
      <p className="mt-4 text-sm font-black text-slate-900">{memberCount} thành viên đang trong nhóm</p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-500">{latestPreview}</p>
      <Link
        to="/campaigns/$id/group-chat"
        params={{ id: campaign.id }}
        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 text-sm font-black text-white shadow-sm transition hover:brightness-110"
      >
        Vào nhóm chat
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}

function ShareCard() {
  return (
    <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-lg">
      <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-500">Chia sẻ chiến dịch</h2>
      <div className="grid grid-cols-3 gap-3">
        <IconButton label="Facebook" icon={Facebook} />
        <IconButton label="Zalo" text="Z" />
        <IconButton label="Copy link" icon={Copy} />
      </div>
    </section>
  );
}

function IconButton({ label, icon: Icon, text }: { label: string; icon?: ElementType; text?: string }) {
  return (
    <button
      type="button"
      className="grid h-11 place-items-center rounded-xl border border-violet-100 bg-[#F8F7FF] text-sm font-black text-[#7C3AED] transition hover:bg-[#F3F0FF]"
      aria-label={label}
      title={label}
    >
      {Icon ? <Icon size={18} /> : text}
    </button>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: ElementType; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-md">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-slate-950">
        <Icon size={20} className="text-[#7C3AED]" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function Composer({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder: string;
}) {
  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled}
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#7C3AED] text-white transition hover:brightness-110 disabled:opacity-50"
      >
        <Send size={17} />
      </button>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-violet-100 bg-[#F3F0FF] p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#7C3AED]">
        <Icon size={15} />
        {label}
      </div>
      <p className="text-sm font-bold leading-6 text-slate-900">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: Campaign["status"] }) {
  const meta = {
    pending_review: { label: "Chờ duyệt", className: "border-slate-200 bg-slate-100 text-slate-600" },
    recruiting: { label: "Đang tuyển", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    inProgress: { label: "Đang thực hiện", className: "border-blue-200 bg-blue-50 text-blue-700" },
    completed: { label: "Hoàn thành", className: "border-violet-200 bg-violet-50 text-[#7C3AED]" },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-black shadow-sm ${meta.className}`}>
      <CheckCircle2 size={13} />
      {meta.label}
    </span>
  );
}

function ListIcon(props: React.ComponentProps<typeof MoreHorizontal>) {
  return <MoreHorizontal {...props} />;
}

function dateRange(campaign: Campaign) {
  const start = campaign.startTime ? new Date(campaign.startTime).toLocaleDateString("vi-VN") : "Chưa đặt";
  const end = campaign.endTime ? new Date(campaign.endTime).toLocaleDateString("vi-VN") : "Chưa đặt";
  return `${start} - ${end}`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDisplayTime(value: string) {
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  return formatDateTime(value);
}

function joinLabel(status: NonNullable<Campaign["currentUserJoinStatus"]>) {
  if (status === "APPROVED") return "Đã được duyệt";
  if (status === "PENDING") return "Chờ duyệt";
  if (status === "REJECTED") return "Bị từ chối";
  return "Đã hủy";
}
