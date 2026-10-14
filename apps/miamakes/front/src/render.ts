import { effect } from "@citrusworx/sigjs";

type Renderable = Node | string | number | null | undefined | Renderable[];

function normalize(value: Renderable): Node[] {
  if (value == null) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(normalize);
  }

  if (typeof value === "string" || typeof value === "number") {
    return [document.createTextNode(String(value))];
  }

  return [value];
}

/** Re-render a slot when signals read inside `children` change. */
export function Render(props: { children: () => Renderable }) {
  const host = document.createElement("div");

  effect(() => {
    host.replaceChildren(...normalize(props.children()));
  });

  return host;
}
