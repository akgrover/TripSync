// Curated Unsplash photo IDs (travel / friends / party) used throughout the
// landing page mockups. Every ID below has been verified to resolve.
export function unsplash(
  id: string,
  { w = 800, q = 80, faces = false }: { w?: number; q?: number; faces?: boolean } = {}
) {
  const crop = faces ? "&crop=faces&fp-z=1.4" : "&fit=crop";
  return `https://images.unsplash.com/photo-${id}?w=${w}&q=${q}&auto=format${crop}`;
}

// Five active members shown on the album top bar.
export const groupMembers = [
  { name: "Maya", id: "1500835556837-99ac94a94552" },
  { name: "Theo", id: "1522543558187-768b6df7c25c" },
  { name: "Priya", id: "1506929562872-bb421503ef21" },
  { name: "Sam", id: "1445019980597-93fa8acb246c" },
  { name: "Ling", id: "1465146344425-f00d5f5c8f07" },
];

// The photo grid inside the interactive product demo. `ofYou` flags the
// subset returned when the "Photos of You" tab is active.
export const demoPhotos: { id: string; ofYou: boolean; tall?: boolean }[] = [
  { id: "1517457373958-b7bdd4587205", ofYou: true, tall: true },
  { id: "1529333166437-7750a6dd5a70", ofYou: false },
  { id: "1523580494863-6f3031224c94", ofYou: true },
  { id: "1531058020387-3be344556be6", ofYou: false, tall: true },
  { id: "1544117519-31a4b719223d", ofYou: false },
  { id: "1519046904884-53103b34b206", ofYou: true },
  { id: "1543269865-cbf427effbad", ofYou: false, tall: true },
  { id: "1493225457124-a3eb161ffa5f", ofYou: false },
  { id: "1533105079780-92b9be482077", ofYou: true },
  { id: "1543807535-eceef0bc6599", ofYou: false },
  { id: "1520342868574-5fa3804e551c", ofYou: false, tall: true },
  { id: "1477959858617-67f85cf4f1df", ofYou: true },
  { id: "1524504388940-b1c1722653e1", ofYou: false },
  { id: "1508921912186-1d1a45ebb3c1", ofYou: false, tall: true },
  { id: "1470229722913-7c0e2dbbafd3", ofYou: false },
  { id: "1414235077428-338989a2e8c0", ofYou: false },
];

// Hero collage — a small handful of vibrant travel shots.
export const heroCollage = [
  "1517457373958-b7bdd4587205",
  "1529333166437-7750a6dd5a70",
  "1523580494863-6f3031224c94",
  "1531058020387-3be344556be6",
];
