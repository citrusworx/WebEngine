/**
 * Typecheck fixture for `jsxImportSource` with no import of the package root.
 * A missing `JSX` export on the runtime entry is TS7026, and an `any` element
 * fails the `IsAny` check below.
 */

type IsAny<T> = 0 extends 1 & T ? true : false;
type NotAny<T extends false> = T;

function Panel(props: { title: string; children?: string }) {
    return (
        <section stack gap="1rem" class={props.title}>
            <h1>{props.title}</h1>
            {props.children}
        </section>
    );
}

const count = 1;
const attrs: Record<string, string> = { name: "faq" };

const view = (
    <section accordion stack gap={() => "1rem"} className={() => (count > 0 ? "hot" : "")}>
        <h1>Count: {() => count}</h1>
        <p>{() => (count > 0 ? "yes" : null)}</p>
        <button
            {...attrs}
            type="button"
            key="go"
            ref={(element: HTMLButtonElement) => {
                void element.type;
            }}
            onClick={() => {}}
        >
            Go
        </button>
        <form
            onSubmit={async (event: Event) => {
                event.preventDefault();
            }}
        >
            <input
                ref={(node: HTMLInputElement) => {
                    node.value = "";
                }}
                oninput={(event: Event) => {
                    event.preventDefault();
                }}
                hidden={() => false}
                disabled={count > 0 ? true : undefined}
                rows={4}
            />
        </form>
        <span style={{ color: "red", fontWeight: 600, margin: 0, width: "44px" }} />
        <svg viewBox="0 0 64 64" strokeWidth="1">
            <text text-anchor="middle" font-size="10">
                x
            </text>
        </svg>
        <>
            <Panel title="A">body</Panel>
        </>
    </section>
);

type _element = NotAny<IsAny<typeof view>>;
view satisfies Node;

export {};
