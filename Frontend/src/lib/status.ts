import { type ReportStatus } from "@/types/status";

/** Map backend DB status string → frontend badge status */
export function mapStatus(backendStatus: string): ReportStatus {
  const m: Record<string, ReportStatus> = {
    PENDING: "pending",
    ASSIGNED: "inProgress",
    IN_PROGRESS: "inProgress",
    WAITING_INFO: "pending",
    RESOLVED: "resolved",
    REJECTED: "urgent",
    PRE_EMPTIVE: "pending",
  };
  return m[backendStatus] || "pending";
}
