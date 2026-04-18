export interface YAMLdata {
    [key: string]: any;
}
export declare const parser: {
    yaml: (filepath: string) => YAMLdata;
    registerRoute: (yaml: string, method: string, route: string) => any;
    genSQL: (yaml: string, type: string, method: string, config: string) => any;
};
export declare function buildSQL(): void;
