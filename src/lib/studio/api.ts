import { API_BASE_URL } from "./config";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "./auth";
import type {
  AdminFlag,
  AdminOverview,
  AdminWindow,
  AuthResponse,
  PhotosPage,
  StudioTrip,
  StudioUser,
} from "./types";

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

// True when the access token is within `bufferMs` of expiring (or already expired). Used to refresh
// proactively BEFORE a request, so a long-running job (bulk uploads) doesn't stall on a wave of 401s
// at the 15-minute boundary. Reads the JWT's `exp` claim locally — no verification needed, just timing.
function accessTokenExpiresSoon(token: string, bufferMs = 60_000): boolean {
  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return false;
    }
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");
    const { exp } = JSON.parse(atob(padded)) as { exp?: number };
    return typeof exp === "number" && exp * 1000 - Date.now() < bufferMs;
  } catch {
    // Can't read the token — let the normal 401-refresh path handle it.
    return false;
  }
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    // Nothing to exchange — the session is unusable; clear so the app routes to login.
    clearTokens();
    return false;
  }
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      // Retry transient failures (network / 5xx) a few times. Only a DEFINITIVE rejection (the
      // refresh token itself is invalid/expired) logs the user out — a transient blip must not nuke
      // a long upload. If all retries fail transiently we keep the tokens so a later call can recover.
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          });
          if (res.ok) {
            const data = (await res.json()) as { accessToken: string; refreshToken: string };
            setTokens(data);
            return true;
          }
          if (res.status === 401 || res.status === 403) {
            clearTokens();
            return false;
          }
          // Other statuses (5xx, etc.) are transient — fall through and retry.
        } catch {
          // Network error — transient; fall through and retry.
        }
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 500 * 2 ** attempt + Math.random() * 250));
        }
      }
      return false;
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function request<T>(path: string, options: RequestOptions = {}, retried = false): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.auth !== false) {
    let token = getAccessToken();
    // Proactively refresh an about-to-expire token. The token is still valid here, so if the refresh
    // blips transiently we simply proceed with it and let the 401 path recover — no harm done.
    if (token && !retried && accessTokenExpiresSoon(token)) {
      await refreshAccessToken();
      token = getAccessToken() ?? token;
    }
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
    // One refresh + retry before giving up. refreshAccessToken clears tokens itself ONLY when the
    // refresh token is truly dead; a transient refresh failure leaves the session intact so the next
    // call can recover (this call still surfaces the 401 to its caller).
    if (!retried && (await refreshAccessToken())) {
      return request<T>(path, options, true);
    }
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
  // Exchange a Google/Apple identity token (from the browser's Google Identity Services) for our
  // session tokens. The verified token already carries name/email, so no separate profile is sent.
  oauthLogin: (provider: "google" | "apple", identityToken: string) =>
    request<AuthResponse>(`/auth/oauth/${provider}`, {
      method: "POST",
      body: { identityToken },
      auth: false,
    }),

  // Authenticated.
  getMe: () => request<{ user: StudioUser }>("/me"),
  // Set the display name (used for first-time sign-ups, same as the mobile app's onboarding).
  updateName: (name: string) =>
    request<{ user: StudioUser }>("/me", { method: "PATCH", body: { name } }),
  // Connect a Google account to the signed-in user (links the provider; 409 on conflicts).
  linkGoogle: (identityToken: string) =>
    request<{ user: StudioUser }>("/me/link/oauth/google", {
      method: "POST",
      body: { identityToken },
    }),
  // Set the default watermark style (text + opacity) for this photographer's events ('' clears text).
  setWatermarkStyle: (watermarkText: string, watermarkOpacity: number) =>
    request<{ user: StudioUser }>("/me", {
      method: "PATCH",
      body: { watermarkText, watermarkOpacity },
    }),

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
  // Event groups: turn the watermark on/off. Enabling queues existing photos for watermarking.
  setWatermark: (tripId: string, enabled: boolean) =>
    request<{ trip: StudioTrip }>(`/trips/${tripId}/settings`, {
      method: "POST",
      body: { watermarkEnabled: enabled },
    }),
  // Owner-only: grant/revoke a member's clean (un-watermarked) access after they pay the photographer.
  setMemberAccess: (tripId: string, memberId: string, cleanAccess: boolean) =>
    request<{ trip: StudioTrip }>(`/trips/${tripId}/members/${memberId}/clean-access`, {
      method: "POST",
      body: { cleanAccess },
    }),
  // Owner-only: re-generate every photo's watermark with the current style (after changing it).
  regenerateWatermark: (tripId: string) =>
    request<{ ok: boolean }>(`/trips/${tripId}/watermark/regenerate`, { method: "POST" }),
  // Owner-only: create a logical folder for organising photos; returns the refreshed trip.
  createFolder: (tripId: string, name: string) =>
    request<{ trip: StudioTrip }>(`/trips/${tripId}/folders`, { method: "POST", body: { name } }),
  // Owner-only: permanently delete the group and all its photos.
  deleteGroup: (tripId: string) => request<void>(`/trips/${tripId}`, { method: "DELETE" }),
  // Remove a photo for everyone in the group (owner or the photo's uploader).
  deletePhotoForAll: (tripId: string, photoId: string) =>
    request<{ removed: boolean }>(`/trips/${tripId}/photos/${photoId}/delete-for-all`, {
      method: "POST",
    }),
  getTripPhotos: (
    tripId: string,
    opts: { scope?: "all" | "mine"; cursor?: string; limit?: number; folder?: string } = {},
  ) => {
    const params = new URLSearchParams({
      scope: opts.scope ?? "all",
      limit: String(opts.limit ?? 48),
    });
    if (opts.cursor) {
      params.set("cursor", opts.cursor);
    }
    // A folder id filters to that folder; "none" filters to ungrouped; omitted = the flat feed.
    if (opts.folder) {
      params.set("folder", opts.folder);
    }
    return request<PhotosPage>(`/trips/${tripId}/photos?${params.toString()}`);
  },

  // Uploads (3-step signed flow, same as the mobile app). `folderId` files the whole batch under one
  // logical folder (omitted = ungrouped).
  createUploadBatch: (tripId: string, totalCount: number, folderId?: string) =>
    request<{ batch: { id: string; totalCount: number; processedCount: number; status: string } }>(
      `/trips/${tripId}/upload-batches`,
      { method: "POST", body: { totalCount, ...(folderId ? { folderId } : {}) } },
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

  // Admin portal (hidden). 404s for non-admins — the page treats that as "not authorized".
  // `window` scopes the upload/sign-up counts (1d/7d/30d/all); other columns are current state.
  getAdminOverview: (window: AdminWindow = "all") =>
    request<AdminOverview>(`/admin/overview?window=${window}`),
  getAdminFlags: () => request<{ flags: AdminFlag[] }>("/admin/flags"),
  setAdminFlag: (key: string, enabled: boolean) =>
    request<{ flags: AdminFlag[] }>("/admin/flags", { method: "POST", body: { key, enabled } }),
  // Per-customer override: value=true force-on, false force-off, null clears (back to plan default).
  // Identify the customer by any one of userId / phone / email.
  setUserOverride: (body: {
    userId?: string;
    phone?: string;
    email?: string;
    feature: string;
    value: boolean | null;
  }) =>
    request<{ id: string; name: string; entitlements: Record<string, boolean> }>("/admin/overrides", {
      method: "POST",
      body,
    }),
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
