import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadNectarineConfig } from "@citrusworx/nectarine/config";
import { describe, expect, it } from "vitest";
import { compileResourceQuery, namedSql } from "./db/named-queries.js";

const configPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../nectarine.config.yaml",
);

describe("compileResourceQuery", () => {
  it("compiles from a Queries.yml path without a new namedSql key", () => {
    const nectarine = loadNectarineConfig(configPath);
    const course = nectarine.getResource("course");

    expect(compileResourceQuery(course.paths.queries, "course", "read", "byId")).toBe(
      "SELECT * FROM courses WHERE id = $1",
    );
    expect(compileResourceQuery(course.queries, "course", "read", "byLine")).toBe(
      "SELECT * FROM courses WHERE line = $1 AND status = 'published' ORDER BY title",
    );
    expect("byId" in namedSql).toBe(false);
    expect("allPublished" in namedSql).toBe(false);
  });

  it("compiles sibling order_item from the order Queries.yml document", () => {
    const nectarine = loadNectarineConfig(configPath);
    const order = nectarine.getResource("order");

    expect(compileResourceQuery(order.queries, "order_item", "read", "byOrder")).toBe(
      "SELECT * FROM order_items WHERE order_id = $1",
    );
    expect(compileResourceQuery(order.queries, "order", "read", "byCatalog")).toBe(
      "SELECT * FROM orders WHERE catalog = $1 ORDER BY created_at DESC",
    );
  });

  it("still exposes the special-cased product JSONB and waitlist keys", () => {
    expect(namedSql.allPayloads).toBe("SELECT payload FROM products ORDER BY created_at ASC");
    expect(namedSql.payloadById).toBe("SELECT payload FROM products WHERE id = $1");
    expect(namedSql.insertPayload).toBe(
      "INSERT INTO products (id, payload) VALUES ($1, $2::jsonb) RETURNING payload",
    );
    expect(namedSql.updatePayload).toBe(
      "UPDATE products SET payload = $1::jsonb, updated_at = NOW() WHERE id = $2",
    );
    expect(namedSql.deleteProduct).toBe("DELETE FROM products WHERE id = $1");
    expect(namedSql.allEntries).toBe("SELECT * FROM waitlist ORDER BY created_at ASC");
    expect(namedSql.entryByEmail).toBe("SELECT * FROM waitlist WHERE email = $1");
    expect(namedSql.joinWaitlist).toBe(
      "INSERT INTO waitlist (id, name, email, source_app, interest) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, created_at",
    );
  });
});
