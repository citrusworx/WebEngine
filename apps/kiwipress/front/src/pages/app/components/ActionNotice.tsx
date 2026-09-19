import { effect } from "@citrusworx/sigjs";
import { actionNotice } from "../state";

export function ActionNotice() {
    let host: HTMLElement | null = null;

    function paint() {
        if (!host) return;
        const message = actionNotice.get();
        host.replaceChildren(
            message ? <div notice role="status">{message}</div> as Node : document.createDocumentFragment()
        );
    }

    effect(() => {
        actionNotice.get();
        paint();
    });

    return (
        <div
            notice-host
            ref={(node: HTMLElement) => {
                host = node;
                paint();
            }}
        ></div>
    );
}
