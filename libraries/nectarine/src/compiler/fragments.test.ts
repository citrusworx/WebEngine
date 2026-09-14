import { describe, expect, it } from "vitest";
import { parseOrderByFragment, parseWhereFragment } from "./fragments.js";
import { QueryCompileError } from "./sql.js";

describe("parseWhereFragment", () => {
    it("parses a boolean constant comparison", () => {
        expect(parseWhereFragment("isActive = true")).toEqual({
            column: "isActive",
            operator: "eq",
            value: { kind: "const", value: true },
        });
    });

    it("parses a $N::jsonb bind cast", () => {
        expect(parseWhereFragment("payload = $1::jsonb")).toEqual({
            column: "payload",
            operator: "eq",
            value: { kind: "placeholder", token: "$1::jsonb" },
        });
    });

    it("parses placeholders, AND, and quoted strings", () => {
        expect(parseWhereFragment("catalog = $1 AND status = 'published'")).toEqual({
            and: [
                { column: "catalog", operator: "eq", value: { kind: "placeholder", token: "$1" } },
                { column: "status", operator: "eq", value: { kind: "const", value: "published" } },
            ],
        });
    });

    it("parses IN lists", () => {
        expect(parseWhereFragment("status IN ('requested', 'confirmed')")).toEqual({
            column: "status",
            operator: "in",
            value: {
                kind: "list",
                values: [
                    { kind: "const", value: "requested" },
                    { kind: "const", value: "confirmed" },
                ],
            },
        });
    });

    it("rejects comments, semicolons, and function calls", () => {
        expect(() => parseWhereFragment("id = $1; DROP TABLE users")).toThrowError(
            QueryCompileError,
        );
        expect(() => parseWhereFragment("id = $1 --")).toThrowError(/comments/);
        expect(() => parseWhereFragment("id = now()")).toThrowError(QueryCompileError);
        expect(() => parseWhereFragment("id IN (SELECT id FROM users)")).toThrowError(
            QueryCompileError,
        );
        expect(() => parseWhereFragment("id = $1 OR 1 = 1")).toThrowError(QueryCompileError);
    });

    it("rejects unquoted strings and double quotes", () => {
        expect(() => parseWhereFragment("email = published")).toThrowError(QueryCompileError);
        expect(() => parseWhereFragment('name = "x"')).toThrowError(/quoted identifiers/);
    });
});

describe("parseOrderByFragment", () => {
    it("parses identifier lists and directions", () => {
        expect(parseOrderByFragment("catalog, category, name")).toEqual([
            { column: "catalog" },
            { column: "category" },
            { column: "name" },
        ]);
        expect(parseOrderByFragment("created_at DESC")).toEqual([
            { column: "created_at", direction: "DESC" },
        ]);
        expect(parseOrderByFragment("starts_at ASC")).toEqual([
            { column: "starts_at", direction: "ASC" },
        ]);
    });

    it("rejects injected SQL in orderBy", () => {
        expect(() => parseOrderByFragment("id; DELETE FROM users")).toThrowError(
            QueryCompileError,
        );
    });
});
