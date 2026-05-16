import { Signal, effect } from "@citrusworx/sigjs";
import type { Child } from "@citrusworx/sigjs";

type ContentKind = "posts" | "pages";

type ManagedContentItem = {
    id: number;
    kind: ContentKind;
    title: string;
    slug: string;
    status: string;
    date: string;
    content: string;
};

function extractTextValue(value: unknown): string {
    if (typeof value === "string") {
        return value;
    }

    if (value && typeof value === "object") {
        const candidate = value as { raw?: unknown; rendered?: unknown };

        if (typeof candidate.raw === "string") {
            return candidate.raw;
        }

        if (typeof candidate.rendered === "string") {
            return candidate.rendered;
        }
    }

    return "";
}

function normalizeItem(kind: ContentKind, value: unknown): ManagedContentItem {
    const item = value as {
        id?: unknown;
        slug?: unknown;
        status?: unknown;
        date?: unknown;
        title?: unknown;
        content?: unknown;
    };

    return {
        id: typeof item.id === "number" ? item.id : Number(item.id ?? 0),
        kind,
        title: extractTextValue(item.title) || `Untitled ${kind.slice(0, -1)}`,
        slug: typeof item.slug === "string" ? item.slug : "",
        status: typeof item.status === "string" ? item.status : "draft",
        date: typeof item.date === "string" ? item.date : "",
        content: extractTextValue(item.content) || "<p></p>"
    };
}

export function ContentManager() {
    const currentKind = Signal<ContentKind>("posts");
    const items = Signal<ManagedContentItem[]>([]);
    const selectedId = Signal<number | null>(null);
    const managerStatus = Signal("Idle");
    const managerError = Signal("");
    const saveStatus = Signal("Idle");

    let initialized = false;
    let listNode: HTMLElement | null = null;
    let errorNode: HTMLElement | null = null;
    let managerStatusNode: HTMLElement | null = null;
    let saveStatusNode: HTMLElement | null = null;
    let titleInput: HTMLInputElement | null = null;
    let statusSelect: HTMLSelectElement | null = null;
    let contentArea: HTMLTextAreaElement | null = null;

    function getSelectedItem() {
        const selected = selectedId.get();

        if (selected === null) {
            return null;
        }

        return items.get().find((item) => item.id === selected) ?? null;
    }

    function syncEditorFields(item: ManagedContentItem | null) {
        if (titleInput) {
            titleInput.value = item?.title ?? "";
        }

        if (statusSelect) {
            statusSelect.value = item?.status ?? "draft";
        }

        if (contentArea) {
            contentArea.value = item?.content ?? "";
        }
    }

    async function loadContent(kind: ContentKind) {
        currentKind.set(kind);
        managerStatus.set(`Loading ${kind}...`);
        managerError.set("");

        try {
            const response = await fetch(`/__kiwipress/content/${kind}`);
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload?.error ?? `Unable to load ${kind}.`);
            }

            const normalized = Array.isArray(payload)
                ? payload.map((item) => normalizeItem(kind, item))
                : [];

            items.set(normalized);
            selectedId.set(normalized[0]?.id ?? null);
            managerStatus.set(`${kind} loaded.`);
        } catch (caughtError) {
            const message = caughtError instanceof Error ? caughtError.message : String(caughtError);
            items.set([]);
            selectedId.set(null);
            managerError.set(message);
            managerStatus.set(`${kind} load failed.`);
        }
    }

    async function saveSelected(event: Event) {
        event.preventDefault();

        const selected = getSelectedItem();

        if (!selected || !titleInput || !statusSelect || !contentArea) {
            saveStatus.set("Pick an item to edit.");
            return;
        }

        saveStatus.set(`Saving ${selected.kind.slice(0, -1)} #${selected.id}...`);
        managerError.set("");

        try {
            const payload = {
                title: titleInput.value,
                status: statusSelect.value,
                content: contentArea.value
            };

            const response = await fetch(`/__kiwipress/content/${selected.kind}/${selected.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result?.error ?? `Unable to save ${selected.kind}.`);
            }

            const normalized = normalizeItem(selected.kind, result);

            items.set(
                items.get().map((item) => {
                    return item.id === normalized.id ? normalized : item;
                })
            );

            selectedId.set(normalized.id);
            saveStatus.set(`${selected.kind.slice(0, -1)} #${selected.id} saved.`);
        } catch (caughtError) {
            const message = caughtError instanceof Error ? caughtError.message : String(caughtError);
            managerError.set(message);
            saveStatus.set("Save failed.");
        }
    }

    async function deleteItem(item: ManagedContentItem) {
        const confirmed = window.confirm(`Delete ${item.kind.slice(0, -1)} "${item.title}"?`);

        if (!confirmed) {
            return;
        }

        saveStatus.set(`Deleting ${item.kind.slice(0, -1)} #${item.id}...`);
        managerError.set("");

        try {
            const response = await fetch(`/__kiwipress/content/${item.kind}/${item.id}`, {
                method: "DELETE"
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result?.error ?? `Unable to delete ${item.kind}.`);
            }

            const remaining = items.get().filter((entry) => entry.id !== item.id);
            items.set(remaining);

            if (selectedId.get() === item.id) {
                selectedId.set(remaining[0]?.id ?? null);
            }

            saveStatus.set(`${item.kind.slice(0, -1)} #${item.id} deleted.`);
        } catch (caughtError) {
            const message = caughtError instanceof Error ? caughtError.message : String(caughtError);
            managerError.set(message);
            saveStatus.set("Delete failed.");
        }
    }

    effect(() => {
        const status = managerStatus.get();

        if (managerStatusNode) {
            managerStatusNode.textContent = status;
        }
    });

    effect(() => {
        const status = saveStatus.get();

        if (saveStatusNode) {
            saveStatusNode.textContent = status;
        }
    });

    effect(() => {
        const message = managerError.get();

        if (!errorNode) {
            return;
        }

        if (!message) {
            errorNode.replaceChildren();
            return;
        }

        errorNode.replaceChildren(
            <div stack gap="0.5rem" bgColor="red-100" rounded="md" paddingX="1rem" paddingY="1rem">
                <h3 fontColor="red-700">Manager Failure</h3>
                <pre>{message}</pre>
            </div>
        );
    });

    effect(() => {
        const allItems = items.get();
        const current = currentKind.get();
        const selected = selectedId.get();

        if (!listNode) {
            return;
        }

        if (allItems.length === 0) {
            listNode.replaceChildren(
                <div stack gap="0.5rem" bgColor="gray-100" rounded="md" paddingX="1rem" paddingY="1rem">
                    <p fontColor="gray-700">No {current} loaded yet.</p>
                </div>
            );
            return;
        }

        const children = allItems.map((item) => {
            const isSelected = item.id === selected;

            return (
                <div
                    stack
                    gap="0.75rem"
                    bgColor={isSelected ? "freshgreen-100" : "gray-100"}
                    rounded="md"
                    paddingX="1rem"
                    paddingY="1rem"
                >
                    <div stack gap="0.25rem">
                        <strong>{item.title}</strong>
                        <span fontColor="gray-700">
                            #{item.id} | {item.status} | {item.slug || "no-slug"}
                        </span>
                        <span fontColor="gray-700">{item.date || "no-date"}</span>
                    </div>

                    <div row wrap gap="0.5rem">
                        <button
                            btn="outline"
                            theme="citrusmint-300"
                            type="button"
                            onclick={() => {
                                selectedId.set(item.id);
                                saveStatus.set(`Editing ${item.kind.slice(0, -1)} #${item.id}.`);
                            }}
                        >
                            Edit
                        </button>
                        <button
                            btn="text"
                            theme="citrusmint-300"
                            type="button"
                            onclick={() => {
                                void deleteItem(item);
                            }}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            );
        }) as Child;

        listNode.replaceChildren(
            <div stack gap="1rem">
                {children}
            </div>
        );
    });

    effect(() => {
        selectedId.get();
        items.get();
        syncEditorFields(getSelectedItem());
    });

    return (
        <div
            card
            card-padding="lg"
            bgColor="white-100"
            rounded="lg"
            shadow
            depth="lg"
            ref={() => {
                if (!initialized) {
                    initialized = true;
                    void loadContent("posts");
                }
            }}
        >
            <div card-header stack gap="0.5rem">
                <p fontColor="freshgreen-600">Manage Content</p>
                <h2>Posts and Pages</h2>
                <p fontColor="gray-700">
                    Load posts or pages from WordPress, pick one, then update or delete it.
                </p>
            </div>

            <div card-body stack gap="1rem">
                <div row wrap gap="0.5rem">
                    <button
                        btn="flat"
                        theme="citrusmint-300"
                        type="button"
                        onclick={() => {
                            void loadContent("posts");
                        }}
                    >
                        Load Posts
                    </button>
                    <button
                        btn="outline"
                        theme="citrusmint-300"
                        type="button"
                        onclick={() => {
                            void loadContent("pages");
                        }}
                    >
                        Load Pages
                    </button>
                    <button
                        btn="text"
                        theme="citrusmint-300"
                        type="button"
                        onclick={() => {
                            void loadContent(currentKind.get());
                        }}
                    >
                        Refresh
                    </button>
                </div>

                <code ref={(node: HTMLElement) => {
                    managerStatusNode = node;
                }}
                >
                    {managerStatus.get()}
                </code>

                <div row gap="1rem">
                    <div stack gap="1rem" width="100%">
                        <div ref={(node: HTMLElement) => {
                            listNode = node;
                        }}
                        />
                        <div ref={(node: HTMLElement) => {
                            errorNode = node;
                        }}
                        />
                    </div>

                    <form stack gap="1rem" width="100%" onsubmit={saveSelected}>
                        <div field stack label gap="0.5rem" width="100%">
                            <label for="manager-title">Title</label>
                            <input
                                id="manager-title"
                                type="text"
                                ref={(node: HTMLInputElement) => {
                                    titleInput = node;
                                }}
                            />
                        </div>

                        <div field stack label gap="0.5rem" width="100%">
                            <label for="manager-status">Status</label>
                            <select
                                id="manager-status"
                                ref={(node: HTMLSelectElement) => {
                                    statusSelect = node;
                                }}
                            >
                                <option value="draft">draft</option>
                                <option value="publish">publish</option>
                                <option value="pending">pending</option>
                                <option value="private">private</option>
                            </select>
                        </div>

                        <div field stack label gap="0.5rem" width="100%">
                            <label for="manager-content">Content</label>
                            <textarea
                                id="manager-content"
                                height="18rem"
                                ref={(node: HTMLTextAreaElement) => {
                                    contentArea = node;
                                }}
                            />
                        </div>

                        <div form actions row wrap gap="1rem">
                            <button
                                btn="flat"
                                theme="citrusmint-300"
                                type="submit"
                            >
                                Save Changes
                            </button>
                            <code ref={(node: HTMLElement) => {
                                saveStatusNode = node;
                            }}
                            >
                                {saveStatus.get()}
                            </code>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
