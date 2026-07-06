import { GardenRendererProps } from '../../lib/plugins/layout';
/**
 * 3D garden renderer (the first opt-in layout plugin). Places the products on
 * a sphere with their typed connections drawn between them, orbit-controllable.
 * Lives in the `@omnidotdev/garden/3d` entry so Three.js stays out of the base
 * bundle.
 */
declare const Garden3D: ({ schema, nodes, edges, relationColors, showPoweredBy, }: GardenRendererProps) => import("react/jsx-runtime").JSX.Element;
export default Garden3D;
//# sourceMappingURL=Garden3D.d.ts.map