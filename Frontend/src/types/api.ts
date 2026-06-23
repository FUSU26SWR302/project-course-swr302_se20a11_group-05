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
  wardName?: string | null;
  wardType?: string | null;
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
  | "SUBMITTED"
  | "PENDING_RECEIVE"
  | "PENDING"
  | "NEED_LOCATION_REVIEW"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "WAITING_INFO"
  | "RESOLVED"
  | "REJECTED"
  | "PRE_EMPTIVE";

export interface FeedbackResponse {
  id: number;
  trackingCode: string;
  title: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  addressDetails: string | null;
  status: FeedbackStatus;
  categoryCode?: string | null;
  categoryName: string | null;
  category?: string | null;
  managedByRole?: BackendRole | null;
  wardId?: number | null;
  wardName?: string | null;
  districtName?: string | null;
  cityName?: string | null;
  assignedUnitId?: number | null;
  assignedUnitName?: string | null;
  assignedToRole?: BackendRole | null;
  assignedStaffId?: number | null;
  citizenName: string | null;
  assigneeName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackRequest {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  addressDetails?: string;
  categoryId?: number;
  categoryCode: string;
  wardId?: number;
}

// ─── Category Types ───────────────────────────────────────────

export interface CategoryResponse {
  id: number;
  code: string;
  name: string;
  description: string;
  nameVi?: string;
  nameEn?: string;
  descriptionVi?: string;
  descriptionEn?: string;
  managedByRole?: BackendRole;
  active?: boolean;
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

// ─── Analytics Types ─────────────────────────────────────────

export interface KpiData {
  total: number;
  resolved: number;
  unresolved: number;
  inProgress: number;
  pending: number;
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
