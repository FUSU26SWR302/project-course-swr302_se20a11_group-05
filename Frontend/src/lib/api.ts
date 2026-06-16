/**
 * API Client v2 — Kết nối Frontend ↔ Backend Spring Boot
 *
 * Cải tiến so với v1:
 *  - Interceptor pattern: tự động refresh token, xử lý lỗi tập trung
 *  - Type-safe hoàn toàn
 *  - Hỗ trợ pagination
 *  - Error handling tập trung với ApiError
 */

const API_BASE: string =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) || "";

// ─── JWT Token Management ─────────────────────────────────────
const TOKEN_KEY = "dn_jwt_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
}

// ─── Error types ──────────────────────────────────────────────

/** Cấu trúc lỗi từ Backend ApiResponse */
export interface ApiErrorData {
  status: number;
  message: string;
  data?: unknown;
}

export class ApiError extends Error {
  public status: number;
  public data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }

  static fromResponse(response: Response, body: unknown): ApiError {
    const data = body as ApiErrorData | null;
    return new ApiError(
      response.status,
      data?.message || `Lỗi ${response.status}: ${response.statusText}`,
      data,
    );
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }
}

// ─── Generic Fetch Wrapper with Interceptors ────────────────

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
  /** Timeout in ms (default: 30000) */
  timeout?: number;
}

let onUnauthorized: (() => void) | null = null;

/**
 * Đăng ký callback khi nhận 401 (dùng để logout tự động)
 */
export function setOnUnauthorized(cb: () => void) {
  onUnauthorized = cb;
}

async function request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { skipAuth, timeout = 30000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");
    const body = isJson ? await response.json().catch(() => null) : null;

    if (!response.ok) {
      const error = ApiError.fromResponse(response, body);

      // Auto-logout on 401, but bypass if using the dummy demo token
      if (error.isUnauthorized && onUnauthorized && getToken() !== "demo-token") {
        onUnauthorized();
      }

      throw error;
    }

    if (response.status === 204) return undefined as T;

    // Tự động bóc vỏ ApiResponse từ Backend (nếu có)
    if (isJson && body && typeof body === "object" && !Array.isArray(body)) {
      if ("status" in body && "message" in body) {
        // Backend trả về chuẩn { status, message, data }
        if (body.status >= 400) {
          const error = new ApiError(body.status, body.message, body.data);
          if (error.isUnauthorized && onUnauthorized && getToken() !== "demo-token") onUnauthorized();
          throw error;
        }
        return body.data as T;
      }
    }

    return (isJson ? body : await response.text()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(408, "Request timeout — máy chủ không phản hồi kịp.");
    }
    throw new ApiError(0, "Lỗi kết nối: " + (error instanceof Error ? error.message : "unknown"));
  } finally {
    clearTimeout(timeoutId);
  }
}

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS — re-exported from @/types/api for backward compat.
// In new code, import types directly from "@/types/api".
// ═══════════════════════════════════════════════════════════════

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

// ─── Auth Types ───────────────────────────────────────────────

export interface TokenResponse {
  token: string;
  tokenType: string;
  username: string;
  role: BackendRole;
}

export interface MfaRequiredResponse {
  username: string;
  mfaRequired: true;
  mfaSetupRequired: boolean;
}

export type BackendRole = "CITIZEN" | "WARD_STAFF" | "POLICE" | "SUPER_ADMIN";

// ─── Feedback Types ───────────────────────────────────────────

export type FeedbackStatus =
  | "PENDING" | "ASSIGNED" | "IN_PROGRESS"
  | "WAITING_INFO" | "RESOLVED" | "REJECTED" | "PRE_EMPTIVE";

export interface FeedbackResponse {
  id: number;
  trackingCode: string;
  title: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  addressDetails: string | null;
  status: FeedbackStatus;
  categoryName: string | null;
  citizenName: string | null;
  assigneeName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackRequest {
  title: string;
  description: string;
  latitude?: number;
  longitude?: number;
  addressDetails?: string;
  categoryId: number;
  wardId: number;
}

// ─── Category Types ───────────────────────────────────────────

export interface CategoryResponse {
  id: number;
  name: string;
  description: string;
}

// ─── Pagination ───────────────────────────────────────────────

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ─── RAG / Chatbot Types ──────────────────────────────────────

export interface Citation {
  source: string;
  content: string;
}

export interface RetrievalMeta {
  totalChunksRetrieved: number;
  afterFusion: number;
  afterGrading: number;
  latencyMs: number;
  provider: string;
}

export interface RagResponse {
  answer: string;
  citations: Citation[];
  meta: RetrievalMeta;
}

export interface ChatbotResponse {
  answer: string;
  citations: Citation[];
  latencyMs: number;
  provider: string;
  userId: number;
  chatId: string;
}

// ═══════════════════════════════════════════════════════════════
// API METHODS
// ═══════════════════════════════════════════════════════════════

export const authApi = {
  login: (username: string, password: string) =>
    request<TokenResponse | MfaRequiredResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      skipAuth: true,
    }),

  register: (data: {
    username: string; password: string; fullName: string;
    phoneNumber?: string; email: string;
  }) =>
    request<unknown>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
      skipAuth: true,
    }),

  mfaSetup: (username: string, password: string) =>
    request<string>("/api/auth/mfa/setup", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      skipAuth: true,
    }),

  mfaVerify: (username: string, password: string, mfaCode: string) =>
    request<TokenResponse>("/api/auth/mfa/verify", {
      method: "POST",
      body: JSON.stringify({ username, password, mfaCode }),
      skipAuth: true,
    }),

  firebaseLogin: (firebaseToken: string) =>
    request<TokenResponse>("/api/auth/firebase-login", {
      method: "POST",
      body: JSON.stringify({ firebaseToken }),
      skipAuth: true,
    }),
};

export const feedbackApi = {
  getAll: (page = 0, size = 20) =>
    request<PageResponse<FeedbackResponse>>(
      `/api/feedbacks?page=${page}&size=${size}`,
    ),

  getById: (id: string | number) =>
    request<FeedbackResponse>(`/api/feedbacks/${id}`),

  create: (data: FeedbackRequest) =>
    request<FeedbackResponse>("/api/feedbacks", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // New: state machine endpoints
  changeStatus: (id: number | string, status: string, note?: string) =>
    request<FeedbackResponse>(`/api/feedbacks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, note }),
    }),

  assignFeedback: (id: number | string, assigneeId: number) =>
    request<FeedbackResponse>(`/api/feedbacks/${id}/assign`, {
      method: "PATCH",
      body: JSON.stringify({ assigneeId }),
    }),

  getLogs: (id: number | string) =>
    request<unknown[]>(`/api/feedbacks/${id}/logs`),
};

export const categoryApi = {
  getAll: () => request<CategoryResponse[]>("/api/categories"),

  create: (name: string, description?: string) =>
    request<CategoryResponse>("/api/categories", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    }),
};

export const ragApi = {
  query: (question: string, options?: Record<string, unknown>) =>
    request<RagResponse>("/api/rag/query", {
      method: "POST",
      body: JSON.stringify({
        question,
        options: options || {
          docType: "traffic",
          language: "vi",
          topK: 10,
          allowedPermissions: ["PUBLIC"],
        },
      }),
    }),

  chatbot: (question: string, userId: string | number) =>
    request<ChatbotResponse>(
      `/api/rag/chatbot?q=${encodeURIComponent(question)}&userId=${userId}`,
    ),

  chatHistory: (userId: string | number) =>
    request<unknown[]>(`/api/rag/chat-history?userId=${userId}`),

  stats: () => request<Record<string, unknown>>("/api/rag/stats"),
};

export const aiApi = {
  router: (message: string, userId: string) =>
    request<Record<string, unknown>>(
      `/api/ai/router?message=${encodeURIComponent(message)}&userId=${encodeURIComponent(userId)}`,
    ),
};

// ─── Weather / Predictive Incident Types ──────────────────────

export interface CurrentWeather {
  temperature: number;
  precipitation: number;
  windspeed: number;
  relativeHumidity: number;
  weatherDescription: string;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  precipitation: number;
  windspeed: number;
}

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AlertLevel = "NORMAL" | "WATCH" | "WARNING" | "DANGER";
export type IncidentType = "FLOOD" | "FALLEN_TREE" | "ROAD_DAMAGE" | "POWER_OUTAGE";

export interface PredictedHotspot {
  wardName: string;
  latitude: number;
  longitude: number;
  incidentType: IncidentType;
  incidentLabel: string;
  riskLevel: RiskLevel;
  riskScore: number;
  reason: string;
}

export interface WeatherForecastResponse {
  current: CurrentWeather;
  next24Hours: HourlyForecast[];
  predictedHotspots: PredictedHotspot[] | null;
  alertLevel: AlertLevel;
  alertMessage: string;
}

export const weatherApi = {
  /** Dự báo đầy đủ kèm điểm nguy cơ — chỉ dành cho cán bộ */
  getForecast: () =>
    request<WeatherForecastResponse>("/api/weather/forecast"),

  /** Dự báo cơ bản — dành cho người dân, không cần đăng nhập */
  getPublicForecast: () =>
    request<WeatherForecastResponse>("/api/weather/forecast/public", { skipAuth: true }),
};

// ─── Analytics Types ─────────────────────────────────────────

export interface KpiData {
  total: number;
  resolved: number;
  pending: number;
  satisfactionRate: string;
}

export interface WardPerformance {
  name: string;
  resolved: number;
  satisfactionPct: number;
}

export interface MonthlyTrend {
  month: string;
  total: number;
  resolved: number;
}

export interface DispatchAgency {
  name: string;
  pendingCount: number;
  status: string;
}

export const analyticsApi = {
  kpi: () => request<KpiData>("/api/analytics/kpi"),
  wardPerformance: () => request<WardPerformance[]>("/api/analytics/ward-performance"),
  monthlyTrend: (months = 12) => request<MonthlyTrend[]>(`/api/analytics/monthly-trend?months=${months}`),
  dispatch: () => request<DispatchAgency[]>("/api/analytics/dispatch"),
};

// ─── Ward API ────────────────────────────────────────────────

export interface Ward {
  id: number;
  name: string;
}

export const wardApi = {
  getAll: () => request<Ward[]>("/api/wards"),
  search: (name: string) => request<Ward[]>(`/api/wards/search?name=${encodeURIComponent(name)}`),
};
