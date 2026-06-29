import type { Edge, Node } from "@xyflow/react";
import type { ComponentType } from "react";
import type { GardenSchema } from "../../generated/garden.types";
import type { GardenVisualizationProps } from "../types/garden.types";

/**
 * Garden layout plugin system.
 *
 * A layout is either a POSITIONER (it repositions the nodes inside the built-in
 * React Flow canvas - e.g. the hierarchical tree or the honeycomb) or a
 * RENDERER (it fully takes over rendering - e.g. a Three.js 3D view). First
 * party layouts (`tree`, `hex`, `3d`) are registered the same way third-party
 * ones are, so the ecosystem is open: publish a package that calls
 * `registerLayout(...)` (e.g. via manifold) and consumers opt in with
 * `<Garden layout="your-layout" />`.
 */

export interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
}

/** Props handed to a full-takeover layout renderer (e.g. the 3D view). */
export interface GardenRendererProps extends GardenVisualizationProps {
  schema: GardenSchema;
  nodes: Node[];
  edges: Edge[];
}

export interface GardenLayout {
  /** Unique id used as the `layout` prop value. */
  name: string;
  /** Human-readable label for pickers. */
  label?: string;
  /**
   * Reposition nodes within the built-in canvas. Mutually exclusive with
   * `Renderer`; return the nodes (with positions) and the edges to draw.
   */
  position?: (
    nodes: Node[],
    edges: Edge[],
  ) => LayoutResult | Promise<LayoutResult>;
  /** Fully replace the canvas (e.g. a 3D renderer). Takes precedence. */
  Renderer?: ComponentType<GardenRendererProps>;
}

const registry = new Map<string, GardenLayout>();

/** Register a layout plugin (first-party or community). */
export const registerLayout = (layout: GardenLayout): void => {
  registry.set(layout.name, layout);
};

/** Look up a registered layout by name. */
export const getLayout = (name: string): GardenLayout | undefined =>
  registry.get(name);

/** All registered layouts (for building a layout picker). */
export const listLayouts = (): GardenLayout[] => [...registry.values()];
