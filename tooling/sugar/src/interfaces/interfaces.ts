import { NodeType } from "../types/types";

export interface Port {
    id: string;
    label: string;
    type: "input" | "output";
}

export interface SugarNode {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    type: NodeType;
    isDragging: boolean;
    ports: Port[];
    fields?: { label: string; value: string }[];
    tooltip?: HTMLDivElement // Optional tooltip property for nodes
}

export interface SugarEdge {
    id: string;
    fromNodeId: string;
    fromPortType: "content" | "parameter" | "operation" | "event" | "variable" | "utility" | "custom";
    toNodeId: string;
}