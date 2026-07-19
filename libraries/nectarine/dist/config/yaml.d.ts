/**
 * Load and parse a YAML file. Library primitive — apps should not reimplement this.
 */
export declare function loadYaml<T = Record<string, unknown>>(filepath: string): T;
/** Alias matching Nectarine docs / schema loading. */
export declare const loadSchema: typeof loadYaml;
