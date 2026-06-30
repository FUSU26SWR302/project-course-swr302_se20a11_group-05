import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { ElementType, FormEvent, ReactNode } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  Check,
  ClipboardList,
  Eye,
  Lightbulb,
  Lock,
  MapPin,
  Package,
  Rocket,
  Save,
  Search,
  Send,
  ShieldCheck,
  Upload,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useCreateCampaign } from "@/hooks/useCampaigns";
import { Role, useAuth } from "@/lib/auth";
import type { CampaignCategory } from "@/lib/campaignStore";
import { buildGoogleMapsEmbedUrl, resolveCampaignCoordinatesFromText } from "@/lib/campaignLocation";

export const Route = createFileRoute("/campaigns/create")({
  head: () => ({
    meta: [
      { title: "Tạo chiến dịch cộng đồng - Đà Nẵng Kết Nối" },
      {
        name: "description",
        content: "Biểu mẫu tạo chiến dịch cộng đồng dành cho cán bộ phường.",
      },
    ],
  }),
  component: CreateCampaignPage,
});

const categories: { value: CampaignCategory; label: string }[] = [
  { value: "environment", label: "Môi trường" },
  { value: "infrastructure", label: "Hạ tầng" },
  { value: "public_safety", label: "An toàn cộng đồng" },
  { value: "construction", label: "Xây dựng" },
  { value: "fire_safety", label: "Phòng cháy chữa cháy" },
];

const categoryImages: Record<CampaignCategory, string> = {
  environment: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&auto=format&fit=crop&q=80",
  infrastructure: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80",
  public_safety: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600&auto=format&fit=crop&q=80",
  construction: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&auto=format&fit=crop&q=80",
  fire_safety: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80",
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15";

function CreateCampaignPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { submit, isLoading } = useCreateCampaign();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CampaignCategory>("environment");
  const [locationText, setLocationText] = useState("");
  const [description, setDescription] = useState("");
  const [privateLocationText, setPrivateLocationText] = useState("");
  const [requiredTools, setRequiredTools] = useState("");
  const [organizerContact, setOrganizerContact] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startClock, setStartClock] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endClock, setEndClock] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("30");
  const [bannerPreview, setBannerPreview] = useState("");

  const canCreate = isAuthenticated && user?.role === Role.WARD_STAFF;
  const startTime = combineDateTime(startDate, startClock);
  const endTime = combineDateTime(endDate, endClock);

  const durationText = useMemo(() => {
    if (!startTime || !endTime) return null;
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return "Thời gian kết thúc phải diễn ra sau thời gian bắt đầu";
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;
    if (diffDays > 0) return `Thời gian diễn ra: ${diffDays} ngày ${remainingHours > 0 ? `${remainingHours} giờ` : ""}`;
    return `Thời gian diễn ra: ${diffHours} giờ`;
  }, [startTime, endTime]);

  const isDurationError = !!(durationText && durationText.includes("phải diễn ra sau"));
  const previewImage = bannerPreview || categoryImages[category];
  const previewCoordinates = resolveCampaignCoordinatesFromText(locationText);

  const handleBannerUpload = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh hợp lệ.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setBannerPreview(String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      toast.error("Vui lòng nhập tên chiến dịch.");
      return;
    }
    if (!locationText.trim()) {
      toast.error("Vui lòng nhập khu vực công khai.");
      return;
    }
    if (!description.trim()) {
      toast.error("Vui lòng nhập mô tả công khai.");
      return;
    }
    if (!privateLocationText.trim()) {
      toast.error("Vui lòng nhập điểm tập kết nội bộ.");
      return;
    }
    if (!requiredTools.trim()) {
      toast.error("Vui lòng nhập danh sách dụng cụ cần thiết.");
      return;
    }
    if (!organizerContact.trim()) {
      toast.error("Vui lòng nhập thông tin liên hệ ban tổ chức.");
      return;
    }
    if (!startTime) {
      toast.error("Vui lòng chọn thời gian bắt đầu chiến dịch.");
      return;
    }
    if (!endTime) {
      toast.error("Vui lòng chọn thời gian kết thúc chiến dịch.");
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start < new Date(now.getTime() - 5 * 60 * 1000)) {
      toast.error("Thời gian bắt đầu không thể ở trong quá khứ.");
      return;
    }
    if (end <= start) {
      toast.error("Thời gian kết thúc phải diễn ra sau thời gian bắt đầu.");
      return;
    }

    const maxPartNum = Number.parseInt(maxParticipants, 10);
    if (Number.isNaN(maxPartNum) || maxPartNum <= 0) {
      toast.error("Số lượng tình nguyện viên tối đa phải là số nguyên dương.");
      return;
    }

    try {
      const campaign = await submit({
        title: title.trim(),
        category,
        description: description.trim(),
        locationText: locationText.trim(),
        privateLocationText: privateLocationText.trim(),
        requiredTools: requiredTools.trim(),
        organizerContact: organizerContact.trim(),
        startTime,
        endTime,
        maxParticipants,
        wardName: user?.org,
      });

      toast.success("Đã gửi chiến dịch thành công để chờ phê duyệt.");
      navigate({ to: "/campaigns/$id", params: { id: campaign.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể gửi chiến dịch để phê duyệt.");
    }
  };

  if (!canCreate) {
    return (
      <main className="min-h-screen bg-[#F8F7FF] px-4 py-12">
        <section className="mx-auto max-w-2xl rounded-2xl border border-violet-100 bg-white p-8 shadow-md">
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-red-50 text-red-600">
            <Lock size={22} />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Quyền truy cập bị giới hạn</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Chỉ có cán bộ địa phương phụ trách được cấp quyền tạo các chiến dịch cộng đồng mới. Người dân có thể đăng ký tham gia các chiến dịch khi đã được phê duyệt chính thức.
          </p>
          <Link
            to="/campaigns"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-bold text-white transition hover:brightness-110"
          >
            <ArrowLeft size={16} />
            Quay lại danh sách
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F7FF] pb-16 text-slate-950">
      <form onSubmit={handleSubmit} className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500">
            <Link to="/campaigns" className="transition hover:text-[#7C3AED]">
              Chiến dịch
            </Link>
            <span>/</span>
            <span className="text-[#7C3AED]">Tạo chiến dịch mới</span>
          </div>
          <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-slate-950">
            <Rocket size={30} className="text-[#7C3AED]" />
            Tạo chiến dịch mới
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Chiến dịch tạo ra sẽ được chuyển đến Ủy ban Thành phố để phê duyệt trước khi công khai. Các chi tiết nhạy cảm sẽ được bảo mật.
          </p>
        </header>

        <Stepper />

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,60fr)_minmax(320px,40fr)]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-violet-100 bg-white p-7 shadow-md">
              <SectionTitle number="1" title="Thông tin chung" subtitle="Hiển thị công khai cho người dân khi tìm kiếm chiến dịch." />

              <div className="mt-5">
                <label
                  className="block cursor-pointer rounded-2xl border-2 border-dashed border-violet-200 bg-[#F8F7FF] p-4 transition hover:border-[#7C3AED]"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleBannerUpload(event.dataTransfer.files[0]);
                  }}
                >
                  <input type="file" accept="image/*" className="sr-only" onChange={(event) => handleBannerUpload(event.target.files?.[0])} />
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="Preview banner chiến dịch" className="aspect-video w-full rounded-xl object-cover" />
                  ) : (
                    <div className="grid aspect-video place-items-center rounded-xl bg-white text-center">
                      <div>
                        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#F3F0FF] text-[#7C3AED]">
                          <Camera size={22} />
                        </div>
                        <p className="mt-3 text-sm font-black text-slate-800">Kéo thả hoặc click để upload ảnh banner</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">Khuyến nghị tỉ lệ 16:9, ảnh rõ chủ đề chiến dịch.</p>
                      </div>
                    </div>
                  )}
                </label>
              </div>

              <div className="mt-6 space-y-5">
                <Field icon={ClipboardList} label="Tên chiến dịch" required>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className={inputClass}
                    placeholder="Ví dụ: Dọn rác bãi biển Mỹ Khê chủ nhật xanh"
                  />
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field icon={Package} label="Lĩnh vực">
                    <select value={category} onChange={(event) => setCategory(event.target.value as CampaignCategory)} className={inputClass}>
                      {categories.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field icon={Users} label="Tình nguyện viên cần tuyển">
                    <input
                      value={maxParticipants}
                      onChange={(event) => setMaxParticipants(event.target.value)}
                      className={inputClass}
                      type="number"
                      min="1"
                      placeholder="30"
                    />
                  </Field>
                </div>

                <Field icon={ClipboardList} label="Mô tả chi tiết chiến dịch" required>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value.slice(0, 500))}
                    className={`${inputClass} min-h-32 resize-y py-3`}
                    placeholder="Mục đích, thông điệp truyền tải, quyền lợi và nội dung hoạt động..."
                  />
                  <div className="mt-1 text-right text-xs font-semibold text-slate-400">{description.length}/500 ký tự</div>
                </Field>
              </div>
            </section>

            <section className="rounded-2xl border border-violet-100 bg-white p-7 shadow-md">
              <SectionTitle number="2" title="Lịch & Địa điểm" subtitle="Thời gian, địa chỉ và bản đồ preview vị trí hoạt động." />

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field icon={CalendarDays} label="Ngày bắt đầu" required>
                  <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={inputClass} />
                </Field>
                <Field icon={CalendarDays} label="Giờ bắt đầu" required>
                  <input type="time" value={startClock} onChange={(event) => setStartClock(event.target.value)} className={inputClass} />
                </Field>
                <Field icon={CalendarDays} label="Ngày kết thúc" required>
                  <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className={inputClass} />
                </Field>
                <Field icon={CalendarDays} label="Giờ kết thúc" required>
                  <input type="time" value={endClock} onChange={(event) => setEndClock(event.target.value)} className={inputClass} />
                </Field>
              </div>

              {durationText && (
                <div
                  className={`mt-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold ${
                    isDurationError ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"
                  }`}
                >
                  <CalendarDays size={15} />
                  <span>{durationText}</span>
                </div>
              )}

              <div className="mt-5">
                <Field icon={MapPin} label="Địa chỉ cụ thể" required>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={locationText}
                      onChange={(event) => setLocationText(event.target.value)}
                      className={`${inputClass} pl-9`}
                      placeholder="Nhập địa chỉ, phường hoặc quận tại Đà Nẵng"
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["Bãi biển Xuân Thiều, Liên Chiểu", "Công viên 29/3, Hải Châu", "Bãi biển Mỹ Khê, Sơn Trà"].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setLocationText(item)}
                        className="rounded-full border border-violet-100 bg-[#F8F7FF] px-3 py-1 text-xs font-bold text-[#7C3AED] transition hover:bg-[#F3F0FF]"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-violet-100">
                <iframe
                  title="Map preview"
                  src={buildGoogleMapsEmbedUrl(previewCoordinates)}
                  className="h-[200px] w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </section>

            <section className="rounded-2xl border border-amber-200 bg-[#FFFBF0] p-7 shadow-md">
              <SectionTitle number="3" title="Thông tin nội bộ" subtitle="Chỉ tình nguyện viên được duyệt mới thấy thông tin này." icon={Lock} />

              <div className="mt-5 grid gap-5">
                <Field label="Điểm tập trung / Hẹn gặp" required>
                  <textarea
                    value={privateLocationText}
                    onChange={(event) => setPrivateLocationText(event.target.value)}
                    className={`${inputClass} min-h-24 resize-y py-3`}
                    placeholder="VD: Cổng trường Tiểu học Trần Cao Vân, số 23 Lê Duẩn"
                  />
                </Field>
                <Field label="Công cụ cần mang theo" required>
                  <textarea
                    value={requiredTools}
                    onChange={(event) => setRequiredTools(event.target.value)}
                    className={`${inputClass} min-h-24 resize-y py-3`}
                    placeholder="VD: Mang theo găng tay cao su, mũ tai bèo, nước cá nhân"
                  />
                </Field>
                <Field label="Người phụ trách / SĐT" required>
                  <input
                    value={organizerContact}
                    onChange={(event) => setOrganizerContact(event.target.value)}
                    className={inputClass}
                    placeholder="VD: Anh Hải (0905.xxx.xxx) - Bí thư chi đoàn"
                  />
                </Field>
              </div>
            </section>

            <footer className="flex flex-col-reverse gap-3 rounded-2xl border border-violet-100 bg-white p-4 shadow-md sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                <Save size={16} />
                Lưu nháp
              </button>
              <button
                type="submit"
                disabled={isLoading || isDurationError}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-5 text-sm font-black text-white shadow-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={16} />
                {isLoading ? "Đang gửi..." : "Gửi phê duyệt"}
              </button>
            </footer>
            <p className="text-right text-xs font-semibold text-slate-500">Chiến dịch sẽ được chuyển đến Ủy ban Thành phố để phê duyệt.</p>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <HelperCard title="Quy trình" icon={ShieldCheck}>
              <div className="space-y-3">
                <ProcessStep color="bg-[#7C3AED]" label="Tạo & gửi" text="Hoàn thành biểu mẫu và gửi phê duyệt." />
                <ProcessStep color="bg-[#3B82F6]" label="Lãnh đạo duyệt" text="Ủy ban Thành phố đánh giá mức phù hợp." />
                <ProcessStep color="bg-[#10B981]" label="Mở đăng ký" text="Chiến dịch được công khai cho người dân." />
              </div>
            </HelperCard>

            <HelperCard title="Mẹo tạo chiến dịch hiệu quả" icon={Lightbulb}>
              <ul className="space-y-3 text-sm font-semibold leading-6 text-slate-600">
                <li>Đặt tên rõ mục tiêu và địa điểm.</li>
                <li>Mô tả đầy đủ quyền lợi của tình nguyện viên.</li>
                <li>Đặt số lượng người tham gia thực tế.</li>
                <li>Ghi rõ dụng cụ, thời gian và người phụ trách.</li>
              </ul>
            </HelperCard>

            <HelperCard title="Xem trước" icon={Eye}>
              <div className="overflow-hidden rounded-xl border border-violet-100 bg-white shadow-sm">
                <div className="relative aspect-video bg-slate-100">
                  <img src={previewImage} alt="Preview campaign" className="h-full w-full object-cover" />
                  <span className="absolute left-3 top-3 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">Chờ duyệt</span>
                </div>
                <div className="p-4">
                  <p className="line-clamp-2 text-base font-black text-slate-950">{title.trim() || "Tên chiến dịch sẽ hiển thị tại đây"}</p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                    {description.trim() || "Mô tả ngắn của chiến dịch sẽ được cập nhật realtime khi bạn nhập nội dung."}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <MapPin size={14} />
                    {locationText.trim() || "Địa điểm hoạt động"}
                  </div>
                  <div className="mt-4 h-1.5 rounded-full bg-slate-100">
                    <div className="h-full w-0 rounded-full bg-[#10B981]" />
                  </div>
                </div>
              </div>
            </HelperCard>
          </aside>
        </div>
      </form>
    </main>
  );
}

function Stepper() {
  const steps = [
    { label: "Thông tin chung", state: "active" },
    { label: "Lịch & Địa điểm", state: "upcoming" },
    { label: "Thông tin nội bộ", state: "upcoming" },
  ];

  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-md">
      <div className="grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => (
          <div key={step.label} className="flex items-center gap-3">
            <div
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-black ${
                step.state === "active" ? "bg-[#7C3AED] text-white" : "border border-slate-200 bg-white text-slate-400"
              }`}
            >
              {step.state === "completed" ? <Check size={16} /> : index + 1}
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">{step.label}</p>
              <p className="text-xs font-semibold text-slate-400">{step.state === "active" ? "Đang nhập" : "Sắp tới"}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ number, title, subtitle, icon: Icon }: { number: string; title: string; subtitle: string; icon?: ElementType }) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#F3F0FF] text-sm font-black text-[#7C3AED]">
        {Icon ? <Icon size={17} /> : number}
      </div>
      <div>
        <h2 className="text-lg font-black text-slate-900">{title}</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function HelperCard({ title, icon: Icon, children }: { title: string; icon: ElementType; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-lg">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-500">
        <Icon size={17} className="text-[#7C3AED]" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function ProcessStep({ color, label, text }: { color: string; label: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${color}`} />
      <div>
        <p className="text-sm font-black text-slate-900">{label}</p>
        <p className="text-sm leading-6 text-slate-600">{text}</p>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  required,
  children,
}: {
  icon?: ElementType;
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-black text-slate-800">
        {Icon && <Icon size={15} className="text-[#7C3AED]" />}
        {label}
        {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function combineDateTime(date: string, time: string) {
  if (!date || !time) return "";
  return `${date}T${time}`;
}
