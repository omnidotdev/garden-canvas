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
    edges: edges.filter(isRelationEdge),
  }),
});
