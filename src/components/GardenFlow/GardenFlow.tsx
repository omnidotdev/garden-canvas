import {
  Background,
  ControlButton,
  Controls,
  MarkerType,
  MiniMap,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import ELK from "elkjs/lib/elk.bundled.js";
import {
  ExternalLinkIcon,
  FlowerIcon,
  Layers2Icon,
  LayersIcon,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  cn,
  findGardenByName,
  gardenToFlow,
  hexLayout,
  isImageUrl,
  relationColor,
} from "../../lib/utils";
import { customNodes } from "../nodes";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

import type { ConnectionLineType, Edge, Node } from "@xyflow/react";
import type { MouseEvent, ReactNode } from "react";
import type { GardenSchema, Theme } from "../../generated/garden.types";
import type { GardenVisualizationProps } from "../../lib/types/garden.types";
import type { NodeData } from "../nodes";

const elk = new ELK();

const isRelationEdge = (edge: Edge): boolean =>
  (edge.data as { kind?: string } | undefined)?.kind === "relation";

const calculateNodeHeight = (node: Node): number => {
  if (node.type === "garden") return 150;

  return 200;
};

const autoLayoutElements = async (nodes: Node[], edges: Edge[]) => {
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
      nodes: updatedGraph.children?.map((node) => ({
        ...node,
        position: { x: node.x, y: node.y },
      })),
      edges: updatedGraph.edges,
    }))
    .catch(() => ({
      nodes: nodes || [],
      edges: edges || [],
    }));
};

interface GardenFlowProps extends GardenVisualizationProps {
  /** Garden schema to visualize. */
  schema: GardenSchema;
  /** Initial graph nodes. */
  initialNodes: Node[];
  /** Initial graph edges. */
  initialEdges: Edge[];
}

const GardenFlow = ({
  schema,
  initialNodes,
  initialEdges,
  className,
  expandSubgardens = false,
  showControls,
  showMinimap,
  fitViewPadding,
  edgeType,
  animateEdges,
  layout = "tree",
  showRelations = true,
  relationColors,
  showPoweredBy = true,
  miniMapOptions,
  controlOptions,
}: GardenFlowProps) => {
  const [isSubgardensExpanded, setIsSubgardensExpanded] =
    useState(expandSubgardens);
  const [isSproutDialogOpen, setIsSproutDialogOpen] = useState(false);
  const [selectedSprout, setSelectedSprout] = useState<NodeData | null>(null);
  const [hiddenRelations, setHiddenRelations] = useState<Set<string>>(
    new Set(),
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { fitView } = useReactFlow();

  // Relation types present in the current graph (for the legend/filter)
  const relationTypes = useMemo(() => {
    const set = new Set<string>();
    for (const edge of edges) {
      if (!isRelationEdge(edge)) continue;
      const rels = (edge.data as { relations?: string[] }).relations ?? [];
      for (const rel of rels) set.add(rel);
    }
    return [...set].sort();
  }, [edges]);

  const toggleRelation = useCallback((relation: string) => {
    setHiddenRelations((prev) => {
      const next = new Set(prev);
      if (next.has(relation)) next.delete(relation);
      else next.add(relation);
      return next;
    });
  }, []);

  // Hierarchy edges always show; a relation edge shows if at least one of its
  // relation types is not filtered out (and relations are enabled at all).
  const visibleEdges = useMemo(
    () =>
      edges.filter((edge) => {
        if (!isRelationEdge(edge)) return true;
        if (!showRelations) return false;
        const rels = (edge.data as { relations?: string[] }).relations ?? [];
        if (!rels.length) return true;
        return rels.some((rel) => !hiddenRelations.has(rel));
      }),
    [edges, hiddenRelations, showRelations],
  );

  const currentGarden = useMemo(
    () => nodes.find((node) => node?.type === "garden"),
    [nodes],
  );

  const onLayout = useCallback(
    async (nodes: Node[], edges: Edge[]) => {
      if (layout === "hex") {
        // honeycomb of products; keep only the typed connection edges
        setNodes(hexLayout(nodes));
        setEdges(edges.filter(isRelationEdge));
        requestAnimationFrame(() => fitView({ padding: fitViewPadding }));
        return;
      }
      await autoLayoutElements(nodes, edges).then(
        ({ nodes: layoutedNodes, edges: layoutedEdges }) => {
          setNodes(layoutedNodes as Node[]);
          setEdges(layoutedEdges as Edge[]);
          fitView({ padding: fitViewPadding });
        },
      );
    },
    [layout, fitViewPadding, setEdges, setNodes, fitView],
  );

  const handleNodeClick = useCallback(
    (_: MouseEvent, node: Node) => {
      if (node.type === "sprout") {
        setSelectedSprout(node.data as unknown as NodeData);
        setIsSproutDialogOpen(true);
      } else {
        if (node?.type === "garden") return;

        const garden = findGardenByName(schema, node.data?.label as string);

        if (garden) {
          const { nodes: updatedNodes, edges: updatedEdges } = gardenToFlow({
            schema,
            garden,
            options: {
              expandSubgardens: isSubgardensExpanded,
              edgeType,
              animateEdges,
              showRelations,
              relationColors,
            },
          });

          onLayout(updatedNodes, updatedEdges);
        }
      }
    },
    [
      edgeType,
      isSubgardensExpanded,
      onLayout,
      schema,
      animateEdges,
      showRelations,
      relationColors,
    ],
  );

  const handleToggleExpandedSubgardens = (expand: boolean) => {
    setIsSubgardensExpanded(expand);

    const garden = findGardenByName(
      schema,
      currentGarden?.data?.label as string,
    );

    if (!garden) return;

    const { nodes: updatedNodes, edges: updatedEdges } = gardenToFlow({
      schema,
      garden,
      options: {
        expandSubgardens: expand,
        edgeType,
        animateEdges,
        showRelations,
        relationColors,
      },
    });

    onLayout(updatedNodes, updatedEdges);
  };

  // Lay out on mount and re-lay-out when the layout mode (tree/hex) changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: initial node/edge set is a stable mount snapshot
  useLayoutEffect(() => {
    onLayout(initialNodes, initialEdges);
  }, [layout]);

  // Auto-fit the graph to the container whenever it resizes, so the whole
  // ecosystem always stays framed (window resize, sidebar toggles, etc.).
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => fitView({ padding: fitViewPadding }));
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [fitView, fitViewPadding]);

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "garden:h-full garden:w-full garden:rounded-lg garden:border garden:border-border",
        className,
      )}
    >
      <ReactFlow
        className="garden:relative"
        nodeTypes={customNodes}
        nodes={nodes.map((node) => ({
          ...node,
          className: "!garden:bg-background",
          style: {
            ...node.style,
            cursor: node.type === "garden" ? "grab" : "pointer",
          },
        }))}
        edges={visibleEdges.map((edge) =>
          // Relation edges keep their own typed color/label; only hierarchy
          // edges take the cosmetic edgeType + uniform stroke.
          isRelationEdge(edge)
            ? edge
            : {
                ...edge,
                type: edgeType,
                animated: animateEdges,
                style: {
                  strokeWidth: 2,
                  stroke: "var(--garden-ring)",
                },
                markerEnd: edge.markerEnd || { type: MarkerType.ArrowClosed },
              },
        )}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        fitViewOptions={{ padding: fitViewPadding }}
        proOptions={{ hideAttribution: true }}
        zoomOnScroll
        panOnScroll={false}
        panOnDrag
        snapToGrid
        snapGrid={[10, 10]}
        defaultEdgeOptions={{
          type: edgeType,
          animated: animateEdges,
        }}
        connectionLineType={edgeType as ConnectionLineType}
      >
        <Background />

        {showMinimap && (
          <MiniMap nodeStrokeWidth={3} zoomable pannable {...miniMapOptions} />
        )}

        {showRelations && relationTypes.length > 0 && (
          <Panel position="top-left">
            <div className="garden:flex garden:max-w-[220px] garden:flex-col garden:gap-1 garden:rounded-md garden:border garden:border-border garden:bg-background/80 garden:p-2 garden:shadow-sm garden:backdrop-blur-sm">
              <span className="garden:px-1 garden:font-medium garden:text-muted-foreground garden:text-xs garden:uppercase garden:tracking-wide">
                Connections
              </span>
              <div className="garden:flex garden:flex-wrap garden:gap-1">
                {relationTypes.map((relation) => {
                  const hidden = hiddenRelations.has(relation);
                  const color = relationColor(relation, relationColors);
                  return (
                    <button
                      key={relation}
                      type="button"
                      onClick={() => toggleRelation(relation)}
                      title={hidden ? `Show ${relation}` : `Hide ${relation}`}
                      className={cn(
                        "garden:flex garden:items-center garden:gap-1.5 garden:rounded garden:border garden:border-border garden:px-1.5 garden:py-0.5 garden:text-xs garden:transition-opacity",
                        hidden ? "garden:opacity-40" : "garden:opacity-100",
                      )}
                    >
                      <span
                        className="garden:h-2 garden:w-2 garden:rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      {relation}
                    </button>
                  );
                })}
              </div>
            </div>
          </Panel>
        )}

        {currentGarden && (
          <Panel position="top-right">
            <div
              className="garden:flex garden:items-center garden:gap-2 garden:rounded-md garden:border garden:px-3 garden:py-1.5 garden:font-medium garden:text-sm garden:shadow-sm garden:backdrop-blur-sm"
              style={{
                color:
                  (currentGarden.data?.theme as Theme)?.primary_color ??
                  undefined,
                borderColor:
                  (currentGarden.data?.theme as Theme)?.secondary_color ??
                  undefined,
              }}
            >
              <FlowerIcon className="garden:h-4 garden:w-4" />

              {(currentGarden.data?.label as ReactNode) ?? "Garden"}

              {(currentGarden.data?.icon as string) && (
                <span className="garden:ml-1">
                  {currentGarden.data.icon as string}
                </span>
              )}
            </div>
          </Panel>
        )}

        {showPoweredBy && (
          <Panel position="bottom-right">
            <a
              href="https://garden.omni.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="garden:flex garden:items-center garden:gap-1.5 garden:rounded-md garden:border garden:px-2.5 garden:py-1 garden:text-xs garden:opacity-80 garden:shadow-sm garden:backdrop-blur-sm garden:transition-opacity garden:hover:opacity-100"
              style={{
                color:
                  (currentGarden?.data?.theme as Theme)?.primary_color ??
                  "var(--garden-primary)",
                borderColor:
                  (currentGarden?.data?.theme as Theme)?.secondary_color ??
                  "var(--garden-border)",
              }}
            >
              <FlowerIcon className="garden:h-3 garden:w-3" />
              Powered by Garden
              <ExternalLinkIcon className="garden:h-3 garden:w-3" />
            </a>
          </Panel>
        )}

        {showControls && (
          <Controls
            showInteractive={false}
            {...controlOptions}
            className={cn(
              "garden:border garden:border-border",
              controlOptions?.className ?? "",
            )}
          >
            <ControlButton
              title={
                isSubgardensExpanded
                  ? "Collapse Subgardens"
                  : "Expand Subgardens"
              }
              aria-label={
                isSubgardensExpanded
                  ? "Collapse Subgardens"
                  : "Expand Subgardens"
              }
              onClick={() =>
                isSubgardensExpanded
                  ? handleToggleExpandedSubgardens(false)
                  : handleToggleExpandedSubgardens(true)
              }
            >
              {isSubgardensExpanded ? <LayersIcon /> : <Layers2Icon />}
            </ControlButton>
          </Controls>
        )}
      </ReactFlow>

      <Dialog
        open={isSproutDialogOpen}
        onOpenChange={(open) => {
          setIsSproutDialogOpen(open);

          if (!open) {
            setTimeout(() => {
              setSelectedSprout(null);
            }, 200);
          }
        }}
      >
        <DialogContent className="garden:sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="garden:text-xl">
              {selectedSprout?.label}
            </DialogTitle>
            {selectedSprout?.description && (
              <DialogDescription className="garden:text-base">
                {selectedSprout.description}
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedSprout?.image &&
            (isImageUrl(selectedSprout.image) ? (
              <img
                src={selectedSprout.image}
                alt={selectedSprout.label}
                className="garden:h-64 garden:w-full garden:object-contain p-3"
              />
            ) : (
              <div className="garden:flex garden:h-40 garden:w-full garden:select-none garden:items-center garden:justify-center garden:text-8xl">
                {selectedSprout.image}
              </div>
            ))}

          {selectedSprout?.version && (
            <div className="garden:mt-2 garden:text-muted-foreground garden:text-sm">
              Version: {selectedSprout.version}
            </div>
          )}

          <DialogFooter className="garden:flex garden:flex-col garden:gap-2 garden:sm:flex-row garden:sm:justify-between garden:sm:gap-0">
            <div className="garden:flex garden:gap-2">
              {selectedSprout?.cta?.primary && (
                <Button
                  variant="default"
                  onClick={() =>
                    window.open(selectedSprout.cta?.primary.url, "_blank")
                  }
                >
                  {selectedSprout.cta.primary.label || "View"}
                </Button>
              )}

              {selectedSprout?.cta?.secondary && (
                <Button
                  variant="outline"
                  onClick={() =>
                    window.open(selectedSprout.cta?.secondary?.url, "_blank")
                  }
                >
                  {selectedSprout.cta.secondary.label || "Source"}
                </Button>
              )}
            </div>

            <DialogClose asChild>
              <Button variant="secondary">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GardenFlow;
