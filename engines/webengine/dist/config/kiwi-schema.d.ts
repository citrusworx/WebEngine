import { z } from "zod";
/** Native (desktop/mobile) and embedded (IoT) runtimes use YAML; root document must be a mapping. */
export declare const yamlRuntimeConfigSchema: z.ZodRecord<z.ZodString, z.ZodUnknown>;
export type YamlRuntimeConfig = z.infer<typeof yamlRuntimeConfigSchema>;
export declare const webRuntimeConfigSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    version: z.ZodOptional<z.ZodString>;
    network: z.ZodOptional<z.ZodObject<{
        host: z.ZodOptional<z.ZodString>;
        port: z.ZodOptional<z.ZodNumber>;
        dns: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>>;
    development: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    staging: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    deployment: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$loose>;
export type WebRuntimeConfig = z.infer<typeof webRuntimeConfigSchema>;
export declare const kiwiConfigSchema: z.ZodObject<{
    version: z.ZodString;
    kernel: z.ZodDefault<z.ZodObject<{
        modules: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
    runtimes: z.ZodOptional<z.ZodObject<{
        web: z.ZodOptional<z.ZodObject<{
            path: z.ZodOptional<z.ZodString>;
            config_file: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        native: z.ZodOptional<z.ZodObject<{
            path: z.ZodOptional<z.ZodString>;
            config_file: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        embedded: z.ZodOptional<z.ZodObject<{
            path: z.ZodOptional<z.ZodString>;
            config_file: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    web: z.ZodOptional<z.ZodObject<{
        runtime: z.ZodOptional<z.ZodObject<{
            config_file: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    webengine: z.ZodObject<{
        app_name: z.ZodString;
        debug_mode: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        port: z.ZodNumber;
        host: z.ZodString;
        log_level: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        database: z.ZodOptional<z.ZodObject<{
            url: z.ZodString;
        }, z.core.$strip>>;
        security: z.ZodOptional<z.ZodObject<{
            enable_https: z.ZodOptional<z.ZodBoolean>;
            cert_file: z.ZodOptional<z.ZodString>;
            key_file: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        features: z.ZodOptional<z.ZodObject<{
            enable_caching: z.ZodOptional<z.ZodBoolean>;
            enable_compression: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type KiwiConfig = z.infer<typeof kiwiConfigSchema>;
