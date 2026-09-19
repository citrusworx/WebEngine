import { Signal, effect } from "@citrusworx/sigjs";
import type { Child } from "@citrusworx/sigjs";
import { DashboardLayout } from "../layout/DashboardLayout";
import type { NavId } from "../layout/Sidebar";
import {
    createCollectionItem,
    deleteCollectionItem,
    listCollection,
    updateCollectionItem
} from "./api";
import {
    draftPayload,
    EDITOR_STATUSES,
    formatItemDate,
    slugFromTitle,
    statusTone
} from "./normalize";
import type { CollectionWorkspaceCopy, ContentItem } from "./types";

type WorkspaceProps = CollectionWorkspaceCopy & {
    page: NavId;
};

type EditorMode = "idle" | "create" | "edit";

export function CollectionWorkspace({
    page,
    kind,
    title,
    singular,
    lede,
    emptyTitle,
    emptyBody
}: WorkspaceProps) {
    const items = Signal<ContentItem[]>([]);
    const selectedId = Signal<string | null>(null);
    const mode = Signal<EditorMode>("idle");
    const loading = Signal(true);
    const saving = Signal(false);
    const error = Signal("");
    const status = Signal(`Loading ${title.toLowerCase()}…`);

    let initialized = false;
    let listNode: HTMLElement | null = null;
    let noticeNode: HTMLElement | null = null;
    let editorNode: HTMLElement | null = null;
    let kickerMetaNode: HTMLElement | null = null;
    let titleInput: HTMLInputElement | null = null;
    let slugInput: HTMLInputElement | null = null;
    let statusSelect: HTMLSelectElement | null = null;
    let contentArea: HTMLTextAreaElement | null = null;
    let slugTouched = false;

    function selectedItem(): ContentItem | null {
        const id = selectedId.get();
        if (!id) {
            return null;
        }

        return items.get().find((item) => item.id === id) ?? null;
    }

    function setNotice(nextError: string, nextStatus: string) {
        error.set(nextError);
        status.set(nextStatus);
    }

    function syncEditorFields(item: ContentItem | null) {
        if (titleInput) {
            titleInput.value = item?.title ?? "";
        }

        if (slugInput) {
            slugInput.value = item?.slug ?? "";
        }

        if (statusSelect) {
            const nextStatus = item?.status ?? "draft";
            statusSelect.value = EDITOR_STATUSES.includes(nextStatus as typeof EDITOR_STATUSES[number])
                ? nextStatus
                : "draft";
        }

        if (contentArea) {
            contentArea.value = item?.content ?? "";
        }
    }

    function readFormPayload() {
        return draftPayload({
            title: titleInput?.value ?? "",
            slug: slugInput?.value ?? "",
            status: statusSelect?.value ?? "draft",
            content: contentArea?.value ?? ""
        });
    }

    function startCreate() {
        slugTouched = false;
        selectedId.set(null);
        mode.set("create");
        syncEditorFields({
            id: "",
            kind,
            title: "",
            slug: "",
            status: "draft",
            date: "",
            content: ""
        });
        setNotice("", `Drafting a new ${singular}.`);
        paintEditor();
        paintList();
    }

    function startEdit(item: ContentItem) {
        slugTouched = true;
        selectedId.set(item.id);
        mode.set("edit");
        setNotice("", `Editing ${singular} #${item.id}.`);
        paintEditor();
        paintList();
        syncEditorFields(item);
    }

    function closeEditor() {
        slugTouched = false;
        selectedId.set(null);
        mode.set("idle");
        setNotice("", items.get().length ? `${items.get().length} ${title.toLowerCase()} loaded.` : `No ${title.toLowerCase()} yet.`);
        paintEditor();
        paintList();
    }

    function paintNotice() {
        if (!noticeNode) {
            return;
        }

        const message = error.get();
        const currentStatus = status.get();

        noticeNode.replaceChildren(
            <div stack gap="0.75rem">
                {message
                    ? <div note>
                        <i icon="circle-exclamation" lib="solid" iconSize="sm"></i>
                        <p>{message}</p>
                    </div>
                    : null}
                <p subtle>{currentStatus}</p>
            </div> as Node
        );
    }

    function paintKicker() {
        if (!kickerMetaNode) {
            return;
        }

        kickerMetaNode.textContent = loading.get()
            ? "Loading"
            : `${items.get().length} total`;
    }

    function paintList() {
        if (!listNode) {
            return;
        }

        const rows = items.get();
        const current = selectedId.get();
        const busy = loading.get();

        if (busy && rows.length === 0) {
            listNode.replaceChildren(
                <div panel-card muted>
                    <p subtle>{status.get()}</p>
                </div> as Node
            );
            return;
        }

        if (rows.length === 0) {
            listNode.replaceChildren(
                <div panel-card dashed>
                    <div choice-icon>
                        <i icon="file-lines" lib="solid" iconSize="sm"></i>
                    </div>
                    <h3>{emptyTitle}</h3>
                    <p subtle>{emptyBody}</p>
                    <button type="button" onclick={() => startCreate()}>
                        <i icon="plus" lib="solid" iconSize="sm"></i>
                        New {singular}
                    </button>
                </div> as Node
            );
            return;
        }

        const children = rows.map((item) => {
            const selected = item.id === current;

            return (
                <tr current={selected || undefined}>
                    <td>
                        <strong>{item.title}</strong>
                    </td>
                    <td><span mono>{item.slug || "—"}</span></td>
                    <td>
                        <span chip tone={statusTone(item.status)}>{item.status}</span>
                    </td>
                    <td><span subtle>{formatItemDate(item.date)}</span></td>
                    <td end>
                        <div action-group>
                            <button
                                btn="ghost"
                                type="button"
                                scale="sm"
                                aria-label={`Edit ${item.title}`}
                                onclick={() => startEdit(item)}
                            >
                                Edit
                            </button>
                            <button
                                danger
                                type="button"
                                scale="sm"
                                aria-label={`Delete ${item.title}`}
                                onclick={() => {
                                    void removeItem(item);
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </td>
                </tr>
            );
        }) as Child;

        listNode.replaceChildren(
            <div data-table-wrap>
                <table data-table>
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Slug</th>
                            <th>Status</th>
                            <th>Updated</th>
                            <th end>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {children}
                    </tbody>
                </table>
            </div> as Node
        );
    }

    function paintEditor() {
        if (!editorNode) {
            return;
        }

        const currentMode = mode.get();
        if (currentMode === "idle") {
            editorNode.replaceChildren();
            titleInput = null;
            slugInput = null;
            statusSelect = null;
            contentArea = null;
            return;
        }

        const current = selectedItem();
        const heading = currentMode === "create" ? `New ${singular}` : `Edit ${singular}`;
        const busy = saving.get() || loading.get();

        editorNode.replaceChildren(
            <div section-block>
                <h2 section-kicker>
                    {heading}
                    <span>{current ? `#${current.id}` : "Unsaved draft"}</span>
                </h2>
                <form
                    panel-card
                    dash-form
                    collection-editor
                    onsubmit={(event: Event) => {
                        void saveEditor(event);
                    }}
                >
                    <div field>
                        <span>Title</span>
                        <input
                            type="text"
                            name="title"
                            autocomplete="off"
                            placeholder={`${singular} title`}
                            ref={(node: HTMLInputElement) => {
                                titleInput = node;
                            }}
                            oninput={() => {
                                if (!slugTouched && slugInput && titleInput) {
                                    slugInput.value = slugFromTitle(titleInput.value);
                                }
                            }}
                        />
                    </div>
                    <div field>
                        <span>Slug</span>
                        <input
                            type="text"
                            name="slug"
                            autocomplete="off"
                            placeholder="url-slug"
                            ref={(node: HTMLInputElement) => {
                                slugInput = node;
                            }}
                            oninput={() => {
                                slugTouched = true;
                            }}
                        />
                    </div>
                    <div field>
                        <span>Status</span>
                        <select
                            name="status"
                            ref={(node: HTMLSelectElement) => {
                                statusSelect = node;
                            }}
                        >
                            {EDITOR_STATUSES.map((value) => (
                                <option value={value}>{value}</option>
                            ))}
                        </select>
                    </div>
                    <div field>
                        <span>Content</span>
                        <textarea
                            name="content"
                            placeholder="Write the body…"
                            ref={(node: HTMLTextAreaElement) => {
                                contentArea = node;
                            }}
                        />
                    </div>
                    <div save-row>
                        <div action-group>
                            <button type="button" btn="outline" disabled={busy || undefined} onclick={() => closeEditor()}>
                                Cancel
                            </button>
                            {currentMode === "edit" && current
                                ? <button
                                    danger
                                    type="button"
                                    disabled={busy || undefined}
                                    onclick={() => {
                                        void removeItem(current);
                                    }}
                                >
                                    Delete
                                </button>
                                : null}
                            <button type="submit" disabled={busy || undefined}>
                                <i icon="floppy-disk" lib="solid" iconSize="sm"></i>
                                {currentMode === "create" ? `Create ${singular}` : "Save changes"}
                            </button>
                        </div>
                    </div>
                </form>
            </div> as Node
        );

        if (currentMode === "edit") {
            syncEditorFields(current);
        } else {
            syncEditorFields({
                id: "",
                kind,
                title: "",
                slug: "",
                status: "draft",
                date: "",
                content: ""
            });
        }
    }

    async function loadItems(nextStatus?: string) {
        loading.set(true);
        setNotice("", nextStatus ?? `Loading ${title.toLowerCase()}…`);

        try {
            const loaded = await listCollection(kind);
            items.set(loaded);

            const current = selectedId.get();
            if (current && !loaded.some((item) => item.id === current)) {
                selectedId.set(null);
                if (mode.get() === "edit") {
                    mode.set("idle");
                }
            }

            setNotice("", loaded.length
                ? `${loaded.length} ${title.toLowerCase()} loaded.`
                : `No ${title.toLowerCase()} yet.`);
        } catch (caught) {
            items.set([]);
            selectedId.set(null);
            mode.set("idle");
            const message = caught instanceof Error ? caught.message : String(caught);
            setNotice(message, `Could not load ${title.toLowerCase()}.`);
        } finally {
            loading.set(false);
        }
    }

    async function saveEditor(event: Event) {
        event.preventDefault();

        const payload = readFormPayload();
        const currentMode = mode.get();
        const current = selectedItem();

        saving.set(true);
        setNotice("", currentMode === "create" ? `Creating ${singular}…` : `Saving ${singular}…`);

        try {
            if (currentMode === "create") {
                const created = await createCollectionItem(kind, payload);
                items.set([created, ...items.get().filter((item) => item.id !== created.id)]);
                startEdit(created);
                setNotice("", `${singular} created.`);
                return;
            }

            if (!current) {
                setNotice("", `Pick a ${singular.toLowerCase()} to edit.`);
                return;
            }

            const updated = await updateCollectionItem(kind, current.id, payload);
            items.set(items.get().map((item) => item.id === updated.id ? updated : item));
            selectedId.set(updated.id);
            syncEditorFields(updated);
            setNotice("", `${singular} saved.`);
        } catch (caught) {
            const message = caught instanceof Error ? caught.message : String(caught);
            setNotice(message, currentMode === "create" ? "Create failed." : "Save failed.");
        } finally {
            saving.set(false);
        }
    }

    async function removeItem(item: ContentItem) {
        const confirmed = window.confirm(`Delete ${singular.toLowerCase()} "${item.title}"?`);
        if (!confirmed) {
            return;
        }

        saving.set(true);
        setNotice("", `Deleting ${singular.toLowerCase()}…`);

        try {
            await deleteCollectionItem(kind, item.id);
            const remaining = items.get().filter((entry) => entry.id !== item.id);
            items.set(remaining);

            if (selectedId.get() === item.id) {
                closeEditor();
            }

            setNotice("", `${singular} deleted.`);
        } catch (caught) {
            const message = caught instanceof Error ? caught.message : String(caught);
            setNotice(message, "Delete failed.");
        } finally {
            saving.set(false);
        }
    }

    effect(() => {
        items.get();
        selectedId.get();
        loading.get();
        paintKicker();
        paintList();
    });

    effect(() => {
        error.get();
        status.get();
        loading.get();
        saving.get();
        paintNotice();
    });

    effect(() => {
        mode.get();
        selectedId.get();
        paintEditor();
    });

    return (
        <DashboardLayout page={page}>
            <div dashboard-page>
                <div header-row>
                    <header page-header>
                        <h1>{title}</h1>
                        <p lede>{lede}</p>
                    </header>
                    <div action-group>
                        <button
                            btn="outline"
                            type="button"
                            scale="sm"
                            onclick={() => {
                                void loadItems(`Refreshing ${title.toLowerCase()}…`);
                            }}
                        >
                            <i icon="arrows-rotate" lib="solid" iconSize="sm"></i>
                            Refresh
                        </button>
                        <button type="button" scale="sm" onclick={() => startCreate()}>
                            <i icon="plus" lib="solid" iconSize="sm"></i>
                            New {singular}
                        </button>
                    </div>
                </div>

                <div
                    section-block
                    ref={(node: HTMLElement) => {
                        noticeNode = node;
                        paintNotice();
                    }}
                />

                <div section-block>
                    <h2 section-kicker>
                        All {title}
                        <span ref={(node: HTMLElement) => {
                            kickerMetaNode = node;
                            paintKicker();
                        }}>Loading</span>
                    </h2>
                    <div
                        ref={(node: HTMLElement) => {
                            listNode = node;
                            paintList();
                            if (!initialized) {
                                initialized = true;
                                void loadItems();
                            }
                        }}
                    />
                </div>

                <div
                    ref={(node: HTMLElement) => {
                        editorNode = node;
                        paintEditor();
                    }}
                />
            </div>
        </DashboardLayout>
    );
}
