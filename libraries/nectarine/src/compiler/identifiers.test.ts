import { describe, expect, it } from "vitest";
import { quoteIdent, quoteIdentPath } from "./identifiers.js";

describe("quoteIdent", () => {
    it("leaves lowercase identifiers unquoted (folding is a no-op)", () => {
        expect(quoteIdent("payload")).toBe("payload");
        expect(quoteIdent("created_at")).toBe("created_at");
        expect(quoteIdent("products")).toBe("products");
    });

    it("quotes mixed-case names so Postgres does not fold them", () => {
        expect(quoteIdent("originalPrice")).toBe('"originalPrice"');
        expect(quoteIdent("isNew")).toBe('"isNew"');
        expect(quoteIdent("isActive")).toBe('"isActive"');
        expect(quoteIdent("originalPrice")).not.toBe("originalprice");
    });

    it("uses backticks for mixed-case MySQL identifiers", () => {
        expect(quoteIdent("isNew", "mysql")).toBe("`isNew`");
        expect(quoteIdent("payload", "mysql")).toBe("payload");
    });

    it("quotes each segment of a dotted path", () => {
        expect(quoteIdentPath("products.isActive")).toBe('products."isActive"');
    });
});
