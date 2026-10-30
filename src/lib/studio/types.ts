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
  quotaBytes: number;
  quotaPct: number;
  plan: "free" | "plus";
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
  owners: AdminOwnerRow[];
};
