import Garden3D from "./components/Garden3D/Garden3D";
import { registerLayout } from "./lib/plugins/layout";

import type { GardenLayout } from "./lib/plugins/layout";

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
export const garden3d: GardenLayout = {
  name: "3d",
  label: "3D",
  Renderer: Garden3D,
};

registerLayout(garden3d);

export { Garden3D };
