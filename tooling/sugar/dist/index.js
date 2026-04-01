"use strict";
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
// Colors
const NODE_COLORS = {
    content: { header: "#4caf50", border: "#388e3c", port: "#81c784" },
    parameter: { header: "#fbc02d", border: "#f9a825", port: "#ffe082" },
    operation: { header: "#5c6bc0", border: "#3949ab", port: "#9fa8da" },
};
// Nodes
const nodes = [
    {
        id: "1",
        x: 60, y: 200,
        width: 180, height: 70,
        label: "GetDocument",
        type: "content",
        isDragging: false,
        ports: [{ id: "out", label: "out", type: "output" }]
    },
    {
        id: "2",
        x: 300, y: 200,
        width: 200, height: 90,
        label: "getElement",
        type: "operation",
        isDragging: false,
        ports: [
            { id: "in", label: "in", type: "input" },
            { id: "out", label: "out", type: "output" }
        ],
        fields: [{ label: "id", value: "#main-title" }]
    },
    {
        id: "3",
        x: 560, y: 200,
        width: 200, height: 70,
        label: "addSimpleTitle",
        type: "content",
        isDragging: false,
        ports: [
            { id: "in", label: "in", type: "input" },
            { id: "out", label: "out", type: "output" }
        ]
    },
    {
        id: "4",
        x: 820, y: 200,
        width: 220, height: 90,
        label: "GET",
        type: "operation",
        isDragging: false,
        ports: [
            { id: "in", label: "in", type: "input" },
            { id: "params", label: "params", type: "input" }
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
        ports: [{ id: "out", label: "out", type: "output" }],
        fields: [{ label: "value", value: "content.title" }]
    }
];
// Edges
const edges = [
    { id: "e1", fromNodeId: "1", fromPortType: "content", toNodeId: "2" },
    { id: "e2", fromNodeId: "2", fromPortType: "operation", toNodeId: "3" },
    { id: "e3", fromNodeId: "3", fromPortType: "content", toNodeId: "4" },
    { id: "e4", fromNodeId: "5", fromPortType: "parameter", toNodeId: "4" },
];
// Port positions
function getOutputPort(node) {
    return { x: node.x + node.width, y: node.y + node.height / 2 };
}
function getInputPort(node) {
    return { x: node.x, y: node.y + node.height / 2 };
}
function getParamsPort(node) {
    return { x: node.x, y: node.y + node.height * 0.75 };
}
// Draw node
function drawNode(node) {
    const colors = NODE_COLORS[node.type];
    const radius = 8;
    // Shadow
    ctx.shadowColor = "rgba(0,0,0,0.15)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    // Body
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(node.x, node.y, node.width, node.height, radius);
    ctx.fill();
    ctx.shadowColor = "transparent";
    // Header
    ctx.fillStyle = colors.header;
    ctx.beginPath();
    ctx.roundRect(node.x, node.y, node.width, 28, [radius, radius, 0, 0]);
    ctx.fill();
    // Header label
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px IBM Plex Sans, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(node.label, node.x + node.width / 2, node.y + 14);
    // Fields
    if (node.fields) {
        node.fields.forEach((field, i) => {
            const fieldY = node.y + 38 + i * 22;
            ctx.fillStyle = "#666666";
            ctx.font = "11px IBM Plex Mono, monospace";
            ctx.textAlign = "left";
            ctx.fillText(`${field.label}: `, node.x + 12, fieldY);
            ctx.fillStyle = "#333333";
            ctx.font = "bold 11px IBM Plex Mono, monospace";
            ctx.fillText(field.value, node.x + 12 + ctx.measureText(`${field.label}: `).width, fieldY);
        });
    }
    // Border
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(node.x, node.y, node.width, node.height, radius);
    ctx.stroke();
    // Output port
    const hasOutput = node.ports.find(p => p.type === "output");
    if (hasOutput) {
        const out = getOutputPort(node);
        ctx.beginPath();
        ctx.arc(out.x, out.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = colors.port;
        ctx.fill();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    // Input port
    const hasInput = node.ports.find(p => p.id === "in");
    if (hasInput) {
        const inp = getInputPort(node);
        ctx.beginPath();
        ctx.arc(inp.x, inp.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.strokeStyle = "#aaaaaa";
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    // Params port
    const hasParams = node.ports.find(p => p.id === "params");
    if (hasParams) {
        const par = getParamsPort(node);
        ctx.beginPath();
        ctx.arc(par.x, par.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.strokeStyle = NODE_COLORS.parameter.border;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}
// Draw edge
function drawEdge(edge) {
    const fromNode = nodes.find(n => n.id === edge.fromNodeId);
    const toNode = nodes.find(n => n.id === edge.toNodeId);
    if (!fromNode || !toNode)
        return;
    const from = getOutputPort(fromNode);
    const to = edge.fromPortType === "parameter"
        ? getParamsPort(toNode)
        : getInputPort(toNode);
    const cp = Math.abs(to.x - from.x) / 2;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.bezierCurveTo(from.x + cp, from.y, to.x - cp, to.y, to.x, to.y);
    ctx.strokeStyle = NODE_COLORS[edge.fromPortType].port;
    ctx.lineWidth = 2;
    ctx.stroke();
}
// Render
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    edges.forEach(drawEdge);
    nodes.forEach(drawNode);
    requestAnimationFrame(render);
}
// Hit detection
function getNodeAtPosition(x, y) {
    return nodes.find(n => x >= n.x && x <= n.x + n.width &&
        y >= n.y && y <= n.y + n.height) ?? null;
}
// Drag
let dragTarget = null;
let offSetX = 0;
let offSetY = 0;
canvas.addEventListener("mousedown", (e) => {
    const node = getNodeAtPosition(e.offsetX, e.offsetY);
    if (!node)
        return;
    dragTarget = node;
    node.isDragging = true;
    offSetX = e.offsetX - node.x;
    offSetY = e.offsetY - node.y;
});
canvas.addEventListener("mousemove", (e) => {
    if (!dragTarget)
        return;
    dragTarget.x = e.offsetX - offSetX;
    dragTarget.y = e.offsetY - offSetY;
});
canvas.addEventListener("mouseup", () => {
    if (dragTarget)
        dragTarget.isDragging = false;
    dragTarget = null;
});
render();
