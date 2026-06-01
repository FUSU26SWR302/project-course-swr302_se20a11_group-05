/**
 * React Query hooks cho tất cả API endpoints.
 * Dùng thay thế cho useEffect + fetch pattern cũ.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  feedbackApi, categoryApi, ragApi, authApi,
  type FeedbackResponse, type CategoryResponse,
  type ChatbotResponse, type FeedbackRequest,
  type PageResponse, type TokenResponse,
  type MfaRequiredResponse,
} from "@/lib/api";

// ─── Query keys (dùng để cache invalidation) ─────────────────

export const queryKeys = {
  feedbacks: {
    all: ["feedbacks"] as const,
    list: (page: number) => ["feedbacks", "list", page] as const,
    detail: (id: string | number) => ["feedbacks", id] as const,
  },
  categories: {
    all: ["categories"] as const,
  },
  auth: {
    me: ["auth", "me"] as const,
  },
  rag: {
    query: (q: string) => ["rag", "query", q] as const,
    chatbot: (q: string) => ["rag", "chatbot", q] as const,
    stats: ["rag", "stats"] as const,
  },
};

// ─── Feedback Hooks ──────────────────────────────────────────

export function useFeedbacks(page = 0, size = 20) {
  return useQuery<PageResponse<FeedbackResponse>>({
    queryKey: queryKeys.feedbacks.list(page),
    queryFn: () => feedbackApi.getAll(page, size),
    staleTime: 30_000, // 30s cache
  });
}

export function useFeedbackDetail(id: string | number) {
  return useQuery<FeedbackResponse>({
    queryKey: queryKeys.feedbacks.detail(id),
    queryFn: () => feedbackApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateFeedback() {
  const queryClient = useQueryClient();

  return useMutation<FeedbackResponse, Error, FeedbackRequest>({
    mutationFn: (data) => feedbackApi.create(data),
    onSuccess: () => {
      // Invalidate all feedback lists to refetch
      queryClient.invalidateQueries({ queryKey: ["feedbacks"] });
    },
  });
}

export function useChangeFeedbackStatus() {
  const queryClient = useQueryClient();
  return useMutation<FeedbackResponse, Error, { id: number | string; status: string; note?: string }>({
    mutationFn: ({ id, status, note }) => feedbackApi.changeStatus(id, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedbacks"] });
    },
  });
}

export function useAssignFeedback() {
  const queryClient = useQueryClient();
  return useMutation<FeedbackResponse, Error, { id: number | string; assigneeId: number }>({
    mutationFn: ({ id, assigneeId }) => feedbackApi.assignFeedback(id, assigneeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedbacks"] });
    },
  });
}

// ─── Category Hooks ──────────────────────────────────────────

export function useCategories() {
  return useQuery<CategoryResponse[]>({
    queryKey: queryKeys.categories.all,
    queryFn: () => categoryApi.getAll(),
    staleTime: 300_000, // 5 phút (categories ít thay đổi)
  });
}

// ─── RAG / Chatbot Hooks ─────────────────────────────────────

export function useChatbot(question: string, userId: string | number, enabled = false) {
  return useQuery<ChatbotResponse>({
    queryKey: queryKeys.rag.chatbot(question),
    queryFn: () => ragApi.chatbot(question, userId),
    enabled: enabled && question.length > 0,
  });
}

export function useRagStats() {
  return useQuery({
    queryKey: queryKeys.rag.stats,
    queryFn: () => ragApi.stats(),
  });
}

// ─── Auth Hooks ──────────────────────────────────────────────

export function useLoginMutation() {
  return useMutation<TokenResponse | MfaRequiredResponse, Error, {
    username: string;
    password: string;
  }>({
    mutationFn: ({ username, password }) => authApi.login(username, password),
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (data: {
      username: string; password: string; fullName: string;
      phoneNumber?: string; email: string;
    }) => authApi.register(data),
  });
}

export function useMfaVerifyMutation() {
  return useMutation<TokenResponse, Error, { username: string; password: string; mfaCode: string }>({
    mutationFn: ({ username, password, mfaCode }) =>
      authApi.mfaVerify(username, password, mfaCode),
  });
}

export function useMfaSetupMutation() {
  return useMutation<string, Error, { username: string; password: string }>({
    mutationFn: ({ username, password }) =>
      authApi.mfaSetup(username, password),
  });
}
