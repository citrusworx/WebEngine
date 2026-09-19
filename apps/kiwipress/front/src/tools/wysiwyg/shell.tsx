import { WYSIWYG } from "./engine";
import type { BlockKind, EditorQuery, HeadingLevel } from "./types";

type ShellProps = {
    initialHtml?: string;
    placeholder?: string;
    onBind?: (engine: WYSIWYG) => void;
};

const BLOCK_OPTIONS: { value: string; label: string }[] = [
    { value: "p", label: "Paragraph" },
    { value: "h1", label: "Heading 1" },
    { value: "h2", label: "Heading 2" },
    { value: "h3", label: "Heading 3" },
    { value: "blockquote", label: "Quote" },
    { value: "pre", label: "Code" }
];

function blockValue(tag: string): string {
    if (BLOCK_OPTIONS.some((option) => option.value === tag)) {
        return tag;
    }

    return "p";
}

function keepSelection(event: Event) {
    event.preventDefault();
}

export function EditorShell({
    initialHtml = "",
    placeholder = "Start writing…",
    onBind
}: ShellProps) {
    const engine = new WYSIWYG();
    let canvas: HTMLElement | null = null;
    let blockSelect: HTMLSelectElement | null = null;
    let boldButton: HTMLButtonElement | null = null;
    let italicButton: HTMLButtonElement | null = null;
    let underlineButton: HTMLButtonElement | null = null;
    let alignLeftButton: HTMLButtonElement | null = null;
    let alignCenterButton: HTMLButtonElement | null = null;
    let alignRightButton: HTMLButtonElement | null = null;
    let linkButton: HTMLButtonElement | null = null;
    let ulButton: HTMLButtonElement | null = null;
    let olButton: HTMLButtonElement | null = null;

    function applyBlock(value: string) {
        if (value === "blockquote" || value === "pre") {
            engine.setBlock(value as BlockKind);
            return;
        }

        if (value.startsWith("h")) {
            engine.setBlock("heading", { level: Number(value.slice(1)) as HeadingLevel });
            return;
        }

        engine.setBlock("paragraph");
    }

    function syncToolbar() {
        const state: EditorQuery = engine.query();

        if (blockSelect) {
            blockSelect.value = blockValue(state.block);
        }

        setPressed(boldButton, state.bold);
        setPressed(italicButton, state.italic);
        setPressed(underlineButton, state.underline);
        setPressed(alignLeftButton, state.align === "left");
        setPressed(alignCenterButton, state.align === "center");
        setPressed(alignRightButton, state.align === "right");
        setPressed(linkButton, state.link);
        setPressed(ulButton, state.list === "ul");
        setPressed(olButton, state.list === "ol");
    }

    function run(command: () => void) {
        command();
        canvas?.focus();
        syncToolbar();
    }

    function onSelectionChange() {
        syncToolbar();
    }

    return (
        <div wysiwyg-shell>
            <div
                wysiwyg-toolbar
                role="toolbar"
                aria-label="Text formatting"
            >
                <div toolbar-group>
                    <select
                        id="wysiwyg-block-style"
                        title="Block style"
                        aria-label="Block style"
                        ref={(node: HTMLSelectElement) => {
                            blockSelect = node;
                        }}
                        onchange={(event: Event) => {
                            applyBlock((event.target as HTMLSelectElement).value);
                            syncToolbar();
                        }}
                    >
                        {BLOCK_OPTIONS.map((option) => (
                            <option value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>

                <span toolbar-divider></span>

                <div toolbar-group>
                    <ToolbarButton
                        label="Bold"
                        icon="bold"
                        shortcut="Ctrl+B"
                        bind={(node) => {
                            boldButton = node;
                        }}
                        onClick={() => run(() => engine.toggleBold())}
                    />
                    <ToolbarButton
                        label="Italic"
                        icon="italic"
                        shortcut="Ctrl+I"
                        bind={(node) => {
                            italicButton = node;
                        }}
                        onClick={() => run(() => engine.toggleItalic())}
                    />
                    <ToolbarButton
                        label="Underline"
                        icon="underline"
                        shortcut="Ctrl+U"
                        bind={(node) => {
                            underlineButton = node;
                        }}
                        onClick={() => run(() => engine.toggleUnderline())}
                    />
                </div>

                <span toolbar-divider></span>

                <div toolbar-group>
                    <ToolbarButton
                        label="Align left"
                        icon="align-left"
                        bind={(node) => {
                            alignLeftButton = node;
                        }}
                        onClick={() => run(() => engine.setAlign("left"))}
                    />
                    <ToolbarButton
                        label="Align center"
                        icon="align-center"
                        bind={(node) => {
                            alignCenterButton = node;
                        }}
                        onClick={() => run(() => engine.setAlign("center"))}
                    />
                    <ToolbarButton
                        label="Align right"
                        icon="align-right"
                        bind={(node) => {
                            alignRightButton = node;
                        }}
                        onClick={() => run(() => engine.setAlign("right"))}
                    />
                </div>

                <span toolbar-divider></span>

                <div toolbar-group>
                    <ToolbarButton
                        label="Insert link"
                        icon="link"
                        bind={(node) => {
                            linkButton = node;
                        }}
                        onClick={() => run(() => engine.insertLink())}
                    />
                    <ToolbarButton
                        label="Bulleted list"
                        icon="list-ul"
                        bind={(node) => {
                            ulButton = node;
                        }}
                        onClick={() => run(() => engine.toggleList("ul"))}
                    />
                    <ToolbarButton
                        label="Numbered list"
                        icon="list-ol"
                        bind={(node) => {
                            olButton = node;
                        }}
                        onClick={() => run(() => engine.toggleList("ol"))}
                    />
                </div>
            </div>

            <div
                wysiwyg-canvas
                contenteditable="true"
                role="textbox"
                aria-multiline="true"
                aria-label="Post content"
                data-placeholder={placeholder}
                spellcheck="true"
                ref={(node: HTMLElement) => {
                    canvas = node;
                    engine.attach(node);
                    if (initialHtml) {
                        engine.setHtml(initialHtml);
                    }
                    node.addEventListener("keyup", onSelectionChange);
                    node.addEventListener("mouseup", onSelectionChange);
                    syncToolbar();
                    onBind?.(engine);
                }}
            />
        </div>
    );
}

function setPressed(button: HTMLButtonElement | null, active: boolean) {
    if (!button) {
        return;
    }

    if (active) {
        button.setAttribute("selected", "");
    } else {
        button.removeAttribute("selected");
    }

    button.setAttribute("aria-pressed", active ? "true" : "false");
}

function ToolbarButton({
    label,
    icon,
    shortcut,
    bind,
    onClick
}: {
    label: string;
    icon: string;
    shortcut?: string;
    bind: (node: HTMLButtonElement) => void;
    onClick: () => void;
}) {
    const title = shortcut ? `${label} (${shortcut})` : label;

    return (
        <button
            type="button"
            btn="ghost"
            scale="sm"
            title={title}
            aria-label={label}
            aria-pressed="false"
            ref={bind}
            onmousedown={keepSelection}
            onclick={onClick}
        >
            <i icon={icon} lib="solid" iconSize="sm"></i>
        </button>
    );
}
