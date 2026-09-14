import { heroNode } from "./nodes/HeroNode";
import { SugarNode, SugarEdge } from "./interfaces/interfaces";
import { NodeType } from "./types/types";
import { createTooltip } from "./util/utility";
import {
    NODE_HEADER_HEIGHT,
    PORT_RADIUS,
    definePort,
    getPortAnchor,
    getPortAnchorById,
    hitTestPort,
    portsByDirection
} from "./graph/ports";
import { validateGraph } from "./graph/validate";
import {
    applyViewportTransform,
    clientToCanvas,
    createViewport,
    panViewport,
    resetTransform,
    screenToWorld,
    syncCanvasSize
} from "./graph/viewport";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
let activeTooltip: HTMLDivElement | null = null;
const viewport = createViewport();
syncCanvasSize(canvas);
new ResizeObserver(() => syncCanvasSize(canvas)).observe(canvas);

const NODE_COLORS: Record<NodeType, { header: string; border: string; port: string }> = {
    content:   { header: "#4caf50", border: "#388e3c", port: "#81c784" },
    parameter: { header: "#fbc02d", border: "#f9a825", port: "#ffe082" },
    operation: { header: "#5c6bc0", border: "#3949ab", port: "#9fa8da" },
    event:     { header: "#e64a19", border: "#d84315", port: "#ff8a65" },
    variable:  { header: "#0097a7", border: "#00796b", port: "#4dd0e1" },
    utility:   { header: "#7b1fa2", border: "#4a148c", port: "#ba68c8" },
    custom:    { header: "#616161", border: "#212121", port: "#bdbdbd" }
};

const nodes: SugarNode[] = [
    {
        id: "1",
        x: 60, y: 200,
        width: 180, height: 70,
        label: "Danny Licks Buttsholes",
        type: "content",
        isDragging: false,
        ports: [definePort("out", "out", "output")],
        tooltip: createTooltip("Fetches the current page content")
    },
    {
        id: "2",
        x: 300, y: 200,
        width: 200, height: 90,
        label: "Grab Container",
        type: "operation",
        isDragging: false,
        ports: [
            definePort("in", "in", "input"),
            definePort("out", "out", "output")
        ],
        fields: [{ label: "id", value: "#main-title" }]
    },
    {
        id: "3",
        x: 560, y: 200,
        width: 200, height: 90,
        label: "Add Button",
        type: "content",
        isDragging: false,
        fields: [{ label: "text", value: "Click Me" }],
        ports: [
            definePort("in", "request", "input"),
            definePort("out", "out", "output"),
            definePort("response", "response", "output")
        ]
    },
    {
        id: "4",
        x: 820, y: 160,
        width: 220, height: 110,
        label: "GET",
        type: "operation",
        isDragging: false,
        ports: [
            definePort("in", "request", "input"),
            definePort("params", "params", "input"),
            definePort("error", "error", "output"),
            definePort("response", "response", "output")
        ],
        fields: [{ label: "url", value: "https://api.example.com/doc" }]
    },
    {
        id: "5",
        x: 620, y: 360,
        width: 180, height: 70,
        label: "Params",
        type: "parameter",
        isDragging: false,
        ports: [definePort("out", "out", "output")],
        fields: [{ label: "value", value: "title" }]
    },
    {
        id: "6",
        x: 1270, y: 160,
        width: 200, height: 70,
        label: "Log",
        type: "event",
        isDragging: false,
        ports: [definePort("in", "in", "input")]
    },
    {
        ...heroNode
    },
    {
        id: "8",
        x: 1200, y: 500,
        width: 200, height: 70,
        label: "userPosts",
        type: "variable",
        isDragging: false,
        ports: [
            definePort("in", "in", "input"),
            definePort("out", "out", "output")
        ],
        fields: [{ label: "custom-field", value: "Custom Value" }],
        tooltip: createTooltip("This is a custom node with user-defined behavior")
    }
];

const edges: SugarEdge[] = [
    { id: "e1", fromNodeId: "1", fromPortId: "out", toNodeId: "2", toPortId: "in" },
    { id: "e2", fromNodeId: "2", fromPortId: "out", toNodeId: "3", toPortId: "in" },
    { id: "e3", fromNodeId: "3", fromPortId: "out", toNodeId: "4", toPortId: "in" },
    { id: "e4", fromNodeId: "5", fromPortId: "out", toNodeId: "4", toPortId: "params" },
    { id: "e5", fromNodeId: "2", fromPortId: "out", toNodeId: "7", toPortId: "in" },
    { id: "e6", fromNodeId: "4", fromPortId: "error", toNodeId: "6", toPortId: "in" },
    { id: "e7", fromNodeId: "7", fromPortId: "out", toNodeId: "4", toPortId: "in" },
    { id: "e8", fromNodeId: "4", fromPortId: "response", toNodeId: "8", toPortId: "in" }
];

validateGraph(nodes, edges);

function drawNode(node: SugarNode) {
    const colors = NODE_COLORS[node.type];
    const radius = 8;

    ctx.shadowColor = "rgba(0,0,0,0.15)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(node.x, node.y, node.width, node.height, radius);
    ctx.fill();
    ctx.shadowColor = "transparent";

    ctx.fillStyle = colors.header;
    ctx.beginPath();
    ctx.roundRect(node.x, node.y, node.width, NODE_HEADER_HEIGHT, [radius, radius, 0, 0]);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px IBM Plex Sans, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(node.label, node.x + node.width / 2, node.y + NODE_HEADER_HEIGHT / 2);

    if (node.fields) {
        node.fields.forEach((field, i) => {
            const fieldY = node.y + NODE_HEADER_HEIGHT + 10 + i * 22;
            ctx.fillStyle = "#666666";
            ctx.font = "11px IBM Plex Mono, monospace";
            ctx.textAlign = "left";
            ctx.fillText(`${field.label}: `, node.x + 12, fieldY);
            ctx.fillStyle = "#333333";
            ctx.font = "bold 11px IBM Plex Mono, monospace";
            ctx.fillText(field.value, node.x + 12 + ctx.measureText(`${field.label}: `).width, fieldY);
        });
    }

    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(node.x, node.y, node.width, node.height, radius);
    ctx.stroke();

    const inputs = portsByDirection(node, "input");
    const outputs = portsByDirection(node, "output");

    for (const port of node.ports) {
        const pos = getPortAnchor(node, port);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, PORT_RADIUS, 0, Math.PI * 2);
        if (port.direction === "output") {
            ctx.fillStyle = colors.port;
            ctx.fill();
            ctx.strokeStyle = colors.border;
        } else {
            ctx.fillStyle = "#ffffff";
            ctx.fill();
            ctx.strokeStyle = "#aaaaaa";
        }
        ctx.lineWidth = 2;
        ctx.stroke();

        const siblings = port.direction === "output" ? outputs : inputs;
        if (siblings.length > 1) {
            ctx.fillStyle = "#888888";
            ctx.font = "10px IBM Plex Sans, sans-serif";
            ctx.textBaseline = "middle";
            if (port.direction === "input") {
                ctx.textAlign = "left";
                ctx.fillText(port.label, pos.x + 12, pos.y);
            } else {
                ctx.textAlign = "right";
                ctx.fillText(port.label, pos.x - 12, pos.y);
            }
        }
    }
}

function drawEdge(edge: SugarEdge) {
    const fromNode = nodes.find((n) => n.id === edge.fromNodeId);
    const toNode = nodes.find((n) => n.id === edge.toNodeId);
    if (!fromNode || !toNode) return;

    const from = getPortAnchorById(fromNode, edge.fromPortId);
    const to = getPortAnchorById(toNode, edge.toPortId);
    const cp = Math.abs(to.x - from.x) / 2;

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.bezierCurveTo(
        from.x + cp, from.y,
        to.x - cp, to.y,
        to.x, to.y
    );

    ctx.strokeStyle = NODE_COLORS[fromNode.type].port;
    ctx.lineWidth = 2;
    ctx.stroke();
}

function render() {
    resetTransform(ctx);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    applyViewportTransform(ctx, viewport);
    edges.forEach(drawEdge);
    nodes.forEach(drawNode);
    requestAnimationFrame(render);
}

function pointerToWorld(e: PointerEvent): { x: number; y: number } {
    const screen = clientToCanvas(canvas, e.clientX, e.clientY);
    return screenToWorld(viewport, screen.x, screen.y);
}

function hideTooltip() {
    if (!activeTooltip) return;
    activeTooltip.style.display = "none";
    activeTooltip = null;
}

function getNodeAtPosition(x: number, y: number): SugarNode | null {
    for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        if (x >= n.x && x <= n.x + n.width && y >= n.y && y <= n.y + n.height) {
            return n;
        }
    }
    return null;
}

let dragTarget: SugarNode | null = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let isPanning = false;
let lastPointerX = 0;
let lastPointerY = 0;
let spaceHeld = false;

function isPanGesture(e: PointerEvent): boolean {
    return e.button === 1 || (e.button === 0 && spaceHeld);
}

function endPointer(e: PointerEvent) {
    if (dragTarget) dragTarget.isDragging = false;
    dragTarget = null;
    isPanning = false;
    if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
    }
    canvas.style.cursor = "grab";
}

canvas.addEventListener("mousedown", (e) => {
    if (e.button === 1) e.preventDefault();
});

canvas.addEventListener("pointerdown", (e) => {
    if (e.button === 1) e.preventDefault();
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;

    if (isPanGesture(e)) {
        isPanning = true;
        hideTooltip();
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = "grabbing";
        return;
    }

    if (e.button !== 0) return;

    const world = pointerToWorld(e);
    // Port hits are reserved for future wiring; do not start a node drag from a port.
    if (hitTestPort(nodes, world.x, world.y)) return;

    const node = getNodeAtPosition(world.x, world.y);
    if (node) {
        dragTarget = node;
        node.isDragging = true;
        dragOffsetX = world.x - node.x;
        dragOffsetY = world.y - node.y;
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = "grabbing";
        return;
    }

    isPanning = true;
    hideTooltip();
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = "grabbing";
});

canvas.addEventListener("pointermove", (e) => {
    if (isPanning) {
        panViewport(viewport, e.clientX - lastPointerX, e.clientY - lastPointerY);
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        canvas.style.cursor = "grabbing";
        return;
    }

    if (dragTarget) {
        const world = pointerToWorld(e);
        dragTarget.x = world.x - dragOffsetX;
        dragTarget.y = world.y - dragOffsetY;
        canvas.style.cursor = "grabbing";
        return;
    }

    const world = pointerToWorld(e);
    const portHit = hitTestPort(nodes, world.x, world.y);
    const node = getNodeAtPosition(world.x, world.y);
    canvas.style.cursor = portHit ? "crosshair" : "grab";

    if (node && node.tooltip) {
        node.tooltip.style.display = "block";
        node.tooltip.style.left = `${e.pageX + 10}px`;
        node.tooltip.style.top = `${e.pageY + 10}px`;
        activeTooltip = node.tooltip;
    } else {
        hideTooltip();
    }
});

canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", endPointer);

canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const scale = e.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? 16
        : e.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? canvas.height
            : 1;
    viewport.x += e.deltaX * scale;
    viewport.y += e.deltaY * scale;
}, { passive: false });

window.addEventListener("keydown", (e) => {
    if (e.code !== "Space" || e.repeat) return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    e.preventDefault();
    spaceHeld = true;
    if (!isPanning && !dragTarget) canvas.style.cursor = "grab";
});

window.addEventListener("keyup", (e) => {
    if (e.code !== "Space") return;
    spaceHeld = false;
});

window.addEventListener("blur", () => {
    spaceHeld = false;
});

render();
