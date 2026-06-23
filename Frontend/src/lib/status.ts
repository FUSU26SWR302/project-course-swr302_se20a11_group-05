import { type ReportStatus } from "@/types/status";

/** Map backend DB status string → frontend badge status */
export function mapStatus(backendStatus: string): ReportStatus {
  const m: Record<string, ReportStatus> = {
    SUBMITTED: "pending",
    PENDING_RECEIVE: "pending",
    PENDING: "pending",
    NEED_LOCATION_REVIEW: "pending",
    ASSIGNED: "inProgress",
    IN_PROGRESS: "inProgress",
    WAITING_INFO: "pending",
    RESOLVED: "resolved",
    REJECTED: "urgent",
    PRE_EMPTIVE: "pending",
  };
  return m[backendStatus] || "pending";
}

/** Group status string into one of the four main dashboard status categories */
export function getGroupedFeedbackStatus(status: string | undefined): "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED" | "UNKNOWN" {
  if (!status) return "UNKNOWN";
  const upperStatus = status.toUpperCase();
  switch (upperStatus) {
    case "SUBMITTED":
    case "PENDING_RECEIVE":
    case "PENDING":
    case "PRE_EMPTIVE":
      return "PENDING";
    case "NEED_MORE_INFO":
    case "ACCEPTED":
    case "IN_PROGRESS":
    case "TRANSFERRED":
    case "WAITING_INFO":
    case "ASSIGNED":
      return "IN_PROGRESS";
    case "RESOLVED":
    case "COMPLETED":
      return "RESOLVED";
    case "REJECTED":
    case "DECLINED":
      return "REJECTED";
    default:
      return "UNKNOWN";
  }
}

