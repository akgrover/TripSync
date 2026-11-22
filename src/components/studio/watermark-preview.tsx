import { unsplash } from "@/lib/photos";

// A verified Unsplash sample used when the photographer hasn't uploaded a cover photo yet, so the
// watermark preview always sits on a real photo (not a flat grey box).
const SAMPLE_PHOTO = unsplash("1519046904884-53103b34b206", { w: 900, q: 80 });

// A live approximation of how the baked watermark looks: tiled, diagonal, semi-transparent text over
// a real photo (the photographer's cover when set, else a sample). Mirrors the server's sharp output
// closely enough to choose the text + opacity. Cosmetic only — the real watermark is rendered by the
// backend worker with the same text.
export function WatermarkPreview({
  text,
  opacity = 0.34,
  imageUrl,
}: {
  text: string;
  opacity?: number;
  imageUrl?: string | null;
}) {
  const label = (text.trim() || "TripSync").slice(0, 40);
  const bg = imageUrl || SAMPLE_PHOTO;
  return (
    <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-slate-200">
      {/* eslint-disable-next-line @next/next/no-img-element -- signed/remote URL, static export */}
      <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern
            id="watermark-preview-tile"
            width="240"
            height="150"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-30)"
          >
            <text
              x="0"
              y="75"
              fontFamily="Helvetica, Arial, sans-serif"
              fontSize="19"
              fontWeight="600"
              fill={`rgba(255,255,255,${opacity})`}
              stroke={`rgba(0,0,0,${(opacity * 0.45).toFixed(3)})`}
              strokeWidth="0.5"
            >
              {label}
            </text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#watermark-preview-tile)" />
      </svg>
    </div>
  );
}
