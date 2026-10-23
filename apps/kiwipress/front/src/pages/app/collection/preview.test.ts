import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { draftPreviewButton } from "./preview.ts";

describe("draft preview button", () => {
    it("is enabled for a post or page that is being edited when preview is ready", () => {
        assert.deepEqual(draftPreviewButton({
            kind: "posts",
            editing: true,
            previewReady: true,
            previewReason: null
        }), { show: true, enabled: true, reason: "" });

        assert.equal(draftPreviewButton({
            kind: "pages",
            editing: true,
            previewReady: true,
            previewReason: null
        }).enabled, true);
    });

    it("stays disabled with the gateway reason, and hides for other collections", () => {
        const reason = "Draft preview is available when the content gateway is in WordPress mode.";
        assert.deepEqual(draftPreviewButton({
            kind: "posts",
            editing: true,
            previewReady: false,
            previewReason: reason
        }), { show: true, enabled: false, reason });

        assert.deepEqual(draftPreviewButton({
            kind: "books",
            editing: true,
            previewReady: true,
            previewReason: null
        }), { show: false, enabled: false, reason: "" });

        assert.equal(draftPreviewButton({
            kind: "posts",
            editing: false,
            previewReady: true,
            previewReason: null
        }).show, false);
    });
});
