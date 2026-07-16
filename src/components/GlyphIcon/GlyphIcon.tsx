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

  return (
    <span
      role="img"
      aria-label={label}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        fontSize,
        lineHeight: 1,
        userSelect: "none",
      }}
    >
      {glyph}
    </span>
  );
};

export default GlyphIcon;
