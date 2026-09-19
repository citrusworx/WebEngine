# @citrusworx/sugar

Sugar is a visual, node-based editor for creating and managing CitrusWorx blueprints.

## Install

```bash
npm install @citrusworx/sugar
```

## What It Includes

- a Vite-powered editor UI
- node and edge primitives for blueprint authoring
- integration points with CitrusWorx UI packages

## Node taxonomy

Every `SugarNode` has a category (`type`) and a concrete `kind`. Categories stay
`content | parameter | operation | event | variable | utility | custom`. Kinds
identify the node (for example content/`hero`, event/`onClick`) so labels are not
the only identity.

Event kinds emit `trigger` and `payload` outputs. They do not take an `in` port
for “happened.” Downstream nodes connect from those outputs into their inputs.

- `onClick`
- `onDragStart`, `onDragMove`, `onDragEnd` (three kinds, not one kind with a mode)
- `customEvent` (field `event-name`)

The demo canvas keeps the multi-port GET graph and adds these event nodes above
it, with `onClick.trigger` wired into a Handle Click operation.

## Development

```bash
yarn workspace @citrusworx/sugar build
yarn workspace @citrusworx/sugar dev
yarn workspace @citrusworx/sugar typecheck
```

Pan the canvas with empty-canvas drag, middle mouse, space+drag, or the wheel.
