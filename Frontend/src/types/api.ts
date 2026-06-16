/**
 * types/api.ts — All domain TypeScript types and interfaces.
 *
 * Extracted from lib/api.ts so that UI components can import types
 * without depending on the HTTP client layer.
 *
 * Usage:
 *   import type { FeedbackResponse, FeedbackStatus } from "@/types/api";
 */

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

// ─── Generic API Envelope ──────────────────────────────────────

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

// ─── Pagination ────────────────────────────────────────────────

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

// ─── Analytics Types ─────────────────────────────────────────

export interface KpiData {
  total: number;
  resolved: number;
  pending: number;
  satisfactionRate: string;
}

export interface WardPerformance {
  /** Ward name — backend uses 'name', mock data uses 'ward' */
  name?: string;
  ward?: string;
  resolved: number;
  /** Average hours to resolve — mock data uses 'avgHrs' */
  avgHrs?: number;
  satisfactionPct?: number;
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

// ─── Ward Types ───────────────────────────────────────────────

export interface Ward {
  id: number;
  name: string;
}
