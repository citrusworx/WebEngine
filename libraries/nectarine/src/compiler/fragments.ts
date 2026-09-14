/**
 * Closed grammars for Blackwater-style YAML fragments.
 *
 * `where: isActive = true` is **not** raw SQL. It is parsed into structured
 * predicates. Anything outside this grammar is rejected so YAML cannot
 * smuggle arbitrary SQL (comments, subqueries, function calls, semicolons).
 *
 * Allowed: identifiers, comparison operators, `$N` placeholders,
 * YAML-authored constants (booleans, numbers, single-quoted strings, NULL),
 * AND / OR, IN / NOT IN lists, IS [NOT] NULL, and parentheses.
 *
 * Runtime / user values must be `$N` bind placeholders — never interpolated.
 */

import { QueryCompileError } from "./errors.js";

export const MAX_FRAGMENT_LENGTH = 1024;

export type ConstScalar = boolean | number | string | null;

export type CompiledValue =
    | { kind: "placeholder"; token: string }
    | { kind: "const"; value: ConstScalar }
    | { kind: "list"; values: CompiledValue[] };

export type WherePredicate = {
    column: string;
    operator: string;
    value?: CompiledValue;
};

export type WhereNode =
    | WherePredicate
    | { and: WhereNode[] }
    | { or: WhereNode[] };

export type OrderByTerm = {
    column: string;
    direction?: "ASC" | "DESC";
};

type TokenKind =
    | "ident"
    | "placeholder"
    | "number"
    | "string"
    | "op"
    | "punct"
    | "keyword";

type Token = {
    kind: TokenKind;
    value: string;
    index: number;
};

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const KEYWORDS = new Set(["AND", "OR", "IN", "NOT", "IS", "NULL", "TRUE", "FALSE", "ASC", "DESC"]);
const TWO_CHAR_OPS = ["<=", ">=", "!=", "<>"];

function assertFragmentLength(input: string, label: string): void {
    if (input.length > MAX_FRAGMENT_LENGTH) {
        throw new QueryCompileError(`${label} fragment exceeds ${MAX_FRAGMENT_LENGTH} characters`);
    }
}

function tokenize(input: string, label: string): Token[] {
    assertFragmentLength(input, label);

    const tokens: Token[] = [];
    let i = 0;

    while (i < input.length) {
        const ch = input[i];
        if (ch === undefined) {
            break;
        }
        if (/\s/.test(ch)) {
            i += 1;
            continue;
        }

        if (ch === "-" && input[i + 1] === "-") {
            throw new QueryCompileError(`${label} fragment cannot contain comments`);
        }
        if (ch === "/" && input[i + 1] === "*") {
            throw new QueryCompileError(`${label} fragment cannot contain comments`);
        }
        if (ch === ";") {
            throw new QueryCompileError(`${label} fragment cannot contain semicolons`);
        }
        if (ch === "`" || ch === "\"") {
            throw new QueryCompileError(`${label} fragment cannot contain quoted identifiers`);
        }

        if (ch === "$") {
            const match = input.slice(i).match(/^\$[1-9]\d*/);
            if (!match) {
                throw new QueryCompileError(`${label} fragment has an invalid placeholder at ${i}`);
            }
            tokens.push({ kind: "placeholder", value: match[0], index: i });
            i += match[0].length;
            continue;
        }

        const two = input.slice(i, i + 2);
        if (TWO_CHAR_OPS.includes(two)) {
            tokens.push({ kind: "op", value: two === "<>" ? "!=" : two, index: i });
            i += 2;
            continue;
        }

        if (ch === "=" || ch === "<" || ch === ">") {
            tokens.push({ kind: "op", value: ch, index: i });
            i += 1;
            continue;
        }

        if (ch === "(" || ch === ")" || ch === ",") {
            tokens.push({ kind: "punct", value: ch, index: i });
            i += 1;
            continue;
        }

        if (ch === "'") {
            let j = i + 1;
            let value = "";
            let closed = false;
            while (j < input.length) {
                const next = input[j];
                if (next === undefined) {
                    break;
                }
                if (next === "'" && input[j + 1] === "'") {
                    value += "'";
                    j += 2;
                    continue;
                }
                if (next === "'") {
                    tokens.push({ kind: "string", value, index: i });
                    i = j + 1;
                    closed = true;
                    break;
                }
                value += next;
                j += 1;
            }
            if (!closed) {
                throw new QueryCompileError(`${label} fragment has an unterminated string at ${i}`);
            }
            continue;
        }

        if (ch === "-" || /[0-9]/.test(ch)) {
            const match = input.slice(i).match(/^-?\d+(?:\.\d+)?/);
            if (!match || (ch === "-" && !/[0-9]/.test(input[i + 1] ?? ""))) {
                throw new QueryCompileError(`${label} fragment has an invalid token at ${i}`);
            }
            tokens.push({ kind: "number", value: match[0], index: i });
            i += match[0].length;
            continue;
        }

        if (/[A-Za-z_]/.test(ch)) {
            const match = input.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);
            if (!match) {
                throw new QueryCompileError(`${label} fragment has an invalid identifier at ${i}`);
            }
            const word = match[0];
            const upper = word.toUpperCase();
            if (KEYWORDS.has(upper)) {
                tokens.push({ kind: "keyword", value: upper, index: i });
            } else {
                tokens.push({ kind: "ident", value: word, index: i });
            }
            i += word.length;
            continue;
        }

        throw new QueryCompileError(`${label} fragment has an invalid character at ${i}`);
    }

    return tokens;
}

class FragmentParser {
    private readonly tokens: Token[];
    private readonly label: string;
    private index = 0;

    constructor(tokens: Token[], label: string) {
        this.tokens = tokens;
        this.label = label;
    }

    parseWhere(): WhereNode {
        if (this.tokens.length === 0) {
            throw new QueryCompileError("where fragment is empty");
        }
        const node = this.parseOr();
        this.expectEnd();
        return node;
    }

    parseOrderBy(): OrderByTerm[] {
        if (this.tokens.length === 0) {
            throw new QueryCompileError("orderBy fragment is empty");
        }

        const terms: OrderByTerm[] = [];
        terms.push(this.parseOrderTerm());
        while (this.peek()?.kind === "punct" && this.peek()?.value === ",") {
            this.index += 1;
            terms.push(this.parseOrderTerm());
        }
        this.expectEnd();
        return terms;
    }

    private parseOrderTerm(): OrderByTerm {
        const column = this.expectIdent("orderBy column");
        const next = this.peek();
        if (next?.kind === "keyword" && (next.value === "ASC" || next.value === "DESC")) {
            this.index += 1;
            return { column, direction: next.value };
        }
        return { column };
    }

    private parseOr(): WhereNode {
        const parts = [this.parseAnd()];
        while (this.peekKeyword("OR")) {
            this.index += 1;
            parts.push(this.parseAnd());
        }
        return parts.length === 1 ? parts[0] : { or: parts };
    }

    private parseAnd(): WhereNode {
        const parts = [this.parsePredicate()];
        while (this.peekKeyword("AND")) {
            this.index += 1;
            parts.push(this.parsePredicate());
        }
        return parts.length === 1 ? parts[0] : { and: parts };
    }

    private parsePredicate(): WhereNode {
        if (this.peek()?.kind === "punct" && this.peek()?.value === "(") {
            this.index += 1;
            const inner = this.parseOr();
            this.expectPunct(")");
            return inner;
        }

        const column = this.expectIdent("column");
        const next = this.peek();

        if (this.peekKeyword("NOT")) {
            this.index += 1;
            this.expectKeyword("IN");
            return { column, operator: "not_in", value: { kind: "list", values: this.parseValueList() } };
        }

        if (this.peekKeyword("IN")) {
            this.index += 1;
            return { column, operator: "in", value: { kind: "list", values: this.parseValueList() } };
        }

        if (this.peekKeyword("IS")) {
            this.index += 1;
            if (this.peekKeyword("NOT")) {
                this.index += 1;
                this.expectKeyword("NULL");
                return { column, operator: "is_not_null" };
            }
            this.expectKeyword("NULL");
            return { column, operator: "is_null" };
        }

        if (next?.kind !== "op") {
            throw new QueryCompileError(`Invalid where fragment: expected operator after ${column}`);
        }
        this.index += 1;
        return { column, operator: operatorToken(next.value), value: this.parseValue() };
    }

    private parseValueList(): CompiledValue[] {
        this.expectPunct("(");
        const values: CompiledValue[] = [];
        values.push(this.parseValue());
        while (this.peek()?.kind === "punct" && this.peek()?.value === ",") {
            this.index += 1;
            values.push(this.parseValue());
        }
        this.expectPunct(")");
        if (values.length === 0) {
            throw new QueryCompileError("IN list cannot be empty");
        }
        return values;
    }

    private parseValue(): CompiledValue {
        const token = this.peek();
        if (!token) {
            throw new QueryCompileError("Invalid where fragment: expected a value");
        }

        if (token.kind === "placeholder") {
            this.index += 1;
            return { kind: "placeholder", token: token.value };
        }
        if (token.kind === "number") {
            this.index += 1;
            return { kind: "const", value: Number(token.value) };
        }
        if (token.kind === "string") {
            this.index += 1;
            return { kind: "const", value: token.value };
        }
        if (token.kind === "keyword" && token.value === "TRUE") {
            this.index += 1;
            return { kind: "const", value: true };
        }
        if (token.kind === "keyword" && token.value === "FALSE") {
            this.index += 1;
            return { kind: "const", value: false };
        }
        if (token.kind === "keyword" && token.value === "NULL") {
            this.index += 1;
            return { kind: "const", value: null };
        }

        throw new QueryCompileError(
            "Invalid where fragment: values must be $N, a boolean, a number, NULL, or a single-quoted string",
        );
    }

    private expectIdent(label: string): string {
        const token = this.peek();
        if (token?.kind !== "ident" || !IDENTIFIER.test(token.value)) {
            throw new QueryCompileError(`Invalid ${label} in ${this.label} fragment`);
        }
        this.index += 1;
        return token.value;
    }

    private expectKeyword(word: string): void {
        if (!this.peekKeyword(word)) {
            throw new QueryCompileError(`Invalid where fragment: expected ${word}`);
        }
        this.index += 1;
    }

    private expectPunct(value: string): void {
        const token = this.peek();
        if (token?.kind !== "punct" || token.value !== value) {
            throw new QueryCompileError(`Invalid where fragment: expected ${value}`);
        }
        this.index += 1;
    }

    private peekKeyword(word: string): boolean {
        const token = this.peek();
        return token?.kind === "keyword" && token.value === word;
    }

    private peek(): Token | undefined {
        return this.tokens[this.index];
    }

    private expectEnd(): void {
        const extra = this.peek();
        if (extra) {
            throw new QueryCompileError(
                `Invalid ${this.label} fragment: unexpected token ${extra.value}`,
            );
        }
    }
}

function operatorToken(op: string): string {
    switch (op) {
        case "=":
            return "eq";
        case "!=":
            return "neq";
        case ">":
            return "gt";
        case "<":
            return "lt";
        case ">=":
            return "gte";
        case "<=":
            return "lte";
        default:
            throw new QueryCompileError(`Unknown operator: ${op}`);
    }
}

export function parseWhereFragment(input: string): WhereNode {
    if (typeof input !== "string") {
        throw new QueryCompileError("where fragment must be a string");
    }
    return new FragmentParser(tokenize(input, "where"), "where").parseWhere();
}

export function parseOrderByFragment(input: string): OrderByTerm[] {
    if (typeof input !== "string") {
        throw new QueryCompileError("orderBy fragment must be a string");
    }
    return new FragmentParser(tokenize(input, "orderBy"), "orderBy").parseOrderBy();
}

export function compiledValueToYaml(value: CompiledValue): unknown {
    if (value.kind === "placeholder") {
        return value.token;
    }
    if (value.kind === "const") {
        return { const: value.value };
    }
    return { list: value.values.map(compiledValueToYaml) };
}

export function whereNodeToYaml(node: WhereNode): unknown {
    if ("and" in node) {
        return { and: node.and.map(whereNodeToYaml) };
    }
    if ("or" in node) {
        return { or: node.or.map(whereNodeToYaml) };
    }
    return {
        column: node.column,
        operator: node.operator,
        ...(node.value !== undefined ? { value: compiledValueToYaml(node.value) } : {}),
    };
}

export function orderByToYaml(terms: OrderByTerm[]): unknown[] {
    return terms.map((term) =>
        term.direction ? { column: term.column, direction: term.direction } : { column: term.column },
    );
}
