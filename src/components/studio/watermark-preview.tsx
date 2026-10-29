// A live approximation of how the baked watermark looks: tiled, diagonal, semi-transparent text over
// a sample "photo" (a gradient). Mirrors the server's sharp output closely enough to choose the text.
// Cosmetic only — the real watermark is rendered by the backend worker with the same text.
export function WatermarkPreview({ text, opacity = 0.34 }: { text: string; opacity?: number }) {
  const label = (text.trim() || "TripSync").slice(0, 40);
  return (
    <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-gradient-to-br from-slate-400 via-slate-500 to-slate-700">
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
