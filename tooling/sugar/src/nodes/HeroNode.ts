import { SugarNode } from "../interfaces/interfaces";

export interface HeroNode extends SugarNode {
    fields: { label: string; value: string }[]; // Ensure fields is always defined for HeroNode
}

export const heroNode: HeroNode = {
    id: '7',
    x: 620, y: 460,
    width: 185, height: 70,
    label: "Hero",
    type: "content",
    isDragging: false,
    ports: [
        { id: "in", label: "in", type: "input" },
        { id: "out", label: "out", type: "output" }
    ],
    fields: [{ label: "heading-level", value: "2" }, { label: "text", value: "Welcome to CitrusWorx!" }]

}