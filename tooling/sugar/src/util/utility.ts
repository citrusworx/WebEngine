// Single global mousemove handler
let activeTooltip: HTMLDivElement | null = null;

document.addEventListener("mousemove", (e) => {
    // if (!activeTooltip) {return;}
    activeTooltip!.style.left = `${e.pageX + 10}px`;
    activeTooltip!.style.top = `${e.pageY + 10}px`;
});

export function createTooltip(tip: string = "Tooltip text"): HTMLDivElement {
    const tooltip = document.createElement("div");
    const span = document.createElement("span");
    tooltip.appendChild(span);
    tooltip.style.position = "absolute";
    tooltip.style.padding = "5px 10px";
    tooltip.style.background = "rgba(0, 0, 0, 0.7)";
    tooltip.style.color = "#fff";
    tooltip.style.borderRadius = "4px";
    tooltip.style.pointerEvents = "none";
    tooltip.style.fontSize = "12px";
    tooltip.style.zIndex = "1000";
    tooltip.style.display = "none";
    span.textContent = tip;
    document.body.appendChild(tooltip);
    return tooltip;
}