// Minimal shapes the Studio portal needs. Grown as features land (groups, photos, etc.).

export type StudioUser = {
  id: string;
  name: string;
  phone?: string;
  avatarUrl?: string | null;
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
  // Event groups whose purchased storage has expired return locked:true with no photos.
  locked?: boolean;
};
