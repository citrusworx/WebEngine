import { z } from "zod";
/** Native (desktop/mobile) and embedded (IoT) runtimes use YAML; root document must be a mapping. */
export const yamlRuntimeConfigSchema = z.record(z.string(), z.unknown());
export const webRuntimeConfigSchema = z
    .object({
    name: z.string().optional(),
    description: z.string().optional(),
    version: z.string().optional(),
    network: z
        .object({
        host: z.string().optional(),
        port: z.number().optional(),
        dns: z.record(z.string(), z.unknown()).optional(),
    })
        .optional(),
    development: z.record(z.string(), z.unknown()).optional(),
    staging: z.record(z.string(), z.unknown()).optional(),
    deployment: z.record(z.string(), z.unknown()).optional(),
})
    .passthrough();
const runtimeFileRefSchema = z.object({
    path: z.string().optional(),
    config_file: z.string().optional(),
});
export const kiwiConfigSchema = z.object({
    version: z.string(),
    kernel: z
        .object({
        modules: z
            .array(z.string())
            .min(1, "kernel.modules must list at least one module")
            .default(["core", "web"]),
    })
        .default({ modules: ["core", "web"] }),
    /**
     * Per-runtime config files: Web (JSON5), Native and Embedded (YAML).
     * Use `path` or legacy `config_file` (same meaning).
     */
    runtimes: z
        .object({
        web: runtimeFileRefSchema.optional(),
        native: runtimeFileRefSchema.optional(),
        embedded: runtimeFileRefSchema.optional(),
    })
        .optional(),
    web: z
        .object({
        runtime: z
            .object({
            config_file: z.string().optional(),
        })
            .optional(),
    })
        .optional(),
    webengine: z.object({
        app_name: z.string(),
        debug_mode: z.boolean().optional().default(false),
        description: z.string().optional().default(""),
        port: z.number().int().positive(),
        host: z.string(),
        log_level: z.string().optional().default("info"),
        database: z.object({ url: z.string() }).optional(),
        security: z
            .object({
            enable_https: z.boolean().optional(),
            cert_file: z.string().optional(),
            key_file: z.string().optional(),
        })
            .optional(),
        features: z
            .object({
            enable_caching: z.boolean().optional(),
            enable_compression: z.boolean().optional(),
        })
            .optional(),
    }),
});
//# sourceMappingURL=kiwi-schema.js.map