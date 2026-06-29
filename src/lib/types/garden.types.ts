import type { ControlProps, MiniMapProps } from "@xyflow/react";

/**
 * Common garden visualization props.
 */
export interface GardenVisualizationProps {
  /** Container class name. */
  className?: string;
  /**
   * Whether to expand all subgardens.
   * @default false
   */
  expandSubgardens?: boolean;
  /**
   * Whether to show controls.
   * @default true
   */
  showControls?: boolean;
  /**
   * Whether to show minimap.
   * @default true
   */
  showMinimap?: boolean;
  /**
   * View padding.
   * @default 0.2
   */
  fitViewPadding?: number;
  /** Edge type (cosmetic). */
  edgeType?: "default" | "straight" | "step" | "smoothstep" | "simplebezier";
  /**
   * Layout plugin name. Built-ins: `"tree"` (hierarchical, default), `"hex"`
   * (honeycomb / "beehive"), and `"3d"` (from `@omnidotdev/garden/3d`). Any
   * registered plugin name is accepted, so the type stays open for the
   * ecosystem.
   * @default "tree"
   */
  // (string & {}) keeps literal autocomplete while accepting any plugin name
  layout?: "tree" | "hex" | "3d" | (string & {});
  /**
   * Whether to enable edge animations.
   * @default true
   */
  animateEdges?: boolean;
  /**
   * Whether to render typed cross-sprout relation edges (from `garden.edges`),
   * with a filterable legend.
   * @default true
   */
  showRelations?: boolean;
  /** Override the color for a relation type (slug -> CSS color). */
  relationColors?: Record<string, string>;
  /**
   * Whether to show "Powered by Garden" badge.
   * @default true
   */
  showPoweredBy?: boolean;
  /** Minimap options. */
  miniMapOptions?: MiniMapProps;
  /** Controls options. */
  controlOptions?: ControlProps;
}
