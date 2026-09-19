import { NodeType, PortDirection } from "../types/types";

/**
 * A connection point on a node.
 * `id` must be unique among ports on the same node.
 */
export interface Port {
    id: string;
    label: string;
    direction: PortDirection;
}

export interface SugarField {
    label: string;
    value: string;
}

export interface SugarNode {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    /** Category: content | parameter | operation | event | variable | utility | custom. */
    type: NodeType;
    /** Concrete node identity under `type` (e.g. content/`hero`, event/`onClick`). */
    kind: string;
    isDragging: boolean;
    ports: Port[];
    fields?: SugarField[];
    tooltip?: HTMLDivElement;
}

/** An edge always names concrete ports, never a node category. */
export interface SugarEdge {
    id: string;
    fromNodeId: string;
    fromPortId: string;
    toNodeId: string;
    toPortId: string;
}
