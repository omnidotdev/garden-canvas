import { Theme } from '../../generated/garden.types';
export interface NodeData {
    label: string;
    description?: string;
    /** Short marketing tagline shown above the description. */
    tagline?: string;
    icon?: string;
    icon_color?: string;
    image?: string;
    expandable?: boolean;
    version?: string;
    /** License identifier (e.g. `Apache-2.0`). */
    license?: string;
    /** ISO release date; absence signals an unreleased product. */
    release_date?: string;
    /** Whether the product can be self-hosted. */
    self_hostable?: boolean;
    /** Publicly teased but not yet launched; rendered dimmed and non-interactive. */
    coming_soon?: boolean;
    /** Documentation URL. */
    docs_url?: string;
    url?: string;
    theme?: Theme | null;
    cta?: {
        primary: {
            label: string;
            url: string;
        };
        secondary?: {
            label: string;
            url: string;
        };
    };
    sourceConnections?: string[];
    targetConnections?: string[];
    /**
     * Whether typed connections ("edges") are currently revealed. Injected by the
     * flow so a node can hide its connection handles while connections are off,
     * rather than leaving stray handle dots on the cell borders.
     */
    showEdges?: boolean;
    isExpandedSubgarden?: boolean;
    [key: string]: any;
}
export interface NodeProps {
    data: NodeData;
}
export declare const customNodes: {
    garden: ({ data }: NodeProps) => import("react/jsx-runtime").JSX.Element;
    sprout: ({ data }: NodeProps) => import("react/jsx-runtime").JSX.Element;
    supergarden: ({ data }: NodeProps) => import("react/jsx-runtime").JSX.Element;
    subgarden: ({ data }: NodeProps) => import("react/jsx-runtime").JSX.Element;
    default: ({ data }: NodeProps) => import("react/jsx-runtime").JSX.Element;
};
//# sourceMappingURL=index.d.ts.map