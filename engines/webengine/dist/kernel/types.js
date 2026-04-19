/**
 * Mutable kernel runtime: validated kiwi config, resolved paths, and module handles.
 */
export class KernelContext {
    kiwi;
    projectRoot;
    webRuntime;
    /** Native desktop/mobile runtime (YAML). */
    nativeRuntime;
    /** Embedded IoT runtime (YAML). */
    embeddedRuntime;
    constructor(kiwi, 
    /** Directory containing kiwi.config.toml */
    projectRoot) {
        this.kiwi = kiwi;
        this.projectRoot = projectRoot;
    }
    handles = new Map();
    registerModuleHandle(id, value) {
        this.handles.set(id, value);
    }
    getModuleHandle(id) {
        return this.handles.get(id);
    }
}
//# sourceMappingURL=types.js.map