export declare const KIWI_CONFIG_FILENAME = "kiwi.config.toml";
/**
 * Walks upward from `startDir` looking for {@link KIWI_CONFIG_FILENAME}.
 * Returns absolute path when found, or `null`.
 */
export declare function findKiwiConfigPath(startDir: string): string | null;
