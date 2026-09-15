import { describe, expect, it } from "vitest";
import { formatTable } from "./format.js";

describe("formatTable", () => {
    it("pads columns to the header/value width", () => {
        const table = formatTable(
            [
                { name: "web", id: "1" },
                { name: "longer-name", id: "99" }
            ],
            [
                { key: "name", header: "NAME" },
                { key: "id", header: "ID" }
            ]
        );
        expect(table).toContain("NAME         ID");
        expect(table).toContain("longer-name  99");
    });
});
