import { Edge, Node } from '@xyflow/react';
import { GardenSchema } from '../../generated/garden.types';
import { GardenVisualizationProps } from '../../lib/types/garden.types';
interface GardenFlowProps extends GardenVisualizationProps {
    /** Garden schema to visualize. */
    schema: GardenSchema;
    /** Initial graph nodes. */
    initialNodes: Node[];
    /** Initial graph edges. */
    initialEdges: Edge[];
}
declare const GardenFlow: ({ schema, initialNodes, initialEdges, className, expandSubgardens, showControls, showMinimap, fitViewPadding, edgeType, animateEdges, showRelations, relationColors, showPoweredBy, miniMapOptions, controlOptions, }: GardenFlowProps) => import("react/jsx-runtime").JSX.Element;
export default GardenFlow;
//# sourceMappingURL=GardenFlow.d.ts.map