import { registerHooks } from "node:module";

const mockUrl = new URL("./juice-legacy-mock.mjs", import.meta.url).href;

const isSigJuice = (parent) =>
    parent.includes("/libraries/sig/dist/juice.js") ||
    parent.includes("/libraries/sig/src/juice.ts");

registerHooks({
    resolve(specifier, context, nextResolve) {
        if (specifier !== "@citrusworx/juiceui") {
            return nextResolve(specifier, context);
        }
        const parent = context.parentURL ?? "";
        if (parent.includes("juice-legacy-mock.mjs") || !isSigJuice(parent)) {
            return nextResolve(specifier, context);
        }
        return {
            format: "module",
            shortCircuit: true,
            url: mockUrl,
        };
    },
});
