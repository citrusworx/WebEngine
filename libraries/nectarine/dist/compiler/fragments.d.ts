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
export declare const MAX_FRAGMENT_LENGTH = 1024;
export type ConstScalar = boolean | number | string | null;
export type CompiledValue = {
    kind: "placeholder";
    token: string;
} | {
    kind: "const";
    value: ConstScalar;
} | {
    kind: "list";
    values: CompiledValue[];
};
export type WherePredicate = {
    column: string;
    operator: string;
    value?: CompiledValue;
};
export type WhereNode = WherePredicate | {
    and: WhereNode[];
} | {
    or: WhereNode[];
};
export type OrderByTerm = {
    column: string;
    direction?: "ASC" | "DESC";
};
export declare function parseWhereFragment(input: string): WhereNode;
export declare function parseOrderByFragment(input: string): OrderByTerm[];
export declare function compiledValueToYaml(value: CompiledValue): unknown;
export declare function whereNodeToYaml(node: WhereNode): unknown;
export declare function orderByToYaml(terms: OrderByTerm[]): unknown[];
