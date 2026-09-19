import type { CollectionKind, ContentItem, ContentPayload } from "./types";

export const EDITOR_STATUSES = ["draft", "publish", "pending", "private"] as const;

export function extractTextValue(value: unknown): string {
    if (typeof value === "string") {
        return value;
    }

    if (value && typeof value === "object") {
        const candidate = value as { raw?: unknown; rendered?: unknown };

        if (typeof candidate.raw === "string") {
            return candidate.raw;
        }

        if (typeof candidate.raw === "number") {
            return String(candidate.raw);
        }

        if (typeof candidate.rendered === "string") {
            return candidate.rendered;
        }
    }

    if (typeof value === "number") {
        return String(value);
    }

    return "";
}

export function displayStatus(status: string): string {
    return status === "published" ? "publish" : status;
}

export function slugFromTitle(title: string): string {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function itemDate(value: {
    date?: unknown;
    createdAt?: unknown;
    updatedAt?: unknown;
}): string {
    if (typeof value.updatedAt === "string" && value.updatedAt) {
        return value.updatedAt;
    }

    if (typeof value.date === "string" && value.date) {
        return value.date;
    }

    if (typeof value.createdAt === "string" && value.createdAt) {
        return value.createdAt;
    }

    return "";
}

export function formatItemDate(value: string): string {
    if (!value) {
        return "—";
    }

    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) {
        return value;
    }

    return new Date(parsed).toLocaleString();
}

export function statusTone(status: string): "ok" | "info" | "warn" | undefined {
    const normalized = displayStatus(status);
    if (normalized === "publish") {
        return "ok";
    }
    if (normalized === "pending") {
        return "warn";
    }
    if (normalized === "draft") {
        return "info";
    }
    return undefined;
}

export function normalizeItem(kind: CollectionKind, value: unknown): ContentItem {
    const item = (value ?? {}) as {
        id?: unknown;
        slug?: unknown;
        status?: unknown;
        date?: unknown;
        createdAt?: unknown;
        updatedAt?: unknown;
        title?: unknown;
        content?: unknown;
    };

    const status = typeof item.status === "string" ? displayStatus(item.status) : "draft";

    return {
        id: item.id == null ? "" : String(item.id),
        kind,
        title: extractTextValue(item.title) || `Untitled ${kind}`,
        slug: typeof item.slug === "string" ? item.slug : extractTextValue(item.slug),
        status,
        date: itemDate(item),
        content: extractTextValue(item.content)
    };
}

export function readCollectionList(kind: CollectionKind, payload: unknown): ContentItem[] {
    if (!Array.isArray(payload)) {
        return [];
    }

    return payload.map((item) => normalizeItem(kind, item));
}

export function draftPayload(fields: {
    title: string;
    slug: string;
    status: string;
    content: string;
}): ContentPayload {
    const title = fields.title.trim() || "Untitled";
    const slug = fields.slug.trim() || slugFromTitle(title);
    return {
        title,
        slug: slug || undefined,
        status: fields.status || "draft",
        content: fields.content
    };
}
