import { clientOnly } from "@/components/ClientOnly";
import { createFileRoute, Link, redirect, useLocation } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useCategories, useCreateFeedbackWithMedia } from "@/lib/hooks";
import { ApiError, wardApi, getToken } from "@/lib/api";
import { getVideoDurationSeconds } from "@/lib/citizenFeedbackMediaApi";
import {
  clearGpsLocation,
  getStoredGpsLocation,
  requestCurrentGpsLocation,
  storeGpsLocation,
} from "@/lib/location";
import { toast } from "sonner";
import {
  Building2,
  Camera,
  Car,
  Check,
  Flame,
  HardHat,
  Loader2,
  LocateFixed,
  MapPin,
  ShieldCheck,
  TreePine,
  Upload,
  X,
} from "lucide-react";

export const Route = createFileRoute("/report")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const token = getToken();
    const raw = localStorage.getItem("dn_auth_user_v2");
    if (!token || !raw) {
      throw redirect({
        to: "/login",
        search: {
          redirect: "/report",
          error: "login_required",
        },
      });
    }
  },
  head: () => ({
    meta: [
      { title: "Gửi phản ánh mới - Đà Nẵng Kết Nối" },
      {
        name: "description",
        content: "Gửi phản ánh sự cố đô thị kèm ảnh/video, mô tả và vị trí GPS hiện tại.",
      },
    ],
  }),
  component: ReportPage,
});

const ReportMap = clientOnly(() =>
  import("@/components/site/ReportMap").then((m) => ({ default: m.ReportMap })),
);

const API_BASE: string =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) || "";

const DEFAULT_MAP_CENTER: [number, number] = [16.0544, 108.2022];
const CURRENT_LOCATION_ZOOM = 17;

const OFFICIAL_CATEGORY_CODES = [
  "TRAFFIC",
  "URBAN_INFRASTRUCTURE",
  "ENVIRONMENT",
  "PUBLIC_SECURITY",
  "CONSTRUCTION",
  "FIRE_SAFETY",
] as const;

const OFFICIAL_CATEGORY_CONTENT: Record<
  (typeof OFFICIAL_CATEGORY_CODES)[number],
  { vi: string; en: string; descriptionVi: string; descriptionEn: string }
> = {
  TRAFFIC: {
    vi: "Giao thông",
    en: "Traffic",
    descriptionVi: "Đường sá, ùn tắc, biển báo và an toàn giao thông",
    descriptionEn: "Road issues, congestion, signs, and traffic safety",
  },
  URBAN_INFRASTRUCTURE: {
    vi: "Hạ tầng đô thị",
    en: "Urban Infrastructure",
    descriptionVi: "Đèn chiếu sáng, cống thoát nước, vỉa hè và hạ tầng công cộng",
    descriptionEn: "Lighting, drainage, sidewalks, and public infrastructure",
  },
  ENVIRONMENT: {
    vi: "Môi trường",
    en: "Environment",
    descriptionVi: "Rác thải, ô nhiễm, cây xanh và vệ sinh đô thị",
    descriptionEn: "Waste, pollution, greenery, and urban sanitation",
  },
  PUBLIC_SECURITY: {
    vi: "An ninh trật tự",
    en: "Public Security",
    descriptionVi: "Mất trật tự, gây rối và nguy cơ an ninh",
    descriptionEn: "Disorder, disturbance, and public security risks",
  },
  CONSTRUCTION: {
    vi: "Xây dựng",
    en: "Construction",
    descriptionVi: "Xây dựng trái phép, che chắn và an toàn thi công",
    descriptionEn: "Illegal construction, site obstruction, and construction safety",
  },
  FIRE_SAFETY: {
    vi: "Phòng cháy chữa cháy",
    en: "Fire Safety",
    descriptionVi: "Nguy cơ cháy nổ, lối thoát hiểm và thiết bị PCCC",
    descriptionEn: "Fire hazards, emergency exits, and fire safety equipment",
  },
};

interface NominatimReverseResponse {
  display_name?: string;
}

async function reverseGeocodeAddress(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<string> {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(latitude),
    lon: String(longitude),
    zoom: "18",
    addressdetails: "1",
    "accept-language": "vi",
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error("REVERSE_GEOCODING_FAILED");
  }

  const data = (await response.json()) as NominatimReverseResponse;
  if (!data.display_name) {
    throw new Error("REVERSE_GEOCODING_EMPTY");
  }

  return data.display_name;
}

function getWardNameFromAddress(readableAddress: string): string {
  return (
    readableAddress
      .split(",")
      .map((part) => part.trim())
      .find((part) => ["Phường ", "Xã ", "Thị trấn "].some((prefix) => part.startsWith(prefix))) ||
    ""
  );
}

function getGpsErrorMessage(error: unknown, t: ReturnType<typeof useI18n>["t"]): string {
  const code =
    typeof error === "object" && error && "code" in error ? Number(error.code) : undefined;

  if (error instanceof Error && error.message === "GEOLOCATION_UNSUPPORTED") {
    return t("report.gps.unsupported");
  }

  if (code === 1) {
    return t("report.gps.denied");
  }

  if (code === 2) {
    return t("report.gps.unavailable");
  }

  if (code === 3) {
    return t("report.gps.timeout");
  }

  return t("report.gps.generic");
}

function isWithinVietnam(lat: number, lng: number): boolean {
  return lat >= 8.0 && lat <= 24.0 && lng >= 102.0 && lng <= 110.0;
}

// ─── PII Guard — Tầng 1 Frontend ────────────────────────────────────
// Phát hiện SĐT Việt Nam (0xxxxxxxxx) và CCCD mới 2021+ (12 số)
// Tương thích đa trình duyệt (kể cả Safari cũ < 16.4 do không dùng negative lookbehind)
const PII_PHONE_RE = /(?:^|[^\d])0\d{9}(?=[^\d]|$)/;
const PII_CCCD_RE  = /(?:^|[^\d])\d{12}(?=[^\d]|$)/;

function detectPii(text: string): boolean {
  return PII_PHONE_RE.test(text) || PII_CCCD_RE.test(text);
}

function ReportPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const location = useLocation();
  const state = location.state as { initialTitle?: string; initialDescription?: string; initialCategoryCode?: string } | undefined;

  const [submitted, setSubmitted] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");
  const [piiError, setPiiError] = useState("");

  const { data: categories } = useCategories();
  const [categoryCode, setCategoryCode] = useState<string | undefined>(state?.initialCategoryCode || undefined);
  const createFeedback = useCreateFeedbackWithMedia();

  const storedLocation = getStoredGpsLocation();
  const initialLat =
    storedLocation && isWithinVietnam(storedLocation.latitude, storedLocation.longitude)
      ? storedLocation.latitude
      : null;
  const initialLng =
    storedLocation && isWithinVietnam(storedLocation.latitude, storedLocation.longitude)
      ? storedLocation.longitude
      : null;

  const [title, setTitle] = useState(state?.initialTitle || "");
  const [description, setDescription] = useState(state?.initialDescription || "");
  const [latitude, setLatitude] = useState<number | null>(initialLat);
  const [longitude, setLongitude] = useState<number | null>(initialLng);
  const [locationLoading, setLocationLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [address, setAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [detectedWard, setDetectedWard] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const geocodeAbortRef = useRef<AbortController | null>(null);

  const hasLocation = latitude !== null && longitude !== null;
  const markerDisplayed = hasLocation && !locationLoading;
  const expectedWard = detectedWard || getWardNameFromAddress(address);
  const mapCenter = useMemo<[number, number]>(
    () => (hasLocation ? [latitude, longitude] : DEFAULT_MAP_CENTER),
    [hasLocation, latitude, longitude],
  );
  const categoryOptions = useMemo(
    () =>
      OFFICIAL_CATEGORY_CODES.map((code) => {
        const apiCategory = categories?.find((category) => category.code === code);
        const content = OFFICIAL_CATEGORY_CONTENT[code];
        return {
          id: apiCategory?.id,
          code,
          name: locale === "vi" ? content.vi : content.en,
          description:
            locale === "vi"
              ? apiCategory?.descriptionVi || content.descriptionVi
              : apiCategory?.descriptionEn || content.descriptionEn,
        };
      }),
    [categories, locale],
  );
  const canSubmit =
    !!categoryCode &&
    title.trim().length > 0 &&
    photos.length > 0 &&
    videos.length > 0 &&
    description.trim().length > 0 &&
    hasLocation &&
    !locationLoading &&
    !createFeedback.isPending &&
    !uploading;

  useEffect(() => {
    if (categoryCode === undefined) {
      setCategoryCode(OFFICIAL_CATEGORY_CODES[0]);
    }
  }, [categoryCode]);

  useEffect(() => {
    if (storedLocation && isWithinVietnam(storedLocation.latitude, storedLocation.longitude)) {
      void loadAddress(storedLocation.latitude, storedLocation.longitude);
    } else {
      detectLocation();
    }
    // Auto GPS runs once on page open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCategoryIcon = (code: string) => {
    if (code === "TRAFFIC") return <Car size={24} />;
    if (code === "URBAN_INFRASTRUCTURE") return <Building2 size={24} />;
    if (code === "ENVIRONMENT") return <TreePine size={24} />;
    if (code === "PUBLIC_SECURITY") return <ShieldCheck size={24} />;
    if (code === "CONSTRUCTION") return <HardHat size={24} />;
    if (code === "FIRE_SAFETY") return <Flame size={24} />;
    return <Building2 size={24} />;
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    const validFiles = newFiles.filter((file) => {
      const validType = file.type.startsWith("image/") || file.type.startsWith("video/");
      const validSize = file.size <= 10 * 1024 * 1024;

      if (!validType) {
        toast.error(`${file.name} không phải ảnh hoặc video.`);
      }
      if (!validSize) {
        toast.error(`${file.name} vượt quá 10MB.`);
      }

      return validType && validSize;
    });

    setPhotos((prev) => [...prev, ...validFiles]);
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoPreviews((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoFilesSelected = (files: FileList | null) => {
    if (!files) {
      if (photoInputRef.current) photoInputRef.current.value = "";
      return;
    }
    const newFiles = Array.from(files);
    const validFiles = newFiles.filter((file) => {
      const validType = file.type.startsWith("image/");
      const validSize = file.size <= 10 * 1024 * 1024;

      if (!validType) {
        toast.error(`${file.name} không phải file ảnh.`);
      }
      if (!validSize) {
        toast.error(`${file.name} vượt quá 10MB.`);
      }

      return validType && validSize;
    });

    const availableSlots = Math.max(0, 5 - photos.length);
    const acceptedFiles = validFiles.slice(0, availableSlots);
    if (validFiles.length > availableSlots) {
      toast.error("Chỉ được upload tối đa 5 ảnh.");
    }

    setPhotos((prev) => [...prev, ...acceptedFiles]);
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoPreviews((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handleVideoFileSelected = (files: FileList | null) => {
    if (!files) {
      if (videoInputRef.current) videoInputRef.current.value = "";
      return;
    }
    const file = Array.from(files)[0];
    if (!file) {
      if (videoInputRef.current) videoInputRef.current.value = "";
      return;
    }

    if (!file.type.startsWith("video/")) {
      toast.error(`${file.name} không phải file video.`);
      if (videoInputRef.current) videoInputRef.current.value = "";
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error(`${file.name} vượt quá 50MB.`);
      if (videoInputRef.current) videoInputRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setVideos([file]);
        setVideoPreviews([event.target.result as string]);
      }
    };
    reader.readAsDataURL(file);
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== idx));
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const removeVideo = () => {
    setVideos([]);
    setVideoPreviews([]);
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const uploadPhotos = async (feedbackId: number): Promise<string[]> => {
    const selectedMedia = [...photos, ...videos];
    if (selectedMedia.length === 0) return [];
    const token = getToken();
    const urls: string[] = [];
    setUploading(true);

    try {
      for (const photo of selectedMedia) {
        const formData = new FormData();
        formData.append("file", photo);
        const res = await fetch(`${API_BASE}/api/files/upload/${feedbackId}`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const message =
            data?.message ||
            data?.error ||
            `Upload ${photo.name} thất bại với mã lỗi ${res.status}`;
          throw new Error(message);
        }

        urls.push(data.fileUrl);
      }
      return urls;
    } finally {
      setUploading(false);
    }
  };

  const loadAddress = async (nextLatitude: number, nextLongitude: number) => {
    geocodeAbortRef.current?.abort();
    const controller = new AbortController();
    geocodeAbortRef.current = controller;

    setAddress("");
    setAddressError("");
    setAddressLoading(true);

    try {
      const resolvedAddress = await reverseGeocodeAddress(
        nextLatitude,
        nextLongitude,
        controller.signal,
      );
      setAddress(resolvedAddress);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setAddressError(t("report.err.geocodeFailed"));
    } finally {
      if (geocodeAbortRef.current === controller) {
        geocodeAbortRef.current = null;
        setAddressLoading(false);
      }
    }
  };

  const applyLocation = async (nextLatitude: number, nextLongitude: number) => {
    setLatitude(nextLatitude);
    setLongitude(nextLongitude);
    setLocationError("");
    storeGpsLocation({ latitude: nextLatitude, longitude: nextLongitude });
    void loadAddress(nextLatitude, nextLongitude);

    try {
      const ward = await wardApi.locate(nextLatitude, nextLongitude);
      setDetectedWard(ward.name);
    } catch {
      setDetectedWard("");
    }
  };

  async function detectLocation() {
    setLocationLoading(true);
    setLocationError("");
    setDetectedWard("");

    try {
      const location = await requestCurrentGpsLocation();
      if (!isWithinVietnam(location.latitude, location.longitude)) {
        const [defaultLat, defaultLng] = DEFAULT_MAP_CENTER;
        await applyLocation(defaultLat, defaultLng);
        toast.warning(
          locale === "vi"
            ? "Tọa độ định vị GPS không chính xác (nằm ngoài Việt Nam). Đã chuyển về vị trí mặc định tại Đà Nẵng, vui lòng kéo ghim hoặc click trên bản đồ để chỉnh sửa."
            : "Inaccurate GPS coordinates detected. Reset to default location in Da Nang, please drag the pin or click on the map to adjust."
        );
      } else {
        await applyLocation(location.latitude, location.longitude);
        toast.success(t("report.loc.gpsSuccess"));
      }
    } catch (err) {
      const message = getGpsErrorMessage(err, t);
      clearGpsLocation();
      setLatitude(null);
      setLongitude(null);
      setAddress("");
      setAddressError("");
      setLocationError(message);
      toast.error(message);
    } finally {
      setLocationLoading(false);
    }
  }

  const validateBeforeSubmit = () => {
    if (!user) {
      toast.error(t("report.err.login"));
      return false;
    }
    if (!categoryCode) {
      toast.error(t("report.err.category"));
      return false;
    }
    if (!title.trim()) {
      toast.error(locale === "vi" ? "Vui lòng nhập tiêu đề phản ánh." : "Please enter a report title.");
      return false;
    }
    if (photos.length === 0) {
      toast.error(t("report.err.photo"));
      return false;
    }
    if (videos.length === 0) {
      toast.error(t("report.err.video"));
      return false;
    }
    if (!description.trim()) {
      toast.error(t("report.err.description"));
      return false;
    }
    if (!hasLocation) {
      toast.error(t("report.err.gps"));
      return false;
    }
    // [PII Guard — Tầng 1] Kiểm tra SĐT / CCCD trong tiêu đề và mô tả
    const hasPii = detectPii(title) || detectPii(description);
    if (hasPii) {
      const msg =
        locale === "vi"
          ? "Vui lòng xoá số điện thoại hoặc CCCD/CMND khỏi nội dung trước khi gửi để bảo vệ thông tin cá nhân của bạn."
          : "Please remove phone numbers or ID numbers from your report to protect your personal information.";
      setPiiError(msg);
      toast.error(msg);
      return false;
    }
    setPiiError("");
    return true;
  };

  const handleSubmit = async () => {
    if (!validateBeforeSubmit() || latitude === null || longitude === null || !categoryCode) {
      return;
    }

    try {
      const videoDurationsSeconds = await Promise.all(videos.map(getVideoDurationSeconds));
      const result = await createFeedback.mutateAsync({
        data: {
          title: title.trim(),
          description: description.trim(),
          latitude,
          longitude,
          addressDetails: address || detectedWard || `${latitude}, ${longitude}`,
          categoryCode,
          videoDurationsSeconds,
        },
        files: [...photos, ...videos],
      });

      setTrackingCode(result.trackingCode || "FB-XXXXXXXX");
      setSubmitted(true);
      toast.success(t("report.success.toast"));
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error(t("report.err.generic"));
      }
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-16 text-center animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-[var(--status-success)] grid place-items-center mx-auto mb-6 text-white">
          <Check size={56} strokeWidth={3} />
        </div>
        <h1 className="text-3xl md:text-4xl font-heading text-gov-blue mb-4">
          {t("report.submitted")}
        </h1>
        <p className="text-lg text-ink-soft mb-2">{t("report.success.codeLabel")}</p>
        <p className="text-2xl font-mono font-bold mb-8">{trackingCode}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/my-reports" className="btn-civic btn-civic-primary">
            {t("report.success.viewReports")}
          </Link>
          <Link to="/" className="btn-civic btn-civic-ghost">
            {t("report.success.goHome")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <h1 className="font-heading text-4xl md:text-5xl text-gov-blue mb-6">{t("report.title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)] gap-6 lg:gap-8 items-start">
        <section className="card-civic p-5 md:p-8 animate-fade-in-up">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2">{t("report.form.titleLabel")}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full min-h-[48px] px-4 rounded-lg border-2 border-slate-200 text-base focus:border-gov-blue outline-none bg-white"
                placeholder={t("report.form.titlePlaceholder")}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">{t("report.form.category")}</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categoryOptions.map((category) => {
                  const selected = categoryCode === category.code;
                  return (
                    <button
                      key={category.code}
                      type="button"
                      onClick={() => setCategoryCode(category.code)}
                      className={`relative p-4 rounded-lg border-2 text-left transition-all duration-200 ${selected
                          ? "border-[var(--status-success)] bg-[var(--status-success)]/5 shadow-sm ring-2 ring-[var(--status-success)]/20"
                          : "border-slate-200 bg-white hover:border-gov-blue/40 hover:shadow-sm"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-gov-blue shrink-0">
                          {getCategoryIcon(category.code)}
                        </span>
                        {selected && (
                          <span className="w-6 h-6 rounded-full bg-[var(--status-success)] text-white grid place-items-center shrink-0 animate-scale-in">
                            <Check size={14} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <div className="mt-2 font-semibold text-sm">{category.name}</div>
                      <p className="mt-1 text-xs leading-5 text-ink-soft">{category.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">{t("report.form.media")}</label>
              <div className="grid sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gov-blue rounded-lg p-8 min-h-[148px] flex flex-col items-center justify-center gap-3 text-gov-blue hover:bg-gov-blue/5 transition-all duration-200"
                >
                  <Camera size={42} />
                  <span className="font-bold text-base">{t("report.form.uploadPhoto")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[var(--status-pending)] rounded-lg p-8 min-h-[148px] flex flex-col items-center justify-center gap-3 text-[var(--status-pending)] hover:bg-[var(--status-pending)]/5 transition-all duration-200"
                >
                  <Upload size={42} />
                  <span className="font-bold text-base">{t("report.form.uploadVideo")}</span>
                </button>
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handlePhotoFilesSelected(e.target.files)}
                multiple
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => handleVideoFileSelected(e.target.files)}
              />
              {photoPreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {photoPreviews.map((preview, idx) => (
                    <div key={`${preview}-${idx}`} className="relative group aspect-square">
                      {photos[idx]?.type.startsWith("video/") ? (
                        <video
                          src={preview}
                          className="w-full h-full object-cover rounded-lg border border-slate-200 bg-black"
                          muted
                        />
                      ) : (
                        <img
                          src={preview}
                          alt=""
                          className="w-full h-full object-cover rounded-lg border border-slate-200"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 w-7 h-7 bg-red-600 text-white rounded-full grid place-items-center opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={t("report.err.removeFile")}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {videoPreviews.length > 0 && (
                <div className="mt-4">
                  <div className="relative group aspect-video max-w-xl overflow-hidden rounded-lg border border-slate-200 bg-black">
                    <video
                      src={videoPreviews[0]}
                      className="w-full h-full object-cover"
                      muted
                      controls
                    />
                    <button
                      type="button"
                      onClick={removeVideo}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-600 text-white rounded-full grid place-items-center opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={t("report.err.removeVideo")}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">{t("report.form.content")}</label>
              <textarea
                value={description}
                onChange={(e) => { setDescription(e.target.value); if (piiError) setPiiError(""); }}
                className={`w-full min-h-[150px] p-4 rounded-lg border-2 text-base focus:border-gov-blue outline-none bg-white transition-colors ${piiError ? "border-red-400" : "border-slate-200"}`}
                placeholder={t("report.form.contentPlaceholder")}
              />
              {piiError && (
                <div className="mt-2 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 animate-fade-in">
                  <span className="text-lg leading-none">🔒</span>
                  <span>{piiError}</span>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-ink">{t("report.loc.title")}</p>
                  <p
                    className={`text-sm font-semibold ${locationLoading
                        ? "text-ink-soft"
                        : hasLocation
                          ? "text-[var(--status-success)]"
                          : "text-[var(--status-danger)]"
                      }`}
                  >
                    {locationLoading
                      ? t("report.loc.loading")
                      : hasLocation
                        ? t("report.loc.confirmed")
                        : t("report.loc.none")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={locationLoading}
                  className="btn-civic btn-civic-ghost disabled:opacity-50"
                >
                  {locationLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <LocateFixed size={20} />
                  )}
                  {t("report.loc.refresh")}
                </button>
              </div>

              <div className="mt-4 rounded-lg bg-white border border-slate-200 p-4 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 shrink-0 text-gov-blue" size={20} />
                  <p className="min-w-0 leading-6 text-ink">
                    {locationLoading
                      ? t("report.loc.gpsRequest")
                      : addressLoading
                        ? t("report.loc.addressLoading")
                        : address ||
                        addressError ||
                        (hasLocation
                          ? t("report.loc.noAddress")
                          : t("report.loc.clickRefresh"))}
                  </p>
                </div>
              </div>

              {expectedWard && (
                <p className="mt-3 text-sm font-semibold text-gov-blue">
                  {t("report.loc.expectedWard")} {expectedWard}
                </p>
              )}
              {locationLoading && (
                <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-ink-soft">
                  <Loader2 size={16} className="animate-spin" />
                  {t("report.loc.gpsLoading")}
                </p>
              )}
              {locationError && (
                <p className="mt-3 text-sm font-semibold text-[var(--status-danger)]">
                  {locationError}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="btn-civic bg-status-success text-white shadow-lg hover:brightness-90 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none w-full sm:w-auto"
            >
              {createFeedback.isPending ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Check size={20} />
              )}
              {createFeedback.isPending ? t("report.form.submitting") : t("report.submit")}
            </button>
          </div>
        </section>

        <aside className="card-civic p-4 md:p-5 animate-fade-in-up lg:sticky lg:top-[120px] lg:self-start">
          <div className="mb-4">
            <div>
              <h2 className="text-2xl font-heading text-gov-blue">{t("report.loc.mapTitle")}</h2>
              <p className="text-sm text-ink-soft mt-1">
                {t("report.loc.mapHint")}
              </p>
            </div>
          </div>

          <div className="relative h-[300px] sm:h-[360px] lg:h-[520px] overflow-hidden rounded-[20px] border border-slate-200 bg-slate-100">
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center text-[#667085] font-sans">
                  <Loader2 className="animate-spin text-gov-blue mr-2" size={20} />
                  {t("report.loc.loadingMap")}
                </div>
              }
            >
              <ReportMap
                mapCenter={mapCenter}
                hasLocation={hasLocation}
                markerDisplayed={markerDisplayed}
                latitude={latitude}
                longitude={longitude}
                address={address}
                locationLoading={locationLoading}
                onChangeLocation={applyLocation}
              />
            </Suspense>
          </div>
        </aside>
      </div>
    </div>
  );
}

