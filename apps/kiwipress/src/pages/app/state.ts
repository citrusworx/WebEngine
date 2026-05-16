import { Signal } from "@citrusworx/sigjs";

export type ViewMode = "simple" | "advanced";

export const viewMode = Signal<ViewMode>("simple");

export function setViewMode(mode: ViewMode): void {
    viewMode.set(mode);
}
