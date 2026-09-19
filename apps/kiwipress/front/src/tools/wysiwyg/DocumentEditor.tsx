import { EditorShell } from "./shell";
import type { WYSIWYG } from "./engine";

type DocumentEditorProps = {
    heading: string;
    itemLabel: string;
    statusOptions: readonly string[];
    busy: boolean;
    saveLabel: string;
    showDelete: boolean;
    singular: string;
    onSubmit: (event: Event) => void;
    onCancel: () => void;
    onDelete?: () => void;
    onBindEngine: (engine: WYSIWYG) => void;
    bindTitle: (node: HTMLInputElement) => void;
    bindSlug: (node: HTMLInputElement) => void;
    bindStatus: (node: HTMLSelectElement) => void;
    onTitleInput: () => void;
    onSlugInput: () => void;
};

export function DocumentEditor({
    heading,
    itemLabel,
    statusOptions,
    busy,
    saveLabel,
    showDelete,
    singular,
    onSubmit,
    onCancel,
    onDelete,
    onBindEngine,
    bindTitle,
    bindSlug,
    bindStatus,
    onTitleInput,
    onSlugInput
}: DocumentEditorProps) {
    return (
        <div section-block post-editor>
            <h2 section-kicker>
                {heading}
                <span>{itemLabel}</span>
            </h2>
            <form
                panel-card
                dash-form
                collection-editor
                post-editor-frame
                onsubmit={(event: Event) => {
                    onSubmit(event);
                }}
            >
                <div field post-editor-title>
                    <span>Title</span>
                    <input
                        type="text"
                        name="title"
                        autocomplete="off"
                        placeholder={`${singular} title`}
                        ref={bindTitle}
                        oninput={onTitleInput}
                    />
                </div>

                <div post-editor-meta>
                    <div field>
                        <span>Slug</span>
                        <input
                            type="text"
                            name="slug"
                            autocomplete="off"
                            placeholder="url-slug"
                            ref={bindSlug}
                            oninput={onSlugInput}
                        />
                    </div>
                    <div field>
                        <span>Status</span>
                        <select name="status" ref={bindStatus}>
                            {statusOptions.map((value) => (
                                <option value={value}>{value}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div post-editor-body>
                    <span>Content</span>
                    <EditorShell onBind={onBindEngine} />
                </div>

                <div save-row>
                    <div action-group>
                        <button type="button" btn="outline" disabled={busy || undefined} onclick={onCancel}>
                            Cancel
                        </button>
                        {showDelete && onDelete
                            ? <button danger type="button" disabled={busy || undefined} onclick={onDelete}>
                                Delete
                            </button>
                            : null}
                        <button type="submit" disabled={busy || undefined}>
                            <i icon="floppy-disk" lib="solid" iconSize="sm"></i>
                            {saveLabel}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
