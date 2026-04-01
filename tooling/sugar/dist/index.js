"use strict";
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const edges = [];
function drawNode(node) {
    // Shadow
    ctx.shadowColor = "rgba(0,0,0,0.2)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    // Body
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(node.x, node.y, node.width, node.height, 8);
    ctx.fill();
    // Reset shadow
    ctx.shadowColor = "transparent";
    // Border
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    ctx.stroke();
    // Label
    ctx.fillStyle = "#333333";
    ctx.font = "14px IBM Plex Sans, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(node.label, node.x + node.width / 2, node.y + node.height / 2);
}
// Hit Detection
function getNodeAtPosition(x, y) {
    return nodes.find(n => x >= n.x && x <= n.x + n.width &&
        y >= n.y && y <= n.y + n.height) ?? null;
}
function getNodeOutputPort(node) {
    // Placeholder for output port logic
    return {
        x: node.x + node.width,
        y: node.y + node.height / 2
    };
}
function getNodeInputPort(node) {
    // Placeholder for input port logic
    return {
        x: node.x,
        y: node.y + node.height / 2
    };
}
function drawPorts(node) {
    const input = getNodeInputPort(node);
    const output = getNodeOutputPort(node);
    [input, output].forEach(port => {
        ctx.beginPath();
        ctx.arc(port.x, port.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.strokeStyle = "#aaaaaa";
        ctx.lineWidth = 2;
        ctx.stroke();
    });
}
function drawEdge(edge) {
    const fromNode = nodes.find(n => n.id === edge.from);
    const toNode = nodes.find(n => n.id === edge.to);
    if (!fromNode || !toNode)
        return;
    const from = getNodeOutputPort(fromNode);
    const to = getNodeInputPort(toNode);
    const cp = (to.x - from.x) / 2;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.bezierCurveTo(from.x + cp, from.y, to.x - cp, to.y, to.x, to.y);
    ctx.strokeStyle = "#aaaaaa";
    ctx.lineWidth = 2;
    ctx.stroke();
}
function getEdgeAtPosition(x, y) {
    // For simplicity, we won't implement edge hit detection in this example
    return null;
}
const nodes = [
    { id: "1", x: 100, y: 100, width: 150, height: 50, label: "Node 1", isDragging: false },
    { id: "2", x: 300, y: 200, width: 150, height: 50, label: "Node 2", isDragging: false }
];
let dragTarget = null;
let offSetX = 0;
let offSetY = 0;
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    edges.forEach(drawEdge);
    nodes.forEach(node => {
        drawNode(node);
        drawPorts(node);
    });
    edges.push({ id: "e1", from: "1", to: "2", "label": "Connection" });
    requestAnimationFrame(render);
}
// Drag
canvas.addEventListener("mousedown", (e) => {
    const node = getNodeAtPosition(e.offsetX, e.offsetY);
    if (!node)
        return;
    dragTarget = node;
    node.isDragging = true;
    offSetX = e.offsetX - node.x;
    offSetY = e.offsetY - node.y;
});
// Move
canvas.addEventListener("mousemove", (e) => {
    if (!dragTarget)
        return;
    dragTarget.x = e.offsetX - offSetX;
    dragTarget.y = e.offsetY - offSetY;
});
// Drop
canvas.addEventListener("mouseup", () => {
    if (dragTarget) {
        dragTarget.isDragging = false;
        dragTarget = null;
    }
});
render();
