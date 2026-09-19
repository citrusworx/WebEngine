import { definePort } from "../graph/ports";
import { Port, SugarField, SugarNode } from "../interfaces/interfaces";
import { EventKind, NodeType } from "../types/types";

/** Event nodes emit what happened; they do not take an `in` port for “happened.” */
export function eventPorts(): Port[] {
    return [
        definePort("trigger", "trigger", "output"),
        definePort("payload", "payload", "output")
    ];
}

export const EVENT_KINDS: readonly EventKind[] = [
    "onClick",
    "onDragStart",
    "onDragMove",
    "onDragEnd",
    "customEvent"
];

export interface KindDefinition {
    type: NodeType;
    label: string;
    ports: () => Port[];
    fields?: () => SugarField[];
    width?: number;
    height?: number;
}

const EVENT_SIZE = { width: 200, height: 90 };

export const kindRegistry: Record<string, KindDefinition> = {
    hero: {
        type: "content",
        label: "Hero",
        width: 185,
        height: 90,
        ports: () => [
            definePort("in", "in", "input"),
            definePort("out", "out", "output")
        ],
        fields: () => [
            { label: "heading-level", value: "2" },
            { label: "text", value: "Welcome to CitrusWorx!" }
        ]
    },
    onClick: {
        type: "event",
        label: "On Click",
        ...EVENT_SIZE,
        ports: eventPorts,
        fields: () => [{ label: "target", value: "#cta" }]
    },
    onDragStart: {
        type: "event",
        label: "On Drag Start",
        ...EVENT_SIZE,
        ports: eventPorts,
        fields: () => [{ label: "target", value: ".draggable" }]
    },
    onDragMove: {
        type: "event",
        label: "On Drag Move",
        ...EVENT_SIZE,
        ports: eventPorts,
        fields: () => [{ label: "target", value: ".draggable" }]
    },
    onDragEnd: {
        type: "event",
        label: "On Drag End",
        ...EVENT_SIZE,
        ports: eventPorts,
        fields: () => [{ label: "target", value: ".draggable" }]
    },
    customEvent: {
        type: "event",
        label: "Custom Event",
        ...EVENT_SIZE,
        ports: eventPorts,
        fields: () => [{ label: "event-name", value: "user:signup" }]
    },
    handleEvent: {
        type: "operation",
        label: "Handle Click",
        width: 200,
        height: 70,
        ports: () => [definePort("in", "in", "input")]
    }
};

export function getKindDefinition(kind: string): KindDefinition {
    const definition = kindRegistry[kind];
    if (!definition) {
        throw new Error(`Unknown node kind "${kind}"`);
    }
    return definition;
}

export type CreateNodeInit = {
    id: string;
    x: number;
    y: number;
} & Partial<Omit<SugarNode, "id" | "x" | "y" | "kind" | "type">>;

/** Build a node from the kind registry. Ports/fields are cloned per instance. */
export function createNode(kind: string, init: CreateNodeInit): SugarNode {
    const definition = getKindDefinition(kind);
    return {
        id: init.id,
        x: init.x,
        y: init.y,
        width: init.width ?? definition.width ?? 200,
        height: init.height ?? definition.height ?? 90,
        label: init.label ?? definition.label,
        type: definition.type,
        kind,
        isDragging: init.isDragging ?? false,
        ports: init.ports ?? definition.ports(),
        fields: init.fields ?? definition.fields?.(),
        tooltip: init.tooltip
    };
}

export function createEventNode(kind: EventKind, init: CreateNodeInit): SugarNode {
    return createNode(kind, init);
}
