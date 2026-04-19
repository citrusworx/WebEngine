export const coreModule = {
    id: "core",
    async scaffold(_ctx) {
        // v1: no filesystem scaffolding
    },
    async bootstrap(ctx) {
        ctx.registerModuleHandle("core", { ready: true });
    },
    async health(ctx) {
        const h = ctx.getModuleHandle("core");
        return h?.ready ? { ok: true } : { ok: false, detail: "core handle missing" };
    },
    async shutdown(_ctx) {
        // noop
    },
};
//# sourceMappingURL=core-module.js.map