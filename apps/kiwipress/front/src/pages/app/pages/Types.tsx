import { Signal, effect } from "@citrusworx/sigjs";
import { router } from "../../../router";
import { DashboardLayout } from "../layout/DashboardLayout";
import { createType } from "../types/api";
import {
    DEFAULT_TYPE_STATUSES,
    draftTypePayload,
    slugFromLabel,
    typeItemPath,
    type TypeDefinition
} from "../types/model";
import { refreshRegisteredTypes, registeredTypes } from "../types/state";

export function Types() {
    const types = Signal<TypeDefinition[]>(registeredTypes.get());
    const error = Signal("");
    const status = Signal("Loading types…");
    const saving = Signal(false);
    const composing = Signal(false);

    let listNode: HTMLElement | null = null;
    let noticeNode: HTMLElement | null = null;
    let formNode: HTMLElement | null = null;
    let slugInput: HTMLInputElement | null = null;
    let labelInput: HTMLInputElement | null = null;
    let singularInput: HTMLInputElement | null = null;
    let statusesInput: HTMLInputElement | null = null;
    let slugTouched = false;
    let initialized = false;

    function setNotice(nextError: string, nextStatus: string) {
        error.set(nextError);
        status.set(nextStatus);
    }

    function paintNotice() {
        if (!noticeNode) {
            return;
        }

        const message = error.get();
        noticeNode.replaceChildren(
            <div stack gap="0.75rem">
                {message
                    ? <div note>
                        <i icon="circle-exclamation" lib="solid" iconSize="sm"></i>
                        <p>{message}</p>
                    </div>
                    : null}
                <p subtle>{status.get()}</p>
            </div> as Node
        );
    }

    function paintList() {
        if (!listNode) {
            return;
        }

        const rows = types.get();
        if (rows.length === 0) {
            listNode.replaceChildren(
                <div panel-card dashed>
                    <div choice-icon>
                        <i icon="layer-group" lib="solid" iconSize="sm"></i>
                    </div>
                    <h3>No custom types yet</h3>
                    <p subtle>Register a type such as recipe. Items use the same collection workspace as posts and pages.</p>
                    <button type="button" onclick={() => composing.set(true)}>
                        <i icon="plus" lib="solid" iconSize="sm"></i>
                        Add type
                    </button>
                </div> as Node
            );
            return;
        }

        listNode.replaceChildren(
            <div data-table-wrap>
                <table data-table>
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Slug</th>
                            <th>Statuses</th>
                            <th end>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((definition) => (
                            <tr>
                                <td>
                                    <strong>{definition.label}</strong>
                                    <p subtle>{definition.singular}</p>
                                </td>
                                <td><span mono>{definition.slug}</span></td>
                                <td>
                                    <div chip-wrap>
                                        {definition.statuses.map((entry) => (
                                            <span chip>{entry}</span>
                                        ))}
                                    </div>
                                </td>
                                <td end>
                                    <div action-group>
                                        <button
                                            btn="outline"
                                            type="button"
                                            scale="sm"
                                            onclick={() => router.navigate(typeItemPath(definition.slug))}
                                        >
                                            Open items
                                            <i icon="arrow-right" lib="solid" iconSize="sm"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div> as Node
        );
    }

    function paintForm() {
        if (!formNode) {
            return;
        }

        if (!composing.get()) {
            formNode.replaceChildren();
            slugInput = null;
            labelInput = null;
            singularInput = null;
            statusesInput = null;
            return;
        }

        const busy = saving.get();
        formNode.replaceChildren(
            <div section-block>
                <h2 section-kicker>
                    Add type
                    <span>Native CMS definition</span>
                </h2>
                <form
                    panel-card
                    dash-form
                    onsubmit={(event: Event) => {
                        void saveType(event);
                    }}
                >
                    <div field>
                        <span>Label</span>
                        <input
                            type="text"
                            name="label"
                            autocomplete="off"
                            placeholder="Recipes"
                            ref={(node: HTMLInputElement) => {
                                labelInput = node;
                            }}
                            oninput={() => {
                                if (!slugTouched && slugInput && labelInput) {
                                    slugInput.value = slugFromLabel(labelInput.value);
                                }
                            }}
                        />
                    </div>
                    <div field>
                        <span>Singular</span>
                        <input
                            type="text"
                            name="singular"
                            autocomplete="off"
                            placeholder="Recipe"
                            ref={(node: HTMLInputElement) => {
                                singularInput = node;
                            }}
                        />
                    </div>
                    <div field>
                        <span>Slug</span>
                        <input
                            type="text"
                            name="slug"
                            autocomplete="off"
                            placeholder="recipe"
                            ref={(node: HTMLInputElement) => {
                                slugInput = node;
                            }}
                            oninput={() => {
                                slugTouched = true;
                            }}
                        />
                    </div>
                    <div field>
                        <span>Statuses</span>
                        <input
                            type="text"
                            name="statuses"
                            autocomplete="off"
                            value={DEFAULT_TYPE_STATUSES.join(", ")}
                            ref={(node: HTMLInputElement) => {
                                statusesInput = node;
                            }}
                        />
                        <p subtle>Comma-separated. Defaults cover draft, published, and archived.</p>
                    </div>
                    <div save-row>
                        <div action-group>
                            <button type="button" btn="outline" disabled={busy || undefined} onclick={() => composing.set(false)}>
                                Cancel
                            </button>
                            <button type="submit" disabled={busy || undefined}>
                                <i icon="plus" lib="solid" iconSize="sm"></i>
                                Create type
                            </button>
                        </div>
                    </div>
                </form>
            </div> as Node
        );
    }

    async function loadTypes() {
        setNotice("", "Loading types…");
        try {
            const loaded = await refreshRegisteredTypes();
            types.set(loaded);
            setNotice("", loaded.length ? `${loaded.length} types registered.` : "No custom types yet.");
        } catch (caught) {
            types.set([]);
            const message = caught instanceof Error ? caught.message : String(caught);
            setNotice(message, "Could not load types.");
        }
    }

    async function saveType(event: Event) {
        event.preventDefault();
        const payload = draftTypePayload({
            slug: slugInput?.value ?? "",
            label: labelInput?.value ?? "",
            singular: singularInput?.value ?? "",
            statuses: statusesInput?.value ?? DEFAULT_TYPE_STATUSES.join(", ")
        });

        if (!payload.slug) {
            setNotice("Slug or label is required.", "Create failed.");
            return;
        }

        saving.set(true);
        setNotice("", `Creating ${payload.singular}…`);

        try {
            const created = await createType(payload);
            const next = [created, ...types.get().filter((entry) => entry.slug !== created.slug)];
            types.set(next);
            registeredTypes.set(next);
            composing.set(false);
            slugTouched = false;
            setNotice("", `${created.label} created.`);
        } catch (caught) {
            const message = caught instanceof Error ? caught.message : String(caught);
            setNotice(message, "Create failed.");
        } finally {
            saving.set(false);
        }
    }

    effect(() => {
        types.get();
        paintList();
    });

    effect(() => {
        error.get();
        status.get();
        paintNotice();
    });

    effect(() => {
        composing.get();
        saving.get();
        paintForm();
    });

    return (
        <DashboardLayout page="types">
            <div dashboard-page>
                <div header-row>
                    <header page-header>
                        <h1>Types</h1>
                        <p lede>
                            Register custom collections in the native CMS. Each type gets the same editor shell as posts and pages at <span mono>/app/c/:slug</span>.
                        </p>
                    </header>
                    <div action-group>
                        <button
                            btn="outline"
                            type="button"
                            scale="sm"
                            onclick={() => {
                                void loadTypes();
                            }}
                        >
                            <i icon="arrows-rotate" lib="solid" iconSize="sm"></i>
                            Refresh
                        </button>
                        <button type="button" scale="sm" onclick={() => composing.set(true)}>
                            <i icon="plus" lib="solid" iconSize="sm"></i>
                            Add type
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
                        Registered types
                        <span>{types.get().length} total</span>
                    </h2>
                    <div
                        ref={(node: HTMLElement) => {
                            listNode = node;
                            paintList();
                            if (!initialized) {
                                initialized = true;
                                void loadTypes();
                            }
                        }}
                    />
                </div>

                <div
                    ref={(node: HTMLElement) => {
                        formNode = node;
                        paintForm();
                    }}
                />
            </div>
        </DashboardLayout>
    );
}
