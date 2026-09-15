/**
 * Load versioned migration YAML documents from a directory.
 *
 * Missing directories yield `[]` so apps can wire a migrations folder before
 * any files exist. Files are read in name order; {@link compileMigrations}
 * sorts by the `version` field.
 */
export declare function loadMigrationDocuments(directory: string): unknown[];
