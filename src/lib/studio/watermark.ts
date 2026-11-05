// Single source of truth for the Studio's watermark show/hide logic, so the settings page, the
// group page, and the group-settings slide-over all agree instead of each re-deriving it.
import type { StudioTrip, StudioUser } from "./types";

type UserLike = Pick<StudioUser, "entitlements"> | null | undefined;
type TripLike = Pick<StudioTrip, "watermark"> | null | undefined;

// Whether the signed-in owner's plan (or an admin override) includes watermarking.
// `!== false` safe-defaults an older /me payload (missing the field) to allowed, so controls aren't
// wrongly hidden for real hosts. Note: a per-user admin override of `watermark` beats the plan, so a
// pilot customer can have this true without being on Pro/Premium.
export function hasWatermarkEntitlement(user: UserLike): boolean {
  return user?.entitlements?.features?.watermark !== false;
}

// Whether a group currently has watermarking switched on.
export function isWatermarkOn(trip: TripLike): boolean {
  return trip?.watermark?.enabled ?? false;
}

// Whether to surface the per-guest "full access" (clean-original) controls. That concept only exists
// while the event is watermarked, and granting it is plan-checked server-side, so we require both the
// event to be watermarked AND the owner to be entitled. When false we still show the guest list —
// just without the access toggles.
export function canManageGuestAccess(trip: TripLike, user: UserLike): boolean {
  return isWatermarkOn(trip) && hasWatermarkEntitlement(user);
}
