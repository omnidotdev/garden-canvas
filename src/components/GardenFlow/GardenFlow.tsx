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
import {
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
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

import { getLayout } from "../../lib/plugins/layout";
import {
  cn,
  findGardenByName,
  gardenToFlow,
  isRelationEdge,
  relationColor,
} from "../../lib/utils";
import { customNodes } from "../nodes";
import { SproutDialog } from "../SproutDialog";

import type { ConnectionLineType, Edge, Node } from "@xyflow/react";
import type { MouseEvent, ReactNode } from "react";
import type { GardenSchema, Theme } from "../../generated/garden.types";
import type { GardenVisualizationProps } from "../../lib/types/garden.types";
import type { NodeData } from "../nodes";

interface GardenFlowProps extends GardenVisualizationProps {
  /** Garden schema to visualize. */
  schema: GardenSchema;
  /** Initial graph nodes. */
  initialNodes: Node[];
  /** Initial graph edges. */
  initialEdges: Edge[];
}

// Auto-fit stays within a legible zoom band. Large graphs would otherwise
// shrink every node past readability; the fit is clamped and the user pans to
// explore. Manual zoom (ReactFlow min/maxZoom) stays unrestricted.
const FIT_MIN_ZOOM = 0.6;
const FIT_MAX_ZOOM = 1.2;

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
  showEdges: controlledShowEdges,
  onShowEdgesChange,
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
  // Typed connections read as clutter over the packed layouts, so they start
  // hidden and the user reveals them. Controlled when `showEdges` is provided
  // (e.g. bound to URL state), otherwise tracked internally.
  const [internalShowEdges, setInternalShowEdges] = useState(false);
  const showEdges = controlledShowEdges ?? internalShowEdges;
  const setShowEdges = useCallback(
    (next: boolean) => {
      onShowEdgesChange?.(next);
      if (controlledShowEdges === undefined) setInternalShowEdges(next);
    },
    [onShowEdgesChange, controlledShowEdges],
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
        if (!showRelations || !showEdges) return false;
        const rels = (edge.data as { relations?: string[] }).relations ?? [];
        if (!rels.length) return true;
        return rels.some((rel) => !hiddenRelations.has(rel));
      }),
    [edges, hiddenRelations, showRelations, showEdges],
  );

  const currentGarden = useMemo(
    () => nodes.find((node) => node?.type === "garden"),
    [nodes],
  );

  const onLayout = useCallback(
    async (nodes: Node[], edges: Edge[]) => {
      // resolve the layout plugin by name (falls back to the tree layout)
      const plugin = getLayout(layout) ?? getLayout("tree");
      const result = (await plugin?.position?.(nodes, edges)) ?? {
        nodes,
        edges,
      };
      setNodes(result.nodes as Node[]);
      setEdges(result.edges as Edge[]);
      requestAnimationFrame(() =>
        fitView({
          padding: fitViewPadding,
          minZoom: FIT_MIN_ZOOM,
          maxZoom: FIT_MAX_ZOOM,
        }),
      );
    },
    [layout, fitViewPadding, setEdges, setNodes, fitView],
  );

  const handleNodeClick = useCallback(
    (_: MouseEvent, node: Node) => {
      if (node.type === "sprout") {
        // Coming-soon products are teased but not interactive.
        if ((node.data as NodeData)?.coming_soon) return;
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
  // ecosystem always stays framed (window resize, sidebar toggles, etc.). The
  // ResizeObserver catches container resizes, not just window ones. Wait for
  // the resize to settle, then animate the graph back into frame; re-fitting on
  // every intermediate frame would restart the animation and read as jank.
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    let timeout: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver(() => {
      clearTimeout(timeout);
      timeout = setTimeout(
        () =>
          fitView({
            padding: fitViewPadding,
            minZoom: FIT_MIN_ZOOM,
            maxZoom: FIT_MAX_ZOOM,
            duration: 200,
          }),
        150,
      );
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
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
        fitViewOptions={{
          padding: fitViewPadding,
          minZoom: FIT_MIN_ZOOM,
          maxZoom: FIT_MAX_ZOOM,
        }}
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
              <button
                type="button"
                onClick={() => setShowEdges(!showEdges)}
                title={showEdges ? "Hide connections" : "Show connections"}
                className="garden:flex garden:items-center garden:gap-1.5 garden:px-1 garden:font-medium garden:text-muted-foreground garden:text-xs garden:uppercase garden:tracking-wide garden:transition-colors garden:hover:text-foreground"
              >
                {showEdges ? (
                  <EyeIcon className="garden:h-3 garden:w-3" />
                ) : (
                  <EyeOffIcon className="garden:h-3 garden:w-3" />
                )}
                Connections
              </button>
              {showEdges && (
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
              )}
            </div>
          </Panel>
        )}

        {/* The garden-name badge must persist across every layout. The hex
            layout drops the garden node, so fall back to the schema. */}
        {(currentGarden?.data?.label ?? schema.name) && (
          <Panel position="top-right">
            <div
              className="garden:flex garden:items-center garden:gap-2 garden:rounded-md garden:border garden:border-border garden:bg-background/80 garden:px-3 garden:py-1.5 garden:font-medium garden:text-sm garden:shadow-sm garden:backdrop-blur-sm"
              style={{
                color:
                  ((currentGarden?.data?.theme ?? schema.theme) as Theme)
                    ?.primary_color ?? undefined,
                borderColor:
                  ((currentGarden?.data?.theme ?? schema.theme) as Theme)
                    ?.secondary_color ?? undefined,
              }}
            >
              <FlowerIcon className="garden:h-4 garden:w-4" />

              {((currentGarden?.data?.label ?? schema.name) as ReactNode) ??
                "Garden"}

              {((currentGarden?.data?.icon ?? schema.icon) as string) && (
                <span className="garden:ml-1">
                  {(currentGarden?.data?.icon ?? schema.icon) as string}
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

      <SproutDialog
        sprout={selectedSprout}
        open={isSproutDialogOpen}
        onOpenChange={(open) => {
          setIsSproutDialogOpen(open);

          if (!open) {
            setTimeout(() => {
              setSelectedSprout(null);
            }, 200);
          }
        }}
      />
    </div>
  );
};

export default GardenFlow;
