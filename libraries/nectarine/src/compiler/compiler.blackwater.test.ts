import path from "node:path";
import { describe, expect, it } from "vitest";
import { CCompiler, QueryCompileError, compileQuery } from "./compiler.js";

const schemas = path.resolve(
    import.meta.dirname,
    "../../../../apps/blackwatersound/back/src/schemas",
);
const fixtureProduct = path.resolve(
    import.meta.dirname,
    "../config/__fixtures__/schemas/product/productQueries.yml",
);

const BLACKWATER_RESOURCES = [
    { file: "product/productQueries.yml", type: "product" },
    { file: "waitlist/waitlistQueries.yml", type: "waitlist" },
    { file: "course/courseQueries.yml", type: "course" },
    { file: "booking/bookingQueries.yml", type: "booking" },
    { file: "order/orderQueries.yml", type: "order" },
    { file: "order/orderQueries.yml", type: "order_item" },
    { file: "coach/coachQueries.yml", type: "coach" },
    { file: "lesson/lessonQueries.yml", type: "lesson" },
    { file: "session/sessionQueries.yml", type: "session" },
    { file: "mix_review/mixReviewQueries.yml", type: "mix_review" },
    { file: "enrollment/enrollmentQueries.yml", type: "enrollment" },
    { file: "client/clientQueries.yml", type: "client" },
] as const;

function compileNamed(file: string, type: string, method: string, query: string): string {
    const compiler = new CCompiler();
    const parsed = compiler.parse_config(path.join(schemas, file));
    const cleaned = compiler.clean_parse(parsed, type, method);
    return compiler.buildQuery(cleaned, query);
}

describe("Blackwater query YAML", () => {
    it("compiles product.read.allProducts with a YAML boolean constant", () => {
        expect(compileNamed("product/productQueries.yml", "product", "read", "allProducts")).toBe(
            "SELECT * FROM products WHERE isActive = TRUE ORDER BY catalog, category, name",
        );
    });

    it("treats read as an alias of get", () => {
        const viaRead = compileNamed("product/productQueries.yml", "product", "read", "productById");
        const viaGet = compileNamed("product/productQueries.yml", "product", "get", "productById");
        expect(viaRead).toBe("SELECT * FROM products WHERE id = $1");
        expect(viaGet).toBe(viaRead);
    });

    it("compiles AND + placeholder without interpolating values", () => {
        expect(
            compileNamed("product/productQueries.yml", "product", "read", "productsByCatalog"),
        ).toBe(
            "SELECT * FROM products WHERE catalog = $1 AND isActive = TRUE ORDER BY category, name",
        );
        expect(compileNamed("course/courseQueries.yml", "course", "read", "byLine")).toBe(
            "SELECT * FROM courses WHERE line = $1 AND status = 'published' ORDER BY title",
        );
    });

    it("compiles quoted YAML constants and IN lists", () => {
        expect(compileNamed("course/courseQueries.yml", "course", "read", "allPublished")).toBe(
            "SELECT * FROM courses WHERE status = 'published' ORDER BY title",
        );
        expect(compileNamed("booking/bookingQueries.yml", "booking", "read", "upcomingByLine")).toBe(
            "SELECT * FROM bookings WHERE line = $1 AND status IN ('requested', 'confirmed') ORDER BY starts_at ASC",
        );
    });

    it("compiles INSERT with implicit $N values and RETURNING", () => {
        expect(compileNamed("waitlist/waitlistQueries.yml", "waitlist", "create", "joinWaitlist")).toBe(
            "INSERT INTO waitlist (id, name, email, source_app, interest) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, created_at",
        );
        expect(compileNamed("product/productQueries.yml", "product", "create", "newProduct")).toBe(
            "INSERT INTO products (id, catalog, name, slug, sub, price, originalPrice, img, accent, badge, category, tags, blurb, isNew, isActive) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)",
        );
    });

    it("compiles JSONB document-store product queries", () => {
        expect(compileNamed("product/productQueries.yml", "product", "read", "allPayloads")).toBe(
            "SELECT payload FROM products ORDER BY created_at ASC",
        );
        expect(compileNamed("product/productQueries.yml", "product", "read", "payloadById")).toBe(
            "SELECT payload FROM products WHERE id = $1",
        );
        expect(compileNamed("product/productQueries.yml", "product", "create", "seedPayload")).toBe(
            "INSERT INTO products (id, payload) VALUES ($1, $2::jsonb)",
        );
    });

    it("compiles the live waitlist insert and ASC listing", () => {
        expect(compileNamed("waitlist/waitlistQueries.yml", "waitlist", "create", "insertEntry")).toBe(
            "INSERT INTO waitlist (id, name, email, created_at) VALUES ($1, $2, $3, $4)",
        );
    });

    it("assigns UPDATE placeholders to SET fields then remaps WHERE $1", () => {
        expect(compileNamed("product/productQueries.yml", "product", "update", "updateProduct")).toBe(
            "UPDATE products SET name = $1, sub = $2, price = $3, originalPrice = $4, img = $5, accent = $6, badge = $7, category = $8, tags = $9, blurb = $10, isNew = $11, isActive = $12, updated_at = $13 WHERE id = $14",
        );
    });

    it("compiles DELETE from table + where fragment", () => {
        expect(compileNamed("product/productQueries.yml", "product", "delete", "deleteProduct")).toBe(
            "DELETE FROM products WHERE id = $1",
        );
    });

    it("compiles waitlist reads including DESC order", () => {
        expect(compileNamed("waitlist/waitlistQueries.yml", "waitlist", "read", "allEntries")).toBe(
            "SELECT * FROM waitlist ORDER BY created_at ASC",
        );
        expect(compileNamed("waitlist/waitlistQueries.yml", "waitlist", "read", "entryByEmail")).toBe(
            "SELECT * FROM waitlist WHERE email = $1",
        );
    });

    it("compiles the product fixture type: SELECT shape", () => {
        const compiler = new CCompiler();
        const parsed = compiler.parse_config(fixtureProduct);
        const cleaned = compiler.clean_parse(parsed, "product", "read");
        expect(compiler.buildQuery(cleaned, "allProducts")).toBe("SELECT * FROM products");
        expect(compileQuery(parsed.product.read.allProducts)).toBe("SELECT * FROM products");
    });

    it("compiles every named query in Blackwater *Queries.yml files", () => {
        const compiler = new CCompiler();
        const compiled: string[] = [];

        for (const resource of BLACKWATER_RESOURCES) {
            const parsed = compiler.parse_config(path.join(schemas, resource.file));
            const block = parsed[resource.type] as Record<string, Record<string, unknown>>;
            expect(block, resource.type).toBeTruthy();

            for (const method of Object.keys(block)) {
                const cleaned = compiler.clean_parse(parsed, resource.type, method);
                for (const name of Object.keys(cleaned.queries)) {
                    const sql = compiler.buildQuery(cleaned, name);
                    expect(sql).toMatch(/^(SELECT|INSERT|UPDATE|DELETE) /);
                    expect(sql).not.toMatch(/;|--;|\/\*/);
                    compiled.push(`${resource.type}.${method}.${name}`);
                }
            }
        }

        expect(compiled.length).toBeGreaterThan(40);
    });

    it("does not interpolate caller values into SQL", () => {
        const sql = compileNamed("waitlist/waitlistQueries.yml", "waitlist", "read", "entryByEmail");
        expect(sql).toBe("SELECT * FROM waitlist WHERE email = $1");
        expect(sql).not.toContain("user@example.com");
        expect(sql).not.toContain("'");
    });

    it("rejects a Blackwater where fragment that is arbitrary SQL", () => {
        expect(() =>
            compileQuery({
                type: "SELECT",
                table: "products",
                fields: "*",
                where: "id = $1; DROP TABLE products",
            }),
        ).toThrowError(QueryCompileError);
    });
});
