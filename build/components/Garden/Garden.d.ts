import { GardenSchema } from '../../generated/garden.types';
import { GardenVisualizationProps } from '../../lib/types/garden.types';
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | {
    [key: string]: JsonValue;
};
export interface GardenProps extends GardenVisualizationProps {
    /** Garden schema to visualize. */
    schema: JsonValue | GardenSchema;
    /** Initial garden name to display. Defaults to first available garden. */
    initialGardenName?: string;
}
declare const Garden: ({ schema, initialGardenName, expandSubgardens, showControls, showMinimap, fitViewPadding, edgeType, animateEdges, showRelations, relationColors, showPoweredBy, ...rest }: GardenProps) => import("react/jsx-runtime").JSX.Element;
export default Garden;
//# sourceMappingURL=Garden.d.ts.map