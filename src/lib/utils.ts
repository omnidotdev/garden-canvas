import { MarkerType, Position } from "@xyflow/react";
import { clsx } from "clsx";
import ELK from "elkjs/lib/elk.bundled.js";
import { twMerge } from "tailwind-merge";
import { match } from "ts-pattern";

import type { Edge, Node } from "@xyflow/react";
import type { ClassValue } from "clsx";
import type {
  Edge as GardenEdge,
  GardenSchema,
} from "../generated/garden.types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Whether an edge is a typed cross-sprout relation edge (vs. hierarchy). */
export const isRelationEdge = (edge: Edge): boolean =>
  (edge.data as { kind?: string } | undefined)?.kind === "relation";

const elk = new ELK();

const calculateNodeHeight = (node: Node): number =>
  node.type === "garden" ? 150 : 200;

/** Hierarchical (tree) auto-layout via ELK. */
export const autoLayoutElements = async (
  nodes: Node[],
  edges: Edge[],
): Promise<{ nodes: Node[]; edges: Edge[] }> => {
  const graph = {
    id: "elk-root",
    layoutOptions: {
      "elk.algorithm": "mrtree",
      "elk.direction": "DOWN",
      "elk.spacing.nodeNode": "200",
      "elk.layered.spacing.nodeNodeBetweenLayers": "200",
      "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
    },
    children: nodes.map((node) => ({
      ...node,
      id: node.id,
      width: 250,
      height: calculateNodeHeight(node),
      layoutOptions: {
        "elk.position": node.type === "garden" ? "ROOT" : "DEFAULT",
      },
    })),
    edges: edges.map((edge) => ({
      ...edge,
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
      layoutOptions: {
        "elk.layered.edge.thickness": "2",
        "elk.edgeRouting": "ORTHOGONAL",
      },
    })),
  };

  return elk
    .layout(graph)
    .then((updatedGraph) => ({
      nodes: (updatedGraph.children?.map((node) => ({
        ...node,
        position: { x: node.x, y: node.y },
      })) ?? []) as Node[],
      edges: (updatedGraph.edges ?? []) as unknown as Edge[],
    }))
    .catch(() => ({ nodes: nodes || [], edges: edges || [] }));
};

/** Whether a logo/image value is a real image source vs. an emoji/glyph. */
export const isImageUrl = (src?: string): boolean =>
  !!src &&
  (/^https?:\/\//.test(src) || src.startsWith("/") || src.startsWith("data:"));

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

// Stable hue from a relation slug so each relation type gets a consistent color
// without a hardcoded palette (the library is product-agnostic).
const hashHue = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) % 360;
  }
  return hash;
};

/** Resolve the color for a relation type, honoring caller overrides. */
export const relationColor = (
  relation: string,
  overrides?: Record<string, string>,
): string => overrides?.[relation] ?? `hsl(${hashHue(relation)} 70% 60%)`;

const NODE_TYPES = {
  GARDEN: "garden",
  SPROUT: "sprout",
  SUPERGARDEN: "supergarden",
  SUBGARDEN: "subgarden",
};

const generateId = (type: string, name: string, prefix?: string) => {
  const cleanName = name
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
  const baseId = prefix ? `${prefix}-${cleanName}` : cleanName;
  return `${type}-${baseId}`;
};

// Helper function to find a garden by name in the schema
export const findGardenByName = (
  schema: GardenSchema,
  name: string,
): GardenSchema | null => {
  // Check if this is the garden we're looking for
  if (schema.name === name) {
    return schema;
  }

  // Search in subgardens recursively
  if (schema.subgardens && Array.isArray(schema.subgardens)) {
    for (const subgarden of schema.subgardens) {
      const found = findGardenByName(subgarden as GardenSchema, name);

      if (found) {
        return found;
      }
    }
  }

  return null;
};

const getNodePositions = (
  type: string,
): { sourcePosition?: Position; targetPosition?: Position } => {
  return match(type)
    .with(NODE_TYPES.GARDEN, () => ({
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    }))
    .with(NODE_TYPES.SPROUT, () => ({
      targetPosition: Position.Top,
    }))
    .with(NODE_TYPES.SUPERGARDEN, () => ({
      sourcePosition: Position.Bottom,
    }))
    .with(NODE_TYPES.SUBGARDEN, () => ({
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    }))
    .otherwise(() => ({}));
};

// Honeycomb / "beehive" layout: pack the product (sprout) nodes into a hex
// cluster that grows in rings from a centre cell. Hierarchy nodes are dropped
// in this mode so the products read as a beehive, with their typed connections
// drawn between them.
//
// Cells are pointy-top hexagons rendered at 176 x 203 (see SproutNode), so
// horizontal neighbours sit one cell-width apart, each ring drops to
// three-quarter height, and odd rows inset half a cell (the r/2 term). Spiralling
// out from the centre keeps the hive balanced and mirror-symmetric for any count;
// an offset row grid, by contrast, leans like a parallelogram once its rows are
// shifted to interlock.
//
// The lattice pitch is the cell size scaled up by a small seam so tessellating
// neighbours leave a gap instead of butting edge to edge. Butted cells stack
// each other's border ring into a double-thick shared edge (while the hive's
// outer edges stay single); the seam keeps every visible border a single width.
const HEX_CELL_WIDTH = 176;
const HEX_CELL_HEIGHT = 203;
// Seam between adjacent cells, in flow px; scales the lattice uniformly so the
// gap reads the same on every side of every hexagon.
const HEX_GAP = 12;
const HEX_PITCH_SCALE = (HEX_CELL_WIDTH + HEX_GAP) / HEX_CELL_WIDTH;

// Axial (q, r) steps around a pointy-top hex, walked in order to trace each
// ring of the spiral.
const HEX_DIRECTIONS: [number, number][] = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];

// Axial coordinates for `count` cells packed as a centred spiral: the origin,
// then each surrounding ring walked edge by edge until the count is filled.
const hexSpiral = (count: number): [number, number][] => {
  const cells: [number, number][] = [[0, 0]];
  for (let ring = 1; cells.length < count; ring++) {
    // step out to the ring's starting cell, then walk its six sides
    let [q, r] = [HEX_DIRECTIONS[4][0] * ring, HEX_DIRECTIONS[4][1] * ring];
    for (let side = 0; side < 6; side++) {
      for (let step = 0; step < ring; step++) {
        if (cells.length >= count) return cells;
        cells.push([q, r]);
        q += HEX_DIRECTIONS[side][0];
        r += HEX_DIRECTIONS[side][1];
      }
    }
  }
  return cells;
};

export const hexLayout = (nodes: Node[]): Node[] => {
  const sprouts = nodes.filter((node) => node.type === NODE_TYPES.SPROUT);
  const coords = hexSpiral(sprouts.length);

  return sprouts.map((node, index) => {
    const [q, r] = coords[index];
    return {
      ...node,
      position: {
        x: (q + r / 2) * HEX_CELL_WIDTH * HEX_PITCH_SCALE,
        y: r * HEX_CELL_HEIGHT * 0.75 * HEX_PITCH_SCALE,
      },
      data: { ...node.data, hex: true },
    };
  });
};

// Track connections between nodes
const trackNodeConnections = (nodes: Node[], edges: Edge[]): Node[] => {
  // Initialize connection tracking objects for each node
  const nodesWithConnections = nodes.map((node) => {
    return {
      ...node,
      data: {
        ...node.data,
        sourceConnections: Array.isArray(node.data.sourceConnections)
          ? [...node.data.sourceConnections]
          : [],
        targetConnections: Array.isArray(node.data.targetConnections)
          ? [...node.data.targetConnections]
          : [],
      },
    };
  });

  // Map nodes by ID for quick lookup
  const nodeMap = new Map<string, Node>();
  nodesWithConnections.forEach((node) => nodeMap.set(node.id, node));

  // Track all connections from edges
  edges.forEach((edge) => {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);

    if (sourceNode && Array.isArray(sourceNode.data.sourceConnections)) {
      sourceNode.data.sourceConnections = [
        ...sourceNode.data.sourceConnections,
        edge.target,
      ];
    }

    if (targetNode && Array.isArray(targetNode.data.targetConnections)) {
      targetNode.data.targetConnections = [
        ...targetNode.data.targetConnections,
        edge.source,
      ];
    }
  });

  return nodesWithConnections;
};

interface RecursiveSubgardenOptions {
  schema: GardenSchema;
  parent: GardenSchema;
  parentId: string;
  parentX: number;
  parentY: number;
  width: number;
  nodes: Node[];
  edges: Edge[];
  options?: FlowOptions;
  level?: number;
}

const processSubgarensRecursively = ({
  schema,
  parent,
  parentId,
  parentX,
  parentY,
  width,
  nodes,
  edges,
  options = {},
  level = 1,
}: RecursiveSubgardenOptions) => {
  if (!parent.subgardens?.length) return;

  // calculate spacing based on the number of sprouts at this level
  const horizontalSpacing = Math.min(
    600,
    width / Math.max(1, parent.subgardens.length),
  );
  const verticalOffset = 200; // Fixed vertical distance between levels
  const baseYPos = parentY + verticalOffset; // Start at a fixed offset from parent

  for (const subgarden of parent.subgardens) {
    const subgardenId = generateId(
      NODE_TYPES.SUBGARDEN,
      subgarden.name,
      `${parentId}-level-${level}`,
    );

    const currentGarden = findGardenByName(schema, subgarden.name);

    // If the subgarden has a defined theme, use it. Otherwise, fallback to current parent theme
    const gardenTheme = currentGarden?.theme ?? parent.theme;

    // Calculate positions to create a tree-like structure
    const numSubgardens = parent.subgardens.length;
    const xSpread = numSubgardens ? horizontalSpacing * numSubgardens : 0;
    const xPos =
      parentX -
      xSpread / 2 +
      horizontalSpacing / 2 +
      parent.subgardens.indexOf(subgarden) * horizontalSpacing;
    const yPos = baseYPos;

    nodes.push({
      id: subgardenId,
      type: NODE_TYPES.SUBGARDEN,
      data: {
        label: subgarden.name,
        description: subgarden.description,
        version: subgarden.version,
        theme: gardenTheme,
        level,
        sourceConnections: [],
        targetConnections: [],
      },
      position: {
        x: xPos,
        y: yPos,
      },
      style: {
        background: gardenTheme?.primary_color ?? undefined,
      },
    });

    // Connect parent garden to this subgarden node
    edges.push({
      id: `${parentId}-to-${subgardenId}`,
      source: parentId,
      target: subgardenId,
      sourceHandle: "bottom",
      targetHandle: "top",
      type: options.edgeType || "default",
      animated: options.animateEdges !== false,
      markerEnd: { type: MarkerType.ArrowClosed },
    });

    if (currentGarden?.sprouts?.length) {
      for (const sprout of currentGarden.sprouts) {
        if (!sprout || !sprout.name) {
          console.warn(
            "Skipping invalid sprout in subgarden:",
            subgarden.name,
            sprout,
          );
          continue;
        }

        const sproutId = generateId(
          NODE_TYPES.SPROUT,
          sprout.name,
          `${subgardenId}-sprout`,
        );

        // distribute sprouts with reasonable spacing
        const sproutSpacing = Math.max(60, 80 - level * 5);
        const sproutYPosition =
          yPos + 100 + currentGarden.sprouts.indexOf(sprout) * sproutSpacing;

        nodes.push({
          id: sproutId,
          type: NODE_TYPES.SPROUT,
          data: {
            label: sprout.name,
            homepage_url: sprout.homepage_url,
            logo: sprout.logo,
            image: sprout.logo,
            repo_url: sprout.repo_url,
            description: sprout.description,
            tagline: sprout.tagline,
            license: sprout.license,
            release_date: sprout.release_date,
            self_hostable: sprout.self_hostable,
            docs_url: sprout.docs_url,
            theme: gardenTheme,
            level: level, // Track the nesting level for styling
            sourceConnections: [],
            targetConnections: [],
            cta: {
              primary: sprout.homepage_url
                ? {
                    label: "Visit Website",
                    url: sprout.homepage_url,
                  }
                : undefined,
              secondary: sprout.repo_url
                ? {
                    label: "View Code",
                    url: sprout.repo_url,
                  }
                : undefined,
            },
          },
          position: {
            x: xPos,
            y: sproutYPosition,
          },
          ...getNodePositions(NODE_TYPES.SPROUT),
        });

        edges.push({
          id: `${subgardenId}-to-${sproutId}`,
          source: subgardenId,
          target: sproutId,
          sourceHandle: "bottom",
          targetHandle: "top",
          type: options.edgeType || "default",
          animated: options.animateEdges !== false,
          style: {
            stroke: "var(--garden-muted-foreground)",
            strokeWidth: 2,
          },
          markerEnd: { type: MarkerType.ArrowClosed },
          interactionWidth: 1,
        });
      }
    }

    if (currentGarden?.subgardens?.length) {
      processSubgarensRecursively({
        schema,
        parent: currentGarden,
        parentId: subgardenId,
        parentX: xPos,
        parentY: yPos,
        width,
        nodes,
        edges,
        options,
        level: level + 1,
      });
    }
  }
};

// Build typed cross-sprout edges from `garden.edges` / `schema.edges`. These
// cut across the containment hierarchy (e.g. "blink integrates crystal"), so
// they only render between sprouts that are currently visible. Endpoints are
// matched by sprout name.
const addRelationEdges = (
  schema: GardenSchema,
  garden: GardenSchema,
  nodes: Node[],
  edges: Edge[],
  options: FlowOptions,
) => {
  if (options.showRelations === false) return;

  const sproutIdByName = new Map<string, string>();
  for (const node of nodes) {
    if (node.type === NODE_TYPES.SPROUT) {
      sproutIdByName.set(String(node.data.label), node.id);
    }
  }
  if (!sproutIdByName.size) return;

  const candidates: GardenEdge[] = [
    ...((schema.edges ?? []) as GardenEdge[]),
    ...((garden.edges ?? []) as GardenEdge[]),
  ];
  if (!candidates.length) return;

  const seen = new Set<string>();
  for (const edge of candidates) {
    if (!edge?.source || !edge?.target) continue;

    const sourceId = sproutIdByName.get(edge.source);
    const targetId = sproutIdByName.get(edge.target);
    // both endpoints must be visible sprouts
    if (!sourceId || !targetId) continue;

    const relations = Array.isArray(edge.relations) ? edge.relations : [];
    const dedupeKey = `${sourceId}->${targetId}:${relations.join(",")}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const color = relationColor(
      relations[0] ?? "related",
      options.relationColors,
    );
    const label =
      edge.label ?? (relations.length ? relations.join(", ") : undefined);

    edges.push({
      id: `relation-${dedupeKey}`,
      source: sourceId,
      target: targetId,
      type: "default",
      animated: options.animateEdges !== false,
      label: label ?? undefined,
      data: {
        kind: "relation",
        relations,
        description: edge.description ?? undefined,
        status: edge.status ?? undefined,
      },
      style: { stroke: color, strokeWidth: 1.5, opacity: 0.75 },
      labelStyle: { fill: color, fontSize: 10, fontWeight: 600 },
      labelBgStyle: { fill: "var(--garden-background)", fillOpacity: 0.85 },
      labelBgPadding: [4, 2],
      labelBgBorderRadius: 4,
      markerEnd: { type: MarkerType.ArrowClosed, color },
      interactionWidth: 6,
      zIndex: 0,
    });
  }
};

interface GardenToFlowOptions {
  schema: GardenSchema;
  garden: GardenSchema;
  width?: number;
  options?: FlowOptions;
}

export const gardenToFlow = ({
  schema,
  garden,
  width = 1600,
  options = {},
}: GardenToFlowOptions): { nodes: Node[]; edges: Edge[] } => {
  // Validate inputs
  if (!schema || typeof schema !== "object") {
    console.error("Invalid schema provided to gardenToFlow:", schema);
    return { nodes: [], edges: [] };
  }

  if (!garden || !garden.name) {
    console.error("Invalid garden provided to gardenToFlow:", garden);
    return { nodes: [], edges: [] };
  }

  // Store the garden theme for propagation to all nodes
  const currentGardenTheme = garden.theme || null;

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const centerX = width / 2;

  const gardenId = generateId(NODE_TYPES.GARDEN, garden.name);
  nodes.push({
    id: gardenId,
    type: NODE_TYPES.GARDEN,
    data: {
      label: garden.name,
      description: garden.description,
      version: garden.version,
      theme: currentGardenTheme,
      icon_color: "var(--garden-primary)",
      icon: garden.icon,
    },
    position: { x: centerX, y: 0 },
    ...getNodePositions(NODE_TYPES.GARDEN),
    style: {
      background: currentGardenTheme?.primary_color ?? undefined,
      color: "var(--garden-primary-foreground)",
      borderRadius: "var(--garden-radius)",
    },
  });

  // process sprouts directly on the garden if any
  if (garden.sprouts && Array.isArray(garden.sprouts)) {
    garden.sprouts.forEach((sprout, index) => {
      if (!sprout || !sprout.name) {
        console.warn("Skipping invalid sprout at index", index, ":", sprout);
        return;
      }

      const sproutId = generateId(
        NODE_TYPES.SPROUT,
        sprout.name,
        `${gardenId}-direct`,
      );
      const sproutYPosition = 150 + index * 80;

      nodes.push({
        id: sproutId,
        type: NODE_TYPES.SPROUT,
        data: {
          label: sprout.name,
          homepage_url: sprout.homepage_url || "",
          logo: sprout.logo || "",
          image:
            sprout.logo ||
            "https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg",
          repo_url: sprout.repo_url || "",
          description: sprout.description || "",
          tagline: sprout.tagline,
          license: sprout.license,
          release_date: sprout.release_date,
          self_hostable: sprout.self_hostable,
          docs_url: sprout.docs_url,
          theme: currentGardenTheme,
          cta: {
            primary: sprout.homepage_url
              ? {
                  label: "Visit Website",
                  url: sprout.homepage_url,
                }
              : undefined,
            secondary: sprout.repo_url
              ? {
                  label: "View Code",
                  url: sprout.repo_url,
                }
              : undefined,
          },
        },
        position: {
          x: centerX,
          y: sproutYPosition,
        },
        ...getNodePositions(NODE_TYPES.SPROUT),
      });

      // connect garden to this sprout
      edges.push({
        id: `${gardenId}-to-${sproutId}`,
        source: gardenId,
        target: sproutId,
        sourceHandle: "bottom",
        targetHandle: "top",
        type: options.edgeType || "default",
        animated: options.animateEdges !== false,
        style: {
          stroke: "var(--garden-muted-foreground)",
          strokeWidth: 2,
        },
        markerEnd: { type: MarkerType.ArrowClosed },
        interactionWidth: 1,
      });
    });
  }

  // Process supergardens if any
  if (garden.supergardens && Array.isArray(garden.supergardens)) {
    garden.supergardens.forEach((supergarden, index) => {
      const supergardenId = generateId(
        NODE_TYPES.SUPERGARDEN,
        supergarden.name,
        `${gardenId}-super`,
      );
      const xOffset = -400 + index * 150; // Position supergardens to the left and above

      // If the supergarden has a defined theme, use it. Otherwise, fallback to current garden theme
      const gardenTheme =
        findGardenByName(schema, supergarden.name)?.theme ?? garden.theme;

      nodes.push({
        id: supergardenId,
        type: NODE_TYPES.SUPERGARDEN,
        data: {
          label: supergarden.name,
          description: supergarden.description,
          url: supergarden.url,
          logo: supergarden.logo,
          version: supergarden.version,
          icon: "GlobeIcon",
          icon_color: "var(--garden-chart-9)",
          theme: gardenTheme,
        },
        position: { x: centerX + xOffset, y: -200 },
        ...getNodePositions(NODE_TYPES.SUPERGARDEN),
        style: {
          background: gardenTheme?.primary_color ?? undefined,
          color: "var(--garden-chart-9-foreground)",
          borderRadius: "var(--garden-radius)",
        },
      });

      // Create edge from supergarden to this garden
      edges.push({
        id: `${supergardenId}-to-${gardenId}`,
        source: supergardenId,
        target: gardenId,
        sourceHandle: "bottom",
        targetHandle: "top",
        type: options.edgeType || "default",
        animated: options.animateEdges !== false,
        style: {
          stroke: "var(--garden-chart-9)",
          strokeWidth: 2,
          strokeDasharray: "5,5",
        },
        markerEnd: { type: MarkerType.ArrowClosed },
        interactionWidth: 1,
      });
    });
  }

  // Process subgardens if any
  if (garden.subgardens && Array.isArray(garden.subgardens)) {
    if (options.expandSubgardens) {
      processSubgarensRecursively({
        schema,
        parent: garden,
        parentId: gardenId,
        parentX: centerX,
        parentY: 0,
        width,
        nodes,
        edges,
        options,
      });
    } else {
      garden.subgardens.forEach((subgarden, index) => {
        const subgardenId = generateId(
          NODE_TYPES.SUBGARDEN,
          subgarden.name,
          `${gardenId}-sub`,
        );
        const xOffset = 400 - index * 150; // Position subgardens to the right and above

        const currentGarden = findGardenByName(schema, subgarden.name);

        // If the subgarden has a defined theme, use it. Otherwise, fallback to current garden theme
        const gardenTheme = currentGarden?.theme ?? garden.theme;

        // add the subgarden node
        nodes.push({
          id: subgardenId,
          type: NODE_TYPES.SUBGARDEN,
          data: {
            label: subgarden.name,
            description: subgarden.description,
            url: subgarden.url,
            logo: subgarden.logo,
            version: subgarden.version,
            icon: "SproutIcon",
            icon_color: "var(--garden-chart-5)",
            theme: gardenTheme,
          },
          position: { x: centerX + xOffset, y: 200 },
          ...getNodePositions(NODE_TYPES.SUBGARDEN),
          style: {
            background: gardenTheme?.primary_color ?? undefined,
            color: "var(--garden-chart-5-foreground)",
            borderRadius: "var(--garden-radius)",
          },
        });

        // Create edge from garden to this subgarden
        edges.push({
          id: `${gardenId}-to-${subgardenId}`,
          source: gardenId,
          target: subgardenId,
          sourceHandle: "bottom",
          targetHandle: "top",
          type: options.edgeType || "default",
          animated: options.animateEdges !== false,
          style: {
            stroke: "var(--garden-chart-5)",
            strokeWidth: 2,
            strokeDasharray: "5,5",
          },
          markerEnd: { type: MarkerType.ArrowClosed },
          interactionWidth: 1,
        });
      });
    }
  }

  // Add typed cross-sprout relation edges (cut across the hierarchy)
  addRelationEdges(schema, garden, nodes, edges, options);

  // Process connections to ensure nodes know about their connections
  const nodesWithConnections = trackNodeConnections(nodes, edges);

  return { nodes: nodesWithConnections, edges };
};
