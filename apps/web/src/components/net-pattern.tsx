/**
 * NetPattern — Decorative SVG honeycomb hex-mesh (FIFA World Cup goal net)
 *
 * Renders an absolute-positioned SVG background with a hexagonal honeycomb
 * tessellation — like the modern FIFA World Cup goal net mesh behind the
 * goalposts. Hexagons use green (#0B6E4F) and gold (#FFD166) strokes via
 * a linear gradient, creating a visible two-tone honeycomb effect.
 */
export function NetPattern({
  density = "normal",
  opacity = 1,
  className = "",
  fade = "bottom",
  variant = "green-to-gold",
}: {
  /** Hexagon size — dense ~22px, normal ~38px, sparse ~58px */
  density?: "dense" | "normal" | "sparse";
  /** Overall wrapper opacity (0-1) */
  opacity?: number;
  /** Extra classes for positioning */
  className?: string;
  /** Which edge fades out */
  fade?: "bottom" | "top" | "left" | "right" | "radial" | "none";
  /** Color scheme for the hex lines */
  variant?: "green-to-gold" | "gold-to-green" | "green-only" | "gold-only";
}) {
  // Unique IDs to avoid SVG clashes when multiple instances exist
  const uid = `hex-${variant}-${fade}-${density}`;
  const patternId = `pat-${uid}`;
  const gradientId = `grad-${uid}`;
  const fadeId = `fade-${uid}`;
  const maskId = `mask-${uid}`;

  // ── Hexagon geometry ──────────────────────────────────────────────
  // Base hexagon with radius r = 16 (center-to-vertex).
  //   hex width  = r * √3 ≈ 27.71
  //   hex height = r * 2   = 32
  // Pattern tile: width = hex_width ≈ 28, height = r * 3 = 48
  // We use a proven tile of 28 × 49.
  //
  // The tile contains one full hexagon plus partial edges that,
  // when repeated, form a seamless honeycomb tessellation.
  // ──────────────────────────────────────────────────────────────────

  const tileW = 28;
  const tileH = 49;

  // Scale factor controls density (bigger scale = larger hexagons = sparser)
  const scale = density === "dense" ? 0.8 : density === "sparse" ? 2.1 : 1.35;

  // Stroke width — thinner for dense, thicker for sparse
  const sw = density === "dense" ? 0.8 : density === "sparse" ? 1.2 : 1;

  // Stroke colors based on variant
  const colors = {
    "green-to-gold": { from: "#0B6E4F", to: "#FFD166" },
    "gold-to-green": { from: "#FFD166", to: "#0B6E4F" },
    "green-only": { from: "#0B6E4F", to: "#14A76C" },
    "gold-only": { from: "#FFD166", to: "#E6B84D" },
  }[variant];

  return (
    <div
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <svg
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Gradient applied to hexagon strokes: green ↔ gold */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.from} />
            <stop offset="100%" stopColor={colors.to} />
          </linearGradient>

          {/*
            Honeycomb hexagon tile.
            Points of the main hexagon (6-sided polygon):
              (14, 0)  → top center
              (28, 8)  → top-right
              (28, 24) → bottom-right
              (14, 32) → bottom center
              (0, 24)  → bottom-left
              (0, 8)   → top-left
            Plus a partial hex below for the offset row tessellation.
          */}
          <pattern
            id={patternId}
            width={tileW}
            height={tileH}
            patternUnits="userSpaceOnUse"
            patternTransform={`scale(${scale})`}
          >
            {/* Full hexagon — 6-sided polygon */}
            <path
              d="M14 0 L28 8 L28 24 L14 32 L0 24 L0 8 Z"
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={sw}
              strokeOpacity={0.4}
            />
            {/* Offset-row partial hex — two angled lines that complete
                the neighbor hexagon when the pattern tiles */}
            <path
              d="M14 32 L28 40 L28 49 M14 32 L0 40 L0 49"
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={sw}
              strokeOpacity={0.4}
            />
          </pattern>

          {/* ── Fade mask ─────────────────────────────────────────── */}
          {fade === "radial" ? (
            <radialGradient id={fadeId} cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
          ) : fade !== "none" ? (
            <linearGradient
              id={fadeId}
              x1={fade === "right" ? "100%" : "0%"}
              y1={fade === "bottom" ? "100%" : "0%"}
              x2={fade === "left" ? "100%" : "0%"}
              y2={fade === "top" ? "100%" : "0%"}
            >
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="60%" stopColor="white" stopOpacity="0.6" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
          ) : null}

          {fade !== "none" && (
            <mask id={maskId}>
              <rect width="100%" height="100%" fill={`url(#${fadeId})`} />
            </mask>
          )}
        </defs>

        {/* Fill the entire SVG with the honeycomb hex pattern */}
        <rect
          width="100%"
          height="100%"
          fill={`url(#${patternId})`}
          mask={fade !== "none" ? `url(#${maskId})` : undefined}
        />
      </svg>
    </div>
  );
}
