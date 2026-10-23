import { Signal, effect } from "@citrusworx/sigjs";
import { fetchPreviewContent } from "../app/bridge/api";

const PREVIEW_QUERY_PARAM = "kiwipress_preview";

function textFromHtml(value: string): string {
    return value
        .replace(/<[^>]*>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, "\"")
        .replace(/&#039;/g, "'");
}

function renderedField(value: { rendered?: string; raw?: string } | undefined): string {
    if (!value) {
        return "";
    }
    if (typeof value.rendered === "string" && value.rendered !== "") {
        return value.rendered;
    }
    return typeof value.raw === "string" ? value.raw : "";
}

function expiryClock(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return iso;
    }
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
}

export function PreviewPage() {
    const phase = Signal<"loading" | "ready" | "missing" | "error">("loading");
    const title = Signal("");
    const html = Signal("");
    const expires = Signal("");
    const message = Signal("");
    let bodyNode: HTMLElement | null = null;
    let started = false;

    function markNoIndex() {
        document.title = "Draft preview";
        let robots = document.querySelector('meta[name="robots"]');
        if (!robots) {
            robots = document.createElement("meta");
            robots.setAttribute("name", "robots");
            document.head.appendChild(robots);
        }
        robots.setAttribute("content", "noindex");
    }

    function paintBody() {
        if (bodyNode) {
            bodyNode.innerHTML = html.get();
        }
    }

    async function load(token: string) {
        markNoIndex();
        try {
            const documentPreview = await fetchPreviewContent(token);
            title.set(textFromHtml(renderedField(documentPreview.post.title)));
            html.set(renderedField(documentPreview.post.content));
            expires.set(expiryClock(documentPreview.expires_at));
            phase.set("ready");
        } catch (caught) {
            phase.set("error");
            message.set(caught instanceof Error ? caught.message : "This preview could not be opened.");
        }
    }

    effect(() => {
        phase.get();
        title.get();
        html.get();
        expires.get();
        message.get();
        paintBody();
    });

    return (
        <main paddingY="roomy">
            <section container narrow>
                <div
                    panel-card
                    ref={() => {
                        if (started) {
                            return;
                        }
                        started = true;
                        const token = new URLSearchParams(window.location.search).get(PREVIEW_QUERY_PARAM) ?? "";
                        if (!token.trim()) {
                            phase.set("missing");
                            message.set("This preview link is missing a token.");
                            markNoIndex();
                            return;
                        }
                        void load(token.trim());
                    }}
                >
                    {phase.get() === "loading"
                        ? <p subtle>Opening draft preview…</p>
                        : null}
                    {phase.get() === "ready"
                        ? <>
                            <p subtle>Draft preview, expires {expires.get()}</p>
                            <h1>{title.get()}</h1>
                            <div
                                ref={(node: HTMLElement) => {
                                    bodyNode = node;
                                    paintBody();
                                }}
                            />
                        </>
                        : null}
                    {phase.get() === "missing" || phase.get() === "error"
                        ? <p>{message.get()}</p>
                        : null}
                </div>
            </section>
        </main>
    );
}
