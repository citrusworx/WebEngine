import { gatewayFetch } from "../../../api";
import { normalizeItem, readCollectionList } from "./normalize";
import type { CollectionKind, ContentItem, ContentPayload } from "./types";

type GatewayErrorBody = {
    error?: string;
};

async function readJson(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) {
        return {};
    }

    try {
        return JSON.parse(text) as unknown;
    } catch {
        throw new Error(text || `Unexpected response (${response.status}).`);
    }
}

function errorMessage(payload: unknown, fallback: string): string {
    if (payload && typeof payload === "object" && "error" in payload) {
        const message = (payload as GatewayErrorBody).error;
        if (typeof message === "string" && message.trim()) {
            return message;
        }
    }

    return fallback;
}

function collectionPath(kind: CollectionKind, id?: string): string {
    const base = `/__kiwipress/content/${encodeURIComponent(kind)}`;
    return id ? `${base}?id=${encodeURIComponent(id)}` : base;
}

export async function listCollection(kind: CollectionKind): Promise<ContentItem[]> {
    const response = await gatewayFetch(collectionPath(kind));
    const payload = await readJson(response);

    if (!response.ok) {
        throw new Error(errorMessage(payload, `Unable to load ${kind}.`));
    }

    return readCollectionList(kind, payload);
}

export async function createCollectionItem(
    kind: CollectionKind,
    body: ContentPayload
): Promise<ContentItem> {
    const response = await gatewayFetch(collectionPath(kind), {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
    const payload = await readJson(response);

    if (!response.ok) {
        throw new Error(errorMessage(payload, `Unable to create ${kind}.`));
    }

    return normalizeItem(kind, payload);
}

export async function updateCollectionItem(
    kind: CollectionKind,
    id: string,
    body: ContentPayload
): Promise<ContentItem> {
    const response = await gatewayFetch(collectionPath(kind, id), {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
    const payload = await readJson(response);

    if (!response.ok) {
        throw new Error(errorMessage(payload, `Unable to save ${kind}.`));
    }

    return normalizeItem(kind, payload);
}

export async function deleteCollectionItem(kind: CollectionKind, id: string): Promise<void> {
    const response = await gatewayFetch(collectionPath(kind, id), {
        method: "DELETE"
    });
    const payload = await readJson(response);

    if (!response.ok) {
        throw new Error(errorMessage(payload, `Unable to delete ${kind}.`));
    }
}
