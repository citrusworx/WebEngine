/** Category of a node on the canvas. Independent of port direction. */
export type NodeType =
    | "content"
    | "parameter"
    | "operation"
    | "event"
    | "variable"
    | "utility"
    | "custom";

/**
 * Concrete event kinds. Each is a node under the `event` category.
 * Drag is three kinds, not one kind with a mode field.
 */
export type EventKind =
    | "onClick"
    | "onDragStart"
    | "onDragMove"
    | "onDragEnd"
    | "customEvent";

/** Whether a port accepts connections (input) or emits them (output). */
export type PortDirection = "input" | "output";
