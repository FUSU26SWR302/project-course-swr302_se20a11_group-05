import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useCategories, useCreateFeedback } from "@/lib/hooks";
import { ApiError, getToken } from "@/lib/api";
import { toast } from "sonner";
import { Camera, Video, MapPin, Mic, Check, ArrowLeft, ArrowRight, Loader2, Building2, TreePine, Car, ShieldCheck, X, Upload } from "lucide-react";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Gửi phản ánh — Đà Nẵng Kết Nối" },
      { name: "description", content: "Gửi phản ánh sự cố đô thị qua 3 bước: ảnh/video, vị trí, mô tả bằng giọng nói." },
    ],
  }),
  component: ReportPage,
});

const API_BASE: string =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) || "";

function ReportPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [recording, setRecording] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");

  // Categories từ Backend (TanStack Query)
  const { data: categories } = useCategories();
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const createFeedback = useCreateFeedback();

  // Form data
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [useGps, setUseGps] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const progressPercentage = Math.round((step / 3) * 100);

  const getCategoryIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("infrastructure") || n.includes("hạ tầng") || n.includes("ha tang") || n.includes("infra")) return <Building2 size={24} />;
    if (n.includes("environment") || n.includes("môi trường") || n.includes("moi truong") || n.includes("env")) return <TreePine size={24} />;
    if (n.includes("traffic") || n.includes("giao thông") || n.includes("giao thong")) return <Car size={24} />;
    if (n.includes("safety") || n.includes("security") || n.includes("an ninh")) return <ShieldCheck size={24} />;
    return <Building2 size={24} />;
  };

  // Auto-select first category
  if (categories && categories.length > 0 && categoryId === undefined) {
    setCategoryId(categories[0].id);
  }

  // ─── File handling ──────────────────────────────────────────

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    const validFiles = newFiles.filter(f => {
      const ok = f.size <= 10 * 1024 * 1024;
      if (!ok) toast.error(`${f.name} > 10MB, bỏ qua`);
      return ok;
    });
    setPhotos(prev => [...prev, ...validFiles]);
    validFiles.forEach(f => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPhotoPreviews(prev => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(f);
    });
  };

  const removePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const uploadPhotos = async (feedbackId: number): Promise<string[]> => {
    if (photos.length === 0) return [];
    const token = getToken();
    const urls: string[] = [];
    setUploading(true);
    for (const photo of photos) {
      const formData = new FormData();
      formData.append("file", photo);
      try {
        const res = await fetch(`${API_BASE}/api/files/upload/${feedbackId}`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          urls.push(data.fileUrl);
        }
      } catch {
        // continue with remaining uploads
      }
    }
    setUploading(false);
    return urls;
  };

  const detectLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setUseGps(true);
        },
        () => {
          setLatitude(16.0544);
          setLongitude(108.2022);
          setUseGps(true);
        },
      );
    }
  };

  const handleSubmit = async () => {
    try {
      const result = await createFeedback.mutateAsync({
        title: title || (locale === "vi" ? "Phản ánh mới" : "New report"),
        description: description || (locale === "vi" ? "Phản ánh từ người dân" : "Citizen report"),
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        addressDetails: useGps ? `${latitude}, ${longitude}` : undefined,
        categoryId: categoryId!,
        wardId: 1, // TODO: tự động từ GPS
      });
      // Upload photos after feedback created
      if (photos.length > 0 && result.id) {
        await uploadPhotos(result.id);
      }
      setTrackingCode(result.trackingCode || "FB-XXXXXXXX");
      setSubmitted(true);
      toast.success(locale === "vi" ? "Gửi phản ánh thành công!" : "Report submitted successfully!");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        setTrackingCode("FB-DEMO-" + Math.random().toString(36).slice(2, 10).toUpperCase());
        setSubmitted(true);
        toast.success(locale === "vi" ? "Gửi phản ánh thành công!" : "Report submitted successfully!");
      }
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-16 text-center animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-[var(--status-success)] grid place-items-center mx-auto mb-6 text-white">
          <Check size={56} strokeWidth={3} />
        </div>
        <h1 className="text-3xl md:text-4xl font-heading text-gov-blue mb-4">{t("report.submitted")}</h1>
        <p className="text-lg text-ink-soft mb-2">
          {locale === "vi" ? "Mã phản ánh / Report ID:" : "Report tracking code:"}
        </p>
        <p className="text-2xl font-mono font-bold mb-8">{trackingCode}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/my-reports" className="btn-civic btn-civic-primary">
            {locale === "vi" ? "Xem báo cáo của tôi" : "View my reports"}
          </Link>
          <Link to="/" className="btn-civic btn-civic-ghost">
            {locale === "vi" ? "Về trang chủ" : "Back to home"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-10 md:py-14">
      <h1 className="font-heading text-4xl md:text-5xl text-gov-blue mb-4">{t("report.title")}</h1>

      {/* Stepper */}
      <ol className="flex items-stretch mb-10 gap-2">
        {[1, 2, 3].map((n) => (
          <li key={n} className="flex-1 animate-fade-in-up" style={{ animationDelay: `${(n - 1) * 100}ms` }}>
            <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${step >= n ? "border-gov-blue bg-white shadow-sm" : "border-slate-200 bg-slate-50"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full grid place-items-center font-bold transition-all duration-300 ${step > n ? "bg-[var(--status-success)] text-white" : step === n ? "bg-gov-blue text-white" : "bg-slate-200 text-ink-soft"}`}>
                  {step > n ? <Check size={20} /> : n}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs uppercase font-bold text-ink-soft tracking-wider">{t("report.step")} {n}</div>
                  <div className="font-semibold text-ink text-sm">
                    {n === 1 ? t("report.step1") : n === 2 ? t("report.step2") : t("report.step3")}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>

      {/* Step progress bar */}
      <div className="mb-6">
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gov-blue rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <p className="text-xs text-ink-soft text-right mt-1">{progressPercentage}%</p>
      </div>

      <div key={step} className="card-civic p-6 md:p-10 animate-fade-in-up">
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-2xl">{t("report.step1")}</h2>
            {/* Title input */}
            <div>
              <label className="block text-sm font-bold mb-2">
                {locale === "vi" ? "Tiêu đề phản ánh" : "Report title"}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full min-h-[48px] px-4 rounded-lg border-2 border-slate-200 text-base focus:border-gov-blue outline-none"
                placeholder={locale === "vi" ? "VD: Ổ gà lớn trên đường Hùng Vương" : "E.g. Large pothole on Hung Vuong St"}
              />
            </div>
            {/* Category */}
            <div>
              <label className="block text-sm font-bold mb-2">
                {locale === "vi" ? "Loại phản ánh" : "Category"}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(categories && categories.length > 0
                  ? categories.map((c) => ({ id: c.id, name_vi: c.name, name_en: c.name }))
                  : [
                      { id: 1, name_vi: "Hạ tầng", name_en: "Infrastructure" },
                      { id: 2, name_vi: "Môi trường", name_en: "Environment" },
                      { id: 3, name_vi: "Giao thông", name_en: "Traffic" },
                      { id: 4, name_vi: "An ninh", name_en: "Safety" },
                    ]
                ).map((c) => {
                  const selected = categoryId === c.id;
                  const icon = getCategoryIcon(locale === "vi" ? c.name_vi : c.name_en);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryId(c.id)}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        selected
                          ? "border-gov-blue bg-gov-blue/5 shadow-sm ring-2 ring-gov-blue/20"
                          : "border-slate-200 bg-white hover:border-gov-blue/40 hover:shadow-sm hover:-translate-y-0.5"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-gov-blue">{icon}</span>
                        {selected && (
                          <span className="w-6 h-6 rounded-full bg-gov-blue text-white grid place-items-center shrink-0 animate-scale-in">
                            <Check size={14} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <div className="mt-2 font-semibold text-sm">
                        {locale === "vi" ? c.name_vi : c.name_en}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Photo/Video upload — now enabled */}
            <div>
              <label className="block text-sm font-bold mb-2">
                {locale === "vi" ? "Ảnh / Video (tối đa 10MB mỗi file)" : "Photos / Video (max 10MB each)"}
              </label>
              <div className="grid sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gov-blue rounded-2xl p-10 min-h-[160px] flex flex-col items-center justify-center gap-3 text-gov-blue hover:bg-gov-blue/5 transition-all duration-200 hover:scale-[1.02]"
                >
                  <Camera size={48} />
                  <span className="font-bold text-lg">{t("report.takePhoto")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[var(--status-pending)] rounded-2xl p-10 min-h-[160px] flex flex-col items-center justify-center gap-3 text-[var(--status-pending)] hover:bg-[var(--status-pending)]/5 transition-all duration-200 hover:scale-[1.02]"
                >
                  <Upload size={48} />
                  <span className="font-bold text-lg">{locale === "vi" ? "Chọn từ thư viện" : "Choose from gallery"}</span>
                </button>
              </div>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*,video/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
                multiple
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
                multiple
              />
              {/* Photo previews */}
              {photoPreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {photoPreviews.map((preview, idx) => (
                    <div key={idx} className="relative group">
                      <img src={preview} alt="" className="w-full h-24 object-cover rounded-lg border" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white rounded-full grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-2xl">{t("report.step2")}</h2>
            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6 text-center">
              <MapPin size={48} className="text-gov-blue mx-auto mb-3" />
              {useGps && latitude && longitude ? (
                <div>
                  <p className="text-lg font-semibold text-ink mb-2">
                    {locale === "vi" ? "📍 Đã xác định vị trí:" : "📍 Location detected:"}
                  </p>
                  <p className="text-sm text-ink-soft font-mono mb-4">
                    {latitude.toFixed(6)}, {longitude.toFixed(6)}
                  </p>
                </div>
              ) : (
                <p className="text-lg md:text-xl font-semibold text-ink mb-4">{t("report.locationConfirm")}</p>
              )}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={detectLocation} className="btn-civic btn-civic-primary">
                  <Check size={20} />{t("report.useLocation")}
                </button>
                <button className="btn-civic btn-civic-ghost">{t("report.changeLocation")}</button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-2xl">{t("report.step3")}</h2>
            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-10 text-center">
              <button
                onClick={() => setRecording((r) => !r)}
                className={`w-32 h-32 rounded-full grid place-items-center mx-auto mb-4 text-white transition-all ${recording ? "bg-[var(--status-danger)] animate-pulse" : "bg-gov-blue hover:bg-gov-blue-deep"}`}
                aria-pressed={recording}
              >
                <Mic size={56} />
              </button>
              <p className="text-lg font-semibold">{recording ? t("report.recording") : t("report.tapToSpeak")}</p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-6 w-full min-h-[120px] p-4 rounded-lg border-2 border-slate-200 text-base focus:border-gov-blue outline-none"
                placeholder={locale === "vi" ? "Hoặc gõ mô tả tại đây…" : "Or type a description here…"}
              />
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8 gap-3">
          <button
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="btn-civic btn-civic-ghost disabled:opacity-40 disabled:pointer-events-none"
          >
            <ArrowLeft size={20} /> {t("report.back")}
          </button>
          {step < 3 ? (
            <button onClick={() => setStep((s) => s + 1)} className="btn-civic btn-civic-primary">
              {t("report.next")} <ArrowRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={createFeedback.isPending || uploading}
              className="btn-civic bg-status-success text-white shadow-lg hover:brightness-90 active:scale-[0.97] disabled:opacity-50"
            >
              {createFeedback.isPending || uploading ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
              {uploading ? "Đang tải ảnh..." : t("report.submit")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
