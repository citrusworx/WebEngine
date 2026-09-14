/** Camera origin in world space: the world point currently at the canvas top-left. */
export interface Viewport {
    x: number;
    y: number;
}

export function createViewport(x = 0, y = 0): Viewport {
    return { x, y };
}

/** Move the world with the pointer: a positive screen delta shifts the camera opposite. */
export function panViewport(viewport: Viewport, screenDx: number, screenDy: number): void {
    viewport.x -= screenDx;
    viewport.y -= screenDy;
}

export function screenToWorld(
    viewport: Viewport,
    screenX: number,
    screenY: number
): { x: number; y: number } {
    return { x: screenX + viewport.x, y: screenY + viewport.y };
}

export function clientToCanvas(
    canvas: HTMLCanvasElement,
    clientX: number,
    clientY: number
): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

export function applyViewportTransform(
    ctx: CanvasRenderingContext2D,
    viewport: Viewport
): void {
    ctx.setTransform(1, 0, 0, 1, -viewport.x, -viewport.y);
}

export function resetTransform(ctx: CanvasRenderingContext2D): void {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/**
 * Match the drawing buffer to the element's CSS box so 1 canvas unit = 1 CSS pixel.
 * Returns true when the buffer was resized (which also resets the context transform).
 */
export function syncCanvasSize(canvas: HTMLCanvasElement): boolean {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    if (canvas.width === width && canvas.height === height) {
        return false;
    }
    canvas.width = width;
    canvas.height = height;
    return true;
}
