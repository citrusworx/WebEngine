/**
 * Normalize Blackwater / `type: SELECT` query YAML onto the canonical
 * phonics shape compiled by {@link compileQuery}.
 *
 * Blackwater:
 *   type: SELECT | INSERT | UPDATE | DELETE
 *   table, fields, where (fragment or structured), orderBy, returning
 *   read: is an alias of get
 *   count: true → SELECT COUNT(*)
 *   exists: true → SELECT EXISTS(SELECT 1 FROM ...)
 *
 * Canonical:
 *   select / from / where:{column,operator,value}
 *   insert:{into,columns,values}
 *   table / set / values / where
 */

import {
    orderByToYaml,
    parseOrderByFragment,
    parseWhereFragment,
    whereNodeToYaml,
} from "./fragments.js";
import { isRecord, QueryCompileError } from "./errors.js";
import { shiftPlaceholder } from "./placeholders.js";
import type { CrudMethod } from "./sql.js";

export const QUERY_TYPES = ["SELECT", "INSERT", "UPDATE", "DELETE"] as const;
export type QueryType = (typeof QUERY_TYPES)[number];

export const METHOD_ALIASES = {
    read: "get",
    get: "get",
    create: "create",
    update: "update",
    delete: "delete",
} as const;

export type MethodAlias = keyof typeof METHOD_ALIASES;

const TYPE_TO_METHOD: Record<QueryType, CrudMethod> = {
    SELECT: "get",
    INSERT: "create",
    UPDATE: "update",
    DELETE: "delete",
};

export function isQueryType(value: unknown): value is QueryType {
    return typeof value === "string" && (QUERY_TYPES as readonly string[]).includes(value.toUpperCase());
}

export function resolveCrudMethod(value: unknown): CrudMethod | undefined {
    if (typeof value !== "string") {
        return undefined;
    }
    if (value in METHOD_ALIASES) {
        return METHOD_ALIASES[value as MethodAlias];
    }
    return undefined;
}

export function methodLookupKeys(method: string): string[] {
    if (method === "get" || method === "read") {
        return method === "read" ? ["read", "get"] : ["get", "read"];
    }
    return [method];
}

export function inferMethodFromType(query: Record<string, unknown>): CrudMethod | undefined {
    if (typeof query.type !== "string") {
        return undefined;
    }
    const type = query.type.toUpperCase();
    if (!isQueryType(type)) {
        throw new QueryCompileError(`Unknown query type: ${query.type}`);
    }
    return TYPE_TO_METHOD[type];
}

export function isBlackwaterQuery(query: Record<string, unknown>): boolean {
    return typeof query.type === "string";
}

function implicitPlaceholders(count: number, startAt = 1): string[] {
    if (count <= 0) {
        throw new QueryCompileError("Cannot generate placeholders for an empty field list");
    }
    return Array.from({ length: count }, (_, index) => `$${startAt + index}`);
}

function shiftPlaceholders(value: unknown, offset: number): unknown {
    if (offset === 0) {
        return value;
    }
    if (typeof value === "string") {
        const shifted = shiftPlaceholder(value, offset);
        if (shifted !== undefined) {
            return shifted;
        }
    }
    if (Array.isArray(value)) {
        return value.map((item) => shiftPlaceholders(item, offset));
    }
    if (isRecord(value)) {
        const next: Record<string, unknown> = {};
        for (const [key, item] of Object.entries(value)) {
            next[key] = shiftPlaceholders(item, offset);
        }
        return next;
    }
    return value;
}

function normalizeFieldList(fields: unknown, label: string, allowStar: boolean): unknown {
    if (fields === undefined) {
        throw new QueryCompileError(`${label} requires fields`);
    }
    if (isRecord(fields) && typeof fields.fn === "string") {
        return [fields];
    }
    if (typeof fields === "string") {
        const trimmed = fields.trim();
        if (trimmed === "*") {
            if (!allowStar) {
                throw new QueryCompileError(`${label} cannot include *`);
            }
            return "*";
        }
        const parts = trimmed.split(",").map((part) => part.trim()).filter(Boolean);
        if (parts.length === 0) {
            throw new QueryCompileError(`${label} fields is empty`);
        }
        return parts;
    }
    if (!Array.isArray(fields) || fields.length === 0) {
        throw new QueryCompileError(`${label} fields must be * or a non-empty list`);
    }
    return fields.map((field, index) => {
        if (isRecord(field) && typeof field.fn === "string") {
            return field;
        }
        if (typeof field !== "string") {
            throw new QueryCompileError(`${label} fields[${index}] must be a string or { fn: count }`);
        }
        return field;
    });
}

function normalizeWhere(where: unknown): unknown {
    if (typeof where === "string") {
        return whereNodeToYaml(parseWhereFragment(where));
    }
    return where;
}

function normalizeOrderBy(orderBy: unknown): unknown {
    if (orderBy === undefined) {
        return undefined;
    }
    if (typeof orderBy === "string") {
        return orderByToYaml(parseOrderByFragment(orderBy));
    }
    return orderBy;
}

function requireTable(query: Record<string, unknown>, label: string): string {
    if (typeof query.table !== "string") {
        throw new QueryCompileError(`${label} requires table`);
    }
    return query.table;
}

function normalizeSelect(query: Record<string, unknown>): Record<string, unknown> {
    const table = requireTable(query, "SELECT");

    if (query.exists === true || isRecord(query.exists)) {
        if (query.count === true) {
            throw new QueryCompileError("SELECT cannot mix count and exists");
        }
        if (query.fields !== undefined || query.select !== undefined) {
            throw new QueryCompileError("EXISTS cannot include fields");
        }
        if (query.orderBy !== undefined) {
            throw new QueryCompileError("EXISTS cannot include orderBy");
        }

        const nested = isRecord(query.exists) ? query.exists : undefined;
        const from = typeof nested?.from === "string" ? nested.from : (query.from ?? table);
        const where = nested?.where !== undefined ? nested.where : query.where;
        const normalized: Record<string, unknown> = {
            exists: true,
            from,
        };
        if (where !== undefined) {
            normalized.where = normalizeWhere(where);
        }
        return normalized;
    }

    if (query.count === true) {
        if (query.fields !== undefined) {
            throw new QueryCompileError("count: true cannot include fields");
        }
        const normalized: Record<string, unknown> = {
            select: [{ fn: "count" }],
            from: query.from ?? table,
        };
        if (query.where !== undefined) {
            normalized.where = normalizeWhere(query.where);
        }
        const orderBy = normalizeOrderBy(query.orderBy);
        if (orderBy !== undefined) {
            normalized.orderBy = orderBy;
        }
        return normalized;
    }

    const select = query.fields === undefined && query.select !== undefined
        ? query.select
        : normalizeFieldList(query.fields, "SELECT", true);

    const normalized: Record<string, unknown> = {
        select,
        from: query.from ?? table,
    };

    if (query.where !== undefined) {
        normalized.where = normalizeWhere(query.where);
    }
    const orderBy = normalizeOrderBy(query.orderBy);
    if (orderBy !== undefined) {
        normalized.orderBy = orderBy;
    }
    return normalized;
}

function normalizeInsert(query: Record<string, unknown>): Record<string, unknown> {
    const table = requireTable(query, "INSERT");
    const columns = normalizeFieldList(query.fields ?? query.columns, "INSERT", false);
    if (!Array.isArray(columns) || columns.some((column) => typeof column !== "string")) {
        throw new QueryCompileError("INSERT cannot include *");
    }

    const values = query.values === undefined
        ? implicitPlaceholders(columns.length)
        : query.values;

    const insert: Record<string, unknown> = {
        into: query.into ?? table,
        columns,
        values,
    };

    const normalized: Record<string, unknown> = { insert };
    if (query.returning !== undefined) {
        normalized.returning = query.returning;
    }
    return normalized;
}

function normalizeUpdate(query: Record<string, unknown>): Record<string, unknown> {
    const table = requireTable(query, "UPDATE");
    const set = query.set === undefined
        ? normalizeFieldList(query.fields, "UPDATE", false)
        : query.set;
    if (!Array.isArray(set) || set.some((column) => typeof column !== "string")) {
        throw new QueryCompileError("UPDATE cannot include *");
    }

    const implicitValues = query.values === undefined;
    const setCount = Array.isArray(set) ? set.length : 0;
    const values = implicitValues ? implicitPlaceholders(setCount) : query.values;
    const where = normalizeWhere(query.where);

    return {
        table,
        set,
        values,
        where: implicitValues ? shiftPlaceholders(where, setCount) : where,
    };
}

function normalizeDelete(query: Record<string, unknown>): Record<string, unknown> {
    const table = typeof query.from === "string" ? query.from : requireTable(query, "DELETE");
    return {
        from: table,
        where: normalizeWhere(query.where),
    };
}

/**
 * Convert a Blackwater `type: SELECT` query (or pass through a canonical one).
 */
export function normalizeQuery(
    query: Record<string, unknown>,
    method?: CrudMethod,
): Record<string, unknown> {
    if (!isBlackwaterQuery(query)) {
        return query;
    }

    const typeMethod = inferMethodFromType(query);
    if (method !== undefined && typeMethod !== undefined && method !== typeMethod) {
        throw new QueryCompileError(
            `Query type ${String(query.type)} does not match CRUD method ${method}`,
        );
    }

    const kind = method ?? typeMethod;
    if (kind === undefined) {
        throw new QueryCompileError("Blackwater query requires type or a CRUD method");
    }

    switch (kind) {
        case "get":
            return normalizeSelect(query);
        case "create":
            return normalizeInsert(query);
        case "update":
            return normalizeUpdate(query);
        case "delete":
            return normalizeDelete(query);
    }
}
