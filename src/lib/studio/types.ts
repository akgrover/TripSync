// Minimal shapes the Studio portal needs. Grown as features land (groups, photos, etc.).

export type StudioEntitlements = {
  features: Record<string, boolean>;
  limits: { retentionDays: number | null; maxPhotos: number | null };
};

export type AdminFlag = { key: string; enabled: boolean; betaCount: number };

export type StudioUser = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  avatarUrl?: string | null;
  // Which sign-in methods are connected to this account (for the Settings "Sign-in methods" section).
  linkedMethods?: { phone: boolean; google: boolean; apple: boolean };
  // True when the user owns at least one event group (a "host"). Gates host-only web UI like the
  // watermark style settings, while profile/sign-in stay visible to everyone.
  isHost?: boolean;
  // EFFECTIVE plan id ('free' | 'essential' | 'pro' | 'premium'; reverts to 'free' once lapsed),
  // display label, renewal/expiry date, and whether a paid plan has lapsed.
  plan?: string | null;
  planLabel?: string;
  planRenewsAt?: string | null;
  planExpired?: boolean;
  photoCap?: number | null; // the current plan's active-photo cap (null = unlimited)
  // Current active storage usage and the plan's quota, in bytes (for the Plan usage meter).
  // storageQuotaBytes is null for an unlimited plan (the meter then hides the number).
  storageUsedBytes?: number;
  storageQuotaBytes?: number | null;
  // Computed feature entitlements (plan → override → global flag). Render UI from this.
  entitlements?: StudioEntitlements;
  // True until the user has picked a real display name (phone sign-ups start on a placeholder).
  // We ask first-time users for their name before sending them into the portal.
  needsName?: boolean;
  // Default watermark text for this photographer's events (falls back to their name when empty).
  watermarkText?: string;
  // Watermark text opacity (0.1–0.6); null when unset (uses the default).
  watermarkOpacity?: number | null;
};

export type AuthResponse = {
  user: StudioUser;
  accessToken: string;
  refreshToken: string;
};

export type StudioFolder = {
  id: string;
  name: string;
};

export type StudioMember = {
  id: string;
  name: string;
  avatar: string;
  role?: "owner" | "member";
  // Watermark exemption (owner view only): true when this member has been granted clean access.
  cleanAccess?: boolean;
};

export type StudioTrip = {
  id: string;
  title: string;
  coverUrl: string;
  inviteCode?: string;
  storageMode?: "shared" | "single_payer";
  photoCount?: number;
  members: StudioMember[];
  isOwner?: boolean;
  allowMemberUploads?: boolean;
  canUpload?: boolean;
  photoVisibility?: "everyone" | "matched_only";
  // Watermark / proofing (event groups). When enabled, guests see a watermarked preview.
  watermark?: { enabled: boolean };
  // Logical folders for organising photos (web). Ordered by creation.
  folders?: StudioFolder[];
};

export type StudioPhoto = {
  id: string;
  uri: string;
  // Small WebP for the grid; absent until the backend worker has generated it.
  thumbUri?: string;
  aspectRatio: number;
  uploadedBy: string;
  location?: string;
  // Logical folder this photo belongs to (null = ungrouped).
  folderId?: string | null;
};

export type PhotosPage = {
  photos: StudioPhoto[];
  nextCursor: string | null;
  total: number;
};

// A purchasable plan from GET /billing/plans — drives the upgrade UI dynamically from the catalog.
export type PlanOffer = {
  id: string;
  label: string;
  amountPaise: number;
  currency: string;
  durationDays: number;
  features: Record<string, boolean>;
  storageBytes: number | null; // null = unlimited (hide the value)
  maxPhotos: number | null; // null = unlimited
  retentionDays: number | null;
};

// What the API returns to open a payment provider's checkout widget (provider-agnostic shape).
export type CheckoutInfo = {
  provider: string;
  keyId: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  plan: string;
  label: string;
};

// Admin portal (hidden /studio/records, gated server-side by the ADMIN_PHONES allowlist). One row
// per photographer who owns an Event group, plus platform totals. Mirrors the API's AdminOverview.
export type AdminWindow = "1d" | "7d" | "30d" | "all";
export type AdminOwnerRow = {
  id: string;
  name: string;
  phone: string;
  groupCount: number; // total event groups owned (current state, not windowed)
  uploadedPhotos: number; // active photos uploaded within the window ("all" = all active photos)
  storageUsedBytes: number; // current state
  quotaBytes: number | null; // null = unlimited — effective storage limit (plan or override)
  quotaPct: number;
  plan: string; // 'free' | 'essential' | 'pro' | 'premium'
  guestsReached: number; // total unique guests (current state)
  watermarkEvents: number;
  lifetimePhotosUploaded: number;
  lifetimeBytesUploaded: number;
  createdAt: string;
  lastActiveAt: string;
  flags: { overQuota: boolean; nearQuota: boolean };
  // Optional so an older API response (or a missing field) can't crash the table.
  features?: Record<string, boolean>; // effective entitlements for this customer
  overrides?: Record<string, boolean>; // admin-set per-user overrides (subset of features)
  photoCap?: number | null; // effective active-photo limit (null = unlimited)
  // Raw per-user limit overrides (null = none set, using the plan/free default).
  storageQuotaOverrideBytes?: number | null;
  maxPhotosOverride?: number | null;
};

// What POST /admin/limits returns after setting/clearing a customer's limit overrides.
export type AdminLimitsResult = {
  id: string;
  name: string;
  quotaBytes: number | null;
  photoCap: number | null;
  storageQuotaOverrideBytes: number | null;
  maxPhotosOverride: number | null;
};

// All-users sign-in-method counts (overlap when a user links more than one method).
export type AdminAuthMethods = {
  totalUsers: number;
  phone: number;
  google: number;
  apple: number;
};

export type AdminOverview = {
  generatedAt: string;
  window: AdminWindow;
  summary: {
    ownerCount: number;
    eventGroupCount: number;
    totalUploadedPhotos: number; // uploaded within the window
    totalStorageUsedBytes: number; // current state
    totalGuestsReached: number;
    newOwnersInWindow: number; // photographers who signed up within the window
  };
  authMethods?: AdminAuthMethods; // optional so an older API response can't crash the page
  owners: AdminOwnerRow[];
};
