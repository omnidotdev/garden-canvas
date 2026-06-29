import { default as Garden3D } from './components/Garden3D/Garden3D';
import { GardenLayout } from './lib/plugins/layout';
/**
 * Optional 3D layout plugin. Importing this entry registers the `3d` layout, so
 * consumers opt in with:
 *
 *   import "@omnidotdev/garden/3d";
 *   <Garden layout="3d" schema={...} />
 *
 * Three.js is bundled here (not in the base `@omnidotdev/garden` entry), so the
 * 2D library stays lean for consumers that don't want the 3D view.
 */
export declare const garden3d: GardenLayout;
export { Garden3D };
//# sourceMappingURL=3d.d.ts.map