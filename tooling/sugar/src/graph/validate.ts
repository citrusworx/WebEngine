import { SugarEdge, SugarNode } from "../interfaces/interfaces";
import { assertUniquePortIds, getPort } from "./ports";

function assertUniqueIds(kind: "node" | "edge", ids: readonly string[]): void {
    const seen = new Set<string>();
    for (const id of ids) {
        if (seen.has(id)) {
            throw new Error(`Duplicate ${kind} id "${id}"`);
        }
        seen.add(id);
    }
}

/** Fail fast on duplicate identities or edges that do not name real output→input ports. */
export function validateGraph(nodes: readonly SugarNode[], edges: readonly SugarEdge[]): void {
    assertUniqueIds("node", nodes.map((node) => node.id));
    assertUniqueIds("edge", edges.map((edge) => edge.id));

    const nodesById = new Map(nodes.map((node) => [node.id, node]));
    for (const node of nodes) {
        assertUniquePortIds(node);
    }

    for (const edge of edges) {
        const fromNode = nodesById.get(edge.fromNodeId);
        const toNode = nodesById.get(edge.toNodeId);
        if (!fromNode) {
            throw new Error(`Edge "${edge.id}" references missing from node "${edge.fromNodeId}"`);
        }
        if (!toNode) {
            throw new Error(`Edge "${edge.id}" references missing to node "${edge.toNodeId}"`);
        }

        const fromPort = getPort(fromNode, edge.fromPortId);
        const toPort = getPort(toNode, edge.toPortId);
        if (fromPort.direction !== "output") {
            throw new Error(
                `Edge "${edge.id}" from port "${edge.fromPortId}" on node "${fromNode.id}" is not an output`
            );
        }
        if (toPort.direction !== "input") {
            throw new Error(
                `Edge "${edge.id}" to port "${edge.toPortId}" on node "${toNode.id}" is not an input`
            );
        }
    }
}
