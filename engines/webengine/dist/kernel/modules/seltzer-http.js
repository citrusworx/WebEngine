import { Seltzer, } from "@citrusworx/seltzer";
import { KernelContext } from "../types.js";
import { NECTARINE_MODULE_ID, } from "./nectarine-module.js";
/**
 * Unique resource names from config `apps[].resources`. Empty when no app
 * lists resources — callers then take every loaded resource.
 */
export function nectarineAppResourceNames(handle) {
    const names = [];
    const seen = new Set();
    for (const app of handle.config.apps) {
        for (const name of app.resources ?? []) {
            if (!name || seen.has(name)) {
                continue;
            }
            seen.add(name);
            names.push(name);
        }
    }
    return names;
}
/** Default `createRoutes` resource list for {@link startSeltzerFromKernel}. */
export function defaultNectarineHttpResources(handle) {
    const fromApps = nectarineAppResourceNames(handle);
    if (fromApps.length > 0) {
        return fromApps;
    }
    return [...handle.config.resources.keys()];
}
export function kernelContextOf(source) {
    if (source instanceof KernelContext) {
        return source;
    }
    return source.context;
}
/**
 * Port for `Seltzer.listen`: options override, then kiwi `webengine.port`,
 * then web runtime `network.port`.
 */
export function resolveSeltzerListenPort(ctx, port) {
    if (port !== undefined) {
        return port;
    }
    const kiwiPort = ctx.kiwi.webengine.port;
    if (typeof kiwiPort === "number") {
        return kiwiPort;
    }
    const networkPort = ctx.webRuntime?.network?.port;
    if (typeof networkPort === "number") {
        return networkPort;
    }
    throw new Error("No HTTP port: pass options.port or set kiwi webengine.port / webengine.config.json5 network.port");
}
function boundPort(server) {
    const address = server.address();
    if (!address || typeof address === "string") {
        throw new Error("Seltzer listen expected a TCP address");
    }
    return address.port;
}
function closeServer(server) {
    return new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
    });
}
function listenReady(app, port, options) {
    return new Promise((resolve, reject) => {
        let settled = false;
        const succeed = (server) => {
            if (settled) {
                return;
            }
            settled = true;
            const bound = boundPort(server);
            if (options.onListening) {
                options.onListening(bound);
            }
            else {
                console.log(`Seltzer server listening on port ${bound}`);
            }
            resolve({ server, port: bound });
        };
        const server = app.listen(port, {
            cors: options.cors,
            locals: options.locals,
            onListening: () => undefined,
        });
        server.once("error", (error) => {
            if (settled) {
                return;
            }
            settled = true;
            reject(error);
        });
        if (server.listening) {
            succeed(server);
            return;
        }
        server.once("listening", () => succeed(server));
    });
}
function requireNectarineHandle(ctx) {
    const handle = ctx.getModuleHandle(NECTARINE_MODULE_ID);
    if (!handle?.createRoutes) {
        throw new Error("Nectarine module is not bootstrapped. Enable kernel.modules nectarine, run the kernel lifecycle, then call startSeltzerFromKernel.");
    }
    return handle;
}
/**
 * Opt-in Seltzer HTTP listen after Nectarine kernel bootstrap.
 *
 * The kernel still does **not** listen during module bootstrap. Hosts call
 * this helper (or keep wiring `Seltzer.init()` / `app.route` / `app.listen`
 * themselves, as Blackwater does today).
 *
 * ```ts
 * const result = await runKernelLifecycle(cwd);
 * const http = await startSeltzerFromKernel(result, {
 *   port: 0,
 *   cors: { origin: "http://localhost:5173" },
 *   routes: [{ method: "GET", path: "/health", handler: () => ({ body: { ok: true } }) }],
 * });
 * ```
 */
export async function startSeltzerFromKernel(source, options = {}) {
    const ctx = kernelContextOf(source);
    const handle = requireNectarineHandle(ctx);
    const { port: portOption, cors, locals, routes: extraRoutes, onListening, resources: resourceOption, ...routeOptions } = options;
    const resources = resourceOption && resourceOption.length > 0
        ? resourceOption
        : defaultNectarineHttpResources(handle);
    const app = Seltzer.init();
    for (const route of extraRoutes ?? []) {
        app.route(route);
    }
    for (const route of handle.createRoutes({
        ...routeOptions,
        resources,
    })) {
        app.route(route);
    }
    const requestedPort = resolveSeltzerListenPort(ctx, portOption);
    const listening = await listenReady(app, requestedPort, {
        cors,
        locals,
        onListening,
    });
    return {
        app,
        server: listening.server,
        port: listening.port,
        close: () => closeServer(listening.server),
    };
}
/** Alias for {@link startSeltzerFromKernel}. */
export const serveNectarineHttp = startSeltzerFromKernel;
//# sourceMappingURL=seltzer-http.js.map