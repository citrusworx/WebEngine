import { sanitizeHtml, sanitizeHref, stripDangerousHtml } from "./paste";
import { bindShortcuts } from "./shortcuts";
import type { Align, BlockKind, EditorQuery, HeadingLevel, ListKind, Mode } from "./types";
import { blockTagFor } from "./types";

const BLOCK_SELECTOR = "p, h1, h2, h3, h4, h5, h6, blockquote, pre, li, div";
const MARK_ALIASES: Record<"bold" | "italic" | "underline", string[]> = {
    bold: ["strong", "b"],
    italic: ["em", "i"],
    underline: ["u"]
};

export class WYSIWYG {
    private inEdit = false;
    private mode: Mode = "editor";
    private canvas: HTMLElement | null = null;
    private lastRange: Range | null = null;
    private unbindShortcuts: (() => void) | null = null;
    private pasteHandler: ((event: ClipboardEvent) => void) | null = null;
    private inputHandler: (() => void) | null = null;
    private selectionHandler: (() => void) | null = null;

    init() {
        this.inEdit = true;
    }

    attach(node: HTMLElement) {
        this.detach();
        this.canvas = node;
        node.setAttribute("contenteditable", "true");
        node.setAttribute("spellcheck", "true");
        this.ensureCanvas();

        this.pasteHandler = (event) => this.handlePaste(event);
        this.inputHandler = () => {
            this.ensureCanvas();
            this.rememberSelection();
            this.syncEmpty();
        };
        this.selectionHandler = () => this.rememberSelection();

        node.addEventListener("paste", this.pasteHandler);
        node.addEventListener("input", this.inputHandler);
        node.addEventListener("keyup", this.selectionHandler);
        node.addEventListener("mouseup", this.selectionHandler);
        document.addEventListener("selectionchange", this.selectionHandler);
        this.unbindShortcuts = bindShortcuts(this, node);
        this.init();
    }

    detach() {
        if (!this.canvas) {
            this.unbindShortcuts?.();
            this.unbindShortcuts = null;
            return;
        }

        if (this.pasteHandler) {
            this.canvas.removeEventListener("paste", this.pasteHandler);
        }

        if (this.inputHandler) {
            this.canvas.removeEventListener("input", this.inputHandler);
        }

        if (this.selectionHandler) {
            this.canvas.removeEventListener("keyup", this.selectionHandler);
            this.canvas.removeEventListener("mouseup", this.selectionHandler);
            document.removeEventListener("selectionchange", this.selectionHandler);
        }

        this.unbindShortcuts?.();
        this.unbindShortcuts = null;
        this.pasteHandler = null;
        this.inputHandler = null;
        this.selectionHandler = null;
        this.lastRange = null;
        this.canvas = null;
        this.inEdit = false;
    }

    focus() {
        this.canvas?.focus();
        this.restoreSelection();
    }

    getHtml(): string {
        return this.getEditableHtml(this.canvas, "<p></p>");
    }

    setHtml(html: string) {
        if (!this.canvas) {
            return;
        }

        const cleaned = stripDangerousHtml(html);
        this.canvas.innerHTML = cleaned || "<p><br></p>";
        this.syncEmpty();
        this.lastRange = null;
    }

    getMode() {
        return this.mode;
    }

    isEditing() {
        return this.inEdit;
    }

    toggleBold(): boolean {
        return this.toggleMark("strong", MARK_ALIASES.bold);
    }

    toggleItalic(): boolean {
        return this.toggleMark("em", MARK_ALIASES.italic);
    }

    toggleUnderline(): boolean {
        return this.toggleMark("u", MARK_ALIASES.underline);
    }

    setBlock(kind: BlockKind, options?: { level?: HeadingLevel }): boolean {
        const editor = this.prepare();
        if (!editor) {
            return false;
        }

        const nextTag = blockTagFor(kind, options?.level);
        const range = this.getEditorRange(editor);
        const block = this.getClosestBlock(range?.commonAncestorContainer ?? editor.firstChild, editor);

        if (!block || block === editor) {
            this.ensureCanvas();
            const created = this.getClosestBlock(editor.firstChild, editor);
            if (!created || created === editor) {
                return false;
            }

            const replaced = this.replaceBlockTag(created, nextTag);
            this.selectNodeContents(replaced);
            this.rememberSelection();
            return true;
        }

        if (block.tagName === "LI") {
            const replaced = this.convertListItemToBlock(block, nextTag);
            this.selectNodeContents(replaced);
            this.rememberSelection();
            return true;
        }

        const replaced = this.replaceBlockTag(block, nextTag);
        this.selectNodeContents(replaced);
        this.rememberSelection();
        return true;
    }

    toggleList(kind: ListKind): boolean {
        const editor = this.prepare();
        if (!editor) {
            return false;
        }

        const range = this.getEditorRange(editor);
        const block = this.getClosestBlock(range?.startContainer ?? editor.firstChild, editor);
        const existing = block?.closest("ul, ol");

        if (existing && editor.contains(existing)) {
            if (existing.tagName.toLowerCase() === kind) {
                this.unwrapList(existing);
            } else {
                const next = document.createElement(kind);
                next.innerHTML = existing.innerHTML;
                existing.replaceWith(next);
                const item = next.querySelector("li") ?? next;
                this.selectNodeContents(item);
            }

            this.rememberSelection();
            return true;
        }

        if (!block || block === editor) {
            const list = document.createElement(kind);
            const item = document.createElement("li");
            item.appendChild(document.createElement("br"));
            list.appendChild(item);
            editor.appendChild(list);
            this.selectNodeContents(item);
            this.rememberSelection();
            return true;
        }

        const list = document.createElement(kind);
        const item = document.createElement("li");
        item.innerHTML = block.innerHTML || "";
        if (!item.innerHTML.trim()) {
            item.appendChild(document.createElement("br"));
        }
        list.appendChild(item);
        block.replaceWith(list);
        this.selectNodeContents(item);
        this.rememberSelection();
        return true;
    }

    insertLink(url?: string): boolean {
        const editor = this.prepare();
        if (!editor) {
            return false;
        }

        const range = this.getEditorRange(editor);
        const existing = this.findClosest(range?.commonAncestorContainer ?? null, ["a"]);
        const currentHref = existing instanceof HTMLAnchorElement ? existing.getAttribute("href") ?? "" : "https://";
        const nextUrl = url ?? window.prompt("Link URL", currentHref);

        if (nextUrl == null) {
            return false;
        }

        if (!nextUrl.trim()) {
            if (existing) {
                this.unwrapElement(existing);
                this.rememberSelection();
            }
            return Boolean(existing);
        }

        const href = sanitizeHref(nextUrl);
        if (!href) {
            return false;
        }

        if (existing instanceof HTMLAnchorElement) {
            existing.setAttribute("href", href);
            this.rememberSelection();
            return true;
        }

        if (!range) {
            return false;
        }

        const anchor = document.createElement("a");
        anchor.setAttribute("href", href);

        if (range.collapsed) {
            anchor.textContent = href;
            range.insertNode(anchor);
            this.selectNodeContents(anchor);
            this.rememberSelection();
            return true;
        }

        return this.wrapSelectionWithElement(editor, anchor);
    }

    setAlign(align: Align): boolean {
        const editor = this.prepare();
        if (!editor) {
            return false;
        }

        const range = this.getEditorRange(editor);
        const block = this.getClosestBlock(range?.commonAncestorContainer ?? editor.firstChild, editor);
        if (!block || block === editor) {
            return false;
        }

        const list = block.closest("ul, ol");
        const target = block.tagName === "LI" && list instanceof HTMLElement ? list : block;
        if (align === "left") {
            target.style.removeProperty("text-align");
        } else {
            target.style.textAlign = align;
        }

        this.rememberSelection();
        return true;
    }

    query(): EditorQuery {
        const editor = this.canvas;
        const range = this.getEditorRange(editor);
        const block = this.getClosestBlock(range?.commonAncestorContainer ?? editor?.firstChild ?? null, editor);
        const list = block?.closest("ul, ol") ?? null;
        const align = this.readAlign(block, list);

        return {
            block: this.readBlockTag(block, editor),
            bold: this.isInside(range?.commonAncestorContainer ?? null, MARK_ALIASES.bold),
            italic: this.isInside(range?.commonAncestorContainer ?? null, MARK_ALIASES.italic),
            underline: this.isInside(range?.commonAncestorContainer ?? null, MARK_ALIASES.underline),
            align,
            list: list && editor?.contains(list) ? list.tagName.toLowerCase() as ListKind : null,
            link: this.isInside(range?.commonAncestorContainer ?? null, ["a"])
        };
    }

    renderJson(value: unknown): string {
        return JSON.stringify(value, null, 2);
    }

    getEditableHtml(node: HTMLElement | null, fallback: string): string {
        if (!node) {
            return fallback;
        }

        const html = node.innerHTML.trim();
        return html && html !== "<p><br></p>" && html !== "<p></p>" ? html : fallback;
    }

    normalizeBlockTag(value: string): string {
        return value.replace(/[<>]/g, "").trim().toLowerCase();
    }

    isNodeWithinEditor(editorNode: HTMLElement, node: Node | null): boolean {
        if (!node) {
            return false;
        }

        return editorNode === node || editorNode.contains(node);
    }

    getEditorSelection(editorNode: HTMLElement | null): Selection | null {
        if (!editorNode) {
            return null;
        }

        const selection = window.getSelection();

        if (!selection || selection.rangeCount === 0) {
            return null;
        }

        const range = selection.getRangeAt(0);

        if (!this.isNodeWithinEditor(editorNode, range.commonAncestorContainer)) {
            return null;
        }

        return selection;
    }

    getEditorRange(editorNode: HTMLElement | null): Range | null {
        const selection = this.getEditorSelection(editorNode);

        if (selection && selection.rangeCount > 0) {
            return selection.getRangeAt(0);
        }

        if (this.lastRange && editorNode && this.isNodeWithinEditor(editorNode, this.lastRange.commonAncestorContainer)) {
            return this.lastRange;
        }

        return null;
    }

    getClosestBlock(node: Node | null, editorNode: HTMLElement | null): HTMLElement | null {
        if (!node || !editorNode) {
            return null;
        }

        const element = node instanceof HTMLElement ? node : node.parentElement;

        if (!element) {
            return null;
        }

        const block = element.closest(BLOCK_SELECTOR);

        if (!block || !editorNode.contains(block)) {
            return null;
        }

        return block as HTMLElement;
    }

    selectNodeContents(node: Node) {
        const selection = window.getSelection();

        if (!selection) {
            return;
        }

        const range = document.createRange();
        range.selectNodeContents(node);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        this.lastRange = range.cloneRange();
    }

    wrapSelectionWithElement(editorNode: HTMLElement | null, element: HTMLElement): boolean {
        const range = this.getEditorRange(editorNode);

        if (!range || range.collapsed) {
            return false;
        }

        const fragment = range.extractContents();
        element.appendChild(fragment);
        range.insertNode(element);
        this.selectNodeContents(element);
        return true;
    }

    replaceBlockTag(block: HTMLElement, nextTag: string): HTMLElement {
        const replacement = document.createElement(this.normalizeBlockTag(nextTag) || "p");
        replacement.innerHTML = block.innerHTML;

        for (const attribute of block.getAttributeNames()) {
            replacement.setAttribute(attribute, block.getAttribute(attribute) ?? "");
        }

        block.replaceWith(replacement);
        return replacement;
    }

    insertTextAtSelection(editorNode: HTMLElement | null, text: string) {
        const range = this.getEditorRange(editorNode);

        if (!range) {
            return;
        }

        const fragment = document.createDocumentFragment();
        const lines = text.split(/\r?\n/);

        lines.forEach((line, index) => {
            fragment.appendChild(document.createTextNode(line));

            if (index < lines.length - 1) {
                fragment.appendChild(document.createElement("br"));
            }
        });

        range.deleteContents();
        range.insertNode(fragment);
        range.collapse(false);

        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
        }

        this.lastRange = range.cloneRange();
    }

    private prepare(): HTMLElement | null {
        if (!this.canvas) {
            return null;
        }

        if (document.activeElement !== this.canvas) {
            this.canvas.focus();
        }

        this.restoreSelection();
        this.ensureCanvas();
        return this.canvas;
    }

    private ensureCanvas() {
        if (!this.canvas) {
            return;
        }

        if (!this.canvas.innerHTML.trim()) {
            this.canvas.innerHTML = "<p><br></p>";
        }

        this.syncEmpty();
    }

    private syncEmpty() {
        if (!this.canvas) {
            return;
        }

        const text = (this.canvas.textContent ?? "").replace(/\u200B/g, "").trim();
        this.canvas.toggleAttribute("empty", text.length === 0);
    }

    private rememberSelection() {
        if (!this.canvas) {
            return;
        }

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return;
        }

        const range = selection.getRangeAt(0);
        if (!this.isNodeWithinEditor(this.canvas, range.commonAncestorContainer)) {
            return;
        }

        this.lastRange = range.cloneRange();
    }

    private restoreSelection() {
        if (!this.canvas || !this.lastRange) {
            return;
        }

        if (!this.isNodeWithinEditor(this.canvas, this.lastRange.commonAncestorContainer)) {
            return;
        }

        const selection = window.getSelection();
        if (!selection) {
            return;
        }

        selection.removeAllRanges();
        selection.addRange(this.lastRange);
    }

    private handlePaste(event: ClipboardEvent) {
        event.preventDefault();
        const editor = this.prepare();
        if (!editor) {
            return;
        }

        const html = event.clipboardData?.getData("text/html") ?? "";
        const text = event.clipboardData?.getData("text/plain") ?? "";

        if (html.trim()) {
            this.insertHtmlAtSelection(sanitizeHtml(html));
            return;
        }

        this.insertTextAtSelection(editor, text);
        this.syncEmpty();
    }

    private insertHtmlAtSelection(html: string) {
        const editor = this.canvas;
        const range = this.getEditorRange(editor);
        if (!editor || !range || !html) {
            if (html && editor && !range) {
                editor.insertAdjacentHTML("beforeend", html);
            }
            this.syncEmpty();
            return;
        }

        range.deleteContents();
        const template = document.createElement("template");
        template.innerHTML = html;
        const fragment = document.createDocumentFragment();
        while (template.content.firstChild) {
            fragment.appendChild(template.content.firstChild);
        }
        const last = fragment.lastChild;
        range.insertNode(fragment);

        if (last) {
            const next = document.createRange();
            next.setStartAfter(last);
            next.collapse(true);
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(next);
            this.lastRange = next.cloneRange();
        }

        this.syncEmpty();
    }

    private toggleMark(tag: string, aliases: string[]): boolean {
        const editor = this.prepare();
        if (!editor) {
            return false;
        }

        const range = this.getEditorRange(editor);
        const existing = this.findClosest(range?.commonAncestorContainer ?? null, aliases);

        if (existing) {
            this.unwrapElement(existing);
            this.rememberSelection();
            return true;
        }

        if (!range) {
            return false;
        }

        if (range.collapsed) {
            const expanded = this.expandRangeToWord(range);
            if (expanded && !expanded.collapsed) {
                const mark = document.createElement(tag);
                const fragment = expanded.extractContents();
                mark.appendChild(fragment);
                expanded.insertNode(mark);
                this.selectNodeContents(mark);
                this.rememberSelection();
                return true;
            }

            const mark = document.createElement(tag);
            mark.appendChild(document.createTextNode("\u200B"));
            range.insertNode(mark);
            this.selectNodeContents(mark);
            this.rememberSelection();
            return true;
        }

        const mark = document.createElement(tag);
        return this.wrapSelectionWithElement(editor, mark);
    }

    private expandRangeToWord(range: Range): Range | null {
        const node = range.startContainer;
        if (node.nodeType !== Node.TEXT_NODE || !node.textContent) {
            return null;
        }

        const text = node.textContent;
        const offset = range.startOffset;
        let start = offset;
        let end = offset;

        while (start > 0 && /[\S]/.test(text[start - 1] ?? "")) {
            start -= 1;
        }

        while (end < text.length && /[\S]/.test(text[end] ?? "")) {
            end += 1;
        }

        if (start === end) {
            return null;
        }

        const next = document.createRange();
        next.setStart(node, start);
        next.setEnd(node, end);
        return next;
    }

    private findClosest(node: Node | null, aliases: string[]): HTMLElement | null {
        if (!this.canvas || !node) {
            return null;
        }

        let current: Node | null = node;
        if (current.nodeType !== Node.ELEMENT_NODE) {
            current = current.parentElement;
        }

        while (current && current !== this.canvas) {
            if (current instanceof HTMLElement && aliases.includes(current.tagName.toLowerCase())) {
                return current;
            }

            current = current.parentElement;
        }

        return null;
    }

    private isInside(node: Node | null, aliases: string[]): boolean {
        return Boolean(this.findClosest(node, aliases));
    }

    private unwrapElement(element: HTMLElement) {
        const parent = element.parentNode;
        if (!parent) {
            return;
        }

        while (element.firstChild) {
            parent.insertBefore(element.firstChild, element);
        }

        parent.removeChild(element);
        parent.normalize();
    }

    private unwrapList(list: Element) {
        const fragment = document.createDocumentFragment();
        const items = Array.from(list.children);

        for (const item of items) {
            const paragraph = document.createElement("p");
            paragraph.innerHTML = item.innerHTML || "<br>";
            fragment.appendChild(paragraph);
        }

        const first = fragment.firstChild;
        list.replaceWith(fragment);
        if (first) {
            this.selectNodeContents(first);
        }
    }

    private convertListItemToBlock(item: HTMLElement, nextTag: string): HTMLElement {
        const list = item.parentElement;
        const replacement = document.createElement(this.normalizeBlockTag(nextTag) || "p");
        replacement.innerHTML = item.innerHTML;

        if (!list) {
            item.replaceWith(replacement);
            return replacement;
        }

        const trailing: Element[] = [];
        let sibling = item.nextElementSibling;
        while (sibling) {
            trailing.push(sibling);
            sibling = sibling.nextElementSibling;
        }

        list.after(replacement);
        item.remove();

        if (trailing.length > 0) {
            const nextList = document.createElement(list.tagName.toLowerCase());
            for (const node of trailing) {
                nextList.appendChild(node);
            }
            replacement.after(nextList);
        }

        if (list.children.length === 0) {
            list.remove();
        }

        return replacement;
    }

    private readBlockTag(block: HTMLElement | null, editor: HTMLElement | null): string {
        if (!block || block === editor) {
            return "p";
        }

        if (block.tagName === "LI") {
            return "p";
        }

        return block.tagName.toLowerCase();
    }

    private readAlign(block: HTMLElement | null, list: Element | null): Align {
        const target = block?.tagName === "LI" ? (list instanceof HTMLElement ? list : block) : block;
        const value = target?.style.textAlign;

        if (value === "center" || value === "right") {
            return value;
        }

        return "left";
    }
}
