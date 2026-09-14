import { Port, SugarNode } from "../interfaces/interfaces";
import { PortDirection } from "../types/types";

export const NODE_HEADER_HEIGHT = 28;
export const PORT_RADIUS = 7;
export const PORT_HIT_PADDING = 4;

export function definePort(id: string, label: string, direction: PortDirection): Port {
    return { id, label, direction };
}

export function portsByDirection(node: SugarNode, direction: PortDirection): Port[] {
    return node.ports.filter((port) => port.direction === direction);
}

export function findPort(node: SugarNode, portId: string): Port | undefined {
    return node.ports.find((port) => port.id === portId);
}

export function getPort(node: SugarNode, portId: string): Port {
    const port = findPort(node, portId);
    if (!port) {
        throw new Error(`Node "${node.id}" has no port "${portId}"`);
    }
    return port;
}

export function assertUniquePortIds(node: SugarNode): void {
    const seen = new Set<string>();
    for (const port of node.ports) {
        if (seen.has(port.id)) {
            throw new Error(`Node "${node.id}" has duplicate port id "${port.id}"`);
        }
        seen.add(port.id);
    }
}

/** Place inputs on the left edge and outputs on the right, spaced through the node body. */
export function getPortAnchor(node: SugarNode, port: Port): { x: number; y: number } {
    const siblings = portsByDirection(node, port.direction);
    const index = siblings.findIndex((candidate) => candidate.id === port.id);
    const count = siblings.length;
    const bodyHeight = Math.max(node.height - NODE_HEADER_HEIGHT, 0);
    const slot = count === 0 || index < 0 ? 0.5 : (index + 1) / (count + 1);
    return {
        x: port.direction === "output" ? node.x + node.width : node.x,
        y: node.y + NODE_HEADER_HEIGHT + bodyHeight * slot
    };
}

export function getPortAnchorById(node: SugarNode, portId: string): { x: number; y: number } {
    return getPortAnchor(node, getPort(node, portId));
}

export function hitTestPort(
    nodes: readonly SugarNode[],
    x: number,
    y: number
): { node: SugarNode; port: Port } | null {
    const threshold = PORT_RADIUS + PORT_HIT_PADDING;
    const thresholdSq = threshold * threshold;

    for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        for (const port of node.ports) {
            const pos = getPortAnchor(node, port);
            const dx = x - pos.x;
            const dy = y - pos.y;
            if (dx * dx + dy * dy <= thresholdSq) {
                return { node, port };
            }
        }
    }

    return null;
}
