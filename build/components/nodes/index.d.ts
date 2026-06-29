import { Theme } from '../../generated/garden.types';
export interface NodeData {
    label: string;
    description?: string;
    icon?: string;
    icon_color?: string;
    image?: string;
    expandable?: boolean;
    version?: string;
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