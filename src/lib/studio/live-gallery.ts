import type { PhotosPage, StudioPhoto } from "./types";

export type GalleryFetch = (options: { cursor?: string; ids?: string[]; limit?: number }) => Promise<PhotosPage>;

export function mergePhotos(existing: StudioPhoto[], incoming: StudioPhoto[]) {
  const byId = new Map(existing.map((photo) => [photo.id, photo]));
  for (const photo of incoming) byId.set(photo.id, photo);
  return [...byId.values()];
}

// Walk new head pages until reaching a known photo. Never replace the pagination cursor for
// older, already loaded pages. This also catches bursts larger than a single API page.
export async function refreshGallery(existing: StudioPhoto[], fetchPage: GalleryFetch, refreshOffset = 0, refreshAll = false) {
  const known = new Set(existing.map((photo) => photo.id));
  const head = await fetchPage({});
  let page = head;
  const arrivals = [...head.photos];
  const cursors = new Set<string>();
  while (existing.length && page.nextCursor && !page.photos.some((photo) => known.has(photo.id))) {
    if (cursors.has(page.nextCursor)) break;
    cursors.add(page.nextCursor);
    page = await fetchPage({ cursor: page.nextCursor });
    arrivals.push(...page.photos);
  }
  // Reconcile ready previews too: photos can be removed, access can change, and signed URLs expire.
  // Background updates rotate through bounded slices; an explicit Refresh checks all loaded photos.
  const ids = existing.length ? Array.from({ length: refreshAll ? existing.length : Math.min(60, existing.length) }, (_, i) => existing[(refreshOffset + i) % existing.length].id) : [];
  const updates: StudioPhoto[] = [];
  for (let i = 0; i < ids.length; i += 60) {
    updates.push(...(await fetchPage({ ids: ids.slice(i, i + 60), limit: 60 })).photos);
  }
  const refreshed = new Map([...arrivals, ...updates].map((photo) => [photo.id, photo]));
  // A photo that is now hidden/deleted must not remain visible after a targeted refresh.
  const visibleIds = new Set(updates.map((photo) => photo.id));
  const checked = new Set(ids);
  return {
    existing: existing.filter((photo) => !checked.has(photo.id) || visibleIds.has(photo.id)).map((photo) => refreshed.get(photo.id) ?? photo),
    arrivals: mergePhotos([], arrivals).filter((photo) => !known.has(photo.id)),
    total: head.total,
    nextCursor: page.nextCursor,
    replaceCursor: existing.length === 0,
    refreshOffset: refreshOffset + ids.length,
  };
}
