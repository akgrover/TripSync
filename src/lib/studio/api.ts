import { API_BASE_URL } from "./config";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "./auth";
import type { AuthResponse, PhotosPage, StudioTrip, StudioUser } from "./types";

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  // Set false for unauthenticated endpoints (OTP start/verify). Defaults to attaching the token.
  auth?: boolean;
};

// Access tokens live ~15 min; the refresh token ~30 days. When a call 401s we silently exchange the
// refresh token for a new access token (once, de-duped across concurrent calls) and retry — so a
// reload or an idle tab keeps working for the full refresh-token lifetime instead of forcing login.
let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return false;
  }
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) {
          return false;
        }
        const data = (await res.json()) as { accessToken: string; refreshToken: string };
        setTokens(data);
        return true;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function request<T>(path: string, options: RequestOptions = {}, retried = false): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.auth !== false) {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (res.status === 401 && options.auth !== false) {
    // Try a one-time refresh + retry before giving up. Only clear tokens (real logout) if the
    // refresh token is also dead or the retried call still 401s.
    if (!retried && (await refreshAccessToken())) {
      return request<T>(path, options, true);
    }
    clearTokens();
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let code: string | undefined;
    try {
      const payload = (await res.json()) as { error?: { message?: string; code?: string } };
      message = payload.error?.message || message;
      code = payload.error?.code;
    } catch {
      // Non-JSON error body — keep the generic message.
    }
    throw new ApiError(message, res.status, code);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export const studioApi = {
  // Auth (unauthenticated).
  startOtp: (phone: string) =>
    request<{ expiresInSeconds: number; devCode?: string }>("/auth/otp/start", {
      method: "POST",
      body: { phone },
      auth: false,
    }),
  verifyOtp: (phone: string, code: string) =>
    request<AuthResponse>("/auth/otp/verify", { method: "POST", body: { phone, code }, auth: false }),

  // Authenticated.
  getMe: () => request<{ user: StudioUser }>("/me"),
  // Set the display name (used for first-time sign-ups, same as the mobile app's onboarding).
  updateName: (name: string) =>
    request<{ user: StudioUser }>("/me", { method: "PATCH", body: { name } }),

  // Groups.
  getTrips: () => request<{ trips: StudioTrip[] }>("/trips"),
  // Photographers create Event (single_payer) groups by default — one host stores everything.
  // (Shared groups + options come later; the API already supports both.)
  createEventGroup: (title: string) =>
    request<{ trip: StudioTrip }>("/trips", {
      method: "POST",
      body: { title, storageMode: "single_payer" },
    }),
  joinGroup: (code: string) =>
    request<{ trip: StudioTrip }>("/trips/join", { method: "POST", body: { code } }),
  // Owner-only group settings. Each call sends one changed field; the server returns the full trip.
  setMemberUploads: (tripId: string, allowMemberUploads: boolean) =>
    request<{ trip: StudioTrip }>(`/trips/${tripId}/settings`, {
      method: "POST",
      body: { allowMemberUploads },
    }),
  setPhotoVisibility: (tripId: string, photoVisibility: "everyone" | "matched_only") =>
    request<{ trip: StudioTrip }>(`/trips/${tripId}/settings`, {
      method: "POST",
      body: { photoVisibility },
    }),
  // Owner-only: permanently delete the group and all its photos.
  deleteGroup: (tripId: string) => request<void>(`/trips/${tripId}`, { method: "DELETE" }),
  // Remove a photo for everyone in the group (owner or the photo's uploader).
  deletePhotoForAll: (tripId: string, photoId: string) =>
    request<{ removed: boolean }>(`/trips/${tripId}/photos/${photoId}/delete-for-all`, {
      method: "POST",
    }),
  getTripPhotos: (
    tripId: string,
    opts: { scope?: "all" | "mine"; cursor?: string; limit?: number } = {},
  ) => {
    const params = new URLSearchParams({
      scope: opts.scope ?? "all",
      limit: String(opts.limit ?? 48),
    });
    if (opts.cursor) {
      params.set("cursor", opts.cursor);
    }
    return request<PhotosPage>(`/trips/${tripId}/photos?${params.toString()}`);
  },

  // Uploads (3-step signed flow, same as the mobile app).
  createUploadBatch: (tripId: string, totalCount: number, clientQueueId?: string) =>
    request<{ batch: { id: string; totalCount: number; processedCount: number; status: string } }>(
      `/trips/${tripId}/upload-batches`,
      { method: "POST", body: { totalCount, clientQueueId } },
    ),
  initPhotoUpload: (
    tripId: string,
    batchId: string,
    body: { fileName: string; contentType: string; contentHash?: string; contentSize?: number },
  ) =>
    request<PhotoInitResult>(`/trips/${tripId}/upload-batches/${batchId}/photos/init`, {
      method: "POST",
      body,
    }),
  completePhotoUpload: (
    tripId: string,
    batchId: string,
    body: {
      objectKey: string;
      contentType: string;
      sizeBytes: number;
      width: number;
      height: number;
      contentHash?: string;
      contentSize?: number;
    },
  ) =>
    request<{ photo: { id: string } }>(
      `/trips/${tripId}/upload-batches/${batchId}/photos/complete`,
      { method: "POST", body },
    ),
};

// init returns a signed S3 PUT URL for a new photo, or a duplicate marker when the exact file is
// already in the group (the backend counts it against the batch and we skip the upload).
export type PhotoInitResult =
  | { uploadUrl: string; objectKey: string }
  | { duplicate: true; restored?: boolean };

// Upload the original bytes straight to S3. No auth header (the URL is presigned); the Content-Type
// MUST equal the one passed to init, or S3 rejects the presigned signature.
export async function putToS3(uploadUrl: string, file: File, contentType: string): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": contentType },
  });
  if (!res.ok) {
    throw new ApiError(`Storage upload failed (${res.status})`, res.status);
  }
}
