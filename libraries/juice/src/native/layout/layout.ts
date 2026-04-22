import { parser } from "../util/parser";
import path from "node:path";

const bluePath = path.resolve(__dirname, "../../tokens/color/blue/blue.yaml");

const blueConfig = parser.yaml<{
    blue: Record<number, string>;
}>(bluePath);

export const bluePalette = {
    100: blueConfig.blue[100],
    200: blueConfig.blue[200]
}
