export type DraftPreviewButton = {
    show: boolean;
    enabled: boolean;
    reason: string;
};

/**
 * Posts and pages in edit mode can open a draft preview.
 * The button stays visible but disabled, with a reason, when the paired
 * bridge is not ready or the content gateway is not that WordPress site.
 */
export function draftPreviewButton(input: {
    kind: string;
    editing: boolean;
    previewReady: boolean;
    previewReason: string | null;
}): DraftPreviewButton {
    const postsOrPages = input.kind === "posts" || input.kind === "pages";
    if (!postsOrPages || !input.editing) {
        return { show: false, enabled: false, reason: "" };
    }

    if (!input.previewReady) {
        return {
            show: true,
            enabled: false,
            reason: input.previewReason?.trim() || "Draft preview is unavailable."
        };
    }

    return { show: true, enabled: true, reason: "" };
}

/**
 * Open the tab synchronously, then navigate once the preview URL is known.
 * Browsers block `window.open` that runs after an await.
 */
export function beginDraftPreview(loadUrl: () => Promise<string>): Promise<void> {
    const popup = window.open("about:blank", "_blank");
    return loadUrl().then((url) => {
        if (popup && !popup.closed) {
            popup.location.href = url;
            return;
        }
        window.location.assign(url);
    }).catch((error: unknown) => {
        if (popup && !popup.closed) {
            popup.close();
        }
        throw error;
    });
}

export function postTypeForKind(kind: string): string {
    if (kind === "pages") {
        return "page";
    }
    if (kind === "posts") {
        return "post";
    }
    return kind;
}
