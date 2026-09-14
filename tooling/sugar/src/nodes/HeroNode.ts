import { definePort } from "../graph/ports";
import { SugarField, SugarNode } from "../interfaces/interfaces";

export interface HeroNode extends SugarNode {
    fields: SugarField[];
}

export const heroNode: HeroNode = {
    id: "7",
    x: 620,
    y: 460,
    width: 185,
    height: 90,
    label: "Hero",
    type: "content",
    isDragging: false,
    ports: [
        definePort("in", "in", "input"),
        definePort("out", "out", "output")
    ],
    fields: [
        { label: "heading-level", value: "2" },
        { label: "text", value: "Welcome to CitrusWorx!" }
    ]
};
