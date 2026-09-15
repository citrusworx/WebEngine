export declare function println(message?: string): void;
export declare function printErr(message: string): void;
export declare function printJson(value: unknown): void;
export interface TableColumn {
    key: string;
    header: string;
}
export declare function formatTable(rows: Array<Record<string, string>>, columns: TableColumn[]): string;
export declare function formatLabeled(pairs: Array<[string, string]>): string;
export declare function dash(value: string | number | undefined | null): string;
