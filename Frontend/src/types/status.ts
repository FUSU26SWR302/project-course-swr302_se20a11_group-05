/**
 * types/status.ts — Frontend badge display status types.
 *
 * Used to define the possible visual status modes for reports
 * and map them from backend database strings.
 */

export type ReportStatus = "pending" | "inProgress" | "resolved" | "urgent";
