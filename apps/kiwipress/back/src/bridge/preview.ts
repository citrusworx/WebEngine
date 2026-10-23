import { sanitizeRestBase } from "@citrusworx/kiwipress";

/**
 * Map a dashboard collection or a WordPress post type onto one REST base.
 * `post` / `posts` and `page` / `pages` are the core collections. Anything
 * else is a single rest_base segment (`kiwi-fruit`), never a path.
 */
export function restBaseForPostType(postType: string | undefined): string {
    const value = (postType ?? "post").trim();
    if (value === "post" || value === "posts") {
        return "posts";
    }
    if (value === "page" || value === "pages") {
        return "pages";
    }
    return sanitizeRestBase(value);
}

export type AutosaveFields = {
    title: string;
    content: string;
    excerpt: string;
};

function ownString(record: Record<string, unknown>, key: string): string | undefined {
    if (!Object.prototype.hasOwnProperty.call(record, key)) {
        return undefined;
    }
    const value = record[key];
    return typeof value === "string" ? value : undefined;
}

/**
 * Fields for `POST /wp/v2/{base}/{id}/autosaves`.
 *
 * `status` is never copied, even when the caller sent one. WordPress would
 * otherwise be asked to change the parent post. Missing title, content, or
 * excerpt fall back to the current post so an autosave cannot blank them.
 */
export function autosaveFields(
    input: Record<string, unknown>,
    fallback: AutosaveFields
): AutosaveFields {
    return {
        title: ownString(input, "title") ?? fallback.title,
        content: ownString(input, "content") ?? fallback.content,
        excerpt: ownString(input, "excerpt") ?? fallback.excerpt
    };
}

export function rawText(value: unknown): string {
    if (typeof value === "string") {
        return value;
    }
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return "";
    }
    const record = value as { raw?: unknown; rendered?: unknown };
    if (typeof record.raw === "string") {
        return record.raw;
    }
    if (typeof record.rendered === "string") {
        return record.rendered;
    }
    return "";
}
