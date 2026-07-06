import { autoLayoutElements, hexLayout, isRelationEdge } from "../utils";
import { registerLayout } from "./layout";

/**
 * First-party layouts, registered through the same public API third-party
 * plugins use. The 3D layout lives in the optional `@omnidotdev/garden/3d`
 * entry so its Three.js dependency never weighs down the base bundle.
 */

registerLayout({
  name: "tree",
  label: "Tree",
  position: (nodes, edges) => autoLayoutElements(nodes, edges),
});

registerLayout({
  name: "hex",
  label: "Beehive",
  position: (nodes, edges) => ({
    nodes: hexLayout(nodes),
    // Beehive cells tessellate and overlap, so lift the relation edges (and
    // their labels) above the nodes; at the default z-index the packed cells
    // bury the labels.
    edges: edges
      .filter(isRelationEdge)
      .map((edge) => ({ ...edge, zIndex: 1000 })),
  }),
});
