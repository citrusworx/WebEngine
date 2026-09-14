/** Category of a node on the canvas. Independent of port direction. */
export type NodeType =
    | "content"
    | "parameter"
    | "operation"
    | "event"
    | "variable"
    | "utility"
    | "custom";

/** Whether a port accepts connections (input) or emits them (output). */
export type PortDirection = "input" | "output";
