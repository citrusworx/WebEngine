import { Signal } from "@citrusworx/sigjs";

type Mode = "editor" | "preview"

export function EditorShell(){
    return (
        <div id="editor">
            {/* Insert the Editor Shell */}
        </div>
    )
}

// Editor Logic
export class WYSIWYG {
    private inEdit = Signal(false);

    private mode: Mode = "editor";

    init(){
        this.inEdit.set(true)
    }

    renderJson(value: unknown): string {
        return JSON.stringify(value, null, 2);
    }

    getMode(){
        return this.mode;
    }

    getEditableHtml(node: HTMLElement | null, fallback: string): string {
        if (!node) {
            return fallback;
        }

        const html = node.innerHTML.trim();
        return html || "<p></p>";
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

        if (!selection || selection.rangeCount === 0) {
            return null;
        }

        return selection.getRangeAt(0);
    }

    getClosestBlock(node: Node | null, editorNode: HTMLElement | null): HTMLElement | null {
        if (!node || !editorNode) {
            return null;
        }

        const element = node instanceof HTMLElement ? node : node.parentElement;

        if (!element) {
            return null;
        }

        const block = element.closest("p, h1, h2, h3, h4, h5, h6, blockquote, pre, li, div");

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
        const replacement = document.createElement(nextTag);
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
    }}
