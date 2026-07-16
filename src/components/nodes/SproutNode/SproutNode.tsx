import { Handle, Position } from "@xyflow/react";
import { ClockIcon, ExternalLinkIcon, GitBranchIcon } from "lucide-react";

import { cn, isImageUrl } from "../../../lib/utils";
import { GlyphIcon } from "../../GlyphIcon";

import type { NodeProps } from "..";

// Pointy-top hexagon clip used by the honeycomb / "beehive" layout.
const HEX_CLIP =
  "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

// Small pill marking a product that has not launched yet.
const ComingSoonBadge = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "garden:flex garden:items-center garden:gap-1 garden:whitespace-nowrap garden:rounded-full garden:border garden:border-border garden:bg-muted garden:px-2 garden:py-0.5 garden:font-medium garden:text-[10px] garden:text-muted-foreground garden:uppercase garden:tracking-wide",
      className,
    )}
  >
    <ClockIcon className="garden:h-2.5 garden:w-2.5" />
    Coming soon
  </div>
);

const SproutNode = ({ data }: NodeProps) => {
  // check if there are any connections
  const hasTopTargets =
    data.targetConnections && data.targetConnections.length > 0;
  const hasBottomSources =
    data.sourceConnections && data.sourceConnections.length > 0;

  // Use theme colors from garden data if available
  const primaryColor = data.theme?.primary_color || "var(--garden-garden)";

  // Unreleased products are teased but not interactive: dimmed, badged, and
  // without call-to-action buttons or hover affordances.
  const comingSoon = Boolean(data.coming_soon);

  const glyph = data.image || data.logo || "🌱";

  // Beehive mode: render the product as a hexagonal cell (icon + name).
  if (data.hex) {
    return (
      <div className="garden:relative">
        {hasTopTargets && (
          <Handle
            id="top"
            type="target"
            position={Position.Top}
            isConnectable={false}
          />
        )}
        {hasBottomSources && (
          <Handle
            id="bottom"
            type="source"
            position={Position.Bottom}
            isConnectable={false}
          />
        )}
        {/* A clip-path clips the element's border away, so the outline is
            drawn as a colored outer hexagon showing through a slightly inset
            inner hexagon (the padding is the visible border width). */}
        {/* Regular pointy-top hexagon: for the HEX_CLIP polygon the box must be
            taller than wide by 2/√3 (~1.1547), otherwise the cell looks
            horizontally stretched. 176 x 203 keeps every side equal. */}
        <div
          className={cn(
            "garden:h-[203px] garden:w-44 garden:p-[3px] garden:transition-transform",
            comingSoon
              ? "garden:cursor-default garden:opacity-60"
              : "garden:cursor-pointer garden:hover:scale-105",
          )}
          style={{ clipPath: HEX_CLIP, backgroundColor: primaryColor }}
        >
          <div
            className="garden:flex garden:h-full garden:w-full garden:flex-col garden:items-center garden:justify-center garden:gap-1 garden:bg-card garden:p-4 garden:text-center"
            style={{ clipPath: HEX_CLIP }}
          >
            {/* Rides in the centered column rather than pinned to a corner: a
                hexagon's corners are clipped away, so a corner-pinned badge
                floats in the seam outside the cell. In flow it also sits low
                enough that the sloped edges have opened up to full width. */}
            {comingSoon && <ComingSoonBadge />}
            {isImageUrl(data.image) ? (
              <img
                src={data.image}
                alt={data.label}
                className="garden:h-12 garden:w-12 garden:object-contain"
              />
            ) : (
              <GlyphIcon glyph={glyph} size={44} label={data.label} />
            )}
            <h3 className="garden:line-clamp-2 garden:px-2 garden:font-medium garden:text-foreground garden:text-xs">
              {data.label}
            </h3>
            {/* Compact teaser mirroring the tree/3D cards. Prefer the punchy
                tagline; fall back to the description. Width is capped inside
                the hexagon's safe band so text never runs into the sloped
                corners. */}
            {(data.tagline || data.description) && (
              <p className="garden:line-clamp-2 garden:max-w-[8rem] garden:text-[10px] garden:text-foreground/60 garden:leading-tight">
                {data.tagline || data.description}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    // NB: relative positioning is important for `Handle` placement because it uses `absolute` positioning internally
    <div
      className={cn(
        "garden:relative garden:rounded-md garden:border-2 garden:border-border garden:bg-card garden:shadow-lg",
        comingSoon
          ? "garden:cursor-default garden:opacity-60"
          : "garden:cursor-pointer garden:hover:scale-105 garden:hover:shadow-xl",
      )}
    >
      {hasTopTargets && (
        <Handle
          id="top"
          type="target"
          position={Position.Top}
          isConnectable={false}
        />
      )}

      {hasBottomSources && (
        <Handle
          id="bottom"
          type="source"
          position={Position.Bottom}
          isConnectable={false}
        />
      )}

      {comingSoon && (
        <ComingSoonBadge className="garden:absolute garden:top-2 garden:right-2 garden:z-10" />
      )}

      <div className="garden:relative">
        {isImageUrl(data.image) ? (
          <img
            src={data.image}
            alt={data.label}
            className="garden:h-28 garden:w-full garden:object-contain garden:p-5"
          />
        ) : (
          <div className="garden:flex garden:h-28 garden:w-full garden:items-center garden:justify-center">
            <GlyphIcon glyph={glyph} size={64} label={data.label} />
          </div>
        )}
        <div className="garden:bg-muted/60 garden:pt-4 garden:dark:bg-muted/20">
          <div className="garden:px-4">
            <h3 className="garden:font-medium garden:text-foreground">
              {data.label}
            </h3>
            {data.description && (
              <p className="garden:mt-0.5 garden:line-clamp-2 garden:text-foreground/70 garden:text-sm">
                {data.description}
              </p>
            )}
          </div>
          {/* Launched products get CTAs; coming-soon ones stay non-interactive. */}
          {comingSoon ? (
            <div className="garden:p-4">
              <span className="garden:font-medium garden:text-muted-foreground garden:text-sm">
                Coming soon
              </span>
            </div>
          ) : (
            <div className="garden:flex garden:gap-2 garden:p-4">
              {data.cta?.primary && (
                <button
                  type="button"
                  className="garden:flex garden:w-full garden:cursor-pointer garden:items-center garden:justify-center garden:rounded-md garden:bg-primary garden:px-3 garden:py-1 garden:font-medium garden:text-primary-foreground garden:text-sm garden:hover:bg-primary/90"
                  onClick={(e) => {
                    // prevent needlessly opening the dialog
                    e.stopPropagation();
                    window.open(data.cta?.primary.url, "_blank");
                  }}
                >
                  <ExternalLinkIcon size={14} className="garden:mr-1" />
                  {data.cta?.primary.label}
                </button>
              )}

              {data.cta?.secondary && (
                <button
                  type="button"
                  className="garden:rounded-md garden:border garden:px-2 garden:py-1 garden:font-medium garden:text-sm"
                  style={{
                    borderColor: primaryColor,
                    color: primaryColor,
                  }}
                  onClick={() =>
                    window.open(data.cta?.secondary?.url, "_blank")
                  }
                >
                  <GitBranchIcon
                    className="garden:h-4 garden:w-4"
                    style={{
                      color: primaryColor,
                    }}
                  />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SproutNode;
