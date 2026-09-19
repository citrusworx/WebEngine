export type Mode = "editor" | "preview";

export type BlockKind = "paragraph" | "heading" | "blockquote" | "pre";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type ListKind = "ul" | "ol";

export type Align = "left" | "center" | "right";

export type EditorQuery = {
    block: string;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    align: Align;
    list: ListKind | null;
    link: boolean;
};

export function blockTagFor(kind: BlockKind, level = 2): string {
    if (kind === "heading") {
        const next = Math.min(6, Math.max(1, Math.round(level)));
        return `h${next}`;
    }

    if (kind === "blockquote") {
        return "blockquote";
    }

    if (kind === "pre") {
        return "pre";
    }

    return "p";
}

export function isHeadingTag(tag: string): boolean {
    return /^h[1-6]$/.test(tag);
}
