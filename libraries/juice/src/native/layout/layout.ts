import { parser } from "../util/parser";
import path from "node:path";

const bluePath = path.resolve(__dirname, "../../tokens/color/blue/blue.yaml");

const blueConfig = parser.yaml<{
    blue: Record<number, string>;
}>(bluePath);

console.log(blueConfig.blue[100]);
