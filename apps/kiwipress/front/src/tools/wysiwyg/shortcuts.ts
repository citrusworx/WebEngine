export type ShortcutEngine = {
    toggleBold(): boolean;
    toggleItalic(): boolean;
    toggleUnderline(): boolean;
};

export function bindShortcuts(engine: ShortcutEngine, target: HTMLElement): () => void {
    const onKeyDown = (event: KeyboardEvent) => {
        if (!(event.metaKey || event.ctrlKey) || event.altKey) {
            return;
        }

        const key = event.key.toLowerCase();

        if (key === "b") {
            event.preventDefault();
            engine.toggleBold();
            return;
        }

        if (key === "i") {
            event.preventDefault();
            engine.toggleItalic();
            return;
        }

        if (key === "u") {
            event.preventDefault();
            engine.toggleUnderline();
        }
    };

    target.addEventListener("keydown", onKeyDown);
    return () => target.removeEventListener("keydown", onKeyDown);
}
