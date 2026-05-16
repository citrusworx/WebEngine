export type optokens = {
    eq: "=";
    gt: ">";
    lt: "<";
    lte: "<=";
    gte: ">=";
    neq: "!=";
};
export declare class CCompiler {
    parse_config(config: string): Record<string, string>;
    clean_parse(parsedConfig: any, method: string, type: string): Record<string, string>;
    buildQuery(cleanedConfig: Record<string, string>, query: string): void;
}
