export interface GardenSchema {
    created_at?: null | string;
    description?: null | string;
    edges?: Edge[] | null;
    maintainers?: Maintainer[] | null;
    name: string;
    sprouts?: Sprout[] | null;
    subgardens?: Garden[] | null;
    supergardens?: Garden[] | null;
    theme?: null | Theme;
    updated_at?: null | string;
    version?: null | string;
    [property: string]: any;
}
export interface Edge {
    description?: null | string;
    label?: null | string;
    relations?: string[] | null;
    source: string;
    status?: null | string;
    target: string;
    [property: string]: any;
}
export interface Maintainer {
    email?: null | string;
    name: string;
    url?: null | string;
    [property: string]: any;
}
export interface Sprout {
    description?: null | string;
    homepage_url: string;
    logo?: null | string;
    name: string;
    project_url?: null | string;
    repo_url?: null | string;
    twitter?: null | string;
    [property: string]: any;
}
export interface Garden {
    created_at?: null | string;
    description?: null | string;
    edges?: Edge[] | null;
    maintainers?: Maintainer[] | null;
    name: string;
    sprouts?: Sprout[] | null;
    subgardens?: Garden[] | null;
    supergardens?: Garden[] | null;
    theme?: null | Theme;
    updated_at?: null | string;
    version?: null | string;
    [property: string]: any;
}
export interface Theme {
    background_color?: null | string;
    primary_color?: null | string;
    secondary_color?: null | string;
    text_color?: null | string;
    [property: string]: any;
}
export declare class Convert {
    static toGardenSchema(json: string): GardenSchema;
    static gardenSchemaToJson(value: GardenSchema): string;
}
//# sourceMappingURL=garden.types.d.ts.map