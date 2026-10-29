// Minimal shapes the Studio portal needs. Grown as features land (groups, photos, etc.).

export type StudioUser = {
  id: string;
  name: string;
  phone?: string;
  avatarUrl?: string | null;
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
};

export type StudioPhoto = {
  id: string;
  uri: string;
  // Small WebP for the grid; absent until the backend worker has generated it.
  thumbUri?: string;
  aspectRatio: number;
  uploadedBy: string;
  location?: string;
};

export type PhotosPage = {
  photos: StudioPhoto[];
  nextCursor: string | null;
  total: number;
};
