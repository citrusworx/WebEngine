interface MapInsertface {
    type: string;
    action: string;
    table: string;
    updates: {
        column: string[];
        values: string[];
    };
}
interface MapGetterface {
    type: string;
    action: string;
    table: string;
    clause: string;
    statement: {
        column: string[];
        values: string[];
    };
}
export declare function mapInsert(action: MapInsertface): string;
export declare function mapGetter(action: MapGetterface): string;
export declare function getValues(action: MapGetterface): string;
export {};
