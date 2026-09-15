import type { Server } from "node:http";
import { Seltzer, type CorsOptions, type RequestContext, type Route } from "@citrusworx/seltzer";
import type { KernelRunResult } from "../orchestrator.js";
import { KernelContext } from "../types.js";
import { type NectarineModuleHandle } from "./nectarine-module.js";
import type { CreateNectarineRoutesOptions } from "./nectarine-routes.js";
export type KernelHttpSource = KernelContext | KernelRunResult;
export type StartSeltzerFromKernelOptions<TContext extends RequestContext = RequestContext> = Omit<CreateNectarineRoutesOptions<TContext>, "resources"> & {
    /**
     * Resources for `handle.createRoutes`. Omit to use unique names from
     * `nectarine.config.yaml` `apps[].resources`, or every loaded resource
     * when no app lists any.
     */
    resources?: readonly string[];
    /**
     * Listen port. `0` is ephemeral. When omitted: kiwi `webengine.port`,
     * then web runtime `network.port`.
     */
    port?: number;
    cors?: CorsOptions;
    locals?: TContext extends RequestContext<infer TLocals> ? TLocals : unknown;
    /** Extra hand routes (health, KiwiPress, …) registered before generated ones. */
    routes?: readonly Route<TContext>[];
    /**
     * Called with the bound TCP port after listen. When omitted, logs
     * `Seltzer server listening on port <bound>`.
     */
    onListening?: (port: number) => void;
};
export type SeltzerHttpHandle = {
    app: Seltzer;
    server: Server;
    port: number;
    close: () => Promise<void>;
};
/**
 * Unique resource names from config `apps[].resources`. Empty when no app
 * lists resources — callers then take every loaded resource.
 */
export declare function nectarineAppResourceNames(handle: NectarineModuleHandle): string[];
/** Default `createRoutes` resource list for {@link startSeltzerFromKernel}. */
export declare function defaultNectarineHttpResources(handle: NectarineModuleHandle): string[];
export declare function kernelContextOf(source: KernelHttpSource): KernelContext;
/**
 * Port for `Seltzer.listen`: options override, then kiwi `webengine.port`,
 * then web runtime `network.port`.
 */
export declare function resolveSeltzerListenPort(ctx: KernelContext, port?: number): number;
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
export declare function startSeltzerFromKernel<TContext extends RequestContext = RequestContext>(source: KernelHttpSource, options?: StartSeltzerFromKernelOptions<TContext>): Promise<SeltzerHttpHandle>;
/** Alias for {@link startSeltzerFromKernel}. */
export declare const serveNectarineHttp: typeof startSeltzerFromKernel;
