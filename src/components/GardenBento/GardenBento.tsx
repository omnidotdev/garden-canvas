import { ExternalLinkIcon, FlowerIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { cn, isImageUrl } from "../../lib/utils";
import { GlyphIcon } from "../GlyphIcon";
import { SproutDialog } from "../SproutDialog";

import type { CSSProperties } from "react";
import type { GardenRendererProps } from "../../lib/plugins/layout";
import type { NodeData } from "../nodes";

/**
 * Bento (masonry) garden renderer. Lays the products out as a wall of
 * varied-size tiles packed into a dense CSS grid, the way a bento box mixes
 * large and small compartments. Unlike the graph layouts it drops the hierarchy
 * and relation edges: a bento is for browsing the products at a glance, not for
 * reading their connections. Each tile opens the shared product dialog, mirroring
 * the 3D view.
 *
 * A renderer has no React Flow context, so (like the 3D layout) it draws its own
 * cards rather than reusing `SproutNode`, whose connection `Handle`s require that
 * context.
 */

type BentoSize = "small" | "wide" | "tall" | "big";

// Grid spans per tile size. Spans clamp to the available columns, so on a narrow
// viewport (where the auto-fill grid collapses to one or two columns) a wide or
// big tile simply fills the row instead of overflowing.
const SPAN_CLASS: Record<BentoSize, string> = {
  small: "garden:col-span-1 garden:row-span-1",
  wide: "garden:col-span-2 garden:row-span-1",
  tall: "garden:col-span-1 garden:row-span-2",
  big: "garden:col-span-2 garden:row-span-2",
};

const ICON_SIZE: Record<BentoSize, number> = {
  small: 44,
  wide: 52,
  tall: 56,
  big: 72,
};

// A repeating rhythm of feature tiles scattered through the smalls. `grid-auto-
// flow: dense` then backfills the gaps the larger tiles leave, so the wall packs
// tight for any product count without a bespoke layout pass.
const SIZE_CYCLE: BentoSize[] = [
  "big",
  "small",
  "small",
  "wide",
  "small",
  "tall",
  "small",
  "small",
];

/**
 * Tile size for the product at `index`. Coming-soon products are always the
 * small tile so unreleased teasers stay quiet next to the launched ones.
 */
const bentoSize = (index: number, comingSoon: boolean): BentoSize =>
  comingSoon ? "small" : SIZE_CYCLE[index % SIZE_CYCLE.length];

// Stable hue derived from the product name, matching the relation-edge hashing.
// It only backstops products the catalog has no brand color for, so the tile
// still gets its own consistent color instead of the generic garden green.
const hashHue = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) % 360;
  }
  return hash;
};

/** The product's brand color, falling back to a stable per-product hue. */
const productColor = (data: NodeData): string =>
  data.theme?.primary_color || `hsl(${hashHue(data.label)} 65% 55%)`;

interface BentoTileProps {
  data: NodeData;
  size: BentoSize;
  onOpen: () => void;
}

const BentoTile = ({ data, size, onOpen }: BentoTileProps) => {
  const comingSoon = Boolean(data.coming_soon);
  const color = productColor(data);
  const glyph = data.image || data.logo || data.icon || "🌱";
  const teaser = data.tagline || data.description;

  // The preview glyph: a real product image if the catalog carries one,
  // otherwise the emoji/logo rendered by GlyphIcon
  const preview = isImageUrl(data.image) ? (
    <img
      src={data.image}
      alt={data.label}
      className="garden:object-contain"
      style={{ height: "62%", width: "62%", maxHeight: "8rem" }}
    />
  ) : (
    <GlyphIcon glyph={glyph} size={ICON_SIZE[size]} label={data.label} />
  );

  const content = (
    <>
      {/* Preview hero: the glyph/image sits on the plain card surface, so the
          product's color reads from the tile's border alone rather than a fill.
          A brand-colored hairline still divides the hero from the footer, and
          the coming-soon state rides here as a corner pill. */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flex: "1 1 auto",
          minHeight: 0,
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--garden-card)",
          borderBottom: `1px solid color-mix(in oklab, ${color} 42%, transparent)`,
        }}
      >
        {preview}
        {comingSoon && (
          <span
            style={{
              position: "absolute",
              top: "0.5rem",
              right: "0.5rem",
              borderRadius: "9999px",
              padding: "0.125rem 0.5rem",
              fontSize: "0.625rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color,
              backgroundColor:
                "color-mix(in oklab, var(--garden-card) 82%, transparent)",
              border: `1px solid color-mix(in oklab, ${color} 45%, transparent)`,
            }}
          >
            Coming soon
          </span>
        )}
      </div>

      {/* Footer: label + tagline on the plain card surface, so the copy stays
          legible against the tinted hero above. */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.125rem",
          padding: "0.625rem 0.75rem",
          width: "100%",
          textAlign: "center",
          backgroundColor: "var(--garden-card)",
        }}
      >
        <h3 className="garden:line-clamp-2 garden:font-medium garden:text-foreground">
          {data.label}
        </h3>
        {teaser && (
          <p className="garden:line-clamp-2 garden:text-foreground/70 garden:text-sm garden:leading-snug">
            {teaser}
          </p>
        )}
      </div>
    </>
  );

  // Full border in the product's own color, so the wall reads as each app's
  // brand at a glance. A same-color ring shadow keeps even light brand colors
  // legible against the card, and `overflow: hidden` clips the hero gradient
  // to the rounded corners.
  const cardClass =
    "garden:flex garden:h-full garden:w-full garden:flex-col garden:rounded-xl garden:border-[3px] garden:shadow-sm garden:transition-transform";
  const cardStyle: CSSProperties = {
    borderColor: color,
    overflow: "hidden",
    backgroundColor: "var(--garden-card)",
    boxShadow: `0 1px 2px rgba(0, 0, 0, 0.06), 0 0 0 1px color-mix(in oklab, ${color} 20%, transparent)`,
    // Coming-soon tiles read as quiet/inactive: dimmed and slightly desaturated
    // so the launched products stay the focus.
    ...(comingSoon ? { opacity: 0.72, filter: "grayscale(0.55)" } : {}),
  };

  if (comingSoon) {
    return (
      <div className={SPAN_CLASS[size]}>
        <div className={cardClass} style={cardStyle}>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className={SPAN_CLASS[size]}>
      <button
        type="button"
        onClick={onOpen}
        style={cardStyle}
        className={cn(
          cardClass,
          "garden:cursor-pointer garden:hover:scale-[1.02] garden:hover:shadow-lg",
        )}
      >
        {content}
      </button>
    </div>
  );
};

const GardenBento = ({
  schema,
  nodes,
  showPoweredBy = true,
}: GardenRendererProps) => {
  const [selectedSprout, setSelectedSprout] = useState<NodeData | null>(null);
  const [isSproutDialogOpen, setIsSproutDialogOpen] = useState(false);

  const sprouts = useMemo(
    () => nodes.filter((node) => node.type === "sprout"),
    [nodes],
  );

  return (
    <div className="garden:relative garden:h-full garden:w-full garden:overflow-auto garden:rounded-lg garden:border garden:border-border garden:bg-background">
      {/* Persistent garden-name badge, mirroring the other views. */}
      <div className="garden:sticky garden:top-3 garden:z-10 garden:mr-3 garden:ml-auto garden:flex garden:w-fit garden:items-center garden:gap-2 garden:rounded-md garden:border garden:border-border garden:bg-background/80 garden:px-3 garden:py-1.5 garden:font-medium garden:text-sm garden:shadow-sm garden:backdrop-blur-sm">
        <FlowerIcon className="garden:h-4 garden:w-4" />
        {schema.name}
        {schema.icon && (
          <span className="garden:ml-1">{schema.icon as string}</span>
        )}
      </div>

      <div className="garden:-mt-9 garden:grid garden:grid-flow-row-dense garden:auto-rows-[13rem] garden:grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] garden:gap-3 garden:p-4 garden:pb-16 garden:sm:p-6">
        {sprouts.map((node, index) => {
          const data = node.data as unknown as NodeData;
          return (
            <BentoTile
              key={node.id}
              data={data}
              size={bentoSize(index, Boolean(data.coming_soon))}
              onOpen={() => {
                setSelectedSprout(data);
                setIsSproutDialogOpen(true);
              }}
            />
          );
        })}
      </div>

      {showPoweredBy && (
        <a
          href="https://garden.omni.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="garden:sticky garden:bottom-3 garden:z-10 garden:ml-3 garden:flex garden:w-fit garden:items-center garden:gap-1.5 garden:rounded-md garden:border garden:border-border garden:bg-background/80 garden:px-2.5 garden:py-1 garden:text-xs garden:opacity-80 garden:shadow-sm garden:backdrop-blur-sm garden:transition-opacity garden:hover:opacity-100"
        >
          <FlowerIcon className="garden:h-3 garden:w-3" />
          Powered by Garden
          <ExternalLinkIcon className="garden:h-3 garden:w-3" />
        </a>
      )}

      <SproutDialog
        sprout={selectedSprout}
        open={isSproutDialogOpen}
        onOpenChange={(open) => {
          setIsSproutDialogOpen(open);
          if (!open) {
            setTimeout(() => setSelectedSprout(null), 200);
          }
        }}
      />
    </div>
  );
};

export default GardenBento;
