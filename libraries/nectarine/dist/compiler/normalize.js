"use strict";
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
 *   onConflict: { target, do|action, set? } on INSERT
 *
 * Canonical:
 *   select / from / where:{column,operator,value}
 *   insert:{into,columns,values,onConflict?}
 *   table / set / values / where
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.METHOD_ALIASES = exports.QUERY_TYPES = void 0;
exports.isQueryType = isQueryType;
exports.resolveCrudMethod = resolveCrudMethod;
exports.methodLookupKeys = methodLookupKeys;
exports.inferMethodFromType = inferMethodFromType;
exports.isBlackwaterQuery = isBlackwaterQuery;
exports.normalizeQuery = normalizeQuery;
const fragments_js_1 = require("./fragments.js");
const errors_js_1 = require("./errors.js");
const placeholders_js_1 = require("./placeholders.js");
exports.QUERY_TYPES = ["SELECT", "INSERT", "UPDATE", "DELETE"];
exports.METHOD_ALIASES = {
    read: "get",
    get: "get",
    create: "create",
    update: "update",
    delete: "delete",
};
const TYPE_TO_METHOD = {
    SELECT: "get",
    INSERT: "create",
    UPDATE: "update",
    DELETE: "delete",
};
function isQueryType(value) {
    return typeof value === "string" && exports.QUERY_TYPES.includes(value.toUpperCase());
}
function resolveCrudMethod(value) {
    if (typeof value !== "string") {
        return undefined;
    }
    if (value in exports.METHOD_ALIASES) {
        return exports.METHOD_ALIASES[value];
    }
    return undefined;
}
function methodLookupKeys(method) {
    if (method === "get" || method === "read") {
        return method === "read" ? ["read", "get"] : ["get", "read"];
    }
    return [method];
}
function inferMethodFromType(query) {
    if (typeof query.type !== "string") {
        return undefined;
    }
    const type = query.type.toUpperCase();
    if (!isQueryType(type)) {
        throw new errors_js_1.QueryCompileError(`Unknown query type: ${query.type}`);
    }
    return TYPE_TO_METHOD[type];
}
function isBlackwaterQuery(query) {
    return typeof query.type === "string";
}
function implicitPlaceholders(count, startAt = 1) {
    if (count <= 0) {
        throw new errors_js_1.QueryCompileError("Cannot generate placeholders for an empty field list");
    }
    return Array.from({ length: count }, (_, index) => `$${startAt + index}`);
}
function shiftPlaceholders(value, offset) {
    if (offset === 0) {
        return value;
    }
    if (typeof value === "string") {
        const shifted = (0, placeholders_js_1.shiftPlaceholder)(value, offset);
        if (shifted !== undefined) {
            return shifted;
        }
    }
    if (Array.isArray(value)) {
        return value.map((item) => shiftPlaceholders(item, offset));
    }
    if ((0, errors_js_1.isRecord)(value)) {
        const next = {};
        for (const [key, item] of Object.entries(value)) {
            next[key] = shiftPlaceholders(item, offset);
        }
        return next;
    }
    return value;
}
function normalizeFieldList(fields, label, allowStar) {
    if (fields === undefined) {
        throw new errors_js_1.QueryCompileError(`${label} requires fields`);
    }
    if ((0, errors_js_1.isRecord)(fields) && typeof fields.fn === "string") {
        return [fields];
    }
    if (typeof fields === "string") {
        const trimmed = fields.trim();
        if (trimmed === "*") {
            if (!allowStar) {
                throw new errors_js_1.QueryCompileError(`${label} cannot include *`);
            }
            return "*";
        }
        const parts = trimmed.split(",").map((part) => part.trim()).filter(Boolean);
        if (parts.length === 0) {
            throw new errors_js_1.QueryCompileError(`${label} fields is empty`);
        }
        return parts;
    }
    if (!Array.isArray(fields) || fields.length === 0) {
        throw new errors_js_1.QueryCompileError(`${label} fields must be * or a non-empty list`);
    }
    return fields.map((field, index) => {
        if ((0, errors_js_1.isRecord)(field) && typeof field.fn === "string") {
            return field;
        }
        if (typeof field !== "string") {
            throw new errors_js_1.QueryCompileError(`${label} fields[${index}] must be a string or { fn: count }`);
        }
        return field;
    });
}
function normalizeWhere(where) {
    if (typeof where === "string") {
        return (0, fragments_js_1.whereNodeToYaml)((0, fragments_js_1.parseWhereFragment)(where));
    }
    return where;
}
function normalizeOrderBy(orderBy) {
    if (orderBy === undefined) {
        return undefined;
    }
    if (typeof orderBy === "string") {
        return (0, fragments_js_1.orderByToYaml)((0, fragments_js_1.parseOrderByFragment)(orderBy));
    }
    return orderBy;
}
function requireTable(query, label) {
    if (typeof query.table !== "string") {
        throw new errors_js_1.QueryCompileError(`${label} requires table`);
    }
    return query.table;
}
function normalizeSelect(query) {
    const table = requireTable(query, "SELECT");
    if (query.exists === true || (0, errors_js_1.isRecord)(query.exists)) {
        if (query.count === true) {
            throw new errors_js_1.QueryCompileError("SELECT cannot mix count and exists");
        }
        if (query.fields !== undefined || query.select !== undefined) {
            throw new errors_js_1.QueryCompileError("EXISTS cannot include fields");
        }
        if (query.orderBy !== undefined) {
            throw new errors_js_1.QueryCompileError("EXISTS cannot include orderBy");
        }
        const nested = (0, errors_js_1.isRecord)(query.exists) ? query.exists : undefined;
        const from = typeof nested?.from === "string" ? nested.from : (query.from ?? table);
        const where = nested?.where !== undefined ? nested.where : query.where;
        const normalized = {
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
            throw new errors_js_1.QueryCompileError("count: true cannot include fields");
        }
        if (query.orderBy !== undefined) {
            throw new errors_js_1.QueryCompileError("COUNT cannot include orderBy (GROUP BY is not compiled)");
        }
        const normalized = {
            select: [{ fn: "count" }],
            from: query.from ?? table,
        };
        if (query.where !== undefined) {
            normalized.where = normalizeWhere(query.where);
        }
        return normalized;
    }
    const select = query.fields === undefined && query.select !== undefined
        ? query.select
        : normalizeFieldList(query.fields, "SELECT", true);
    const normalized = {
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
function normalizeInsert(query) {
    const table = requireTable(query, "INSERT");
    const columns = normalizeFieldList(query.fields ?? query.columns, "INSERT", false);
    if (!Array.isArray(columns) || columns.some((column) => typeof column !== "string")) {
        throw new errors_js_1.QueryCompileError("INSERT cannot include *");
    }
    const values = query.values === undefined
        ? implicitPlaceholders(columns.length)
        : query.values;
    const insert = {
        into: query.into ?? table,
        columns,
        values,
    };
    const onConflict = query.onConflict
        ?? ((0, errors_js_1.isRecord)(query.insert) ? query.insert.onConflict : undefined);
    if (onConflict !== undefined) {
        insert.onConflict = onConflict;
    }
    const normalized = { insert };
    if (query.returning !== undefined) {
        normalized.returning = query.returning;
    }
    return normalized;
}
function normalizeUpdate(query) {
    const table = requireTable(query, "UPDATE");
    const set = query.set === undefined
        ? normalizeFieldList(query.fields, "UPDATE", false)
        : query.set;
    if (!Array.isArray(set) || set.some((column) => typeof column !== "string")) {
        throw new errors_js_1.QueryCompileError("UPDATE cannot include *");
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
function normalizeDelete(query) {
    const table = typeof query.from === "string" ? query.from : requireTable(query, "DELETE");
    return {
        from: table,
        where: normalizeWhere(query.where),
    };
}
/**
 * Convert a Blackwater `type: SELECT` query (or pass through a canonical one).
 */
function normalizeQuery(query, method) {
    if (!isBlackwaterQuery(query)) {
        return query;
    }
    const typeMethod = inferMethodFromType(query);
    if (method !== undefined && typeMethod !== undefined && method !== typeMethod) {
        throw new errors_js_1.QueryCompileError(`Query type ${String(query.type)} does not match CRUD method ${method}`);
    }
    const kind = method ?? typeMethod;
    if (kind === undefined) {
        throw new errors_js_1.QueryCompileError("Blackwater query requires type or a CRUD method");
    }
    if (query.onConflict !== undefined && kind !== "create") {
        throw new errors_js_1.QueryCompileError("onConflict is only valid on INSERT");
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
//# sourceMappingURL=normalize.js.map