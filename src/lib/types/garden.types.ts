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
   * Whether the view responds to pointer/touch input. When false, the 3D
   * layout's orbit controls are disabled so the controls never preventDefault
   * touch gestures (which otherwise trap page scroll when the garden is
   * embedded in a scrollable page). The idle rotation still runs.
   * @default true
   */
  interactive?: boolean;
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
  /**
   * Whether typed connections are currently shown. Typed edges are hidden by
   * default; pass this together with `onShowEdgesChange` to control the toggle
   * from outside (e.g. URL state). Omit both for the built-in internal toggle.
   */
  showEdges?: boolean;
  /** Called when the user toggles typed connections on or off. */
  onShowEdgesChange?: (show: boolean) => void;
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
