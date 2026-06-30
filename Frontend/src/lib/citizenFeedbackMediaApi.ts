import { ApiError, getToken } from "./api";

const API_BASE: string =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) || "";

export interface CitizenFeedbackMediaRequest {
  title: string;
  description: string;
  latitude?: number;
  longitude?: number;
  addressDetails?: string;
  categoryId?: number;
  categoryCode: string;
  videoDurationsSeconds: number[];
}

export interface FeedbackAttachmentResponse {
  id: number;
  fileUrl: string;
  fileType: string;
  fileName: string | null;
  fileSize: number | null;
  uploadedAt: string;
}

export interface CitizenFeedbackMediaResponse {
  id: number;
  trackingCode: string;
  title: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  addressDetails: string | null;
  status: string;
  categoryCode: string | null;
  categoryName: string | null;
  managedByRole: string | null;
  wardId: number | null;
  wardName: string | null;
  districtName: string | null;
  cityName: string | null;
  assignedUnitId: number | null;
  assignedUnitName: string | null;
  assignedToRole: string | null;
  citizenName: string | null;
  submittedAt: string | null;
  receivedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  attachments: FeedbackAttachmentResponse[];
}

export async function submitCitizenFeedbackMedia(
  data: CitizenFeedbackMediaRequest,
  files: File[],
): Promise<CitizenFeedbackMediaResponse> {
  const formData = new FormData();
  formData.append("data", new Blob([JSON.stringify(data)], { type: "application/json" }));
  files.forEach((file) => formData.append("files", file));

  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/api/feedbacks/media`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    const body = contentType?.includes("application/json")
      ? await response.json().catch(() => null)
      : await response.text().catch(() => "");
    const message =
      body && typeof body === "object" && "message" in body
        ? String(body.message)
        : typeof body === "string" && body
          ? body
          : `Submit feedback failed with status ${response.status}`;

    throw new ApiError(response.status, message, body);
  }

  return response.json();
}

export async function getVideoDurationSeconds(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);

    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Math.floor(video.duration));
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Cannot read video duration"));
    };
    video.src = url;
  });
}
