import { Edge, Node } from '@xyflow/react';
import { ClassValue } from 'clsx';
import { GardenSchema } from '../generated/garden.types';
export declare function cn(...inputs: ClassValue[]): string;
/** Whether a logo/image value is a real image source vs. an emoji/glyph. */
export declare const isImageUrl: (src?: string) => boolean;
interface FlowOptions {
    expandSubgardens?: boolean;
    edgeType?: "default" | "straight" | "step" | "smoothstep" | "simplebezier";
    animateEdges?: boolean;
    /**
     * Whether to render typed cross-sprout relation edges (from `garden.edges`).
     * @default true
     */
    showRelations?: boolean;
    /** Override the color used for a relation type (slug -> CSS color). */
    relationColors?: Record<string, string>;
}
/** Resolve the color for a relation type, honoring caller overrides. */
export declare const relationColor: (relation: string, overrides?: Record<string, string>) => string;
export declare const findGardenByName: (schema: GardenSchema, name: string) => GardenSchema | null;
interface GardenToFlowOptions {
    schema: GardenSchema;
    garden: GardenSchema;
    width?: number;
    options?: FlowOptions;
}
export declare const gardenToFlow: ({ schema, garden, width, options, }: GardenToFlowOptions) => {
    nodes: Node[];
    edges: Edge[];
};
export {};
//# sourceMappingURL=utils.d.ts.map