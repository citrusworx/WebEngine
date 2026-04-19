/**
 * Adds transitive dependencies so prerequisites are included in the graph.
 */
export function computeModuleClosure(enabled, registry) {
    const out = new Set(enabled);
    let changed = true;
    while (changed) {
        changed = false;
        for (const id of [...out]) {
            const mod = registry.get(id);
            if (!mod) {
                throw new Error(`Unknown kernel module "${id}"`);
            }
            for (const dep of mod.dependencies ?? []) {
                if (!out.has(dep)) {
                    if (!registry.has(dep)) {
                        throw new Error(`Module "${id}" depends on unknown module "${dep}"`);
                    }
                    out.add(dep);
                    changed = true;
                }
            }
        }
    }
    return [...out];
}
/**
 * Kahn topological sort. `ids` must include every dependency edge endpoint.
 */
export function topologicalSortModules(ids, registry) {
    const idSet = new Set(ids);
    const inDegree = new Map();
    const adj = new Map();
    for (const id of ids) {
        inDegree.set(id, 0);
        adj.set(id, []);
    }
    for (const id of ids) {
        const mod = registry.get(id);
        if (!mod) {
            throw new Error(`Unknown kernel module "${id}"`);
        }
        const depsInGraph = (mod.dependencies ?? []).filter((d) => idSet.has(d));
        inDegree.set(id, depsInGraph.length);
        for (const dep of depsInGraph) {
            adj.get(dep).push(id);
        }
    }
    const queue = [...ids].filter((id) => inDegree.get(id) === 0);
    queue.sort();
    const sorted = [];
    while (queue.length > 0) {
        const id = queue.shift();
        sorted.push(id);
        for (const next of adj.get(id) ?? []) {
            const nextDeg = (inDegree.get(next) ?? 0) - 1;
            inDegree.set(next, nextDeg);
            if (nextDeg === 0) {
                queue.push(next);
                queue.sort();
            }
        }
    }
    if (sorted.length !== ids.length) {
        throw new Error("Kernel module dependency cycle detected");
    }
    return sorted;
}
//# sourceMappingURL=toposort.js.map