/**
 * React Query hooks cho tất cả API endpoints.
 * Dùng thay thế cho useEffect + fetch pattern cũ.
 */

import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  feedbackApi,
  categoryApi,
  ragApi,
  authApi,
  userApi,
  notificationApi,
  policeApi,
  type FeedbackResponse,
  type CategoryResponse,
  type ChatbotResponse,
  type FeedbackRequest,
  type FeedbackListFilters,
  type FeedbackStatusOption,
  type PageResponse,
  type TokenResponse,
  type MfaRequiredResponse,
  type UpdateProfileRequest,
  type UserProfile,
  type NotificationResponse,
  type FeedbackLookupStatsResponse,
  type PoliceFeedbackResponse,
} from "@/lib/api";
import {
  submitCitizenFeedbackMedia,
  type CitizenFeedbackMediaRequest,
  type CitizenFeedbackMediaResponse,
} from "@/lib/citizenFeedbackMediaApi";

// ─── Query keys (dùng để cache invalidation) ─────────────────

export const queryKeys = {
  feedbacks: {
    all: ["feedbacks"] as const,
    list: (page: number, size: number, filters: FeedbackListFilters) =>
      ["feedbacks", "list", page, size, filters] as const,
    publicList: (page: number, size: number, filters: FeedbackListFilters) =>
      ["feedbacks", "publicList", page, size, filters] as const,
    publicStats: (filters: FeedbackListFilters) =>
      ["feedbacks", "publicStats", filters] as const,
    statuses: ["feedbacks", "statuses"] as const,
    detail: (id: string | number) => ["feedbacks", id] as const,
    publicDetail: (id: string | number) => ["feedbacks", "publicDetail", id] as const,
  },
  categories: {
    all: ["categories"] as const,
  },
  auth: {
    me: ["auth", "me"] as const,
    profile: ["auth", "profile"] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    page: (size: number) => ["notifications", "page", size] as const,
    unreadCount: ["notifications", "unreadCount"] as const,
  },
  rag: {
    query: (q: string) => ["rag", "query", q] as const,
    chatbot: (q: string) => ["rag", "chatbot", q] as const,
    stats: ["rag", "stats"] as const,
  },
};

// ─── Feedback Hooks ──────────────────────────────────────────

export function useFeedbacks(page = 0, size = 3, filters: FeedbackListFilters = {}) {
  return useQuery<PageResponse<FeedbackResponse>>({
    queryKey: queryKeys.feedbacks.list(page, size, filters),
    queryFn: () => feedbackApi.getAll(page, size, filters),
    staleTime: 30_000, // 30s cache
  });
}

export function useFeedbackStatuses() {
  return useQuery<FeedbackStatusOption[]>({
    queryKey: queryKeys.feedbacks.statuses,
    queryFn: () => feedbackApi.getStatuses(),
    staleTime: 300_000,
  });
}

export function useFeedbackDetail(id: string | number) {
  return useQuery<FeedbackResponse>({
    queryKey: queryKeys.feedbacks.detail(id),
    queryFn: () => feedbackApi.getById(id),
    enabled: !!id,
  });
}

export function usePublicFeedbacks(page = 0, size = 10, filters: FeedbackListFilters = {}) {
  return useQuery<PageResponse<FeedbackResponse>>({
    queryKey: queryKeys.feedbacks.publicList(page, size, filters),
    queryFn: () => feedbackApi.getPublic(page, size, filters),
    staleTime: 30_000,
  });
}

export function usePublicFeedbackStats(filters: FeedbackListFilters = {}) {
  return useQuery<FeedbackLookupStatsResponse>({
    queryKey: queryKeys.feedbacks.publicStats(filters),
    queryFn: () => feedbackApi.getPublicStats(filters),
    staleTime: 30_000,
  });
}

export function usePublicFeedbackStatistics(filters: FeedbackListFilters = {}) {
  return useQuery<FeedbackLookupStatsResponse>({
    queryKey: queryKeys.feedbacks.publicStats(filters),
    queryFn: () => feedbackApi.getPublicFeedbackStatistics(filters),
    staleTime: 30_000,
  });
}

export function useWardStaffStatistics(date: string) {
  return useQuery<FeedbackLookupStatsResponse>({
    queryKey: ["ward-staff-dashboard-statistics", date],
    queryFn: () => feedbackApi.getWardStaffStatistics(date),
    staleTime: 30_000,
  });
}

export function useRecentPublicFeedback(limit = 5, filters: FeedbackListFilters = {}) {
  return useQuery<PageResponse<FeedbackResponse>>({
    queryKey: queryKeys.feedbacks.publicList(0, limit, filters),
    queryFn: () => feedbackApi.getRecentPublicFeedback(limit, filters),
    staleTime: 30_000,
  });
}

export function usePublicFeedbackDetail(id: string | number) {
  return useQuery<FeedbackResponse>({
    queryKey: queryKeys.feedbacks.publicDetail(id),
    queryFn: () => feedbackApi.getPublicById(id),
    enabled: !!id,
  });
}

export function useCreateFeedback() {
  const queryClient = useQueryClient();

  return useMutation<FeedbackResponse, Error, FeedbackRequest>({
    mutationFn: (data) => feedbackApi.create(data),
    onSuccess: () => {
      // Invalidate all feedback lists and notifications to refetch
      queryClient.invalidateQueries({ queryKey: ["feedbacks"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useCreateFeedbackWithMedia() {
  const queryClient = useQueryClient();

  return useMutation<
    CitizenFeedbackMediaResponse,
    Error,
    { data: CitizenFeedbackMediaRequest; files: File[] }
  >({
    mutationFn: ({ data, files }) => submitCitizenFeedbackMedia(data, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedbacks"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useChangeFeedbackStatus() {
  const queryClient = useQueryClient();
  return useMutation<
    FeedbackResponse,
    Error,
    { id: number | string; status: string; note?: string }
  >({
    mutationFn: ({ id, status, note }) => feedbackApi.changeStatus(id, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedbacks"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useAssignFeedback() {
  const queryClient = useQueryClient();
  return useMutation<FeedbackResponse, Error, { id: number | string; assigneeId: number }>({
    mutationFn: ({ id, assigneeId }) => feedbackApi.assignFeedback(id, assigneeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedbacks"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useRejectFeedback() {
  const queryClient = useQueryClient();
  return useMutation<FeedbackResponse, Error, { id: number | string; reason: string }>({
    mutationFn: ({ id, reason }) => policeApi.rejectFeedback(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedbacks"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useAcceptFeedback() {
  const queryClient = useQueryClient();
  return useMutation<PoliceFeedbackResponse, Error, number | string>({
    mutationFn: (id) => policeApi.acceptFeedback(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedbacks"] });
      queryClient.invalidateQueries({ queryKey: ["police", "assigned-feedbacks"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useUpdatePoliceFeedbackStatus() {
  const queryClient = useQueryClient();
  return useMutation<PoliceFeedbackResponse, Error, { id: number | string; status: string; note?: string }>({
    mutationFn: ({ id, status, note }) => policeApi.updateStatus(id, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedbacks"] });
      queryClient.invalidateQueries({ queryKey: ["police", "assigned-feedbacks"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useSubmitPoliceFeedbackResult() {
  const queryClient = useQueryClient();
  return useMutation<PoliceFeedbackResponse, Error, { id: number | string; resultNote: string }>({
    mutationFn: ({ id, resultNote }) => policeApi.submitResult(id, resultNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedbacks"] });
      queryClient.invalidateQueries({ queryKey: ["police", "assigned-feedbacks"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useRequestMoreInfo() {
  const queryClient = useQueryClient();
  return useMutation<FeedbackResponse, Error, { id: number | string; reason: string }>({
    mutationFn: ({ id, reason }) => policeApi.requestMoreInfo(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedbacks"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useHotspots() {
  return useQuery<any[]>({
    queryKey: ["feedbacks", "hotspots"],
    queryFn: () => policeApi.getHotspots(),
    staleTime: 60_000, // 1 min cache
  });
}

export function usePoliceAssignedFeedbacks() {
  return useQuery<PoliceFeedbackResponse[]>({
    queryKey: ["police", "assigned-feedbacks"],
    queryFn: () => policeApi.getAssignedFeedbacks(),
    staleTime: 10_000,
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
  return useMutation<
    TokenResponse | MfaRequiredResponse,
    Error,
    {
      username: string;
      password: string;
    }
  >({
    mutationFn: ({ username, password }) => authApi.login(username, password),
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (data: {
      username: string;
      password: string;
      fullName: string;
      phoneNumber?: string;
      email: string;
    }) => authApi.register(data),
  });
}

export function useMfaVerifyMutation() {
  return useMutation<TokenResponse, Error, { username: string; password: string; mfaCode: string }>(
    {
      mutationFn: ({ username, password, mfaCode }) =>
        authApi.mfaVerify(username, password, mfaCode),
    },
  );
}

export function useMfaSetupMutation() {
  return useMutation<string, Error, { username: string; password: string }>({
    mutationFn: ({ username, password }) => authApi.mfaSetup(username, password),
  });
}

export function useProfile() {
  return useQuery<UserProfile>({
    queryKey: queryKeys.auth.profile,
    queryFn: () => userApi.profile(),
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation<UserProfile, Error, UpdateProfileRequest>({
    mutationFn: (data) => userApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
  });
}

export function useNotifications() {
  return useQuery<NotificationResponse[]>({
    queryKey: queryKeys.notifications.all,
    queryFn: () => notificationApi.getAll(),
    staleTime: 30_000,
    refetchInterval: 10_000,
  });
}

export function useNotificationUnreadCount(enabled = true) {
  return useQuery<number>({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: () => notificationApi.getUnreadCount(),
    staleTime: 30_000,
    enabled,
    refetchInterval: 10_000,
  });
}

export function useInfiniteNotifications(size = 5) {
  return useInfiniteQuery<PageResponse<NotificationResponse>>({
    queryKey: queryKeys.notifications.page(size),
    queryFn: ({ pageParam }) => notificationApi.getPage(Number(pageParam ?? 0), size),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage.page ?? lastPage.number ?? 0;
      return lastPage.hasNext ? currentPage + 1 : undefined;
    },
    staleTime: 30_000,
    refetchInterval: 10_000,
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    NotificationResponse,
    Error,
    number | string,
    { previousNotifications?: NotificationResponse[]; previousUnreadCount?: number }
  >({
    mutationFn: (id) => notificationApi.markAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.unreadCount });

      const previousNotifications = queryClient.getQueryData<NotificationResponse[]>(
        queryKeys.notifications.all
      );
      const previousUnreadCount = queryClient.getQueryData<number>(
        queryKeys.notifications.unreadCount
      );

      if (previousNotifications) {
        queryClient.setQueryData<NotificationResponse[]>(
          queryKeys.notifications.all,
          previousNotifications.map((n) =>
            String(n.id) === String(id) ? { ...n, isRead: true } : n
          )
        );
      }

      if (typeof previousUnreadCount === "number") {
        queryClient.setQueryData<number>(
          queryKeys.notifications.unreadCount,
          Math.max(0, previousUnreadCount - 1)
        );
      }

      return { previousNotifications, previousUnreadCount };
    },
    onError: (err, id, context) => {
      if (context) {
        queryClient.setQueryData(queryKeys.notifications.all, context.previousNotifications);
        queryClient.setQueryData(queryKeys.notifications.unreadCount, context.previousUnreadCount);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    void,
    { previousNotifications?: NotificationResponse[]; previousUnreadCount?: number }
  >({
    mutationFn: () => notificationApi.markAllAsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.unreadCount });

      const previousNotifications = queryClient.getQueryData<NotificationResponse[]>(
        queryKeys.notifications.all
      );
      const previousUnreadCount = queryClient.getQueryData<number>(
        queryKeys.notifications.unreadCount
      );

      if (previousNotifications) {
        queryClient.setQueryData<NotificationResponse[]>(
          queryKeys.notifications.all,
          previousNotifications.map((n) => ({ ...n, isRead: true }))
        );
      }

      queryClient.setQueryData<number>(queryKeys.notifications.unreadCount, 0);

      return { previousNotifications, previousUnreadCount };
    },
    onError: (err, variables, context) => {
      if (context) {
        queryClient.setQueryData(queryKeys.notifications.all, context.previousNotifications);
        queryClient.setQueryData(queryKeys.notifications.unreadCount, context.previousUnreadCount);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
    },
  });
}

