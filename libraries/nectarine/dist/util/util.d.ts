import { type CrudMethod } from "../compiler/sql.js";
export interface YAMLdata {
    [key: string]: any;
}
export declare const parser: {
    yaml: (filepath: string) => YAMLdata;
    registerRoute: (yaml: string, method: string, route: string) => any;
    genSQL: (yaml: string, type: string, method: string, config: string) => any;
    /**
     * Compile a query object from {@link parser.genSQL} into SQL.
     * Delegates to the shared compiler so this is not a second code path.
     * Pass `method` for DELETE (and to disambiguate incomplete shapes).
     */
    buildSQL: (genSQL: Record<string, unknown>, method?: CrudMethod) => string;
};
