import { describe, expect, it } from "vitest";
import { EDIT_CONTEXT, editContextQuery, withEditContext } from "./query.js";

describe("edit-context query helpers", () => {
    it("returns context=edit with no extra params", () => {
        expect(editContextQuery()).toEqual({ context: "edit" });
        expect(withEditContext()).toEqual({ context: EDIT_CONTEXT });
    });

    it("merges context=edit onto an existing query without dropping keys", () => {
        expect(withEditContext({ status: "any", per_page: "10" })).toEqual({
            status: "any",
            per_page: "10",
            context: "edit"
        });
    });

    it("lets an explicit context be overwritten to edit", () => {
        expect(editContextQuery({ context: "view", status: "publish" })).toEqual({
            context: "edit",
            status: "publish"
        });
    });
});
