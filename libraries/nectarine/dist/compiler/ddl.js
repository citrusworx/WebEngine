"use strict";
/**
 * Schema YAML → DDL compiler.
 *
 * App code never embeds CREATE TABLE. `*Schema.yml` tokens (table, fields,
 * constraints, indexes) are assembled here the same way query YAML becomes
 * DML. Adapters only execute the resulting statement text.
 *
 * Postgres JSONB is first-class: `json` / `jsonb` fields emit JSON/JSONB
 * columns. Do not drop JSONB to satisfy the no-SQL rule.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DDL_VENDORS = exports.SchemaCompileError = void 0;
exports.compileSchema = compileSchema;
exports.compileSchemas = compileSchemas;
exports.compileTable = compileTable;
exports.compileSchemaPlan = compileSchemaPlan;
exports.schemaFieldEnumValues = schemaFieldEnumValues;
const util_js_1 = require("../util/util.js");
const errors_js_1 = require("./errors.js");
class SchemaCompileError extends errors_js_1.QueryCompileError {
    constructor(message) {
        super(message);
        this.name = "SchemaCompileError";
    }
}
exports.SchemaCompileError = SchemaCompileError;
exports.DDL_VENDORS = ["postgres", "mysql"];
const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const ENUM_VALUE = /^[A-Za-z0-9_]+$/;
const NOW_CALL = /^NOW\s*\(\s*\)$/i;
const CURRENT_TIMESTAMP = /^CURRENT_TIMESTAMP$/i;
function assertIdentifier(name, label) {
    if (!IDENTIFIER.test(name)) {
        throw new SchemaCompileError(`Invalid ${label}: ${name}`);
    }
}
function sqlString(value) {
    return `'${value.replace(/'/g, "''")}'`;
}
function resolveVendor(vendor) {
    if (vendor === "mongodb") {
        throw new SchemaCompileError("Schema DDL compilation supports postgres and mysql; MongoDB is not SQL CREATE TABLE");
    }
    if (!exports.DDL_VENDORS.includes(vendor)) {
        throw new SchemaCompileError(`Unknown DDL vendor: ${vendor}`);
    }
    return vendor;
}
function loadSchemaDoc(schema) {
    if (typeof schema === "string") {
        const parsed = util_js_1.parser.yaml(schema);
        if (!(0, errors_js_1.isRecord)(parsed)) {
            throw new SchemaCompileError("Schema YAML must parse to an object");
        }
        return parsed;
    }
    if (!(0, errors_js_1.isRecord)(schema)) {
        throw new SchemaCompileError("Schema must be an object");
    }
    return schema;
}
function matchingParen(source, openIndex) {
    let depth = 0;
    for (let i = openIndex; i < source.length; i += 1) {
        const ch = source[i];
        if (ch === "(") {
            depth += 1;
        }
        else if (ch === ")") {
            depth -= 1;
            if (depth === 0) {
                return i;
            }
        }
    }
    throw new SchemaCompileError(`Unbalanced parentheses in field type: ${source}`);
}
function splitArgs(inner) {
    return inner
        .split(",")
        .map((part) => part.trim())
        .filter((part) => part.length > 0);
}
function parseColumnType(spec) {
    const trimmed = spec.trim();
    const enumMatch = trimmed.match(/^enum\s*\(/i);
    if (enumMatch && enumMatch[0] !== undefined) {
        const open = trimmed.indexOf("(");
        const close = matchingParen(trimmed, open);
        const values = splitArgs(trimmed.slice(open + 1, close));
        if (values.length === 0) {
            throw new SchemaCompileError("enum() requires at least one value");
        }
        for (const value of values) {
            if (!ENUM_VALUE.test(value)) {
                throw new SchemaCompileError(`Invalid enum value: ${value}`);
            }
        }
        return { type: { kind: "enum", values }, rest: trimmed.slice(close + 1).trim() };
    }
    const sized = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*\(/);
    if (sized && sized[1] !== undefined) {
        const open = trimmed.indexOf("(");
        const close = matchingParen(trimmed, open);
        const args = splitArgs(trimmed.slice(open + 1, close));
        if (args.length === 0) {
            throw new SchemaCompileError(`Type ${sized[1]}() requires arguments`);
        }
        for (const arg of args) {
            if (!/^[A-Za-z0-9_]+$/.test(arg)) {
                throw new SchemaCompileError(`Invalid type argument: ${arg}`);
            }
        }
        return {
            type: { kind: "sized", name: sized[1].toLowerCase(), args },
            rest: trimmed.slice(close + 1).trim(),
        };
    }
    const named = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)/);
    if (!named || named[1] === undefined) {
        throw new SchemaCompileError(`Missing field type: ${spec}`);
    }
    return {
        type: { kind: "named", name: named[1].toLowerCase() },
        rest: trimmed.slice(named[0].length).trim(),
    };
}
function takeDefaultValue(input) {
    const now = input.match(/^NOW\s*\(\s*\)/i);
    if (now && now[0] !== undefined) {
        return { value: { kind: "now" }, rest: input.slice(now[0].length).trim() };
    }
    const current = input.match(/^CURRENT_TIMESTAMP\b/i);
    if (current && current[0] !== undefined) {
        return { value: { kind: "now" }, rest: input.slice(current[0].length).trim() };
    }
    const bool = input.match(/^(TRUE|FALSE)\b/i);
    if (bool && bool[1] !== undefined) {
        return {
            value: { kind: "boolean", value: bool[1].toUpperCase() === "TRUE" },
            rest: input.slice(bool[0].length).trim(),
        };
    }
    const nul = input.match(/^NULL\b/i);
    if (nul && nul[0] !== undefined) {
        return { value: { kind: "null" }, rest: input.slice(nul[0].length).trim() };
    }
    const num = input.match(/^-?\d+(?:\.\d+)?/);
    if (num && num[0] !== undefined) {
        return {
            value: { kind: "number", value: Number(num[0]) },
            rest: input.slice(num[0].length).trim(),
        };
    }
    if (input.startsWith("'")) {
        let i = 1;
        let value = "";
        while (i < input.length) {
            const ch = input[i];
            if (ch === "'" && input[i + 1] === "'") {
                value += "'";
                i += 2;
                continue;
            }
            if (ch === "'") {
                return { value: { kind: "string", value }, rest: input.slice(i + 1).trim() };
            }
            value += ch;
            i += 1;
        }
        throw new SchemaCompileError("Unterminated DEFAULT string");
    }
    throw new SchemaCompileError(`Unsupported DEFAULT value: ${input}`);
}
function parseConstraintTokens(rest) {
    let input = rest.trim();
    const result = {
        primaryKey: false,
        autoIncrement: false,
        unique: false,
        notNull: false,
    };
    while (input.length > 0) {
        const upper = input.toUpperCase();
        if (upper.startsWith("PRIMARY KEY")) {
            result.primaryKey = true;
            input = input.slice("PRIMARY KEY".length).trim();
            continue;
        }
        if (upper.startsWith("AUTO_INCREMENT")) {
            result.autoIncrement = true;
            input = input.slice("AUTO_INCREMENT".length).trim();
            continue;
        }
        if (upper.startsWith("FOREIGN KEY")) {
            input = input.slice("FOREIGN KEY".length).trim();
            continue;
        }
        if (upper.startsWith("REFERENCES")) {
            const match = input.match(/^REFERENCES\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)/i);
            if (!match || match[1] === undefined || match[2] === undefined) {
                throw new SchemaCompileError(`Invalid REFERENCES clause: ${input}`);
            }
            assertIdentifier(match[1], "referenced table");
            assertIdentifier(match[2], "referenced column");
            result.references = { table: match[1], column: match[2] };
            input = input.slice(match[0].length).trim();
            continue;
        }
        if (upper.startsWith("NOT NULL")) {
            result.notNull = true;
            input = input.slice("NOT NULL".length).trim();
            continue;
        }
        if (/^NULL\b/i.test(input)) {
            input = input.slice(4).trim();
            continue;
        }
        if (upper.startsWith("UNIQUE")) {
            result.unique = true;
            input = input.slice("UNIQUE".length).trim();
            continue;
        }
        if (upper.startsWith("DEFAULT")) {
            const after = input.slice("DEFAULT".length).trim();
            const taken = takeDefaultValue(after);
            result.default = taken.value;
            input = taken.rest;
            continue;
        }
        throw new SchemaCompileError(`Unknown field constraint: ${input}`);
    }
    return result;
}
function parseStringField(name, spec) {
    const { type, rest } = parseColumnType(spec);
    return { name, type, ...parseConstraintTokens(rest) };
}
function parseDefaultFromObject(value) {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return { kind: "null" };
    }
    if (typeof value === "boolean") {
        return { kind: "boolean", value };
    }
    if (typeof value === "number" && Number.isFinite(value)) {
        return { kind: "number", value };
    }
    if (typeof value === "string") {
        if (NOW_CALL.test(value) || CURRENT_TIMESTAMP.test(value)) {
            return { kind: "now" };
        }
        return { kind: "string", value };
    }
    throw new SchemaCompileError(`Unsupported object-field default: ${JSON.stringify(value)}`);
}
function parseObjectField(name, spec) {
    const rawType = spec.type;
    if (typeof rawType !== "string" || rawType.trim() === "") {
        throw new SchemaCompileError(`Field ${name} is missing type`);
    }
    const length = spec.length ?? spec.size;
    let typeSource = rawType.trim();
    if (typeof length === "number" &&
        Number.isFinite(length) &&
        !typeSource.includes("(") &&
        /^(varchar|char|string)$/i.test(typeSource)) {
        const typeName = /^string$/i.test(typeSource) ? "varchar" : typeSource;
        typeSource = `${typeName}(${length})`;
    }
    const { type, rest } = parseColumnType(typeSource);
    if (rest.length > 0) {
        throw new SchemaCompileError(`Unexpected tokens in object field type: ${rest}`);
    }
    const constraints = parseConstraintTokens("");
    constraints.primaryKey = spec.primaryKey === true || spec.primary_key === true;
    constraints.autoIncrement = spec.autoIncrement === true || spec.auto_increment === true;
    constraints.unique = spec.unique === true;
    if (spec.null === false || spec.notNull === true || spec.not_null === true) {
        constraints.notNull = true;
    }
    constraints.default = parseDefaultFromObject(spec.default);
    const foreignKey = spec.foreignKey ?? spec.foreign_key;
    if (typeof foreignKey === "string") {
        const refs = parseConstraintTokens(foreignKey.trim().toUpperCase().startsWith("REFERENCES")
            ? foreignKey
            : `REFERENCES ${foreignKey}`);
        constraints.references = refs.references;
    }
    return { name, type, ...constraints };
}
function parseField(name, spec) {
    assertIdentifier(name, "column");
    if (typeof spec === "string") {
        return parseStringField(name, spec);
    }
    if ((0, errors_js_1.isRecord)(spec)) {
        return parseObjectField(name, spec);
    }
    throw new SchemaCompileError(`Field ${name} must be a type string or object`);
}
function parseIndexEntry(name, spec) {
    assertIdentifier(name, "index");
    if (!(0, errors_js_1.isRecord)(spec)) {
        throw new SchemaCompileError(`Index ${name} must be an object`);
    }
    const columns = spec.columns;
    const list = Array.isArray(columns)
        ? columns
        : typeof columns === "string"
            ? [columns]
            : null;
    if (!list || list.length === 0) {
        throw new SchemaCompileError(`Index ${name} requires columns`);
    }
    const parsed = list.map((column) => {
        if (typeof column !== "string") {
            throw new SchemaCompileError(`Index ${name} columns must be strings`);
        }
        assertIdentifier(column, "index column");
        return column;
    });
    return { name, columns: parsed, unique: spec.unique === true };
}
function parseIndexes(table, indexes) {
    if (indexes === undefined) {
        return [];
    }
    if (Array.isArray(indexes)) {
        return indexes.map((entry, i) => {
            if (!(0, errors_js_1.isRecord)(entry)) {
                throw new SchemaCompileError(`Index entry ${i} must be an object`);
            }
            const name = entry.name;
            if (typeof name !== "string") {
                throw new SchemaCompileError(`Index entry ${i} requires name`);
            }
            return parseIndexEntry(name, entry);
        });
    }
    if ((0, errors_js_1.isRecord)(indexes)) {
        return Object.entries(indexes).map(([name, spec]) => parseIndexEntry(name, spec));
    }
    throw new SchemaCompileError(`indexes on ${table} must be a list or map`);
}
function collectModels(schema) {
    const models = [];
    for (const [modelName, value] of Object.entries(schema)) {
        if (!(0, errors_js_1.isRecord)(value)) {
            continue;
        }
        if (value.table === undefined && value.fields === undefined) {
            continue;
        }
        assertIdentifier(modelName, "model");
        if (typeof value.table !== "string") {
            throw new SchemaCompileError(`Model ${modelName} requires a table name`);
        }
        assertIdentifier(value.table, "table");
        if (!(0, errors_js_1.isRecord)(value.fields)) {
            throw new SchemaCompileError(`Model ${modelName} requires a fields object`);
        }
        const fields = Object.entries(value.fields).map(([name, spec]) => parseField(name, spec));
        if (fields.length === 0) {
            throw new SchemaCompileError(`Model ${modelName} has no fields`);
        }
        models.push({
            modelName,
            table: value.table,
            fields,
            indexes: parseIndexes(value.table, value.indexes),
        });
    }
    if (models.length === 0) {
        throw new SchemaCompileError("Schema YAML contains no models with table/fields");
    }
    return models;
}
function emitDefault(value) {
    switch (value.kind) {
        case "now":
            return "NOW()";
        case "null":
            return "NULL";
        case "boolean":
            return value.value ? "TRUE" : "FALSE";
        case "number":
            return String(value.value);
        case "string":
            return sqlString(value.value);
    }
}
function namedSqlType(name, vendor) {
    switch (name) {
        case "string":
            return vendor === "mysql" ? "VARCHAR(255)" : "TEXT";
        case "text":
            return "TEXT";
        case "int":
        case "integer":
            return vendor === "mysql" ? "INT" : "INTEGER";
        case "smallint":
            return "SMALLINT";
        case "bigint":
            return "BIGINT";
        case "float":
            return vendor === "mysql" ? "DOUBLE" : "DOUBLE PRECISION";
        case "boolean":
        case "bool":
            return "BOOLEAN";
        case "date":
            return "DATE";
        case "time":
            return "TIME";
        case "timestamp":
        case "datetime":
            return vendor === "mysql" ? "DATETIME" : "TIMESTAMPTZ";
        case "json":
            return vendor === "mysql" ? "JSON" : "JSON";
        case "jsonb":
            return vendor === "mysql" ? "JSON" : "JSONB";
        case "serial":
            return vendor === "mysql" ? "INT" : "SERIAL";
        case "varchar":
            return "VARCHAR(255)";
        case "char":
            return "CHAR(1)";
        default:
            throw new SchemaCompileError(`Unknown field type: ${name}`);
    }
}
function emitSqlType(field, vendor) {
    const incrementInt = field.autoIncrement &&
        field.type.kind === "named" &&
        (field.type.name === "int" || field.type.name === "integer" || field.type.name === "serial");
    if (incrementInt && vendor === "postgres") {
        return "SERIAL";
    }
    if (field.type.kind === "enum") {
        if (vendor === "mysql") {
            return `ENUM(${field.type.values.map(sqlString).join(", ")})`;
        }
        return "TEXT";
    }
    if (field.type.kind === "sized") {
        const args = field.type.args.join(", ");
        switch (field.type.name) {
            case "varchar":
                return `VARCHAR(${args})`;
            case "char":
                return `CHAR(${args})`;
            case "decimal":
            case "numeric":
                return `DECIMAL(${args})`;
            default:
                throw new SchemaCompileError(`Unknown sized type: ${field.type.name}`);
        }
    }
    const sql = namedSqlType(field.type.name, vendor);
    if (incrementInt && vendor === "mysql") {
        return sql;
    }
    return sql;
}
function emitColumn(field, vendor) {
    const parts = [`${field.name} ${emitSqlType(field, vendor)}`];
    if (field.primaryKey) {
        parts.push("PRIMARY KEY");
    }
    if (field.autoIncrement && vendor === "mysql") {
        parts.push("AUTO_INCREMENT");
    }
    if (field.notNull && !field.primaryKey) {
        parts.push("NOT NULL");
    }
    if (field.default) {
        parts.push(`DEFAULT ${emitDefault(field.default)}`);
    }
    if (field.unique && !field.primaryKey) {
        parts.push("UNIQUE");
    }
    if (field.type.kind === "enum" && vendor === "postgres") {
        const list = field.type.values.map(sqlString).join(", ");
        parts.push(`CHECK (${field.name} IN (${list}))`);
    }
    if (field.references) {
        parts.push(`REFERENCES ${field.references.table}(${field.references.column})`);
    }
    return parts.join(" ");
}
function emitCreateTable(model, vendor) {
    const columns = model.fields.map((field) => `  ${emitColumn(field, vendor)}`).join(",\n");
    return `CREATE TABLE IF NOT EXISTS ${model.table} (\n${columns}\n);`;
}
function emitAddColumn(field, vendor) {
    if (field.primaryKey || field.autoIncrement) {
        return undefined;
    }
    const parts = [`${field.name} ${emitSqlType(field, vendor)}`];
    if (field.notNull && field.default) {
        parts.push("NOT NULL");
    }
    if (field.default) {
        parts.push(`DEFAULT ${emitDefault(field.default)}`);
    }
    if (field.unique) {
        parts.push("UNIQUE");
    }
    if (field.type.kind === "enum" && vendor === "postgres") {
        const list = field.type.values.map(sqlString).join(", ");
        parts.push(`CHECK (${field.name} IN (${list}))`);
    }
    if (field.references) {
        parts.push(`REFERENCES ${field.references.table}(${field.references.column})`);
    }
    return parts.join(" ");
}
function emitAddColumns(model, vendor) {
    if (vendor !== "postgres") {
        return [];
    }
    return model.fields.flatMap((field) => {
        const definition = emitAddColumn(field, vendor);
        if (!definition) {
            return [];
        }
        return [`ALTER TABLE ${model.table} ADD COLUMN IF NOT EXISTS ${definition};`];
    });
}
function emitIndexes(model, vendor) {
    return model.indexes.map((index) => {
        const unique = index.unique ? "UNIQUE " : "";
        const ifNotExists = vendor === "postgres" ? "IF NOT EXISTS " : "";
        return `CREATE ${unique}INDEX ${ifNotExists}${index.name} ON ${model.table} (${index.columns.join(", ")});`;
    });
}
function sortModels(models) {
    const byTable = new Map();
    for (const model of models) {
        if (byTable.has(model.table)) {
            throw new SchemaCompileError(`Duplicate table: ${model.table}`);
        }
        byTable.set(model.table, model);
    }
    const remaining = new Set(models.map((model) => model.table));
    const ordered = [];
    while (remaining.size > 0) {
        const ready = [...remaining].filter((table) => {
            const model = byTable.get(table);
            if (!model) {
                return false;
            }
            return model.fields.every((field) => {
                if (!field.references || field.references.table === table) {
                    return true;
                }
                return !remaining.has(field.references.table);
            });
        });
        if (ready.length === 0) {
            throw new SchemaCompileError(`Circular foreign keys among: ${[...remaining].sort().join(", ")}`);
        }
        ready.sort();
        for (const table of ready) {
            remaining.delete(table);
            const model = byTable.get(table);
            if (model) {
                ordered.push(model);
            }
        }
    }
    return ordered;
}
function planModels(models, vendor) {
    return sortModels(models).map((model) => ({
        table: model.table,
        createTable: emitCreateTable(model, vendor),
        addColumns: emitAddColumns(model, vendor),
        indexes: emitIndexes(model, vendor),
        references: [
            ...new Set(model.fields
                .map((field) => field.references?.table)
                .filter((table) => Boolean(table) && table !== model.table)),
        ],
    }));
}
function emitPlan(tables, options = {}) {
    const statements = [];
    for (const table of tables) {
        statements.push(table.createTable);
        if (options.additive) {
            statements.push(...table.addColumns);
        }
        statements.push(...table.indexes);
    }
    return statements.join("\n\n");
}
/**
 * Compile one schema document (`*Schema.yml`) into CREATE TABLE / INDEX SQL.
 * `schema` may be a parsed object or a filesystem path.
 */
function compileSchema(schema, vendor = "postgres", options = {}) {
    const dialect = resolveVendor(vendor);
    return emitPlan(planModels(collectModels(loadSchemaDoc(schema)), dialect), options);
}
/**
 * Compile several schema documents with shared foreign-key ordering.
 */
function compileSchemas(schemas, vendor = "postgres", options = {}) {
    if (!Array.isArray(schemas) || schemas.length === 0) {
        throw new SchemaCompileError("compileSchemas requires at least one schema document");
    }
    const dialect = resolveVendor(vendor);
    const models = schemas.flatMap((schema) => collectModels(loadSchemaDoc(schema)));
    return emitPlan(planModels(models, dialect), options);
}
/**
 * Compile a single named model from a schema document.
 */
function compileTable(schema, modelName, vendor = "postgres", options = {}) {
    const dialect = resolveVendor(vendor);
    const models = collectModels(loadSchemaDoc(schema));
    const model = models.find((entry) => entry.modelName === modelName);
    if (!model) {
        throw new SchemaCompileError(`Model not found: ${modelName}`);
    }
    return emitPlan(planModels([model], dialect), options);
}
function compileSchemaPlan(schema, vendor = "postgres") {
    return planModels(collectModels(loadSchemaDoc(schema)), resolveVendor(vendor));
}
/** Enum tokens from a schema field (for app-side allowlists, not SQL). */
function schemaFieldEnumValues(schema, modelName, fieldName) {
    assertIdentifier(modelName, "model");
    assertIdentifier(fieldName, "column");
    const model = collectModels(loadSchemaDoc(schema)).find((entry) => entry.modelName === modelName);
    const field = model?.fields.find((entry) => entry.name === fieldName);
    if (!field || field.type.kind !== "enum") {
        throw new SchemaCompileError(`Enum field not found: ${modelName}.${fieldName}`);
    }
    return field.type.values;
}
//# sourceMappingURL=ddl.js.map