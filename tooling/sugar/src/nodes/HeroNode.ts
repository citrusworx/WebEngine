import { SugarField, SugarNode } from "../interfaces/interfaces";
import { createNode } from "./kinds";

export interface HeroNode extends SugarNode {
    kind: "hero";
    fields: SugarField[];
}

export const heroNode: HeroNode = {
    ...createNode("hero", {
        id: "7",
        x: 620,
        y: 460
    }),
    kind: "hero",
    fields: [
        { label: "heading-level", value: "2" },
        { label: "text", value: "Welcome to CitrusWorx!" }
    ]
};
