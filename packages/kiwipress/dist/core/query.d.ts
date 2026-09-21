/** WordPress REST `context=edit`. Required for `raw` title/content/excerpt fields. */
export declare const EDIT_CONTEXT: "edit";
export type WordPressQuery = Record<string, string>;
/**
 * Merge `{ context: "edit" }` onto a WordPress REST query.
 *
 * Raw (`title.raw`, `content.raw`, `excerpt.raw`) only appears when WordPress
 * is asked for edit context on an **authenticated** request. Public
 * `getAll()` stays view-context by default — pass this helper explicitly.
 */
export declare function withEditContext<T extends WordPressQuery = WordPressQuery>(query?: T): T & {
    context: typeof EDIT_CONTEXT;
};
/** Same as {@link withEditContext}. */
export declare function editContextQuery(query?: WordPressQuery): WordPressQuery;
