import { Edge, Node } from '@xyflow/react';
import { ComponentType } from 'react';
import { GardenSchema } from '../../generated/garden.types';
import { GardenVisualizationProps } from '../types/garden.types';
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
    position?: (nodes: Node[], edges: Edge[]) => LayoutResult | Promise<LayoutResult>;
    /** Fully replace the canvas (e.g. a 3D renderer). Takes precedence. */
    Renderer?: ComponentType<GardenRendererProps>;
}
/** Register a layout plugin (first-party or community). */
export declare const registerLayout: (layout: GardenLayout) => void;
/** Look up a registered layout by name. */
export declare const getLayout: (name: string) => GardenLayout | undefined;
/** All registered layouts (for building a layout picker). */
export declare const listLayouts: () => GardenLayout[];
//# sourceMappingURL=layout.d.ts.map