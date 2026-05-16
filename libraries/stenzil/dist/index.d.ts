export * from "./types";
export * from "./lexer";
export * from "./parser";
export declare class Stenzil {
    static tokenize(source: string): import("./types").Token[];
    static parse(source: string): import("./types").TemplateAST;
}
