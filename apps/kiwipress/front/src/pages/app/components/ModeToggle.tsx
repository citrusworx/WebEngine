import { setViewMode, viewMode } from "../state";

export function ModeToggle() {
    const mode = viewMode.get();

    return (
        <div mode-toggle-wrap>
            <div mode-toggle>
                <button type="button" selected={mode === "simple"} onclick={() => setViewMode("simple")}>
                    Simple
                </button>
                <button type="button" selected={mode === "advanced"} onclick={() => setViewMode("advanced")}>
                    Advanced
                </button>
            </div>
            <p subtle>{mode === "simple" ? "High-level controls" : "Developer configuration"}</p>
        </div>
    );
}
