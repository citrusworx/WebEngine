export * from "./types";
export * from "./lexer";
export * from "./parser";

import { tokenize } from "./lexer";
import { parse } from "./parser";

export class Stenzil {
    static tokenize(source: string) {
        return tokenize(source);
    }

    static parse(source: string) {
        return parse(source);
    }
}
