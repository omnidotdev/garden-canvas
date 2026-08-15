import { useMemo } from "react";

/**
 * Optically normalize an arbitrary glyph/emoji icon.
 *
 * Different characters have very different intrinsic ink sizes at the same
 * font-size (e.g. `⊗` renders far larger than `⏣`), so a fixed font-size makes
 * product icons look uneven. We measure each glyph's real ink box once, then
 * pick a font-size that makes its larger dimension fill `size` px and center it
 * in a `size`-square box. Real image logos should use <img>; this is glyph-only.
 */

// Measurement font stack, matching the app's inherited sans + emoji fallbacks.
// Only relative ink size matters here, so an approximate stack is fine.
const FONT_STACK =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Color Emoji", "Apple Color Emoji", sans-serif';

// Measure at a large size for precision; ink scales linearly with font-size.
const MEASURE_FONT_PX = 100;

const ratioCache = new Map<string, number>();

/** Ratio of a glyph's larger ink dimension to the font-size it is drawn at. */
const inkRatio = (glyph: string): number => {
  const cached = ratioCache.get(glyph);
  if (cached !== undefined) return cached;
  if (typeof document === "undefined") return 1;
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return 1;
  ctx.font = `${MEASURE_FONT_PX}px ${FONT_STACK}`;
  const m = ctx.measureText(glyph);
  const w = (m.actualBoundingBoxLeft ?? 0) + (m.actualBoundingBoxRight ?? 0);
  const h =
    (m.actualBoundingBoxAscent ?? 0) + (m.actualBoundingBoxDescent ?? 0);
  const ink = Math.max(w, h);
  const ratio = ink > 0 ? ink / MEASURE_FONT_PX : 1;
  ratioCache.set(glyph, ratio);
  return ratio;
};

interface GlyphIconProps {
  glyph: string;
  /** Target optical size (px) the glyph's larger dimension should fill. */
  size: number;
  className?: string;
  label?: string;
}

const GlyphIcon = ({ glyph, size, className, label }: GlyphIconProps) => {
  const fontSize = useMemo(() => size / inkRatio(glyph), [glyph, size]);

  // Render the glyph as SVG text centered by `dominant-baseline: central`
  // rather than an HTML flex box. Emoji have no reliable line-box centering in
  // HTML (with `line-height: 1` the glyph rides high off the baseline, and each
  // engine places it differently, e.g. Firefox's bundled emoji font sat it flush
  // with the card's top edge and looked clipped). SVG central baseline centers
  // the glyph the same way in every engine.
  return (
    <svg
      role="img"
      aria-label={label}
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ userSelect: "none", overflow: "visible", display: "block" }}
    >
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSize}
        fontFamily={FONT_STACK}
      >
        {glyph}
      </text>
    </svg>
  );
};

export default GlyphIcon;
