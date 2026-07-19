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

export function Render(props: { children: () => Renderable }) {
  const host = document.createElement("div");
  host.className = "bw-render-slot";

  effect(() => {
    host.replaceChildren(...normalize(props.children()));
  });

  return host;
}
